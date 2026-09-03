import { describe, expect, it } from 'vitest'
import { computeStatusBarLayout } from './status-bar-layout.js'
import { findDevice, resolveDevice } from '@devicekit/devices'
import type { CutoutSpec, ResolvedDevice } from '@devicekit/devices'

/**
 * Builds a resolved device from a real preset, then overrides the fields the
 * spec's measured table varies (screen width, pixel ratio, status bar height,
 * cutout) — decoupling these cases from whatever the presets currently hold,
 * since those values are being corrected independently.
 */
function withOverrides(presetName: string, overrides: Partial<ResolvedDevice>): ResolvedDevice {
  const base = resolveDevice(findDevice(presetName)!)
  return { ...base, ...overrides }
}

const NOTCH_STUB: Pick<CutoutSpec, 'width' | 'height'> = { width: 200, height: 30 }

describe('mode selection follows os, cutout presence, and screen size', () => {
  it('a cutout phone is ios-cutout (iPhone 15)', () => {
    const device = resolveDevice(findDevice('iPhone 15')!)
    expect(computeStatusBarLayout(device, 'portrait').mode).toBe('ios-cutout')
  })

  it('a phone with no cutout is ios-classic (iPhone SE)', () => {
    const device = resolveDevice(findDevice('iPhone SE')!)
    expect(computeStatusBarLayout(device, 'portrait').mode).toBe('ios-classic')
  })

  it('an iOS device whose short side is 744pt or more is ipad regardless of cutout (iPad Pro 11)', () => {
    const device = resolveDevice(findDevice('iPad Pro 11')!)
    expect(computeStatusBarLayout(device, 'portrait').mode).toBe('ipad')
  })

  it('android maps to the android mode (Pixel 7)', () => {
    const device = resolveDevice(findDevice('Pixel 7')!)
    expect(computeStatusBarLayout(device, 'portrait').mode).toBe('android')
  })

  it('harmony also maps to the android mode, having no layout of its own yet (HUAWEI Mate 60)', () => {
    const device = resolveDevice(findDevice('HUAWEI Mate 60')!)
    expect(computeStatusBarLayout(device, 'portrait').mode).toBe('android')
  })
})

