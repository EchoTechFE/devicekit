import { describe, expect, it } from 'vitest'
import { DEVICES } from '@devicekit/devices'
import {
  cutoutNotchContinuousClipPath,
  cutoutPaintLeft,
  cutoutPaintWidth,
} from './cutout.js'
import {
  notchContinuousClipPath,
  notchContinuousOuterWidth,
  notchContinuousPathD,
  NOTCH_CURVE_TOKEN,
  NOTCH_PATH_DEFAULT_SMOOTHING,
} from './notch-continuous-path.js'
import { FIGMA_IOS_CORNER_SMOOTHING } from './figma-continuous-path.js'

describe('notchContinuousPathD', () => {
  it('returns empty for a degenerate box', () => {
    expect(notchContinuousPathD(0, 30, 6, 20)).toBe('')
    expect(notchContinuousPathD(209, 0, 6, 20)).toBe('')
  })

  it('PaintCode X (209×30, ear 6, bottom 20): top edge then outward ear arcs (sweep 0)', () => {
    const d = notchContinuousPathD(209, 30, 6, 20)
    // Outer box 221×30 — start at left tip, line across top (NOT arc into body)
    expect(d.startsWith('M 0.0000 0.0000 L 221.0000 0.0000')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
    // Right ear: A … 0 0 0 bodyRight,ear  (sweep 0 = outward)
    expect(d).toMatch(/A 6\.0000 6\.0000 0 0 0 215\.0000 6\.0000/)
    // Left ear closes: A … 0 0 0 0 0
    expect(d).toMatch(/A 6\.0000 6\.0000 0 0 0 0\.0000 0\.0000 Z$/)
    // MUST NOT be the concave scoop M 0,0 A … 6,6 with sweep 1
    expect(d).not.toMatch(/^M 0\.0000 0\.0000 A 6\.0000 6\.0000 0 0 1 6\.0000 6\.0000/)
    expect(notchContinuousOuterWidth(209, 6)).toBe(221)
    const clip = notchContinuousClipPath(209, 30, 6, 20)
    expect(clip.startsWith('path("')).toBe(true)
    expect(clip.endsWith('")')).toBe(true)
  })

  it('keeps a vertical mid sidewall on the body (L at x=ear between ear and bottom)', () => {
    const d = notchContinuousPathD(209, 30, 6, 20, 0)
    // Traverse: top → right ear → down right wall to y=10 → bottoms → up left wall L 6,6
    expect(d).toMatch(/L 215\.0000 10\.0000/)
    expect(d).toMatch(/L 6\.0000 6\.0000/)
    // Mid-wall length: from y=ear(6) to y=H-bot(10) = 4pt
    expect(d).toContain('L 215.0000 10.0000 A 20.0000')
  })

  it('is not a literal trapezoid polygon (no bare 4-point L-only hull)', () => {
    const d = notchContinuousPathD(209, 30, 6, 20)
    const onlyLines = !/[cCaA]/.test(d)
    expect(onlyLines).toBe(false)
  })

  it('defaults to circular paint; screen ξ stays 0.6 for screen corners only', () => {
    expect(NOTCH_PATH_DEFAULT_SMOOTHING).toBe(0)
    expect(NOTCH_CURVE_TOKEN).toBe('circular')
    expect(FIGMA_IOS_CORNER_SMOOTHING).toBe(0.6)
    const d = notchContinuousPathD(209, 30, 6, 20)
    for (const m of d.matchAll(/A\s+([\d.]+)\s+([\d.]+)/g)) {
      expect(Number(m[1])).toBe(Number(m[2]))
    }
  })

  it('ear arcs use sweep 0 (outward); bottom fillets keep sweep 1', () => {
    const d = notchContinuousPathD(209, 30, 6, 20)
    const arcs = [...d.matchAll(/A\s+([\d.]+)\s+([\d.]+)\s+0\s+0\s+(\d)/g)]
    expect(arcs.length).toBe(4)
    // order: right ear, bottom-right, bottom-left, left ear
    expect(arcs[0]![3]).toBe('0') // right ear outward
    expect(arcs[1]![3]).toBe('1') // bottom
    expect(arcs[2]![3]).toBe('1') // bottom
    expect(arcs[3]![3]).toBe('0') // left ear outward
  })
})

describe('cutout continuous wiring', () => {
  it('builds a circular clip for every iPhone notch preset and leaves pill/circle on radius paint', () => {
    const notches = DEVICES.filter((d) => d.os === 'ios' && d.cutout?.shape === 'notch')
    expect(notches.length).toBeGreaterThan(10)
    for (const d of notches) {
      const clip = cutoutNotchContinuousClipPath(d.cutout!)
      expect(clip, d.name).toMatch(/^path\("/)
      const ear = d.cutout!.topRadius ?? 6
      expect(cutoutPaintWidth(d.cutout!)).toBe(d.cutout!.width + 2 * ear)
      expect(cutoutPaintLeft(d.cutout!, d.screen.width)).toBe(
        (d.screen.width - d.cutout!.width) / 2 - ear,
      )
      // Every notch path must use outward ear sweep 0, not concave scoop
      expect(clip, d.name).toMatch(/A [\d.]+ [\d.]+ 0 0 0 /)
      expect(clip, d.name).not.toMatch(/^path\("M 0\.0000 0\.0000 A /)
    }

    const island = DEVICES.find((d) => d.name === 'iPhone 15')!
    expect(cutoutNotchContinuousClipPath(island.cutout!)).toBeNull()
    expect(cutoutPaintWidth(island.cutout!)).toBe(island.cutout!.width)

    const duo = DEVICES.find((d) => d.name === 'iPhone Duo (outer)')!
    expect(cutoutNotchContinuousClipPath(duo.cutout!)).toBeNull()
  })

  it('covers the four Face ID families with cited radii', () => {
    const families: Array<{ name: string, w: number, h: number, ear: number, bot: number }> = [
      { name: 'iPhone X', w: 209, h: 30, ear: 6, bot: 20 },
      { name: 'iPhone 11', w: 227, h: 32, ear: 6, bot: 21.5 },
      { name: 'iPhone 12', w: 210, h: 32, ear: 6, bot: 20 },
      { name: 'iPhone 14', w: 162, h: 34, ear: 6, bot: 21 },
    ]
    for (const f of families) {
      const d = notchContinuousPathD(f.w, f.h, f.ear, f.bot)
      expect(d.length, f.name).toBeGreaterThan(40)
      expect(notchContinuousOuterWidth(f.w, f.ear)).toBe(f.w + 2 * f.ear)
      expect(d, f.name).toMatch(new RegExp(`L ${(f.w + 2 * f.ear).toFixed(4)} 0\\.0000`))
    }
  })
})

describe('continuous path stays inside the outer box', () => {
  it('X / XR / 12 / 14 family paths keep absolute M/L coords in [0,W]×[0,H] (±0.5)', () => {
    const families = [
      [209, 30, 6, 20],
      [227, 32, 6, 21.5],
      [210, 32, 6, 20],
      [162, 34, 6, 21],
    ] as const
    for (const [w, h, ear, bot] of families) {
      const W = w + 2 * ear
      const d = notchContinuousPathD(w, h, ear, bot)
      const abs = [...d.matchAll(/[ML]\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)/g)]
      expect(abs.length, `family ${w}`).toBeGreaterThan(2)
      for (const m of abs) {
        const x = Number(m[1])
        const y = Number(m[2])
        expect(x).toBeGreaterThanOrEqual(-0.5)
        expect(x).toBeLessThanOrEqual(W + 0.5)
        expect(y).toBeGreaterThanOrEqual(-0.5)
        expect(y).toBeLessThanOrEqual(h + 0.5)
      }
    }
  })
})

describe('circular path keeps a mid sidewall', () => {
  it('PaintCode X / XR / 12 / 14 families have ear+bot ≤ height (positive mid wall)', () => {
    const families = [
      [209, 30, 6, 20],
      [227, 32, 6, 21.5],
      [210, 32, 6, 20],
      [162, 34, 6, 21],
    ] as const
    for (const [w, h, ear, bot] of families) {
      expect(ear + bot, `family ${w}`).toBeLessThanOrEqual(h)
      const d = notchContinuousPathD(w, h, ear, bot)
      expect(d, `family ${w}`).toMatch(new RegExp(`L ${ear.toFixed(4)} `))
    }
  })
})
