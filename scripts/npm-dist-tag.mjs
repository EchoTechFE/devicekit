// resolveDistTag() is the decision publish.yml's NPM_TAG defers to. Two
// independent signals can mean "prerelease" — a version string with a
// semver prerelease segment (1.0.0-beta.1) and the release's own prerelease
// checkbox — and either one routes the publish to `next` regardless of what
// the other says, because `npm install` resolving a half-baked version by
// default is worse than a workflow that has to be told `next` explicitly.
import { appendFileSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

function isPrereleaseVersion(version) {
  return /^\d+\.\d+\.\d+-/.test(version)
}

/**
 * @param {{ versions: string[], requested: string, eventName: string, prerelease: boolean }} input
 * @returns {'latest' | 'next'}
 */
export function resolveDistTag({ versions, requested, eventName, prerelease }) {
  const prereleaseVersions = versions.filter(isPrereleaseVersion)

  if (requested === 'latest' && prereleaseVersions.length > 0) {
    throw new Error(
      `Refusing to publish "latest": ${prereleaseVersions.join(', ')} carries a prerelease version segment.`,
    )
  }

  if (prereleaseVersions.length > 0) return 'next'
  if (requested === 'next' || requested === 'latest') return requested
  if (eventName === 'release') return prerelease ? 'next' : 'latest'
  return 'latest'
}

// --- CLI entry: reads the workspace's package versions and CI's env, then
// writes `tag=...` to $GITHUB_OUTPUT (and stdout, for a human reading logs).
function readWorkspaceVersions(rootDir) {
  const packagesDir = path.join(rootDir, 'packages')
  const versions = []
  for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const pkgPath = path.join(packagesDir, entry.name, 'package.json')
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      if (typeof pkg.version === 'string') versions.push(pkg.version)
    } catch {
      // No package.json (or an unparseable one) under this directory — not a workspace package.
    }
  }
  return versions
}

function main() {
  const rootDir = fileURLToPath(new URL('..', import.meta.url))
  const versions = readWorkspaceVersions(rootDir)
  const tag = resolveDistTag({
    versions,
    requested: process.env.REQUESTED_TAG ?? '',
    eventName: process.env.EVENT_NAME ?? '',
    prerelease: process.env.RELEASE_PRERELEASE === 'true',
  })

  console.log(`dist-tag: ${tag} (versions: ${versions.join(', ') || '(none found)'})`)

  const outputFile = process.env.GITHUB_OUTPUT
  if (outputFile) appendFileSync(outputFile, `tag=${tag}\n`)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main()
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  }
}
