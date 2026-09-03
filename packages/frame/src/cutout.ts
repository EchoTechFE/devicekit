import type { CutoutShape, CutoutSpec } from '@devicekit/devices'

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
 * The cutout's border-radius, which follows from its shape.
 *
 * A notch hangs off the top edge, so only its bottom corners are round. A pill
 * and a punch-hole are free-floating and round the whole way.
 */
export function cutoutBorderRadius(cutout: CutoutSpec): string {
  switch (cutout.shape) {
    case 'notch': {
      const r = Math.round(cutout.height * 0.6)
      return `0 0 ${r}px ${r}px`
    }
    case 'circle':
      return '50%'
    case 'pill':
    default:
      return `${cutout.height / 2}px`
  }
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
