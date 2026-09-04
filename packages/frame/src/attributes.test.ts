import { describe, expect, it } from 'vitest'
import {
  profileFromAttributes,
  toCutout,
  toOrientation,
  toOS,
  toPositiveNumber,
} from './attributes.js'
import { CUTOUT_PRESETS } from './cutout.js'
import type { DeviceProfile } from '@devicekit/devices'

function elementWith(attributes: Record<string, string>): Element {
  const el = document.createElement('div')
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
  return el
}

describe('toPositiveNumber', () => {
  it('parses a non-negative numeric string', () => {
    expect(toPositiveNumber('12')).toBe(12)
    expect(toPositiveNumber('0')).toBe(0)
    expect(toPositiveNumber('12.5')).toBe(12.5)
  })

  it('rejects a negative number rather than passing it through', () => {
    expect(toPositiveNumber('-1')).toBeUndefined()
  })

  it('rejects a non-numeric string instead of producing NaN', () => {
    expect(toPositiveNumber('abc')).toBeUndefined()
    expect(Number.isNaN(toPositiveNumber('abc'))).toBe(false)
  })

  it('reports a missing attribute as undefined, the same as an invalid one', () => {
    expect(toPositiveNumber(null)).toBeUndefined()
  })
})

describe('toOS', () => {
  it('accepts the three supported platforms', () => {
    expect(toOS('ios')).toBe('ios')
    expect(toOS('android')).toBe('android')
    expect(toOS('harmony')).toBe('harmony')
  })

  it('rejects anything else, missing attribute included', () => {
    expect(toOS('windows')).toBeUndefined()
    expect(toOS(null)).toBeUndefined()
  })
})

describe('toOrientation', () => {
  it('is landscape only for the exact string; everything else, including missing, is portrait', () => {
    expect(toOrientation('landscape')).toBe('landscape')
    expect(toOrientation('portrait')).toBe('portrait')
    expect(toOrientation(null)).toBe('portrait')
    expect(toOrientation('sideways')).toBe('portrait')
  })
})

describe('toCutout', () => {
  it('leaves the preset untouched when the attribute is absent', () => {
    expect(toCutout(null)).toBeUndefined()
  })

  it('clears the cutout for "none", distinct from a missing attribute', () => {
    expect(toCutout('none')).toBeNull()
  })

  for (const shape of ['notch', 'pill', 'circle'] as const) {
    it(`returns the stock geometry for a known shape (${shape})`, () => {
      expect(toCutout(shape)).toBe(CUTOUT_PRESETS[shape])
    })
  }

  it('rejects a shape that is not in the stock table', () => {
    expect(toCutout('square')).toBeUndefined()
  })
})

describe('profileFromAttributes', () => {
  const preset: DeviceProfile = {
    name: 'Preset Phone',
    os: 'ios',
    screen: { width: 100, height: 200 },
    pixelRatio: 2,
    system: 'iOS 18.0',
    statusBarHeight: 30,
    safeAreaInsets: { top: 30, bottom: 10 },
    cutout: { shape: 'notch', width: 50, height: 10, top: 0 },
  }
  const fallbackScreen = { width: 1, height: 1 }

  it('lets an attribute override the field it names, next to the preset', () => {
    const profile = profileFromAttributes(elementWith({ width: '414' }), preset, fallbackScreen)
    expect(profile.screen.width).toBe(414)
    expect(profile.screen.height).toBe(200)
  })

  it('falls back to the preset for every field a missing attribute leaves out', () => {
    const profile = profileFromAttributes(elementWith({}), preset, fallbackScreen)
    expect(profile).toMatchObject({
      os: 'ios',
      screen: { width: 100, height: 200 },
      pixelRatio: 2,
      system: 'iOS 18.0',
      statusBarHeight: 30,
      safeAreaInsets: { top: 30, bottom: 10 },
    })
    expect(profile.cutout).toEqual(preset.cutout)
  })

  it('falls back to the fallback screen when neither an attribute nor a preset names one', () => {
    const profile = profileFromAttributes(elementWith({}), null, { width: 9, height: 9 })
    expect(profile.screen).toEqual({ width: 9, height: 9 })
  })

  it('defaults os to ios and pixelRatio to 1 when nothing at all names one', () => {
    const profile = profileFromAttributes(elementWith({}), null, fallbackScreen)
    expect(profile.os).toBe('ios')
    expect(profile.pixelRatio).toBe(1)
  })

  it('cutout="none" clears the preset cutout, where a missing attribute keeps it', () => {
    const cleared = profileFromAttributes(elementWith({ cutout: 'none' }), preset, fallbackScreen)
    expect(cleared.cutout).toBeUndefined()

    const kept = profileFromAttributes(elementWith({}), preset, fallbackScreen)
    expect(kept.cutout).toEqual(preset.cutout)
  })

  it('ignores an invalid numeric attribute instead of poisoning the profile with NaN', () => {
    const negative = profileFromAttributes(elementWith({ 'status-bar-height': '-5' }), preset, fallbackScreen)
    expect(negative.statusBarHeight).toBe(30)

    const nonNumeric = profileFromAttributes(elementWith({ width: 'abc' }), preset, fallbackScreen)
    expect(nonNumeric.screen.width).toBe(100)
    expect(Number.isNaN(nonNumeric.screen.width)).toBe(false)
  })

  it('folds the four safe-area attributes into one partial-insets object', () => {
    const profile = profileFromAttributes(
      elementWith({ 'safe-area-top': '10', 'safe-area-bottom': '20' }),
      null,
      fallbackScreen,
    )
    expect(profile.safeAreaInsets).toEqual({ top: 10, bottom: 20 })
  })

  it('reports no safe-area override when none of the four attributes are set', () => {
    const profile = profileFromAttributes(elementWith({}), preset, fallbackScreen)
    expect(profile.safeAreaInsets).toEqual(preset.safeAreaInsets)
  })

  // navigation-bar-height already applies to both orientations (see device-frame.ts's
  // #navigationBarHeight); status-bar-height and safe-area-* have to follow the same rule
  // instead of only ever reaching the portrait fields.
  it('an explicit status-bar-height attribute overrides the landscape height as well as the portrait one', () => {
    const profile = profileFromAttributes(elementWith({ 'status-bar-height': '20' }), preset, fallbackScreen)
    expect(profile.statusBarHeight).toBe(20)
    expect(profile.statusBarHeightLandscape).toBe(20)
  })

  it('leaves statusBarHeightLandscape at the preset when the attribute is absent', () => {
    const profile = profileFromAttributes(elementWith({}), preset, fallbackScreen)
    expect(profile.statusBarHeightLandscape).toBe(preset.statusBarHeightLandscape)
  })

  it('explicit safe-area-* attributes override the landscape insets as well as the portrait ones', () => {
    const profile = profileFromAttributes(
      elementWith({ 'safe-area-top': '10', 'safe-area-bottom': '5' }),
      preset,
      fallbackScreen,
    )
    expect(profile.safeAreaInsetsLandscape).toEqual({ top: 10, bottom: 5 })
  })

  it('leaves safeAreaInsetsLandscape at the preset when none of the four attributes are set', () => {
    const profile = profileFromAttributes(elementWith({}), preset, fallbackScreen)
    expect(profile.safeAreaInsetsLandscape).toEqual(preset.safeAreaInsetsLandscape)
  })
})
