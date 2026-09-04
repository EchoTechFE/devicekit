/**
 * `toViewportRect()` used to derive both axes from the horizontal scale
 * alone, which is only correct when the host scales the frame uniformly. A
 * panel that stretches the frame's box non-uniformly — a flex/grid layout
 * that does not preserve aspect ratio, most CSS that sets width and height
 * independently — needs y/height measured against the vertical ratio, or a
 * view positioned from the rect sits and sizes wrong on the shorter axis.
 * `scale` itself stays the horizontal ratio (documented as such): a caller
 * that scales a whole child view by a single number is only exact on that
 * axis under anisotropic scaling, which is a tradeoff, not a bug this test
 * disputes.
 */
import { describe, expect, it } from 'vitest'
import { toViewportRect } from './content-rect.js'

describe('toViewportRect() under independent horizontal/vertical scale', () => {
  const box = (left: number, top: number, width: number, height: number): DOMRect =>
    ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) })

  const content = { x: 10, y: 20, width: 100, height: 200 }

  it('scales x/width by the horizontal ratio and y/height by the vertical ratio', () => {
    // screen 375x800, measured box 187.5x320 -> width ratio 0.5, height ratio 0.4
    const result = toViewportRect(content, 375, 800, box(0, 0, 187.5, 320))

    expect(result).toEqual({
      x: content.x * 0.5,
      y: content.y * 0.4,
      width: content.width * 0.5,
      height: content.height * 0.4,
      scale: 0.5,
    })
  })

  it('offsets by the screen box origin on both axes independently', () => {
    const result = toViewportRect(content, 375, 800, box(20, 10, 187.5, 320))

    expect(result.x).toBe(20 + content.x * 0.5)
    expect(result.y).toBe(10 + content.y * 0.4)
  })

  it('does not scale either axis when screenWidth is 0', () => {
    const result = toViewportRect(content, 0, 800, box(0, 0, 187.5, 320))

    expect(result).toEqual({ x: content.x, y: content.y, width: content.width, height: content.height, scale: 1 })
  })

  it('does not scale either axis when screenHeight is 0', () => {
    const result = toViewportRect(content, 375, 0, box(0, 0, 187.5, 320))

    expect(result).toEqual({ x: content.x, y: content.y, width: content.width, height: content.height, scale: 1 })
  })

  it('collapses width/x to the horizontal ratio (0) and still projects the vertical axis when the measured box has zero width', () => {
    // A CSS transform can legitimately squeeze one axis to nothing while the
    // other still has a real, measured size — that is not the same as the
    // box being unmeasured altogether, so only the collapsed axis reads as a
    // 0 ratio; the other axis still projects normally. `scale` stays
    // horizontal-only, so it reads 0 here too.
    const sy = 320 / 800
    const result = toViewportRect(content, 375, 800, box(0, 0, 0, 320))

    expect(result).toEqual({
      x: 0,
      y: content.y * sy,
      width: 0,
      height: content.height * sy,
      scale: 0,
    })
  })

  it('collapses height/y to the vertical ratio (0) and still projects the horizontal axis when the measured box has zero height', () => {
    const sx = 187.5 / 375
    const result = toViewportRect(content, 375, 800, box(0, 0, 187.5, 0))

    expect(result).toEqual({
      x: content.x * sx,
      y: 0,
      width: content.width * sx,
      height: 0,
      scale: sx,
    })
  })

  it('does not scale either axis when the measured box is 0x0', () => {
    const result = toViewportRect(content, 375, 800, box(0, 0, 0, 0))

    expect(result).toEqual({ x: content.x, y: content.y, width: content.width, height: content.height, scale: 1 })
  })
})
