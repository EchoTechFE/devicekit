import { describe, expect, it } from 'vitest'
import {
  PLATFORM_DEFAULTS,
  navigationBarHeightFor,
  resolveDevice,
  safeAreaInsetsFor,
  statusBarHeightFor,
  type DeviceOS,
  type DeviceProfile,
} from './devices.js'
import { findDevice } from './presets/index.js'

/**
 * Expected numbers, transcribed from the external device tables and published
 * measurements this package's presets were built from — deliberately not read
 * back out of those presets or their formulas. The status bar
 * height and the portrait top inset are kept as two separate fields on
 * purpose: from the Dynamic Island onward (14 Pro / 16 Pro / 17 Pro) they are
 * different numbers, and a regression that collapses them back into one
 * should fail here.
 */
const IOS_TABLE: Record<string, {
  screen: { width: number, height: number }
  pixelRatio: number
  statusBarHeight: number
  portraitInsets: { top: number, right: number, bottom: number, left: number }
  landscapeInsets: { top: number, right: number, bottom: number, left: number }
}> = {
  'iPhone SE': {
    screen: { width: 375, height: 667 },
    pixelRatio: 2,
    statusBarHeight: 20,
    portraitInsets: { top: 20, right: 0, bottom: 0, left: 0 },
    landscapeInsets: { top: 0, right: 0, bottom: 0, left: 0 },
  },
  'iPhone X': {
    screen: { width: 375, height: 812 },
    pixelRatio: 3,
    statusBarHeight: 44,
    portraitInsets: { top: 44, right: 0, bottom: 34, left: 0 },
    landscapeInsets: { top: 0, right: 44, bottom: 21, left: 44 },
  },
  'iPhone 14': {
    screen: { width: 390, height: 844 },
    pixelRatio: 3,
    statusBarHeight: 47,
    portraitInsets: { top: 47, right: 0, bottom: 34, left: 0 },
    landscapeInsets: { top: 0, right: 47, bottom: 21, left: 47 },
  },
  'iPhone 14 Pro': {
    screen: { width: 393, height: 852 },
    pixelRatio: 3,
    statusBarHeight: 54,
    portraitInsets: { top: 59, right: 0, bottom: 34, left: 0 },
    landscapeInsets: { top: 0, right: 59, bottom: 21, left: 59 },
  },
  'iPhone 16 Pro': {
    screen: { width: 402, height: 874 },
    pixelRatio: 3,
    statusBarHeight: 54,
    portraitInsets: { top: 62, right: 0, bottom: 34, left: 0 },
    landscapeInsets: { top: 0, right: 62, bottom: 21, left: 62 },
  },
  'iPhone 17 Pro': {
    screen: { width: 402, height: 874 },
    pixelRatio: 3,
    statusBarHeight: 54,
    portraitInsets: { top: 62, right: 0, bottom: 34, left: 0 },
    // UIKit on the iOS 26.5 simulator reports 0/62/20/62 in landscape for the
    // whole 17 series: no top inset, and a 20pt (not 21pt) home-indicator inset.
    landscapeInsets: { top: 0, right: 62, bottom: 20, left: 62 },
  },
}

const HARMONY_TABLE: Record<string, {
  screen: { width: number, height: number }
  pixelRatio: number
  statusBarHeight: number
  navigationBarHeight: number
}> = {
  'HUAWEI Mate 60 Pro': { screen: { width: 388, height: 837 }, pixelRatio: 3.25, statusBarHeight: 38, navigationBarHeight: 28 },
  'HUAWEI Mate 70 Pro': { screen: { width: 376, height: 809 }, pixelRatio: 3.5, statusBarHeight: 39, navigationBarHeight: 28 },
  'HUAWEI Mate 80': { screen: { width: 366, height: 809 }, pixelRatio: 3.5, statusBarHeight: 39, navigationBarHeight: 28 },
  'HUAWEI Pura 70': { screen: { width: 372, height: 818 }, pixelRatio: 3.375, statusBarHeight: 36, navigationBarHeight: 28 },
  'HUAWEI Pura 80 Pro': { screen: { width: 365, height: 814 }, pixelRatio: 3.5, statusBarHeight: 38, navigationBarHeight: 28 },
}

const ANDROID_TABLE: Record<string, { screen: { width: number, height: number }, pixelRatio: number }> = {
  'Nexus 5': { screen: { width: 360, height: 640 }, pixelRatio: 3 },
  'Nexus 5X': { screen: { width: 411, height: 731 }, pixelRatio: 2.625 },
  'Nexus 6': { screen: { width: 412, height: 732 }, pixelRatio: 3.5 },
}

function preset(name: string): DeviceProfile {
  const device = findDevice(name)
  if (!device) throw new Error(`fixture device missing from presets: ${name}`)
  return device
}

