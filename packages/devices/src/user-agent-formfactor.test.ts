/**
 * `deviceUserAgent` grows a `formFactor` input: an iOS tablet reports desktop
 * Safari (no `iPad`, no `Mobile`, matching Apple's own "request desktop site
 * by default" iPadOS behavior since iOS 13), an iOS phone past major version
 * 26 pins its platform token to `iPhone OS 18_6` (Safari's real ceiling)
 * while `Version/` still carries the true system version, and HarmonyOS drops
 * the `HuaweiBrowser` suffix entirely and switches its form-factor token
 * between `(Phone; ...)` and `(Tablet; ...)`.
 */
import { describe, expect, it } from 'vitest'
import { resolveDevice } from './devices.js'
import { HARMONY_DEVICES } from './presets/index.js'
import { deviceUserAgent } from './user-agent.js'

describe('deviceUserAgent formFactor', () => {
  it('iOS phone: pins the platform token to iPhone OS 18_6 at major version 26+, but keeps the real Version/', () => {
    const ua = deviceUserAgent({ os: 'ios', system: 'iOS 26.0', name: 'iPhone 17 Pro', formFactor: 'phone' })
    expect(ua).toContain('(iPhone; CPU iPhone OS 18_6 like Mac OS X)')
    expect(ua).toContain('Version/26.0')
    expect(ua).not.toContain('26_0')
  })

  it('iOS phone: below major version 26 still reports the real platform token', () => {
    const ua = deviceUserAgent({ os: 'ios', system: 'iOS 18.5', name: 'iPhone 15', formFactor: 'phone' })
    expect(ua).toContain('CPU iPhone OS 18_5')
    expect(ua).toContain('Version/18.5')
  })

  it('iOS tablet: reports desktop Safari, not a Mobile iPad UA', () => {
    const ua = deviceUserAgent({ os: 'ios', system: 'iPadOS 18.5', name: 'iPad Pro 13', formFactor: 'tablet' })
    expect(ua).toBe(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
    )
    expect(ua).not.toContain('iPad')
    expect(ua).not.toContain('Mobile')
  })

  it('harmony phone: starts with the Phone form-factor token and drops HuaweiBrowser', () => {
    const ua = deviceUserAgent({ os: 'harmony', system: 'HarmonyOS 5.0', name: 'HUAWEI Mate 70', formFactor: 'phone' })
    expect(ua.startsWith('Mozilla/5.0 (Phone; OpenHarmony 5.0)')).toBe(true)
    expect(ua).toContain('ArkWeb/4.1.6.1 Mobile')
    expect(ua).not.toContain('HuaweiBrowser')
  })

  it('harmony tablet: starts with the Tablet form-factor token and drops HuaweiBrowser', () => {
    const ua = deviceUserAgent({ os: 'harmony', system: 'HarmonyOS 5.0', name: 'HUAWEI MatePad', formFactor: 'tablet' })
    expect(ua.startsWith('Mozilla/5.0 (Tablet; OpenHarmony 5.0)')).toBe(true)
    expect(ua).not.toContain('HuaweiBrowser')
  })

  it('android phone: keeps the Mobile token', () => {
    const ua = deviceUserAgent({ os: 'android', system: 'Android 14', name: 'Pixel 9', formFactor: 'phone' })
    expect(ua).toContain(' Mobile Safari/537.36')
  })

  it('android tablet: drops the Mobile token and ends with Safari/537.36', () => {
    const ua = deviceUserAgent({ os: 'android', system: 'Android 14', name: 'Pixel Tablet', formFactor: 'tablet' })
    expect(ua).not.toContain('Mobile')
    expect(ua.endsWith(' Safari/537.36')).toBe(true)
  })

  it('no HarmonyOS preset resolves a user agent naming HuaweiBrowser', () => {
    expect(HARMONY_DEVICES.length).toBe(22)
    for (const device of HARMONY_DEVICES) {
      expect(resolveDevice(device).userAgent, device.name).not.toContain('HuaweiBrowser')
    }
  })
})
