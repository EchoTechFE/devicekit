import { describe, expect, it } from 'vitest'
import { assertDeviceProfile, cutoutFor, findDevice, resolveDevice, type DeviceProfile } from './index.js'

describe('per-orientation cutouts', () => {
  it('defaults the landscape cutout to null and selects the stored orientation', () => {
    const plain: DeviceProfile = { name: 'plain', os: 'ios', screen: { width: 100, height: 200 }, pixelRatio: 1, cutout: { shape: 'circle', width: 10, height: 10, top: 4 } }
    const resolvedPlain = resolveDevice(plain)
    expect(resolvedPlain.cutoutLandscape).toBeNull()
    expect(cutoutFor(resolvedPlain, 'portrait')).toEqual(plain.cutout)
    expect(cutoutFor(resolvedPlain, 'landscape')).toBeNull()

    const duo = resolveDevice(findDevice('iPhone Duo (outer)')!)
    expect(cutoutFor(duo, 'landscape')).toEqual({ shape: 'circle', width: 37, height: 37, top: 401, centerX: 0.934 })
  })

  it('validates the landscape geometry with the same rules as portrait', () => {
    expect(() => assertDeviceProfile({
      name: 'invalid landscape cutout', os: 'ios', screen: { width: 100, height: 200 }, pixelRatio: 1,
      cutoutLandscape: { shape: 'square', width: 10, height: 10, top: 0 },
    })).toThrow(/cutoutLandscape\.shape/)
  })
})
