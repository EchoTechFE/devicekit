// A bundler's tree-shaking trusts package.json's "sideEffects" field to decide
// which files it may drop when nothing imports from them directly. @devicekit
// frame's react entry (src/react/index.tsx) registers the custom element as an
// import-time side effect (`defineDeviceFrame()` at the top of the module, not
// inside a function) — see the comment at the top of that file. A bundler that
// believes "sideEffects": false is free to drop that file's module wrapper
// whenever nothing imports a named export from it, which strips the
// registration and leaves `<device-frame>` undefined in the DOM. These cases
// pin that both the source file and its build output are listed, and that
// @devicekit/devices — which has no import-time side effects at all — keeps
// declaring `false`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptsDir, '..')
const framePkgPath = path.join(repoRoot, 'packages/frame/package.json')
const devicesPkgPath = path.join(repoRoot, 'packages/devices/package.json')

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

test('@devicekit/frame lists sideEffects as an array, not false', () => {
  const pkg = readJson(framePkgPath)
  assert.ok(Array.isArray(pkg.sideEffects), `expected sideEffects to be an array, got ${JSON.stringify(pkg.sideEffects)}`)
})

test('@devicekit/frame\'s sideEffects covers exactly the react entry\'s source and built paths', () => {
  const pkg = readJson(framePkgPath)
  const sideEffects = new Set(pkg.sideEffects)
  const expected = new Set(['./src/react/index.tsx', './dist/react/index.js'])
  assert.deepEqual(sideEffects, expected, `sideEffects should be exactly ${[...expected]}, got ${[...sideEffects]}`)
})

test('every ./src/ path declared as a side effect points at a file that actually exists', () => {
  const pkg = readJson(framePkgPath)
  const sourceEntries = (pkg.sideEffects ?? []).filter((entry) => entry.startsWith('./src/'))
  assert.ok(sourceEntries.length > 0, 'expected at least one ./src/ side-effect entry')
  for (const entry of sourceEntries) {
    const resolved = path.join(repoRoot, 'packages/frame', entry)
    assert.ok(existsSync(resolved), `sideEffects entry ${entry} does not resolve to an existing file at ${resolved}`)
  }
})

test('the react entry actually makes the top-level call that justifies listing it as a side effect', () => {
  const source = readFileSync(path.join(repoRoot, 'packages/frame/src/react/index.tsx'), 'utf8')
  assert.match(source, /defineDeviceFrame\(\)/, 'expected a defineDeviceFrame() call in src/react/index.tsx')
})

test('@devicekit/devices has no import-time side effects, so it keeps sideEffects: false', () => {
  const pkg = readJson(devicesPkgPath)
  assert.equal(pkg.sideEffects, false)
})

test('devices/src/index.ts has no top-level statement other than export/import — proving false is honest', () => {
  const source = readFileSync(path.join(repoRoot, 'packages/devices/src/index.ts'), 'utf8')
  const lines = source.split('\n')
  let depth = 0
  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (depth === 0) {
      if (line === '' || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        // blank line or comment — not a statement
      } else {
        assert.ok(
          line.startsWith('export') || line.startsWith('import'),
          `unexpected top-level statement in devices/src/index.ts: ${JSON.stringify(line)}`,
        )
      }
    }
    // Track brace depth so a multi-line `export { ... } from './x.js'` block
    // is treated as one statement, not one violation per continuation line.
    for (const char of rawLine) {
      if (char === '{') depth += 1
      else if (char === '}') depth -= 1
    }
  }
  assert.equal(depth, 0, 'unbalanced braces while scanning devices/src/index.ts')
})
