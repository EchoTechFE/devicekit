import { describe, expect, it } from 'vitest'
import { resolveDevice, safeAreaInsetsFor, type DeviceOS, type DeviceProfile, type Orientation } from './devices.js'
import { orientedScreen } from './safe-area.js'
import { ANDROID_DEVICES, DEFAULT_DEVICE, DEVICES, findDevice, HARMONY_DEVICES, IOS_DEVICES } from './presets/index.js'
import { CHROME_BUILD, systemVersion } from './user-agent.js'

/**
 * Whole-table checks. Individual devices are cross-checked against the external
 * tables in devices.test.ts; these are the invariants that have to hold for
 * every row, including rows added later.
 */

const PLATFORMS: Array<[DeviceOS, readonly DeviceProfile[]]> = [
  ['ios', IOS_DEVICES],
  ['android', ANDROID_DEVICES],
  ['harmony', HARMONY_DEVICES],
]

describe('the table is well formed', () => {
  it('has every platform represented, and DEVICES is exactly the three of them', () => {
    for (const [os, devices] of PLATFORMS) expect(devices.length, os).toBeGreaterThan(0)
    expect(DEVICES.length).toBe(IOS_DEVICES.length + ANDROID_DEVICES.length + HARMONY_DEVICES.length)
  })

  it('keeps each platform file to its own platform', () => {
    for (const [os, devices] of PLATFORMS) {
      expect(devices.filter((d) => d.os !== os).map((d) => d.name)).toEqual([])
    }
  })

  // findDevice is a name lookup, so a duplicate name silently makes one of the
  // two unreachable.
  it('gives every device a distinct name', () => {
    const seen = new Set<string>()
    const duplicates = DEVICES.filter((d) => (seen.has(d.name) ? true : (seen.add(d.name), false)))
    expect(duplicates.map((d) => d.name)).toEqual([])
  })

  it('gives every device a positive screen and pixel ratio', () => {
    const broken = DEVICES.filter((d) => !(d.screen.width > 0 && d.screen.height > 0 && d.pixelRatio > 0))
    expect(broken.map((d) => d.name)).toEqual([])
  })

  // Rotating is what the orientation argument is for. A source table that also
  // ships a pre-rotated copy of a device leaves two rows here where one turns
  // into the other, and the pre-rotated one then rotates backwards.
  it('lists no device twice, once per orientation', () => {
    const seen = new Map<string, string>()
    const rotations: string[] = []
    for (const d of DEVICES) {
      const rotated = `${d.os} ${d.screen.height}x${d.screen.width}@${d.pixelRatio}`
      const twin = seen.get(rotated)
      if (twin !== undefined) rotations.push(`${d.name} is ${twin} rotated`)
      seen.set(`${d.os} ${d.screen.width}x${d.screen.height}@${d.pixelRatio}`, d.name)
    }
    expect(rotations).toEqual([])
  })
})

