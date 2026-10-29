import { describe, expect, it } from 'vitest'
import { cutoutBorderRadius, cutoutTopRadius, statusBarEars } from './cutout.js'
import { DEVICES, findDevice, resolveDevice, statusBarEdgeFor } from '@devicekit/devices'
import type { CutoutSpec } from '@devicekit/devices'

describe('statusBarEars', () => {
  it('returns null when there is no cutout to make room around', () => {
    expect(statusBarEars(null, 375)).toBeNull()
  })

  it('splits the screen into two equal ears for a centered cutout (iPhone X: 375 screen, 209-wide notch)', () => {
    const iphoneX = findDevice('iPhone X')!
    expect(statusBarEars(iphoneX.cutout!, iphoneX.screen.width)).toEqual({ left: 83, right: 83 })
  })

  it('gives unequal ears for an off-center cutout, and the two ears plus the cutout still span the screen', () => {
    const cutout: CutoutSpec = { shape: 'notch', width: 100, height: 30, top: 0, centerX: 0.3 }
    const screenWidth = 400
    const ears = statusBarEars(cutout, screenWidth)!
    expect(ears.left).not.toBe(ears.right)
    expect(ears.left + ears.right + cutout.width).toBe(screenWidth)
  })
})

describe('every top-edge tabled cutout leaves room for the horizontal status bar icon group', () => {
  // .status-bar__icons is signal(17) + gap(6) + wifi(16) + gap(6) + battery(25) = 70px,
  // and it needs an 8px margin from the ear's inner edge not to touch the cutout.
  // Duo's right-edge camera and vertical icon layout are covered by status-bar-edge and Chromium tests.
  const MIN_RIGHT_EAR = 70 + 8
  // iPhone 12 Mini's DeviceHub notch (226 on 375) leaves ~74.5pt ears — below the stock
  // icon-group budget. Real SpringBoard packs tighter; do not invent a narrower mask.
  const EAR_EXCEPTIONS: Record<string, number> = { 'iPhone 12 Mini': 74 }

  it('holds the icon group in the right ear for every top-edge device with a top-region cutout', () => {
    // Bottom camera bars (e.g. Flip cover cutout.top near screen bottom) are not status-bar cutouts —
    // they must not be held to status-icon ear clearance.
    const tooNarrow = DEVICES
      .filter((d) => {
        const resolved = resolveDevice(d)
        if (resolved.cutout === null || statusBarEdgeFor(resolved, 'portrait') !== 'top') return false
        return resolved.cutout.top + resolved.cutout.height / 2 < resolved.screen.height / 2
      })
      .filter((d) => {
        const resolved = resolveDevice(d)
        const ears = statusBarEars(resolved.cutout, d.screen.width)
        const min = EAR_EXCEPTIONS[d.name] ?? MIN_RIGHT_EAR
        return ears === null || ears.right < min
      })
      .map((d) => d.name)
    expect(tooNarrow).toEqual([])
  })
})


describe('cutoutBorderRadius / cutoutTopRadius', () => {
  it('uses measured bottomRadius for a notch when present', () => {
    expect(cutoutBorderRadius({
      shape: 'notch', width: 227, height: 32, top: 0, bottomRadius: 21.5,
    })).toBe('0 0 21.5px 21.5px')
  })

  it('falls back to round(height * 0.6) when bottomRadius is omitted', () => {
    expect(cutoutBorderRadius({ shape: 'notch', width: 100, height: 30, top: 0 })).toBe('0 0 18px 18px')
  })

  it('paints a Dynamic Island as a stadium of height/2 (idle end-cap)', () => {
    expect(cutoutBorderRadius({ shape: 'pill', width: 125, height: 37, top: 11 })).toBe('18.5px')
  })

  it('paints a punch-hole as a disc', () => {
    expect(cutoutBorderRadius({ shape: 'circle', width: 37, height: 37, top: 26 })).toBe('50%')
  })

  it('uses measured topRadius for notch ears when present', () => {
    expect(cutoutTopRadius({
      shape: 'notch', width: 209, height: 30, top: 0, bottomRadius: 20, topRadius: 6,
    })).toBe(6)
  })

  it('defaults notch ear radius to 6 when topRadius is omitted', () => {
    expect(cutoutTopRadius({ shape: 'notch', width: 100, height: 30, top: 0 })).toBe(6)
  })
})

describe('every iPhone notch preset carries cited corner radii', () => {
  it('no notch iPhone is left on the global 0.6h heuristic (bottomRadius required)', () => {
    const missing = DEVICES
      .filter((d) => d.os === 'ios' && d.cutout?.shape === 'notch')
      .filter((d) => d.cutout!.bottomRadius === undefined)
      .map((d) => d.name)
    expect(missing).toEqual([])
  })

  it('PaintCode X-class sets ear topRadius=6; later gens leave ear unset (ADV null)', () => {
    const xClass = ['iPhone X', 'iPhone XS Max', 'iPhone 11 Pro', 'iPhone 11 Pro Max']
    for (const name of xClass) {
      const d = DEVICES.find((x) => x.name === name)!
      expect(d.cutout!.topRadius, name).toBe(6)
      expect(d.cutout!.bottomRadius, name).toBe(20)
    }
    const unsetEar = DEVICES
      .filter((d) => d.os === 'ios' && d.cutout?.shape === 'notch')
      .filter((d) => !xClass.includes(d.name))
      .filter((d) => d.cutout!.topRadius !== undefined)
      .map((d) => d.name)
    expect(unsetEar).toEqual([])
  })
})
