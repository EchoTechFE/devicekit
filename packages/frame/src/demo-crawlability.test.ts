import { describe, expect, it } from 'vitest'
// @ts-expect-error -- node:fs is available in the Vitest runtime only.
import { readFileSync } from 'node:fs'

const deviceDirectory = readFileSync('demo/src/pages/devices/index.astro', 'utf8')
const demoPage = readFileSync('demo/src/components/DemoPage.astro', 'utf8')

describe('demo crawlability', () => {
  it('provides a static directory that links to every device detail page', () => {
    expect(deviceDirectory).toContain('DEVICES.map')
    expect(deviceDirectory).toContain('<a href={deviceHref(device.name)}>')
    expect(deviceDirectory).toContain('new URL(devicePath(name), DEMO_SITE_URL).pathname')
  })

  it('renders the selected device facts and the directory link before JavaScript runs', () => {
    expect(demoPage).toContain('id="device-directory"')
    expect(demoPage).toContain('new URL(DEMO_DEVICE_DIRECTORY_URL).pathname')
    expect(demoPage).toContain('Operating system')
    expect(demoPage).toContain('CSS viewport')
    expect(demoPage).toContain('Pixel ratio')
    expect(demoPage).toContain('Release year')
  })
})
