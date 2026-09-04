#!/usr/bin/env node
// Regenerates src/device-names.generated.ts from the compiled device table —
// dist/, not src/, because deviceNameKey and DEVICES have to run to produce
// the constant, and a build is cheaper than a second parallel implementation
// of deviceNameKey in this script. Run `pnpm --filter @devicekit/devices
// build` first (the `generate:device-names` script does that automatically).
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outFile = path.join(packageRoot, 'src/device-names.generated.ts')
const checkOnly = process.argv.includes('--check')

const { DEVICES } = await import(pathToFileURL(path.join(packageRoot, 'dist/presets/index.js')).href)
const { deviceNameKey } = await import(pathToFileURL(path.join(packageRoot, 'dist/device-names.js')).href)

const byKey = new Map()
const conflicts = []
for (const device of DEVICES) {
  const key = deviceNameKey(device.name)
  const existing = byKey.get(key)
  if (existing !== undefined && existing !== device.name) {
    conflicts.push(`  ${key}: ${JSON.stringify(existing)} vs ${JSON.stringify(device.name)}`)
    continue
  }
  byKey.set(key, device.name)
}
if (conflicts.length > 0) {
  console.error('generate-device-names: two device names collide on the same key:')
  console.error(conflicts.join('\n'))
  process.exit(1)
}

const entries = DEVICES.map((device) => {
  const key = deviceNameKey(device.name)
  const value = device.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return `  ${key}: '${value}',`
}).join('\n')

const content = `/**
 * Generated from \`DEVICES\` in presets/index.ts — do not hand-edit.
 * Regenerate with \`pnpm --filter @devicekit/devices generate:device-names\`.
 */
export const DEVICE_NAMES = {
${entries}
} as const
`

if (checkOnly) {
  const current = readFileSync(outFile, 'utf8')
  if (current !== content) {
    console.error(`generate-device-names: ${path.relative(packageRoot, outFile)} is out of date.`)
    console.error('Run `pnpm --filter @devicekit/devices generate:device-names` and commit the result.')
    process.exit(1)
  }
  console.log('generate-device-names: up to date.')
} else {
  writeFileSync(outFile, content)
  console.log(`generate-device-names: wrote ${DEVICES.length} device(s) to ${path.relative(packageRoot, outFile)}`)
}
