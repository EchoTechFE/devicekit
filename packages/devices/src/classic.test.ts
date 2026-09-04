/**
 * CLASSIC_DEVICES is the short hand-picked list a host shows when the whole
 * 171-row table is too much for a picker. It must stay a strict subset of
 * the table — the same objects, not copies — so
 * a name chosen from it resolves through findDevice() like any other entry.
 */
import { describe, expect, it } from 'vitest'
import { CLASSIC_DEVICES, DEFAULT_DEVICE, DEVICES, findDevice, type DeviceOS } from './index.js'

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
})
