/**
 * What a device is.
 *
 * Five decisions the shape encodes:
 *
 * - `screen` is the physical screen, never the usable area. Once the status bar
 *   and the app's own navigation bar are taken out the two differ by close to a
 *   hundred pixels, so one number standing for both guarantees a preview that
 *   lies. The usable area is computed by resolveWindowSize(), because it
 *   depends on which chrome the page asked for.
 * - `screen` is stored portrait-only, because rotating a phone genuinely swaps
 *   its width and height. Everything else that differs between orientations is
 *   stored twice, because it does NOT follow from the portrait value by any
 *   rule: the bottom inset shrinks from 34 to 21, the navigation bar from 44 to
 *   32, and iOS 26 gave landscape a 20px top inset where there used to be none.
 * - The status bar height and the top safe-area inset are separate numbers. On
 *   a Dynamic Island phone the status bar is 54 while the inset is 59 or 62 —
 *   one is what the clock is drawn into, the other is what the island and its
 *   surround make unusable. A single field cannot serve both.
 * - `cutout` carries its own shape and geometry rather than being an enum of
 *   known phones, so a punch-hole camera is expressible without the enum
 *   growing a case. It describes appearance only; what the screen gives up for
 *   it lives in the safe-area insets.
 * - `shell` is the phone's body — corner radius and bezel. It is per-device
 *   because a 2016 phone and a 2025 phone do not have the same corners.
 */

import { deviceUserAgent } from './user-agent.js'

export type DeviceOS = 'ios' | 'android' | 'harmony'

export type Orientation = 'portrait' | 'landscape'

export interface ScreenSize {
  width: number
  height: number
}

/** Distances from each screen edge, the way `env(safe-area-inset-*)` reports them. */
export interface EdgeInsets {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * The shape of what interrupts the screen. `notch` hangs off the top edge,
 * `pill` floats below it (a Dynamic Island), `circle` is a punch-hole camera —
 * the three shapes phones actually ship.
 */
export type CutoutShape = 'notch' | 'pill' | 'circle'

/**
 * Where to draw the cutout, in CSS px at the device's portrait width.
 *
 * Purely visual. A cutout costs the page nothing by itself: what the screen
 * gives up is in `safeAreaInsets`, which is measured, not derived from this.
 */
export interface CutoutSpec {
  shape: CutoutShape
  width: number
  height: number
  /** Distance from the screen's top edge. 0 = flush, which is what a notch is. */
  top: number
  /** Horizontal centre as a fraction of screen width. Omitted = centred. */
  centerX?: number
}

/** The phone's body around the screen. */
export interface DeviceShell {
  /** Screen corner radius. */
  screenRadius: number
  /** Body thickness around the screen on every side. 0 = a bezel-less preview. */
  bezel: number
  /** Body corner radius. Omitted = screenRadius + bezel, which keeps the two concentric. */
  bodyRadius?: number
}

export interface DeviceProfile {
  /** Lookup key, so it has to be unique within the table. */
  name: string
  os: DeviceOS
  /** The physical screen in CSS px, portrait. Landscape swaps the two. */
  screen: ScreenSize
  pixelRatio: number
  /** Shown in the device picker, e.g. "iOS 18.0". Also feeds the generated user agent. */
  system?: string
  /**
   * What a page emulating this device should report as `navigator.userAgent`.
   * Omitted = generated from `os` and `system` — see deviceUserAgent().
   */
  userAgent?: string

  /** Portrait status bar height: the strip the clock and glyphs are drawn into. */
  statusBarHeight?: number
  /** Landscape status bar height. Omitted = the platform default (0 on iOS, unchanged elsewhere). */
  statusBarHeightLandscape?: number
  /**
   * Height of the app's own top bar — a mini-program's navigation bar. It sits
   * in the device table because it varies by platform, not just by app.
   */
  navigationBarHeight?: number
  navigationBarHeightLandscape?: number

  /**
   * Measured safe area, portrait. Omitted = the status bar at the top and
   * nothing anywhere else, which is what a phone without a cutout or a gesture
   * bar reports.
   */
  safeAreaInsets?: Partial<EdgeInsets>
  /** Measured safe area, landscape. Omitted = no insets at all. */
  safeAreaInsetsLandscape?: Partial<EdgeInsets>

