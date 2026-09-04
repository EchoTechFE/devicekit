/**
 * `formFactor` distinguishes a phone from a tablet preset. resolveDevice()
 * must default a profile that omits it to `'phone'` — every existing preset
 * and every host-supplied profile predates this field, so a silent default is
 * the only way this stays additive. assertDeviceProfile() has to reject a
 * bogus value with the same message shape the other enum fields already use
 * (see `os` in validate.ts), or a typo silently falls through to `'phone'`.
 */
import { describe, expect, it } from 'vitest'
import { resolveDevice, type DeviceProfile } from './devices.js'
import { assertDeviceProfile } from './validate.js'
import type { DeviceFormFactor } from './index.js'

const baseProfile: DeviceProfile = {
  name: 'Test Phone',
  os: 'android',
  screen: { width: 360, height: 800 },
  pixelRatio: 2,
}

describe('DeviceProfile.formFactor', () => {
  it('resolveDevice defaults formFactor to "phone" when the profile omits it', () => {
    const resolved = resolveDevice(baseProfile)
    expect(resolved.formFactor).toBe('phone')
  })

  it('resolveDevice passes an explicit "tablet" formFactor through', () => {
    const resolved = resolveDevice({ ...baseProfile, name: 'Test Tablet', formFactor: 'tablet' })
    expect(resolved.formFactor).toBe('tablet')
  })

  it('resolveDevice passes an explicit "phone" formFactor through', () => {
    const resolved = resolveDevice({ ...baseProfile, formFactor: 'phone' })
    expect(resolved.formFactor).toBe('phone')
  })

  it('assertDeviceProfile accepts a profile with no formFactor', () => {
    expect(() => assertDeviceProfile(baseProfile, 'deviceProfile')).not.toThrow()
  })

  it('assertDeviceProfile rejects an invalid formFactor with the same message shape as os', () => {
    const bad = { ...baseProfile, formFactor: 'tv' }
    expect(() => assertDeviceProfile(bad, 'deviceProfile')).toThrow(TypeError)
    expect(() => assertDeviceProfile(bad, 'deviceProfile')).toThrow(
      'deviceProfile.formFactor must be one of "phone", "tablet", got "tv"',
    )
  })

  it('the DeviceFormFactor type accepts "phone" and "tablet"', () => {
    const phone: DeviceFormFactor = 'phone'
    const tablet: DeviceFormFactor = 'tablet'
    expect(phone).toBe('phone')
    expect(tablet).toBe('tablet')
  })
})