describe('iOS presets resolve to the external table', () => {
  for (const [name, expected] of Object.entries(IOS_TABLE)) {
    it(`${name}: screen, DPR, status bar and safe area in both orientations`, () => {
      const resolved = resolveDevice(preset(name))
      expect(resolved.screen).toEqual(expected.screen)
      expect(resolved.pixelRatio).toBe(expected.pixelRatio)
      expect(resolved.statusBarHeight).toBe(expected.statusBarHeight)
      expect(safeAreaInsetsFor(resolved, 'portrait')).toEqual(expected.portraitInsets)
      expect(safeAreaInsetsFor(resolved, 'landscape')).toEqual(expected.landscapeInsets)
    })
  }
})

describe('HarmonyOS presets resolve to the external HarmonyOS table', () => {
  for (const [name, expected] of Object.entries(HARMONY_TABLE)) {
    it(`${name}: screen, DPR, status bar and navigation bar (same in both orientations)`, () => {
      const resolved = resolveDevice(preset(name))
      expect(resolved.screen).toEqual(expected.screen)
      expect(resolved.pixelRatio).toBe(expected.pixelRatio)
      expect(resolved.statusBarHeight).toBe(expected.statusBarHeight)
      expect(navigationBarHeightFor(resolved, 'portrait')).toBe(expected.navigationBarHeight)
      expect(navigationBarHeightFor(resolved, 'landscape')).toBe(expected.navigationBarHeight)
    })
  }
})

describe('Android presets resolve their screen and DPR; chrome comes from the platform default', () => {
  for (const [name, expected] of Object.entries(ANDROID_TABLE)) {
    it(`${name}: screen and DPR`, () => {
      const resolved = resolveDevice(preset(name))
      expect(resolved.screen).toEqual(expected.screen)
      expect(resolved.pixelRatio).toBe(expected.pixelRatio)
    })
  }
})

describe('falling back to platform defaults when a profile omits chrome fields', () => {
  function bareProfile(os: DeviceOS): DeviceProfile {
    return { name: 'bare', os, screen: { width: 100, height: 200 }, pixelRatio: 1 }
  }

  it('iOS: navigation bar 44 portrait / 32 landscape, status bar hidden (0) in landscape', () => {
    const resolved = resolveDevice(bareProfile('ios'))
    expect(resolved.navigationBarHeight).toBe(44)
    expect(resolved.navigationBarHeightLandscape).toBe(32)
    expect(resolved.statusBarHeightLandscape).toBe(0)
    // Not part of the external table (no source measures a bare, unnamed
    // iOS device); this just checks the fallback wires up at all.
    expect(resolved.statusBarHeight).toBe(PLATFORM_DEFAULTS.ios.statusBarHeight)
  })

  it('Android: status bar 24, navigation bar 48, unchanged by orientation', () => {
    const resolved = resolveDevice(bareProfile('android'))
    expect(resolved.statusBarHeight).toBe(24)
    expect(resolved.statusBarHeightLandscape).toBe(24)
    expect(resolved.navigationBarHeight).toBe(48)
    expect(resolved.navigationBarHeightLandscape).toBe(48)
  })

  it('HarmonyOS: falls back to the platform constant (not separately specified by any device table)', () => {
    const resolved = resolveDevice(bareProfile('harmony'))
    expect(resolved.statusBarHeight).toBe(PLATFORM_DEFAULTS.harmony.statusBarHeight)
    expect(resolved.navigationBarHeight).toBe(PLATFORM_DEFAULTS.harmony.navigationBarHeight)
  })

  it('an omitted safe area defaults to the status bar on top and nothing on the other three edges', () => {
    const resolved = resolveDevice(bareProfile('android'))
    expect(resolved.safeAreaInsets).toEqual({ top: 24, right: 0, bottom: 0, left: 0 })
    expect(resolved.safeAreaInsetsLandscape).toEqual({ top: 24, right: 0, bottom: 0, left: 0 })
  })
})

describe('per-orientation accessors just switch on orientation', () => {
  it('statusBarHeightFor / navigationBarHeightFor / safeAreaInsetsFor pick the field the orientation names', () => {
    const resolved = resolveDevice({
      name: 'synthetic',
      os: 'ios',
      screen: { width: 100, height: 200 },
      pixelRatio: 1,
      statusBarHeight: 10,
      statusBarHeightLandscape: 20,
      navigationBarHeight: 30,
      navigationBarHeightLandscape: 40,
      safeAreaInsets: { top: 10 },
      safeAreaInsetsLandscape: { left: 5 },
    })

    expect(statusBarHeightFor(resolved, 'portrait')).toBe(10)
    expect(statusBarHeightFor(resolved, 'landscape')).toBe(20)
    expect(navigationBarHeightFor(resolved, 'portrait')).toBe(30)
    expect(navigationBarHeightFor(resolved, 'landscape')).toBe(40)
    expect(safeAreaInsetsFor(resolved, 'portrait')).toEqual({ top: 10, right: 0, bottom: 0, left: 0 })
    expect(safeAreaInsetsFor(resolved, 'landscape')).toEqual({ top: 20, right: 0, bottom: 0, left: 5 })
  })
})
