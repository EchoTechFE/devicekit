/**
 * Every iPad-named iOS preset, and the five known Android tablets, must carry
 * `formFactor: 'tablet'` — everything else in the table resolves to the
 * default `'phone'`. Checked against the live preset arrays rather than a
 * hardcoded count, so a device added later without the field fails loudly
 * instead of silently rendering as a phone-shaped tablet.
 */
import { describe, expect, it } from 'vitest'
import { resolveDevice } from '../devices.js'
import { ANDROID_DEVICES, HARMONY_DEVICES, IOS_DEVICES } from './index.js'

const ANDROID_TABLET_NAMES = ['Galaxy Tab S4', 'Galaxy Tab S9', 'Nexus 7', 'Nexus 10', 'Pixel Tablet']

describe('preset formFactor', () => {
  it('flags every iPad-named iOS device as a tablet', () => {
    const tablets = IOS_DEVICES.filter((device) => device.name.startsWith('iPad'))
    expect(tablets).toHaveLength(14)
    for (const device of tablets) {
      expect(device.formFactor, device.name).toBe('tablet')
    }
  })

  it('resolves every non-iPad iOS device as a phone', () => {
    const phones = IOS_DEVICES.filter((device) => !device.name.startsWith('iPad'))
    expect(phones.length).toBeGreaterThan(0)
    for (const device of phones) {
      expect(resolveDevice(device).formFactor, device.name).toBe('phone')
    }
  })

  it('flags the five known Android tablets as tablet', () => {
    for (const name of ANDROID_TABLET_NAMES) {
      const device = ANDROID_DEVICES.find((d) => d.name === name)
      expect(device, name).toBeDefined()
      expect(device?.formFactor, name).toBe('tablet')
    }
  })

  it('resolves every other Android device as a phone', () => {
    const phones = ANDROID_DEVICES.filter((device) => !ANDROID_TABLET_NAMES.includes(device.name))
    expect(phones.length).toBeGreaterThan(0)
    for (const device of phones) {
      expect(resolveDevice(device).formFactor, device.name).toBe('phone')
    }
  })

  it('resolves every HarmonyOS device as a phone', () => {
    expect(HARMONY_DEVICES.length).toBe(22)
    for (const device of HARMONY_DEVICES) {
      expect(resolveDevice(device).formFactor, device.name).toBe('phone')
    }
  })
})
