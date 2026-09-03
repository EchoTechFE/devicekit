/**
 * Reading `<dimina-device-frame>`'s attributes back into a device profile.
 *
 * Kept apart from the element so that "an attribute overrides the preset, a
 * missing attribute falls through to it" is stated once, in one place, for
 * every field — rather than once per field inside the element's render path.
 */
import { CUTOUT_PRESETS } from './cutout.js'
import {
  type CutoutShape,
  type CutoutSpec,
  type DeviceOS,
  type DeviceProfile,
  type Orientation,
} from '@devicekit/devices'

export function toPositiveNumber(raw: string | null): number | undefined {
  if (raw === null) return undefined
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

export function toOS(raw: string | null): DeviceOS | undefined {
  return raw === 'ios' || raw === 'android' || raw === 'harmony' ? raw : undefined
}

export function toOrientation(raw: string | null): Orientation {
  return raw === 'landscape' ? 'landscape' : 'portrait'
}

/**
 * The `cutout` attribute names a shape and gets that shape's stock geometry;
 * an exact cutout is set through the `deviceProfile` property instead, because
 * four numbers do not belong in an attribute string.
 *
 * `"none"` is distinct from a missing attribute: it clears the preset's cutout,
 * where a missing attribute keeps it.
 */
export function toCutout(raw: string | null): CutoutSpec | null | undefined {
  if (raw === null) return undefined
  if (raw === 'none') return null
  return raw in CUTOUT_PRESETS ? CUTOUT_PRESETS[raw as CutoutShape] : undefined
}

/** The four safe-area attributes, folded into the partial insets a profile takes. */
function insetsFrom(element: Element): Partial<Record<'top' | 'right' | 'bottom' | 'left', number>> | undefined {
  const insets = {
    top: toPositiveNumber(element.getAttribute('safe-area-top')),
    right: toPositiveNumber(element.getAttribute('safe-area-right')),
    bottom: toPositiveNumber(element.getAttribute('safe-area-bottom')),
    left: toPositiveNumber(element.getAttribute('safe-area-left')),
  }
  const present = Object.entries(insets).filter(([, value]) => value !== undefined)
  return present.length > 0 ? Object.fromEntries(present) : undefined
}

/**
 * Attributes folded back onto a device profile, so every consumer downstream
 * reads one shape and the "omitted means platform default" rule lives in
 * exactly one place (resolveDevice).
 */
export function profileFromAttributes(
  element: Element,
  named: DeviceProfile | null,
  fallbackScreen: { width: number, height: number },
): DeviceProfile {
  const attributeInsets = insetsFrom(element)
  const cutout = toCutout(element.getAttribute('cutout'))
  const statusBarHeight = toPositiveNumber(element.getAttribute('status-bar-height'))

  return {
    name: named?.name ?? '',
    os: toOS(element.getAttribute('os')) ?? named?.os ?? 'ios',
    screen: {
      width: toPositiveNumber(element.getAttribute('width')) ?? named?.screen.width ?? fallbackScreen.width,
      height: toPositiveNumber(element.getAttribute('height')) ?? named?.screen.height ?? fallbackScreen.height,
    },
    pixelRatio: toPositiveNumber(element.getAttribute('pixel-ratio')) ?? named?.pixelRatio ?? 1,
    system: named?.system,
    userAgent: element.getAttribute('user-agent') ?? named?.userAgent,
    // status-bar-height and safe-area-* apply to both orientations, the same as
    // navigation-bar-height already does (see device-frame.ts's #navigationBarHeight):
    // an attribute speaks for the device regardless of which way it is held.
    statusBarHeight: statusBarHeight ?? named?.statusBarHeight,
    statusBarHeightLandscape: statusBarHeight ?? named?.statusBarHeightLandscape,
    navigationBarHeight:
      toPositiveNumber(element.getAttribute('navigation-bar-height')) ?? named?.navigationBarHeight,
    navigationBarHeightLandscape: named?.navigationBarHeightLandscape,
    safeAreaInsets: attributeInsets ?? named?.safeAreaInsets,
    safeAreaInsetsLandscape: attributeInsets ?? named?.safeAreaInsetsLandscape,
    cutout: cutout === undefined ? named?.cutout : (cutout ?? undefined),
    shell: named?.shell,
  }
}