describe('ios-cutout: measured table rows are looked up by (width, pixelRatio, statusBarHeight)', () => {
  const rows: Array<{
    label: string
    presetName: string
    W: number
    dpr: number
    sb: number
    shape: CutoutSpec['shape']
    cutoutTop: number
    timeLeft: number
    trailing: number
    scale: number
    centerY?: number
  }> = [
    { label: '375@3 sb44 (iPhone 11 Pro)', presetName: 'iPhone 11 Pro', W: 375, dpr: 3, sb: 44, shape: 'notch', cutoutTop: 0, timeLeft: 31.3, trailing: 14.3, scale: 1.00, centerY: 23.0 },
    { label: '375@3 sb50 (iPhone 13 Mini)', presetName: 'iPhone 13 Mini', W: 375, dpr: 3, sb: 50, shape: 'notch', cutoutTop: 0, timeLeft: 26.7, trailing: 24.5, scale: 0.95, centerY: 26.3 },
    { label: '390@3 sb47 (iPhone 13)', presetName: 'iPhone 13', W: 390, dpr: 3, sb: 47, shape: 'notch', cutoutTop: 0, timeLeft: 36.0, trailing: 18.3, scale: 1.02, centerY: 24.8 },
    { label: '414@2 sb48 (iPhone 11)', presetName: 'iPhone 11', W: 414, dpr: 2, sb: 48, shape: 'notch', cutoutTop: 0, timeLeft: 35.0, trailing: 17.0, scale: 1.05, centerY: 25.0 },
    { label: '414@3 sb44 (iPhone 11 Pro Max)', presetName: 'iPhone 11 Pro Max', W: 414, dpr: 3, sb: 44, shape: 'notch', cutoutTop: 0, timeLeft: 40.7, trailing: 21.4, scale: 1.05, centerY: 22.7 },
    { label: '428@3 sb47 (iPhone 13 Pro Max)', presetName: 'iPhone 13 Pro Max', W: 428, dpr: 3, sb: 47, shape: 'notch', cutoutTop: 0, timeLeft: 45.3, trailing: 27.4, scale: 1.11, centerY: 24.3 },
    { label: '393@3 sb54 (iPhone 15, pill)', presetName: 'iPhone 15', W: 393, dpr: 3, sb: 54, shape: 'pill', cutoutTop: 11, timeLeft: 54.3, trailing: 32.7, scale: 1.11 },
    { label: '402@3 sb54 (iPhone 16 Pro, pill)', presetName: 'iPhone 16 Pro', W: 402, dpr: 3, sb: 54, shape: 'pill', cutoutTop: 14, timeLeft: 56.7, trailing: 35.4, scale: 1.11 },
    { label: '420@3 sb54 (iPhone Air, pill)', presetName: 'iPhone Air', W: 420, dpr: 3, sb: 54, shape: 'pill', cutoutTop: 20, timeLeft: 59.3, trailing: 34.7, scale: 1.17 },
    { label: '430@3 sb54 (iPhone 15 Pro Max, pill)', presetName: 'iPhone 15 Pro Max', W: 430, dpr: 3, sb: 54, shape: 'pill', cutoutTop: 11, timeLeft: 62.3, trailing: 42.6, scale: 1.17 },
    { label: '440@3 sb54 (iPhone 16 Pro Max, pill)', presetName: 'iPhone 16 Pro Max', W: 440, dpr: 3, sb: 54, shape: 'pill', cutoutTop: 14, timeLeft: 65.3, trailing: 40.7, scale: 1.17 },
  ]

  it.each(rows)('$label matches the measured timeLeft/trailing/scale/centerY', (row) => {
    const cutoutHeight = row.shape === 'pill' ? 37 : NOTCH_STUB.height
    const cutout: CutoutSpec = row.shape === 'pill'
      ? { shape: 'pill', width: 125, height: cutoutHeight, top: row.cutoutTop }
      : { shape: 'notch', width: NOTCH_STUB.width, height: cutoutHeight, top: row.cutoutTop }
    const device = withOverrides(row.presetName, {
      screen: { width: row.W, height: Math.round(row.W * 2) },
      pixelRatio: row.dpr,
      statusBarHeight: row.sb,
      cutout,
    })
    const layout = computeStatusBarLayout(device, 'portrait')

    expect(layout.timeLeft).toBeCloseTo(row.timeLeft, 1)
    expect(layout.trailing).toBeCloseTo(row.trailing, 1)
    expect(layout.scale).toBeCloseTo(row.scale, 1)

    const expectedCenterY = row.shape === 'pill' ? cutout.top + cutout.height / 2 : row.centerY!
    expect(layout.centerY).toBeCloseTo(expectedCenterY, 1)
  })
})

describe('ios-cutout: an untabled width falls back to the size-derived formula', () => {
  it('a notch phone off the table (W 380, dpr 3, sb 46, notch width 200) uses ear = (W - cutout.width) / 2', () => {
    const device = withOverrides('iPhone 11 Pro', {
      screen: { width: 380, height: 823 },
      pixelRatio: 3,
      statusBarHeight: 46,
      cutout: { shape: 'notch', width: 200, height: 30, top: 0 },
    })
    const layout = computeStatusBarLayout(device, 'portrait')
    // ear = (380 - 200) / 2 = 90
    expect(layout.timeLeft).toBeCloseTo(35, 1) // ear/2 - 10 = 45 - 10
    expect(layout.trailing).toBeCloseTo(18, 1) // ear/2 - 27 = 45 - 27, above the 10 floor
    expect(layout.centerY).toBeCloseTo(24, 1) // sb/2 + 1 = 23 + 1
    expect(layout.scale).toBeCloseTo(380 / 375, 3)
  })

  it('a pill phone off the table (W 400, dpr 3, sb 54, pill width 120 top 12) uses ear = (W - cutout.width) / 2', () => {
    const device = withOverrides('iPhone 15', {
      screen: { width: 400, height: 866 },
      pixelRatio: 3,
      statusBarHeight: 54,
      // Height is not given in the spec's fallback example; the stock pill
      // height (CUTOUT_PRESETS.pill.height, 37) is used to make the midline
      // computable — see the spec-ambiguity note in the handoff report.
      cutout: { shape: 'pill', width: 120, height: 37, top: 12 },
    })
    const layout = computeStatusBarLayout(device, 'portrait')
    // ear = (400 - 120) / 2 = 140
    expect(layout.timeLeft).toBeCloseTo(57, 1) // ear/2 - 13 = 70 - 13
    expect(layout.trailing).toBeCloseTo(70, 1) // ear/2 = 70
    expect(layout.centerY).toBeCloseTo(30.5, 1) // top + height/2 = 12 + 18.5
    expect(layout.scale).toBeCloseTo(400 / 375, 3)
  })
})

