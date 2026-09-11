// Vitest executes this source-boundary check in Node; the package browser
// tsconfig intentionally does not include Node's ambient types.
// @ts-expect-error -- node:fs is available in the Vitest runtime only.
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const demoMain = readFileSync('demo/main.ts', 'utf8')
const astroConfig = readFileSync('demo/astro.config.ts', 'utf8')

it('uses only project-authored status-bar masks in the demo', () => {
  expect(demoMain).not.toContain('SF_SYMBOLS_ENDPOINT')
  expect(demoMain).not.toContain('applySfSymbolMasks')
  expect(astroConfig).not.toContain('sfSymbolProviderPlugin')
})
