// @ts-expect-error -- node:fs is available in the Vitest runtime only.
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const demoPage = readFileSync('demo/src/components/DemoPage.astro', 'utf8')

it('lets Astro bundle the interactive demo entry instead of shipping a source path', () => {
  expect(demoPage).toContain("import { bootstrapDemo } from '../client.ts'")
  expect(demoPage).toContain('bootstrapDemo()')
  expect(demoPage).not.toContain('<script src="../../main.ts">')
})
