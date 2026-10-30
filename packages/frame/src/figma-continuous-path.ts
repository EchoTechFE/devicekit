/**
 * Figma corner-smoothing path for continuous screen clip.
 *
 * Path math vendored from phamfoo/figma-squircle (MIT), which implements the
 * curve from Figma's "Desperately seeking squircles" (ξ / cornerSmoothing).
 * Default ξ=0.6 is the Figma value chosen to approximate iOS continuous corners.
 *
 * Authoritative paint for `cornerCurve: 'continuous'` is inline
 * `clip-path: path(...)` — hard clip with engine edge AA — not a PNG mask
 * (alpha fringes cause white bleed against dark chrome).
 */
import type { CornerRadii } from '@devicekit/devices'
import { distributeAndNormalize } from './figma-squircle-distribute.js'
import { getPathParamsForCorner, getSVGPathFromPathParams } from './figma-squircle-draw.js'

/** Figma cornerSmoothing that targets iOS-like continuous corners. */
export const FIGMA_IOS_CORNER_SMOOTHING = 0.6

function clampCorners(width: number, height: number, corners: CornerRadii): CornerRadii {
  let { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = corners
  tl = Math.max(0, tl)
  tr = Math.max(0, tr)
  br = Math.max(0, br)
  bl = Math.max(0, bl)

  const scale = (a: number, b: number, limit: number): [number, number] => {
    if (a + b <= limit || a + b === 0) return [a, b]
    const s = limit / (a + b)
    return [a * s, b * s]
  }
  ;[tl, tr] = scale(tl, tr, width)
  ;[bl, br] = scale(bl, br, width)
  ;[tl, bl] = scale(tl, bl, height)
  ;[tr, br] = scale(tr, br, height)
  return { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl }
}

/**
 * SVG path `d` for a continuous rounded rect (Figma ξ smoothing).
 * Axis intercept stays at the labeled radius on each edge when budget allows.
 */
export function figmaContinuousRoundedRectPath(
  width: number,
  height: number,
  corners: CornerRadii,
  cornerSmoothing = FIGMA_IOS_CORNER_SMOOTHING,
): string {
  if (width <= 0 || height <= 0) return ''
  const c = clampCorners(width, height, corners)
  const uniform =
    c.topLeft === c.topRight
    && c.topRight === c.bottomRight
    && c.bottomRight === c.bottomLeft

  if (uniform) {
    const budget = Math.min(width, height) / 2
    const radius = Math.min(c.topLeft, budget)
    const pathParams = getPathParamsForCorner({
      cornerRadius: radius,
      cornerSmoothing,
      preserveSmoothing: true,
      roundingAndSmoothingBudget: budget,
    })
    return getSVGPathFromPathParams({
      width,
      height,
      topLeftPathParams: pathParams,
      topRightPathParams: pathParams,
      bottomLeftPathParams: pathParams,
      bottomRightPathParams: pathParams,
    })
  }

  const distributed = distributeAndNormalize({
    topLeftCornerRadius: c.topLeft,
    topRightCornerRadius: c.topRight,
    bottomRightCornerRadius: c.bottomRight,
    bottomLeftCornerRadius: c.bottomLeft,
    width,
    height,
  })

  return getSVGPathFromPathParams({
    width,
    height,
    topLeftPathParams: getPathParamsForCorner({
      cornerSmoothing,
      preserveSmoothing: true,
      cornerRadius: distributed.topLeft.radius,
      roundingAndSmoothingBudget: distributed.topLeft.roundingAndSmoothingBudget,
    }),
    topRightPathParams: getPathParamsForCorner({
      cornerSmoothing,
      preserveSmoothing: true,
      cornerRadius: distributed.topRight.radius,
      roundingAndSmoothingBudget: distributed.topRight.roundingAndSmoothingBudget,
    }),
    bottomRightPathParams: getPathParamsForCorner({
      cornerSmoothing,
      preserveSmoothing: true,
      cornerRadius: distributed.bottomRight.radius,
      roundingAndSmoothingBudget: distributed.bottomRight.roundingAndSmoothingBudget,
    }),
    bottomLeftPathParams: getPathParamsForCorner({
      cornerSmoothing,
      preserveSmoothing: true,
      cornerRadius: distributed.bottomLeft.radius,
      roundingAndSmoothingBudget: distributed.bottomLeft.roundingAndSmoothingBudget,
    }),
  })
}

/** CSS `clip-path` value: `path("…")` for inline application on `.screen` / `.body`. */
export function figmaContinuousClipPath(
  width: number,
  height: number,
  corners: CornerRadii,
  cornerSmoothing = FIGMA_IOS_CORNER_SMOOTHING,
): string {
  const d = figmaContinuousRoundedRectPath(width, height, corners, cornerSmoothing)
  if (!d) return 'none'
  // CSS path() takes a quoted SVG path; keep double quotes for style.setProperty.
  return `path("${d}")`
}

/**
 * Continuous clip inset by `insetPx` on every side (keeps white AA inside chrome).
 * Builds the Figma path in the inset box, then shifts absolute M/L by inset;
 * relative c/a segments stay unchanged.
 */
export function figmaContinuousClipPathInset(
  width: number,
  height: number,
  corners: CornerRadii,
  insetPx: number,
  cornerSmoothing = FIGMA_IOS_CORNER_SMOOTHING,
): string {
  const inset = Math.max(0, insetPx)
  const w = width - 2 * inset
  const h = height - 2 * inset
  if (w <= 0 || h <= 0) return 'none'
  const c = {
    topLeft: Math.max(0, corners.topLeft - inset),
    topRight: Math.max(0, corners.topRight - inset),
    bottomRight: Math.max(0, corners.bottomRight - inset),
    bottomLeft: Math.max(0, corners.bottomLeft - inset),
  }
  const d = figmaContinuousRoundedRectPath(w, h, c, cornerSmoothing)
  if (!d) return 'none'
  const shifted = d.replace(/([ML])\s+(-?\d*\.?\d+(?:e[-+]?\d+)?)\s+(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi, (_m, cmd, x, y) => {
    return `${cmd} ${(Number(x) + inset).toFixed(4)} ${(Number(y) + inset).toFixed(4)}`
  })
  return `path("${shifted}")`
}