describe('user agents are usable as-is', () => {
  // Some source tables store a template with a placeholder for the browser
  // version. Shipping one of those sends a literal '%s' to the site.
  it('carries no unsubstituted placeholder', () => {
    const templated = DEVICES.filter((d) => d.userAgent !== undefined && /%s|\{/.test(d.userAgent))
    expect(templated.map((d) => d.name)).toEqual([])
  })

  // One source table files a Windows tablet under an iPad user agent, so a row
  // can land on the wrong platform without anything else looking odd. The
  // reverse check is the one that catches it: nothing claims a platform it is
  // not filed under. It is deliberately not `must mention iPhone or iPad` —
  // recent iPadOS sends a desktop Safari user agent by default, and iPad Pro 13
  // is in here with one.
  it('claims no platform other than the one it is filed under', () => {
    const strays = [
      ...IOS_DEVICES.filter((d) => /Android|OpenHarmony|KAIOS|KaiOS/.test(d.userAgent ?? '')),
      ...ANDROID_DEVICES.filter((d) => /iPhone|iPad|OpenHarmony|KAIOS|KaiOS/.test(d.userAgent ?? '')),
      ...HARMONY_DEVICES.filter((d) => /iPhone|iPad|KAIOS|KaiOS/.test(d.userAgent ?? '')),
    ]
    expect(strays.map((d) => d.name)).toEqual([])
  })

  // systemVersion() drives the generated UA when userAgent is omitted, and it is also the
  // label shown in a device picker: a UA whose own version disagrees with it is lying about
  // one or the other. Compared by major version only — the two channels bump patch versions
  // independently.
  it('agrees with its own system label on iOS: the UA major version matches systemVersion', () => {
    const majorOf = (raw: string): number => Number.parseInt(raw.split('.')[0]!, 10)
    const mismatched = IOS_DEVICES.filter((d) => {
      const ua = d.userAgent ?? ''
      const sysMajor = majorOf(systemVersion(d))
      // Checked independently: a UA can carry the platform token and the Safari
      // Version/ token out of step with each other as well as with the label.
      const platform = /OS (\d+)_/.exec(ua)
      const safariVersion = /Version\/(\d+)/.exec(ua)
      const platformMismatch = platform !== null && Number.parseInt(platform[1]!, 10) !== sysMajor
      const versionMismatch = safariVersion !== null && Number.parseInt(safariVersion[1]!, 10) !== sysMajor
      return platformMismatch || versionMismatch
    }).map((d) => d.name)
    expect(mismatched).toEqual([])
  })

  // Stock Android browsers never shipped a Version/ token above single digits; a UA quoting
  // Version/26 is generated Safari-style data pasted onto an Android row.
  it('never quotes an implausibly high Version/ token on Android (stock browser never reached Version/6)', () => {
    const implausible = ANDROID_DEVICES.filter((d) => {
      const match = /Version\/(\d+)/.exec(d.userAgent ?? '')
      return match !== null && Number.parseInt(match[1]!, 10) > 5
    }).map((d) => d.name)
    expect(implausible).toEqual([])
  })

  it('CHROME_BUILD matches the Chrome build the Android table actually ships most often', () => {
    const counts = new Map<string, number>()
    for (const d of ANDROID_DEVICES) {
      const match = /Chrome\/([\d.]+)/.exec(d.userAgent ?? '')
      if (!match) continue
      const build = match[1]!
      counts.set(build, (counts.get(build) ?? 0) + 1)
    }
    const mostCommon = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    expect(CHROME_BUILD).toBe(mostCommon)
  })
})

describe('the table carries no noise: functional entries only, each fully labeled', () => {
  it('gives every device a non-empty system label', () => {
    const unlabeled = DEVICES.filter((d) => !d.system || d.system.trim() === '').map((d) => d.name)
    expect(unlabeled).toEqual([])
  })

  it('names no device as an emulation of an app running on a platform ("X on Y"), and no KaiOS feature phone', () => {
    const noise = DEVICES.filter((d) => / on /.test(d.name) || d.name.includes('JioPhone')).map((d) => d.name)
    expect(noise).toEqual([])
  })
})

describe('every device resolves to metrics a frame can be drawn from', () => {
  const orientations: Orientation[] = ['portrait', 'landscape']

  it('never reports a safe area larger than the screen it sits in', () => {
    const impossible: string[] = []
    for (const device of DEVICES) {
      const resolved = resolveDevice(device)
      for (const orientation of orientations) {
        const screen = orientedScreen(device, orientation)
        const insets = safeAreaInsetsFor(resolved, orientation)
        const negative = insets.top < 0 || insets.right < 0 || insets.bottom < 0 || insets.left < 0
        if (negative || insets.top + insets.bottom > screen.height || insets.left + insets.right > screen.width) {
          impossible.push(`${device.name} ${orientation}`)
        }
      }
    }
    expect(impossible).toEqual([])
  })

  it('keeps every cutout inside the portrait screen', () => {
    const outside = DEVICES.filter((d) => d.cutout !== undefined
      && (d.cutout.width > d.screen.width || d.cutout.top + d.cutout.height > d.screen.height))
    expect(outside.map((d) => d.name)).toEqual([])
  })
})

describe('lookup', () => {
  it('finds a device by its exact name', () => {
    expect(findDevice('iPhone X')?.name).toBe('iPhone X')
  })

  it('returns undefined for an unknown name and for no name at all', () => {
    expect(findDevice('Nokia 3310')).toBeUndefined()
    expect(findDevice(null)).toBeUndefined()
    expect(findDevice(undefined)).toBeUndefined()
    expect(findDevice('')).toBeUndefined()
  })

  // The default used to be a position in the array, which quietly became a
  // different phone as soon as the table grew. It is a name now.
  it('defaults to iPhone X, and to the same object findDevice hands back', () => {
    expect(DEFAULT_DEVICE.name).toBe('iPhone X')
    expect(DEFAULT_DEVICE).toBe(findDevice('iPhone X'))
  })
})