  cutout?: CutoutSpec
  shell?: Partial<DeviceShell>
}

/**
 * Fallbacks for a profile that leaves a field out, and for hosts that only know
 * the platform.
 *
 * `navigationBarHeightLandscape` on iOS is 32, which is what WeChat's device
 * table reports for every iPhone it lists. Unverified: Android and HarmonyOS
 * keep their portrait heights in landscape, and their status bar stays visible
 * when rotated — neither has been checked against a rotated device.
 */
export const PLATFORM_DEFAULTS: Record<DeviceOS, {
  statusBarHeight: number
  statusBarHeightLandscape: number
  navigationBarHeight: number
  navigationBarHeightLandscape: number
  shell: DeviceShell
}> = {
  ios: {
    statusBarHeight: 44,
    statusBarHeightLandscape: 0,
    navigationBarHeight: 44,
    navigationBarHeightLandscape: 32,
    shell: { screenRadius: 38, bezel: 6 },
  },
  android: {
    statusBarHeight: 24,
    statusBarHeightLandscape: 24,
    navigationBarHeight: 48,
    navigationBarHeightLandscape: 48,
    shell: { screenRadius: 16, bezel: 4 },
  },
  harmony: {
    statusBarHeight: 36,
    statusBarHeightLandscape: 36,
    navigationBarHeight: 28,
    navigationBarHeightLandscape: 28,
    shell: { screenRadius: 34, bezel: 4 },
  },
}

const NO_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 }

/**
 * A profile with every field filled in — what the rest of the package reads, so
 * no caller has to repeat the "omitted means platform default" rule.
 */
export interface ResolvedDevice {
  name: string
  os: DeviceOS
  screen: ScreenSize
  pixelRatio: number
  system: string
  userAgent: string
  statusBarHeight: number
  statusBarHeightLandscape: number
  navigationBarHeight: number
  navigationBarHeightLandscape: number
  safeAreaInsets: EdgeInsets
  safeAreaInsetsLandscape: EdgeInsets
  cutout: CutoutSpec | null
  shell: Required<DeviceShell>
}

function withInsets(partial: Partial<EdgeInsets> | undefined, fallback: EdgeInsets): EdgeInsets {
  if (!partial) return fallback
  return {
    top: partial.top ?? fallback.top,
    right: partial.right ?? fallback.right,
    bottom: partial.bottom ?? fallback.bottom,
    left: partial.left ?? fallback.left,
  }
}

export function resolveDevice(profile: DeviceProfile): ResolvedDevice {
  const defaults = PLATFORM_DEFAULTS[profile.os]
  const statusBarHeight = profile.statusBarHeight ?? defaults.statusBarHeight
  const screenRadius = profile.shell?.screenRadius ?? defaults.shell.screenRadius
  const bezel = profile.shell?.bezel ?? defaults.shell.bezel

  return {
    name: profile.name,
    os: profile.os,
    screen: profile.screen,
    pixelRatio: profile.pixelRatio,
    system: profile.system ?? '',
    userAgent: profile.userAgent ?? deviceUserAgent(profile),
    statusBarHeight,
    statusBarHeightLandscape: profile.statusBarHeightLandscape ?? defaults.statusBarHeightLandscape,
    navigationBarHeight: profile.navigationBarHeight ?? defaults.navigationBarHeight,
    navigationBarHeightLandscape: profile.navigationBarHeightLandscape ?? defaults.navigationBarHeightLandscape,
    safeAreaInsets: withInsets(profile.safeAreaInsets, { ...NO_INSETS, top: statusBarHeight }),
    safeAreaInsetsLandscape: withInsets(profile.safeAreaInsetsLandscape, NO_INSETS),
    cutout: profile.cutout ?? null,
    shell: {
      screenRadius,
      bezel,
      bodyRadius: profile.shell?.bodyRadius ?? screenRadius + bezel,
    },
  }
}

/** Per-orientation views of the fields that are stored twice. */
export function statusBarHeightFor(device: ResolvedDevice, orientation: Orientation): number {
  return orientation === 'landscape' ? device.statusBarHeightLandscape : device.statusBarHeight
}

export function navigationBarHeightFor(device: ResolvedDevice, orientation: Orientation): number {
  return orientation === 'landscape' ? device.navigationBarHeightLandscape : device.navigationBarHeight
}

export function safeAreaInsetsFor(device: ResolvedDevice, orientation: Orientation): EdgeInsets {
  return orientation === 'landscape' ? device.safeAreaInsetsLandscape : device.safeAreaInsets
}
