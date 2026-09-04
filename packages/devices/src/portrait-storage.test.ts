/**
 * `screen` is documented (devices.ts) as stored portrait-only: width <= height.
 * Landscape swaps the two at read time, so a row that already stores the
 * landscape dimensions silently doubles the swap and reports a portrait
 * screen wider than it is tall. `(inner)` foldable rows are the ones easiest
 * to get backwards, since the unfolded screen is usually a landscape-shaped
 * rectangle in real life.
 */
import { describe, expect, it } from 'vitest'
import { DEVICES } from './presets/index.js'

describe('DEVICES.screen is stored portrait (width <= height)', () => {
  it.each(DEVICES.map((profile) => [profile.name, profile] as const))(
    '%s stores a portrait screen',
    (_name: string, profile: (typeof DEVICES)[number]) => {
      expect(profile.screen.width, profile.name).toBeLessThanOrEqual(profile.screen.height)
    },
  )

  it('keeps the foldable (inner) rows present with their known portrait dimensions', () => {
    const surfaceDuoInner = DEVICES.find((d) => d.name === 'Surface Duo (inner)')
    const puraXMaxInner = DEVICES.find((d) => d.name === 'HUAWEI Pura X Max (inner)')

    expect(surfaceDuoInner, 'Surface Duo (inner)').toBeDefined()
    expect(puraXMaxInner, 'HUAWEI Pura X Max (inner)').toBeDefined()

    expect(new Set([surfaceDuoInner!.screen.width, surfaceDuoInner!.screen.height])).toEqual(new Set([720, 1114]))
    expect(new Set([puraXMaxInner!.screen.width, puraXMaxInner!.screen.height])).toEqual(new Set([665, 940]))
  })
})
