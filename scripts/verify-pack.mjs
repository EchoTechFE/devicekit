// A workspace `exports` map (packages/*/package.json) points at
// ./src/index.ts so pnpm/npm link consumers get plain TS source — but
// `publishConfig.exports` is what actually ships, and nothing had ever run
// `pnpm pack` and loaded the result the way a real `npm install` consumer
// would. This packs each workspace package the way `pnpm publish` would,
// unpacks the tarball, checks every `exports` target file is present, and
// loads the main entry point from a directory that isn't the workspace (so
// it can't accidentally resolve anything via node_modules symlinks or a
// workspace `tsconfig`).
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const packagesDir = path.join(rootDir, 'packages')

function exportTargets(exportsMap) {
  const targets = []
  for (const value of Object.values(exportsMap ?? {})) {
    if (typeof value === 'string') {
      targets.push(value)
    } else if (value && typeof value === 'object') {
      targets.push(...exportTargets(value))
    }
  }
  return targets
}

async function verifyPackage(pkgDir, failures, unpackedByName) {
  const pkgJson = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
  const name = pkgJson.name
  console.log(`\n--- ${name} ---`)

  const packDestination = mkdtempSync(path.join(tmpdir(), 'devicekit-pack-'))
  execFileSync('pnpm', ['pack', '--pack-destination', packDestination], { cwd: pkgDir, stdio: 'inherit' })

  const tgz = readdirSync(packDestination).find((file) => file.endsWith('.tgz'))
  if (!tgz) {
    failures.push(`${name}: pnpm pack produced no .tgz`)
    return
  }

  // tar always wraps the tarball's contents in a top-level "package/" directory.
  const extractDir = mkdtempSync(path.join(tmpdir(), 'devicekit-extract-'))
  execFileSync('tar', ['-xzf', path.join(packDestination, tgz), '-C', extractDir], { stdio: 'inherit' })
  const unpacked = path.join(extractDir, 'package')
  unpackedByName.set(name, unpacked)

  const unpackedPkgJson = JSON.parse(readFileSync(path.join(unpacked, 'package.json'), 'utf8'))
  const exportsMap = unpackedPkgJson.exports ?? {}

  for (const target of exportTargets(exportsMap)) {
    if (!existsSync(path.join(unpacked, target))) {
      failures.push(`${name}: exports target ${target} is missing from the packed tarball`)
    }
  }

  // tsconfig.base.json turns sourceMap on, so every compiled dist/**/*.js
  // ships a sibling .js.map — a consumer's devtools should step into the
  // original TS rather than the compiled output. Checked structurally
  // against the packed tarball rather than the workspace build, since a
  // publishConfig.files allowlist could drop the maps without either build
  // or check-types noticing.
  const distDir = path.join(unpacked, 'dist')
  if (existsSync(distDir)) {
    const jsFiles = readdirSync(distDir, { recursive: true }).filter(
      (entry) => typeof entry === 'string' && entry.endsWith('.js'),
    )
    for (const relative of jsFiles) {
      if (!existsSync(path.join(distDir, `${relative}.map`))) {
        failures.push(`${name}: dist/${relative} is missing its .js.map`)
      }
    }
    console.log(`  dist/**/*.js checked for a matching .js.map: ${jsFiles.length} file(s)`)
  }

  const mainEntry = path.join(unpacked, 'dist/index.js')
  if (!existsSync(mainEntry)) {
    failures.push(`${name}: dist/index.js is missing from the packed tarball`)
  } else {
    // Node resolves a bare specifier inside dist/index.js by walking up from
    // that file's own directory looking for node_modules — not from this
    // script's cwd — so a workspace dependency has to be symlinked inside
    // the extracted tarball itself. A real `npm install` would fetch it from
    // the registry; this reuses the tarball already unpacked for that
    // dependency, which exercises the same packed dist output on both ends
    // without a network round trip.
    for (const dep of Object.keys(unpackedPkgJson.dependencies ?? {})) {
      const depUnpacked = unpackedByName.get(dep)
      if (!depUnpacked) continue
      const linkPath = path.join(unpacked, 'node_modules', dep)
      mkdirSync(path.dirname(linkPath), { recursive: true })
      symlinkSync(depUnpacked, linkPath, 'dir')
    }
    try {
      const mod = await import(pathToFileURL(mainEntry).href)
      const exportNames = Object.keys(mod)
      console.log(`  dist/index.js imported, exports: ${exportNames.join(', ') || '(none)'}`)
      if (name === '@devicekit/devices' && !mod.DEVICES) {
        failures.push(`${name}: dist/index.js loaded but did not export DEVICES`)
      }
      if (name === '@devicekit/frame' && !mod.DeviceFrameElement) {
        failures.push(`${name}: dist/index.js loaded but did not export DeviceFrameElement`)
      }
    } catch (err) {
      failures.push(`${name}: import(dist/index.js) threw: ${err instanceof Error ? err.message : err}`)
    }
  }

  // The react entry imports the peer dependency `react`, which this script
  // does not install (that would mean a real npm install into a scratch
  // directory on every run). It is checked structurally instead: the file
  // must exist and must be syntactically valid JS, which catches a broken
  // build or a stale exports path without paying for a real React render.
  const reactEntry = path.join(unpacked, 'dist/react/index.js')
  if (exportsMap['./react'] || existsSync(reactEntry)) {
    if (!existsSync(reactEntry)) {
      failures.push(`${name}: dist/react/index.js is missing from the packed tarball`)
    } else {
      execFileSync('node', ['--check', reactEntry], { stdio: 'inherit' })
      console.log('  dist/react/index.js: syntax-checked (not imported — it needs the react peer dependency)')
    }
  }
}

