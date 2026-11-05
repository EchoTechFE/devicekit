/**
 * CLASSIC_DEVICES is the short hand-picked list a host shows when the whole
 * 171-row table is too much for a picker. It must stay a strict subset of
 * the table — the same objects, not copies — so
 * a name chosen from it resolves through findDevice() like any other entry.
 */
import { describe, expect, it } from 'vitest'
import { CLASSIC_DEVICES, DEFAULT_DEVICE, DEVICES, findDevice, resolveDevice, type DeviceOS } from './index.js'

/** Measured screenRadius locked for Classic modern phones (Harmony skipped until measured). */
const CLASSIC_SCREEN_RADIUS: Record<string, number> = {
  'iPhone SE (3rd gen)': 0,
  'iPhone X': 39,
  'iPhone 12/13 (Pro)': 47.33,
  'iPhone 14 Pro': 55,
  'iPhone 15': 55,
  'iPhone 16 Pro Max': 62,
  'iPhone 17 Pro': 62,
  'Pixel 9 Pro': 52.33,
  'Galaxy S24': 36,
  'Galaxy S24 Ultra': 2.13,
}

describe('CLASSIC_DEVICES', () => {
  it('is a short list: at most 20 entries, at least one per platform', () => {
    expect(CLASSIC_DEVICES.length).toBeGreaterThan(0)
    expect(CLASSIC_DEVICES.length).toBeLessThanOrEqual(20)
    const platforms = new Set(CLASSIC_DEVICES.map((d) => d.os))
    expect([...platforms].sort()).toEqual(['android', 'harmony', 'ios'])
  })

  it('contains the same objects as the full table, so names round-trip through findDevice', () => {
    for (const d of CLASSIC_DEVICES) {
      expect(findDevice(d.name), d.name).toBe(d)
      expect(DEVICES.includes(d), d.name).toBe(true)
    }
  })

  it('has no duplicate names', () => {
    const names = CLASSIC_DEVICES.map((d) => d.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('includes DEFAULT_DEVICE, so a host that falls back to the default never leaves the list', () => {
    expect(CLASSIC_DEVICES).toContain(DEFAULT_DEVICE)
  })

  it('keeps each platform contiguous in iOS → Android → HarmonyOS order, so a grouped picker needs no sorting', () => {
    const order = CLASSIC_DEVICES.map((d) => d.os)
    const firstIndex = (os: DeviceOS) => order.indexOf(os)
    const lastIndex = (os: DeviceOS) => order.lastIndexOf(os)
    expect(lastIndex('ios')).toBeLessThan(firstIndex('android'))
    expect(lastIndex('android')).toBeLessThan(firstIndex('harmony'))
  })

  it('does not include unverified Classic rows (Pixel 8 / Xiaomi 14)', () => {
    const names = new Set(CLASSIC_DEVICES.map((d) => d.name))
    expect(names.has('Pixel 8')).toBe(false)
    expect(names.has('Xiaomi 14')).toBe(false)
  })

  it('locks measured screenRadius for Classic modern phones (Harmony skipped until measured)', () => {
    for (const d of CLASSIC_DEVICES) {
      if (d.formFactor === 'tablet') continue
      // Harmony Classic rows still lack measured RoundedCorner — skip honestly.
      if (d.os === 'harmony') continue
      const expected = CLASSIC_SCREEN_RADIUS[d.name]
      expect(expected, `${d.name} must have a locked Classic radius`).toEqual(expect.any(Number))
      expect(d.shell?.screenRadius, `${d.name} explicit screenRadius`).toBe(expected)
      expect(resolveDevice(d).shell.screenRadius, `${d.name} resolved`).toBe(expected)
    }
  })

  it('Harmony Classic phones are present but not inventing radius/cutout', () => {
    const harmony = CLASSIC_DEVICES.filter((d) => d.os === 'harmony' && d.formFactor !== 'tablet')
    expect(harmony.length).toBeGreaterThan(0)
    for (const d of harmony) {
      expect(d.shell?.screenRadius, `${d.name} must not invent radius`).toBeUndefined()
      expect(d.cutout, `${d.name} must not invent cutout`).toBeUndefined()
    }
  })
})
