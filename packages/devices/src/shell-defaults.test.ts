import { afterEach, describe, expect, it } from 'vitest'
import { PLATFORM_DEFAULTS, resolveDevice, type DeviceProfile, type DeviceShell } from './devices.js'
import { assertDeviceProfile } from './validate.js'

const profile = (shell?: Partial<DeviceShell>): DeviceProfile => ({
  name: 'shell fixture', os: 'ios', screen: { width: 100, height: 200 }, pixelRatio: 1, shell,
})

const original = { ...PLATFORM_DEFAULTS.ios, shell: { ...PLATFORM_DEFAULTS.ios.shell } }

afterEach(() => {
  PLATFORM_DEFAULTS.ios = { ...original, shell: { ...original.shell } }
})

describe('resolved shell default precedence', () => {
  it('inherits every platform inset and Home button when the profile has no shell geometry', () => {
    PLATFORM_DEFAULTS.ios.shell = { screenRadius: 10, bezel: 3, bezelInsets: { top: 11, right: 12, bottom: 13, left: 14 }, homeButton: { diameter: 20 } }
    expect(resolveDevice(profile()).shell).toMatchObject({
      bezel: 3,
      bezelInsets: { top: 11, right: 12, bottom: 13, left: 14 },
      homeButton: { diameter: 20 },
    })
  })

  it('uses an explicit uniform bezel for every edge instead of retaining platform insets', () => {
    PLATFORM_DEFAULTS.ios.shell = { screenRadius: 10, bezel: 3, bezelInsets: { top: 11, right: 12, bottom: 13, left: 14 } }
    expect(resolveDevice(profile({ bezel: 7 })).shell.bezelInsets).toEqual({ top: 7, right: 7, bottom: 7, left: 7 })
  })

  it('uses partial profile insets including zero, with the resolved uniform bezel for missing edges', () => {
    PLATFORM_DEFAULTS.ios.shell = { screenRadius: 10, bezel: 3, bezelInsets: { top: 11, right: 12, bottom: 13, left: 14 } }
    expect(resolveDevice(profile({ bezel: 7, bezelInsets: { top: 0, left: 9 } })).shell.bezelInsets).toEqual({ top: 0, right: 7, bottom: 7, left: 9 })
  })

  it('allows resolved shells to round-trip, treats undefined as omitted, and lets null disable a platform button', () => {
    PLATFORM_DEFAULTS.ios.shell = { screenRadius: 10, bezel: 3, homeButton: { diameter: 20 } }
    const resolved = resolveDevice(profile())
    const roundTrip: DeviceProfile = { ...profile(), shell: resolved.shell }
    expect(() => assertDeviceProfile(roundTrip)).not.toThrow()
    expect(resolveDevice(profile({ homeButton: undefined })).shell.homeButton).toEqual({ diameter: 20 })
    expect(resolveDevice(profile({ homeButton: null })).shell.homeButton).toBeNull()
  })
})

describe('resolved screenCorners precedence', () => {
  it('every corner takes the uniform screenRadius when the profile omits screenCorners', () => {
    PLATFORM_DEFAULTS.ios.shell = { screenRadius: 10, bezel: 3 }
    expect(resolveDevice(profile({ screenRadius: 20 })).shell.screenCorners).toEqual({
      topLeft: 20, topRight: 20, bottomRight: 20, bottomLeft: 20,
    })
  })

  it('a partial screenCorners override, including zero, falls back to screenRadius for the omitted corners', () => {
    PLATFORM_DEFAULTS.ios.shell = { screenRadius: 10, bezel: 3 }
    expect(resolveDevice(profile({ screenRadius: 20, screenCorners: { topLeft: 0, bottomLeft: 0 } })).shell.screenCorners).toEqual({
      topLeft: 0, topRight: 20, bottomRight: 20, bottomLeft: 0,
    })
  })

  it('a profile with screenCorners but no screenRadius falls back to the platform screenRadius for omitted corners', () => {
    PLATFORM_DEFAULTS.ios.shell = { screenRadius: 15, bezel: 3 }
    expect(resolveDevice(profile({ screenCorners: { topLeft: 4, bottomLeft: 4 } })).shell.screenCorners).toEqual({
      topLeft: 4, topRight: 15, bottomRight: 15, bottomLeft: 4,
    })
  })

  it('the default bodyRadius is the largest corner radius plus the largest bezel inset', () => {
    PLATFORM_DEFAULTS.ios.shell = { screenRadius: 10, bezel: 3 }
    const resolved = resolveDevice(profile({
      screenRadius: 20,
      screenCorners: { topLeft: 5, bottomLeft: 5 },
      bezelInsets: { left: 9 },
    }))
    expect(resolved.shell.bodyRadius).toBe(20 + 9)
  })
})
