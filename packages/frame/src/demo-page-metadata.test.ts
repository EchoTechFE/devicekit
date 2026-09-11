import { describe, expect, it } from 'vitest'
import { DEVICES } from '@devicekit/devices'
// @ts-expect-error -- node:fs is available in the Vitest runtime only.
import { readFileSync } from 'node:fs'
import { demoPageMetadata } from './demo-page-metadata.js'

const demoMain = readFileSync('demo/main.ts', 'utf8')

describe('demoPageMetadata', () => {
  it('restores the homepage title, heading, canonical URL and structured data', () => {
    const metadata = demoPageMetadata()

    expect(metadata.title).toBe('Device frame simulator for iOS, Android & HarmonyOS | devicekit')
    expect(metadata.heading).toBe('Device frame simulator')
    expect(metadata.canonical).toBe('https://echotechfe.github.io/devicekit/')
    expect(metadata.jsonLd).toMatchObject({ '@type': 'WebApplication', url: metadata.canonical })
  })

  it('uses device-specific metadata when the current route names a device', () => {
    const device = DEVICES.find((candidate) => candidate.name === 'iPhone 18 Pro')
    if (device === undefined) throw new Error('missing iPhone 18 Pro fixture')

    const metadata = demoPageMetadata(device)

    expect(metadata.title).toBe('iPhone 18 Pro device frame simulator | devicekit')
    expect(metadata.heading).toBe('iPhone 18 Pro device frame simulator')
    expect(metadata.canonical).toBe('https://echotechfe.github.io/devicekit/devices/iphone-18-pro/')
    expect(metadata.jsonLd).toMatchObject({ '@type': 'WebPage', url: metadata.canonical })
  })

  it('makes browser history restore homepage metadata after a device route', () => {
    const popstateHandler = demoMain.slice(demoMain.indexOf("window.addEventListener('popstate'"), demoMain.indexOf('\n\n  fillDevices()'))
    const applyBody = demoMain.slice(demoMain.indexOf('function apply()'), demoMain.indexOf('function selectedTheme'))

    expect(popstateHandler).toContain('showingDeviceMetadata = device !== undefined')
    expect(popstateHandler).toContain('deviceSelect.value = device?.name ?? DEMO_DEFAULT_DEVICE_NAME')
    expect(applyBody).toContain('syncPageMetadata(showingDeviceMetadata ? device : undefined)')
  })
})
