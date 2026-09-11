// @ts-expect-error -- node:fs is available in the Vitest runtime only.
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const demoPage = readFileSync('demo/src/components/DemoPage.astro', 'utf8')

it('credits EchoTechFE directly below the device preview', () => {
  const preview = demoPage.indexOf('class="stage__viewport"')
  const attribution = demoPage.indexOf('class="stage__attribution"')

  expect(preview).toBeGreaterThan(-1)
  expect(attribution).toBeGreaterThan(preview)
  expect(demoPage).toContain('Open sourced by')
  expect(demoPage).toContain('https://github.com/EchoTechFE')
})
