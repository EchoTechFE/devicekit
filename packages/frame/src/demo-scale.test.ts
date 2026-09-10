import { describe, expect, it } from 'vitest'
import { overflowsViewport, scaleFor, scaledViewport } from './demo-scale.js'

describe('demo scale modes', () => {
  it('uses the clamped stage fit only for Fit to window', () => {
    expect(scaleFor('fit', 1.4)).toBe(1)
    expect(scaleFor('fit', 0.62)).toBe(0.62)
  })

  it('uses the scaled viewport, not the unscaled frame box, to decide overflow', () => {
    const viewport = scaledViewport({ width: 678, height: 466 }, 0.595)
    expect(viewport.width).toBeCloseTo(403.41, 2)
    expect(viewport.height).toBeCloseTo(277.27, 2)
    expect(overflowsViewport({ width: 403.41, height: 277.27 }, { width: 412, height: 300 })).toBe(false)
    expect(overflowsViewport({ width: 678, height: 466 }, { width: 412, height: 300 })).toBe(true)
  })

  it('keeps explicit 100% at one host CSS px per device CSS px', () => {
    expect(scaleFor('100', 0.62)).toBe(1)
    expect(scaleFor('75', 0.62)).toBe(0.75)
    expect(scaleFor('50', 0.62)).toBe(0.5)
  })
})
