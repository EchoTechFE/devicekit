import { describe, expect, it } from 'vitest'
import {
  CONTINUOUS_SUPERELLIPSE_N,
  applyContinuousScreenPaint,
  continuousMidArcInsetRatio,
  continuousRoundedRectPath,
  continuousScreenMaskDataURL,
  continuousScreenMaskImage,
  continuousScreenClipPath,
  continuousBodyCorners,
  encodeAlphaMaskPng,
  isInsideContinuousScreen,
} from './continuous-corner-mask.js'

describe('continuousRoundedRectPath', () => {
  it('returns a closed path that visits all four corners for a uniform radius', () => {
    const d = continuousRoundedRectPath(100, 200, { topLeft: 20, topRight: 20, bottomRight: 20, bottomLeft: 20 })
    expect(d.startsWith('M ')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
    expect(d).toContain('L ')
  })

  it('degenerates zero-radius corners to a rectangular path', () => {
    const d = continuousRoundedRectPath(100, 100, { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 })
    expect(d).toBe('M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z')
  })

  it('clamps overlapping corner radii so the path stays inside the box', () => {
    const d = continuousRoundedRectPath(40, 40, { topLeft: 30, topRight: 30, bottomRight: 30, bottomLeft: 30 })
    expect(d).toMatch(/M /)
    expect(d).toContain('Z')
  })

  it('axis intercept equals the labeled radius on each edge (same footprint as circular)', () => {
    const R = 62
    const w = 402
    const h = 874
    const d = continuousRoundedRectPath(w, h, { topLeft: R, topRight: R, bottomRight: R, bottomLeft: R })
    // Top edge starts at x=R and reaches the TR transition at x=w-R
    expect(d.startsWith(`M ${R} 0`)).toBe(true)
    expect(d).toContain(`L ${w - R} 0`)
    // Right edge reaches BR at y=h-R
    expect(d).toContain(`L ${w} ${h - R}`)
    // Bottom edge reaches BL at x=R
    expect(d).toContain(`L ${R} ${h}`)
    // Left edge reaches TL at y=R
    expect(d).toContain(`L 0 ${R}`)
  })

  it('Duo asymmetric corners keep distinct hinge vs free intercepts', () => {
    const d = continuousRoundedRectPath(466, 678, { topLeft: 8, topRight: 59, bottomRight: 59, bottomLeft: 8 })
    expect(d.startsWith('M 8 0')).toBe(true)
    expect(d).toContain('L 407 0') // 466-59
    expect(d).toContain('L 466 619') // 678-59
    expect(d).toContain('L 8 678')
    expect(d).toContain('L 0 8')
  })
})

describe('continuousMidArcInsetRatio', () => {
  it('continuous n=5 sits closer to the vertex than a circle (squarer mid-arc)', () => {
    const circle = Math.SQRT2 - 1 // ≈0.414
    const continuous = continuousMidArcInsetRatio(CONTINUOUS_SUPERELLIPSE_N)
    expect(continuous).toBeLessThan(circle - 0.05)
    expect(continuous).toBeGreaterThan(0.15)
  })
})

describe('continuousScreenMaskImage', () => {
  it('returns none for empty sizes', () => {
    expect(continuousScreenMaskImage(0, 100, { topLeft: 10, topRight: 10, bottomRight: 10, bottomLeft: 10 })).toBe('none')
  })

  it('returns a data-URI SVG mask for a Duo-like asymmetric screen', () => {
    const mask = continuousScreenMaskImage(466, 678, { topLeft: 8, topRight: 59, bottomRight: 59, bottomLeft: 8 })
    expect(mask.startsWith('url("data:image/svg+xml,')).toBe(true)
    expect(mask).toContain('svg')
    // Path must encode the free-side radius intercept, not a collapsed hinge-only shape.
    expect(decodeURIComponent(mask)).toContain('L 407 0')
  })
})

describe('continuousScreenClipPath', () => {
  it('returns CSS path() from Figma ξ smoothing (not circular polyline)', () => {
    const clip = continuousScreenClipPath(402, 874, { topLeft: 62, topRight: 62, bottomRight: 62, bottomLeft: 62 })
    expect(clip.startsWith('path("')).toBe(true)
    expect(clip).toContain('M ')
    expect(clip).toMatch(/[cC]/) // cubic segments from Figma smoothing
    expect(clip.endsWith('Z")')).toBe(true)
  })

  it('keeps Duo hinge/free asymmetry in the path budget', () => {
    const clip = continuousScreenClipPath(466, 678, { topLeft: 8, topRight: 59, bottomRight: 59, bottomLeft: 8 })
    expect(clip.startsWith('path("')).toBe(true)
    // Free-side corner uses a larger p than the hinge — path must mention both curves.
    expect(clip).toMatch(/a 59\.0|a 8\.0/)
  })
})

describe('isInsideContinuousScreen', () => {
  const corners = { topLeft: 50, topRight: 50, bottomRight: 50, bottomLeft: 50 }

  it('keeps axis intercept at labeled R (top-row content starts at x=R)', () => {
    expect(isInsideContinuousScreen(49, 0, 200, 200, corners)).toBe(false)
    expect(isInsideContinuousScreen(50, 0, 200, 200, corners)).toBe(true)
  })

  it('is squarer mid-arc than a circle of the same R', () => {
    // Circle mid at 45° sits at (R - R/√2) ≈ 14.64 from vertex.
    // Continuous n=5 mid sits closer to the vertex (~6.5).
    expect(isInsideContinuousScreen(10, 10, 200, 200, corners)).toBe(true)
    expect(isInsideContinuousScreen(3, 3, 200, 200, corners)).toBe(false)
  })

  it('honors Duo hinge asymmetry', () => {
    const duo = { topLeft: 8, topRight: 59, bottomRight: 59, bottomLeft: 8 }
    expect(isInsideContinuousScreen(7, 0, 466, 678, duo)).toBe(false)
    expect(isInsideContinuousScreen(8, 0, 466, 678, duo)).toBe(true)
    expect(isInsideContinuousScreen(465, 0, 466, 678, duo)).toBe(false)
    expect(isInsideContinuousScreen(407, 0, 466, 678, duo)).toBe(true)
  })
})

describe('continuousScreenMaskDataURL (authoritative paint)', () => {
  it('returns none for empty sizes', () => {
    expect(continuousScreenMaskDataURL(0, 100, { topLeft: 10, topRight: 10, bottomRight: 10, bottomLeft: 10 })).toBe('none')
  })

  it('returns a PNG data URL whose alpha matches isInsideContinuousScreen intercepts', () => {
    const corners = { topLeft: 20, topRight: 20, bottomRight: 20, bottomLeft: 20 }
    const mask = continuousScreenMaskDataURL(60, 80, corners)
    expect(mask.startsWith('url("data:image/png;base64,')).toBe(true)
    // Axis intercept at labeled R
    expect(isInsideContinuousScreen(19, 0, 60, 80, corners)).toBe(false)
    expect(isInsideContinuousScreen(20, 0, 60, 80, corners)).toBe(true)
  })

  it('encodeAlphaMaskPng emits a valid PNG signature', () => {
    const alpha = new Uint8Array(4)
    alpha[0] = 255
    const png = encodeAlphaMaskPng(2, 2, alpha)
    expect(Array.from(png.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  })
})

describe('applyContinuousScreenPaint', () => {
  it('never leaves CSS radius at 0 when clip is none', () => {
    const host = document.createElement('div')
    const screen = document.createElement('div')
    const body = document.createElement('div')
    host.style.setProperty('--device-screen-css-border-radius', '0')
    const mode = applyContinuousScreenPaint({ screen, body, hostStyle: host.style, clip: 'none' })
    expect(mode).toBe('circular-fallback')
    expect(host.style.getPropertyValue('--device-screen-css-border-radius')).not.toBe('0')
    expect(host.style.getPropertyValue('--device-screen-css-border-radius')).toBe('')
  })

  it('applies hard clip-path and clears mask to avoid alpha bleed', () => {
    const host = document.createElement('div')
    const screen = document.createElement('div')
    const body = document.createElement('div')
    const clip = continuousScreenClipPath(40, 60, { topLeft: 10, topRight: 10, bottomRight: 10, bottomLeft: 10 })
    const mode = applyContinuousScreenPaint({ screen, body, hostStyle: host.style, clip, bodyClip: clip })
    expect(mode).toBe('continuous-clip')
    expect(screen.style.clipPath).toBe(clip)
    expect(screen.style.getPropertyValue('mask-image')).toBe('none')
    expect(host.style.getPropertyValue('--device-body-overflow')).toBe('hidden')
  })
})

describe('continuousBodyCorners', () => {
  it('expands each corner by max adjacent bezel + border + underlap', () => {
    const body = continuousBodyCorners(
      { topLeft: 59, topRight: 59, bottomRight: 59, bottomLeft: 59 },
      { top: 6, right: 6, bottom: 6, left: 6 },
      1,
      2,
    )
    expect(body).toEqual({
      topLeft: 59 + 6 + 1 + 2,
      topRight: 59 + 6 + 1 + 2,
      bottomRight: 59 + 6 + 1 + 2,
      bottomLeft: 59 + 6 + 1 + 2,
    })
  })

  it('Duo outer hinge uses left inset for TL/BL expansion', () => {
    const body = continuousBodyCorners(
      { topLeft: 8, topRight: 59, bottomRight: 59, bottomLeft: 8 },
      { top: 6, right: 6, bottom: 6, left: 8 },
      1,
      2,
    )
    expect(body.topLeft).toBe(8 + 8 + 1 + 2)
    expect(body.topRight).toBe(59 + 6 + 1 + 2)
  })
})
