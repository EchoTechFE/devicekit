import type { CutoutShape, CutoutSpec } from '@devicekit/devices'
import {
  notchContinuousClipPath,
  notchContinuousOuterWidth,
  notchContinuousPathD,
  NOTCH_CURVE_TOKEN,
  NOTCH_PATH_DEFAULT_SMOOTHING,
} from './notch-continuous-path.js'

/**
 * Stock geometry per shape, for a host that knows its phone has a notch but
 * carries no measurements of its own. The presets in the device table override
 * these with per-device values.
 */
export const CUTOUT_PRESETS: Record<CutoutShape, CutoutSpec> = {
  notch: { shape: 'notch', width: 164, height: 30, top: 0 },
  pill: { shape: 'pill', width: 125, height: 37, top: 11 },
  circle: { shape: 'circle', width: 11, height: 11, top: 13 },
}

/**
 * Default notch ear fillet when preset `topRadius` is omitted.
 * PaintCode iPhone X labeled ear **6** — **legacy fallback only**.
 * Uncalibrated families (XR/11, 12*, 13/14 narrow) keep `topRadius` unset
 * rather than writing 6 into the preset (that would fake a calibration).
 */

export const DEFAULT_NOTCH_TOP_RADIUS = 6

/**
 * The cutout's border-radius, which follows from its shape.
 *
 * A notch hangs off the top edge, so only its bottom corners are round — prefer
 * a measured `bottomRadius` when present. A pill and a punch-hole are
 * free-floating and round the whole way (`height/2` stadium / `50%` disc).
 */
export function cutoutBorderRadius(cutout: CutoutSpec): string {
  switch (cutout.shape) {
    case 'notch': {
      const r = cutout.bottomRadius ?? Math.round(cutout.height * 0.6)
      return `0 0 ${r}px ${r}px`
    }
    case 'circle':
      return '50%'
    case 'pill':
    default:
      return `${cutout.height / 2}px`
  }
}

/** Notch↔top-edge ear fillet radius in CSS px. */
export function cutoutTopRadius(cutout: CutoutSpec): number {
  return cutout.topRadius ?? DEFAULT_NOTCH_TOP_RADIUS
}

/** Where the cutout's left edge sits, in CSS px from the screen's left edge. */
export function cutoutLeft(cutout: CutoutSpec, screenWidth: number): number {
  const center = (cutout.centerX ?? 0.5) * screenWidth
  return center - cutout.width / 2
}

/**
 * The two strips of status bar left clear on either side of the cutout, so the
 * time and icon group can be boxed into them instead of overlapping it. `null`
 * means there is no cutout to dodge — the bar keeps its ordinary left/right layout.
 */
export function statusBarEars(cutout: CutoutSpec | null, screenWidth: number): { left: number, right: number } | null {
  if (!cutout) return null
  const left = cutoutLeft(cutout, screenWidth)
  return { left, right: screenWidth - left - cutout.width }
}

/**
 * Face ID notch clip-path (circular ears + bottom; ξ=0).
 *
 * Figma ξ≈0.6 continuous is NOT used — ADV found leftover sidewall=0 melt +
 * anisotropic ear arcs (`NOTCH-CONTINUOUS-VISUAL-ADV.md`). Path default is
 * circular quarter-circles matching PaintCode / Bezel radii.
 */
export function cutoutNotchContinuousClipPath(cutout: CutoutSpec): string | null {
  if (cutout.shape !== 'notch') return null
  const topR = cutout.topRadius ?? DEFAULT_NOTCH_TOP_RADIUS
  const bottomR = cutout.bottomRadius ?? Math.round(cutout.height * 0.6)
  const clip = notchContinuousClipPath(cutout.width, cutout.height, topR, bottomR)
  return clip === 'none' ? null : clip
}

/** Outer paint width including circular ears. */
export function cutoutPaintWidth(cutout: CutoutSpec): number {
  if (cutout.shape !== 'notch') return cutout.width
  return notchContinuousOuterWidth(cutout.width, cutout.topRadius ?? DEFAULT_NOTCH_TOP_RADIUS)
}

/** Left of paint box (shifts left by ear when notch path includes ears). */
export function cutoutPaintLeft(cutout: CutoutSpec, screenWidth: number): number {
  const left = cutoutLeft(cutout, screenWidth)
  if (cutout.shape !== 'notch') return left
  return left - (cutout.topRadius ?? DEFAULT_NOTCH_TOP_RADIUS)
}

export {
  notchContinuousPathD,
  notchContinuousClipPath,
  notchContinuousOuterWidth,
  NOTCH_CURVE_TOKEN,
  NOTCH_PATH_DEFAULT_SMOOTHING,
}
