import { describe, expect, it } from 'vitest'
import { deviceUserAgent, systemVersion } from './user-agent.js'

describe('systemVersion', () => {
  it('pulls the version number out of a system label', () => {
    expect(systemVersion({ os: 'ios', system: 'iOS 18.0' })).toBe('18.0')
    expect(systemVersion({ os: 'harmony', system: 'HarmonyOS 5.0' })).toBe('5.0')
    expect(systemVersion({ os: 'android', system: 'Android 13' })).toBe('13')
  })

  it('falls back to a plausible version rather than leaving a hole when the label is missing', () => {
    expect(systemVersion({ os: 'android', system: undefined })).not.toBe('')
  })
})

describe('deviceUserAgent', () => {
  it('returns a profile-supplied user agent as-is, generating nothing', () => {
    const ua = deviceUserAgent({ os: 'ios', system: 'iOS 18.0', name: 'x', userAgent: 'Custom/1.0' })
    expect(ua).toBe('Custom/1.0')
  })

  it('iOS: underscores the version in the platform token, dots it in the Version token', () => {
    const ua = deviceUserAgent({ os: 'ios', system: 'iOS 18.0', name: 'iPhone', userAgent: undefined })
    expect(ua).toContain('OS 18_0')
    expect(ua).toContain('Version/18.0')
    // The platform token specifically must not carry a dot — collapsing the
    // two tokens into one format is the regression this guards against.
    expect(ua).not.toContain('OS 18.0')
  })

  it('HarmonyOS: names OpenHarmony and carries the ArkWeb engine token', () => {
    const ua = deviceUserAgent({ os: 'harmony', system: 'HarmonyOS 5.0', name: 'HUAWEI Mate 70 Pro', userAgent: undefined })
    expect(ua).toContain('OpenHarmony')
    expect(ua).toContain('ArkWeb')
  })

  it('Android: carries the device model name and system version', () => {
    const ua = deviceUserAgent({ os: 'android', system: 'Android 13', name: 'Nexus 5X', userAgent: undefined })
    expect(ua).toContain('Nexus 5X')
    expect(ua).toContain('Android 13')
  })
})
