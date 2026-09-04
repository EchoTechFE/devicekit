/**
 * A device's top safe-area inset is the usable strip below the status bar —
 * it can never be shallower than the status bar itself, or a page would draw
 * content under the clock. Portrait keeps that invariant because
 * resolveDevice() derives the portrait inset from the status bar height. The
 * landscape inset is stored independently and, on Android and HarmonyOS
 * (whose status bar stays visible in landscape), a profile that leaves
 * `safeAreaInsetsLandscape` unset must still get a top inset that matches
 * `statusBarHeightLandscape` — not the empty-inset fallback that only iOS
 * (status bar height 0 in landscape) can use safely.
 */
import { describe, expect, it } from 'vitest'
import { PLATFORM_DEFAULTS, resolveDevice, safeAreaInsetsFor, statusBarHeightFor, type DeviceProfile } from './devices.js'
import { DEVICES } from './presets/index.js'

describe('landscape top inset vs. status bar height', () => {
  it.each(DEVICES.map((profile) => [profile.name, profile] as const))(
    'never draws %s content under its own status bar, portrait or landscape',
    (_name: string, profile: DeviceProfile) => {
      const resolved = resolveDevice(profile)
      for (const orientation of ['portrait', 'landscape'] as const) {
        const inset = safeAreaInsetsFor(resolved, orientation)
        const statusBar = statusBarHeightFor(resolved, orientation)
        expect(inset.top, `${profile.name} ${orientation}`).toBeGreaterThanOrEqual(statusBar)
      }
    },
  )

  // No custom safeAreaInsetsLandscape in the source row, so this exercises the
  // platform-default fallback rather than a measured value.
  it('falls back Samsung Galaxy S8+ (android, no measured landscape inset) to the platform status bar height', () => {
    const profile = DEVICES.find((d) => d.name === 'Samsung Galaxy S8+')
    expect(profile).toBeDefined()
    const resolved = resolveDevice(profile!)
    const landscape = safeAreaInsetsFor(resolved, 'landscape')
    expect(landscape.top).toBe(PLATFORM_DEFAULTS.android.statusBarHeightLandscape)
  })

  it('falls back HUAWEI Mate 80 (harmony, no measured landscape inset) to the platform status bar height', () => {
    const profile = DEVICES.find((d) => d.name === 'HUAWEI Mate 80')
    expect(profile).toBeDefined()
    const resolved = resolveDevice(profile!)
    const landscape = safeAreaInsetsFor(resolved, 'landscape')
    expect(landscape.top).toBe(PLATFORM_DEFAULTS.harmony.statusBarHeightLandscape)
  })

  it('keeps iOS landscape top inset at 0, matching its 0 landscape status bar', () => {
    const profile = DEVICES.find((d) => d.name === 'iPhone X')
    expect(profile).toBeDefined()
    const resolved = resolveDevice(profile!)
    expect(statusBarHeightFor(resolved, 'landscape')).toBe(0)
    expect(safeAreaInsetsFor(resolved, 'landscape').top).toBe(0)
  })
})
