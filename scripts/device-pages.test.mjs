import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptsDir, '..')
const pagesPath = path.join(repoRoot, 'docs/device-pages.md')
const deviceNamesPath = path.join(repoRoot, 'packages/devices/src/device-names.generated.ts')

function deviceSlug(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

test('docs/device-pages.md lists exactly one live URL for every device profile', () => {
  const markdown = readFileSync(pagesPath, 'utf8')
  const names = [...readFileSync(deviceNamesPath, 'utf8').matchAll(/^  \w+: '([^']+)',$/gm)].map((match) => match[1])
  const urls = [...markdown.matchAll(/\((https:\/\/echotechfe\.github\.io\/devicekit\/devices\/[^)]+\/)\)/g)].map((match) => match[1])
  const expectedUrls = names.map((name) => `https://echotechfe.github.io/devicekit/devices/${deviceSlug(name)}/`)

  assert.ok(markdown.includes('pnpm generate:device-pages'))
  assert.equal(urls.length, names.length)
  assert.deepEqual(new Set(urls), new Set(expectedUrls))
})