describe('ios-cutout is portrait-only: landscape has no status bar to lay out', () => {
  it('an iPhone with a cutout reports height 0 in landscape (iPhone 15)', () => {
    const device = resolveDevice(findDevice('iPhone 15')!)
    expect(computeStatusBarLayout(device, 'landscape').height).toBe(0)
  })
})

describe('ios-classic: SE/legacy iPhones center the time and space icons by a fixed rule', () => {
  it('iPhone SE has a centered time, a 6px leading icon margin, 14px trailing, and no scaling', () => {
    const device = resolveDevice(findDevice('iPhone SE')!)
    const layout = computeStatusBarLayout(device, 'portrait')
    expect(layout.mode).toBe('ios-classic')
    expect(layout.timeLeft).toBeNull()
    expect(layout.leadingIcons).toBe(6)
    expect(layout.trailing).toBe(14)
    expect(layout.centerY).toBe(10) // sb/2 = 20/2
    expect(layout.scale).toBe(1)
  })

  it('iPhone SE has no status bar in landscape', () => {
    const device = resolveDevice(findDevice('iPhone SE')!)
    expect(computeStatusBarLayout(device, 'landscape').height).toBe(0)
  })
})

describe('ipad: home-button and full-screen iPads share one fixed layout keyed off statusBarHeight', () => {
  it('a 24pt iPad status bar (full-screen) uses 17/15.5 with centerY 12', () => {
    const device = withOverrides('iPad Pro 11', { statusBarHeight: 24 })
    const layout = computeStatusBarLayout(device, 'portrait')
    expect(layout.mode).toBe('ipad')
    expect(layout.timeLeft).toBe(17)
    expect(layout.trailing).toBe(15.5)
    expect(layout.centerY).toBe(12)
    expect(layout.scale).toBe(1)
  })

  it('a 20pt iPad status bar (home-button) uses 7/5.5 with centerY 10', () => {
    const device = withOverrides('iPad Pro 11', { statusBarHeight: 20 })
    const layout = computeStatusBarLayout(device, 'portrait')
    expect(layout.timeLeft).toBe(7)
    expect(layout.trailing).toBe(5.5)
    expect(layout.centerY).toBe(10)
  })

  it('landscape keeps the same rule off statusBarHeightLandscape (24pt, height stays visible)', () => {
    const device = withOverrides('iPad Pro 11', { statusBarHeight: 24, statusBarHeightLandscape: 24 })
    const layout = computeStatusBarLayout(device, 'landscape')
    expect(layout.height).toBe(24)
    expect(layout.timeLeft).toBe(17)
    expect(layout.trailing).toBe(15.5)
    expect(layout.centerY).toBe(12)
  })
})

describe('android: one fixed layout regardless of statusBarHeight, both orientations', () => {
  it('Pixel 7 portrait uses 31/28 with centerY = statusBarHeight / 2', () => {
    const device = resolveDevice(findDevice('Pixel 7')!)
    const layout = computeStatusBarLayout(device, 'portrait')
    expect(layout.mode).toBe('android')
    expect(layout.timeLeft).toBe(31)
    expect(layout.trailing).toBe(28)
    expect(layout.centerY).toBe(device.statusBarHeight / 2)
    expect(layout.scale).toBe(1)
  })

  it('Pixel 7 landscape uses statusBarHeightLandscape for centerY (24 -> 12)', () => {
    const device = resolveDevice(findDevice('Pixel 7')!)
    const layout = computeStatusBarLayout(device, 'landscape')
    expect(layout.height).toBe(device.statusBarHeightLandscape)
    expect(layout.centerY).toBe(12)
    expect(layout.timeLeft).toBe(31)
    expect(layout.trailing).toBe(28)
  })
})