// A consumer's own `moduleResolution` decides whether it even reads
// package.json `exports` — `node10` is TypeScript's classic Node.js
// algorithm (still the default a lot of unmigrated app tsconfigs carry) and
// never looks at `exports`, only `main`/`types` and, for a subpath import,
// `typesVersions`. `node16` and `bundler` both read `exports` and would
// resolve `@devicekit/frame/react` without any fallback. Running the same
// probe file through all three against the real packed tarballs is the only
// way to know the `typesVersions` entry in publishConfig actually plugs the
// node10 gap, rather than trusting that it should.
const TSC_MATRIX = [
  { name: 'node16', module: 'node16', moduleResolution: 'node16' },
  { name: 'bundler', module: 'esnext', moduleResolution: 'bundler' },
  { name: 'node10', module: 'commonjs', moduleResolution: 'node10' },
]

async function verifyTypeResolution(failures, unpackedByName) {
  const frameUnpacked = unpackedByName.get('@devicekit/frame')
  const devicesUnpacked = unpackedByName.get('@devicekit/devices')
  if (!frameUnpacked || !devicesUnpacked) {
    failures.push('type resolution probe: @devicekit/frame or @devicekit/devices was not packed')
    return
  }

  console.log('\n--- type resolution (node16 / bundler / node10) ---')
  const probeDir = mkdtempSync(path.join(tmpdir(), 'devicekit-typeprobe-'))
  const nodeModules = path.join(probeDir, 'node_modules')
  mkdirSync(path.join(nodeModules, '@devicekit'), { recursive: true })
  symlinkSync(frameUnpacked, path.join(nodeModules, '@devicekit', 'frame'), 'dir')
  symlinkSync(devicesUnpacked, path.join(nodeModules, '@devicekit', 'devices'), 'dir')
  // TS resolves a bare specifier inside a file by walking up node_modules
  // from that *file's own* location, following symlinks to their real target
  // first — same rule the runtime import above already works around for
  // workspace deps. `dist/react/index.d.ts` imports the bare specifier
  // `react`; since `@devicekit/frame` here is a symlink into `frameUnpacked`,
  // that walk starts at `frameUnpacked`, not at `probeDir` — a `react`
  // sibling only in `probeDir/node_modules` is never seen. `react` and its
  // types (a peerDependency, never bundled) have to be symlinked inside
  // `frameUnpacked` itself, reused from the workspace root rather than
  // installed fresh.
  const frameNodeModules = path.join(frameUnpacked, 'node_modules')
  mkdirSync(path.join(frameNodeModules, '@types'), { recursive: true })
  symlinkSync(path.join(rootDir, 'node_modules/react'), path.join(frameNodeModules, 'react'), 'dir')
  symlinkSync(path.join(rootDir, 'node_modules/@types/react'), path.join(frameNodeModules, '@types', 'react'), 'dir')
  // The probe file itself needs to be recognized as ESM under node16/nodenext
  // resolution — the packages it imports are ESM-only (`"type": "module"`),
  // and without a package.json here TS would default probe.ts to CommonJS
  // and reject the imports with TS1479 rather than the resolution behavior
  // actually under test.
  writeFileSync(path.join(probeDir, 'package.json'), JSON.stringify({ type: 'module' }))

  writeFileSync(
    path.join(probeDir, 'probe.ts'),
    [
      "import { DeviceFrameElement } from '@devicekit/frame'",
      "import { DeviceFrame } from '@devicekit/frame/react'",
      "import { resolveDevice } from '@devicekit/devices'",
      '',
      'export const probeElement: DeviceFrameElement | null = null',
      'export const probeComponent = DeviceFrame',
      'export const probeDevice = resolveDevice',
      '',
    ].join('\n'),
  )

  const typescriptBin = path.join(rootDir, 'node_modules/typescript/bin/tsc')
  for (const { name, module: moduleKind, moduleResolution } of TSC_MATRIX) {
    const tsconfigPath = path.join(probeDir, `tsconfig.${name}.json`)
    writeFileSync(
      tsconfigPath,
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: moduleKind,
            moduleResolution,
            strict: true,
            jsx: 'react-jsx',
            skipLibCheck: false,
            esModuleInterop: true,
            noEmit: true,
          },
          include: ['probe.ts'],
        },
        null,
        2,
      ),
    )
    try {
      execFileSync(process.execPath, [typescriptBin, '-p', tsconfigPath], { cwd: probeDir, stdio: 'pipe' })
      console.log(`  moduleResolution=${moduleResolution}: OK`)
    } catch (err) {
      const output = [err.stdout, err.stderr]
        .filter(Boolean)
        .map((buf) => buf.toString())
        .join('\n')
      failures.push(`type resolution probe (moduleResolution=${moduleResolution}): tsc failed\n${output}`)
      console.error(`  moduleResolution=${moduleResolution}: FAILED\n${output}`)
    }
  }
}

async function main() {
  const failures = []
  // Alphabetical happens to match dependency order for this workspace
  // (devices has no workspace deps, frame depends on devices) — a package
  // whose own dependency hasn't been packed yet just skips the symlink step
  // above and reports a real import failure instead of a false pass.
  const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(packagesDir, entry.name, 'package.json')))
    .map((entry) => path.join(packagesDir, entry.name))
    .sort()

  const unpackedByName = new Map()
  for (const pkgDir of packageDirs) {
    await verifyPackage(pkgDir, failures, unpackedByName)
  }

  await verifyTypeResolution(failures, unpackedByName)

  if (failures.length > 0) {
    console.error('\nverify:pack failed:')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exitCode = 1
    return
  }
  console.log('\nverify:pack: every package/export loads from its packed tarball')
}

main()
