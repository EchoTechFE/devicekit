/**
 * `CONTENT_RECT_EPSILON` is a value export, not a type — a host comparing its
 * own cached rect against a freshly measured one needs the same tolerance
 * `sameContentRect` uses internally, or its own dedupe drifts out of sync
 * with the frame's. The package root re-exports it alongside the `ContentRect`
 * type it is defined next to; missing either one breaks that host at the
 * import site, not just at some call inside it.
 */
import { describe, expect, it } from 'vitest'
import { CONTENT_RECT_EPSILON } from './index.js'

describe('package entry exports', () => {
  it('exports CONTENT_RECT_EPSILON as a value', () => {
    expect(CONTENT_RECT_EPSILON).toBe(1e-3)
  })
})
