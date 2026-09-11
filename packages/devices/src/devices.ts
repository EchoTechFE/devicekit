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
 *   32, and the iPhone 17 line's landscape bottom inset moved from 21 to 20 —
 *   the top inset stays 0 in landscape on every iOS device.
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
import { assertDeviceProfile } from './validate.js'

/** The platforms the table covers. */
export type DeviceOS = 'ios' | 'android' | 'harmony'

/** Paint family for status-bar typography and glyphs; independent of geometry. */
export type StatusBarStyle = 'ios' | 'android-stock' | 'android-samsung' | 'android-hyperos' | 'harmony'

/** Which way the device is held. Landscape swaps the screen's two sides. */
export type Orientation = 'portrait' | 'landscape'

/** Which screen edge owns the status-bar strip in this orientation. */
export type StatusBarEdge = 'top' | 'right'

/** A phone, tablet, or foldable. Drives the UA's device-compat token and HarmonyOS's DeviceType. */
export type DeviceFormFactor = 'phone' | 'tablet' | 'foldable'

/** A width and a height in CSS px — never physical pixels. */
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
  /** Horizontal center as a fraction of screen width. Omitted = centered. */
  centerX?: number
}

/** The phone's body around the screen. */
export interface DeviceShell {
  /** Screen corner radius. */
  screenRadius: number
  /** Body thickness around the screen on every side. 0 = a bezel-less preview. */
  bezel: number
  /** Per-edge body thickness. Omitted edges keep the uniform `bezel` value. */
  bezelInsets?: Partial<EdgeInsets>
  /** A physical Home button centered in the bottom bezel. */
  homeButton?: HomeButtonSpec | null
  /** Body corner radius. Omitted = screenRadius + the largest adjacent bezel inset. */
  bodyRadius?: number
}

export interface HomeButtonSpec {
  diameter: number
}

export interface ResolvedDeviceShell extends Required<Omit<DeviceShell, 'bezelInsets' | 'homeButton'>> {
  bezelInsets: EdgeInsets
  homeButton: HomeButtonSpec | null
}

/**
 * One device as the table stores it: everything measured, nothing derived.
 * Optional fields fall back to that platform's entry in PLATFORM_DEFAULTS —
 * resolveDevice() applies those fallbacks so no reader has to.
 */
export interface DeviceProfile {
  /** Lookup key, so it has to be unique within the table. */
  name: string
  os: DeviceOS
  /** Status-bar paint family. Omitted profiles use their platform's family. */
  statusBarStyle?: StatusBarStyle
  /** The physical screen in CSS px, portrait. Landscape swaps the two. */
  screen: ScreenSize
  pixelRatio: number
  /**
   * Phone or tablet. Feeds the generated user agent's device-compat token (an
   * iPad gets Safari's desktop UA, an Android tablet drops "Mobile") and
   * HarmonyOS's DeviceType. Omitted = phone.
   */
  formFactor?: DeviceFormFactor
  /** Shown in the device picker, e.g. "iOS 18.0". Also feeds the generated user agent. */
  system?: string
  /** Calendar year in which this model was released. */
  releaseYear?: number
  /**
   * What a page emulating this device should report as `navigator.userAgent`.
   * Omitted = generated from `os` and `system` — see deviceUserAgent().
   */
  userAgent?: string

  /** Portrait status bar height: the strip the clock and glyphs are drawn into. */
  statusBarHeight?: number
  /** Landscape status bar height. Omitted = the platform default (0 on iOS, unchanged elsewhere). */
  statusBarHeightLandscape?: number
  /** Portrait status-bar edge. Omitted = the platform default, currently top. */
  statusBarEdge?: StatusBarEdge
  /** Landscape status-bar edge. Omitted = the platform default, currently top. */
  statusBarEdgeLandscape?: StatusBarEdge
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
  /** Landscape cutout geometry. Omitted means this orientation draws none. */
  cutoutLandscape?: CutoutSpec | null
  shell?: Partial<DeviceShell>
}

/** A bundled profile, whose release year is known and always present. */
export interface PresetDeviceProfile extends DeviceProfile {
  releaseYear: number
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
  statusBarStyle: StatusBarStyle
  statusBarHeight: number
  statusBarHeightLandscape: number
  statusBarEdge: StatusBarEdge
  statusBarEdgeLandscape: StatusBarEdge
  navigationBarHeight: number
  navigationBarHeightLandscape: number
  shell: DeviceShell
}> = {
  ios: {
    statusBarStyle: 'ios',
    statusBarHeight: 44,
    statusBarHeightLandscape: 0,
    statusBarEdge: 'top',
    statusBarEdgeLandscape: 'top',
    navigationBarHeight: 44,
    navigationBarHeightLandscape: 32,
    shell: { screenRadius: 38, bezel: 6 },
  },
  android: {
    statusBarStyle: 'android-stock',
    statusBarHeight: 24,
    statusBarHeightLandscape: 24,
    statusBarEdge: 'top',
    statusBarEdgeLandscape: 'top',
    navigationBarHeight: 48,
    navigationBarHeightLandscape: 48,
    shell: { screenRadius: 16, bezel: 4 },
  },
  harmony: {
    statusBarStyle: 'harmony',
    statusBarHeight: 36,
    statusBarHeightLandscape: 36,
    statusBarEdge: 'top',
    statusBarEdgeLandscape: 'top',
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
  statusBarStyle: StatusBarStyle
  screen: ScreenSize
  pixelRatio: number
  formFactor: DeviceFormFactor
  system: string
  releaseYear?: number
  userAgent: string
  statusBarHeight: number
  statusBarHeightLandscape: number
  statusBarEdge: StatusBarEdge
  statusBarEdgeLandscape: StatusBarEdge
  navigationBarHeight: number
  navigationBarHeightLandscape: number
  safeAreaInsets: EdgeInsets
  safeAreaInsetsLandscape: EdgeInsets
  cutout: CutoutSpec | null
  cutoutLandscape: CutoutSpec | null
  shell: ResolvedDeviceShell
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

/**
 * Fills a profile's optional fields in from its platform's defaults, generating
 * the user agent when the profile states none.
 *
 * @param profile a table entry or a caller's own profile of the same shape
 * @returns the same device with every field present
 */
export function resolveDevice(profile: DeviceProfile): ResolvedDevice {
  assertDeviceProfile(profile, 'device')
  const defaults = PLATFORM_DEFAULTS[profile.os]
  const statusBarHeight = profile.statusBarHeight ?? defaults.statusBarHeight
  const statusBarHeightLandscape = profile.statusBarHeightLandscape ?? defaults.statusBarHeightLandscape
  const statusBarEdge = profile.statusBarEdge ?? defaults.statusBarEdge
  const statusBarEdgeLandscape = profile.statusBarEdgeLandscape ?? defaults.statusBarEdgeLandscape
  const screenRadius = profile.shell?.screenRadius ?? defaults.shell.screenRadius
  const bezel = profile.shell?.bezel ?? defaults.shell.bezel
  const uniformBezelInsets = { top: bezel, right: bezel, bottom: bezel, left: bezel }
  const profileInsets = profile.shell?.bezelInsets
  const bezelInsets = profileInsets !== undefined
    ? withInsets(profileInsets, uniformBezelInsets)
    : profile.shell?.bezel !== undefined
      ? uniformBezelInsets
      : withInsets(defaults.shell.bezelInsets, uniformBezelInsets)
  const profileHomeButton = profile.shell?.homeButton
  const homeButton = profileHomeButton !== undefined
    ? profileHomeButton
    : defaults.shell.homeButton ?? null

  return {
    name: profile.name,
    os: profile.os,
    statusBarStyle: profile.statusBarStyle ?? defaults.statusBarStyle,
    screen: profile.screen,
    pixelRatio: profile.pixelRatio,
    formFactor: profile.formFactor ?? 'phone',
    system: profile.system ?? '',
    ...(profile.releaseYear === undefined ? {} : { releaseYear: profile.releaseYear }),
    userAgent: profile.userAgent ?? deviceUserAgent(profile),
    statusBarHeight,
    statusBarHeightLandscape,
    statusBarEdge,
    statusBarEdgeLandscape,
    navigationBarHeight: profile.navigationBarHeight ?? defaults.navigationBarHeight,
    navigationBarHeightLandscape: profile.navigationBarHeightLandscape ?? defaults.navigationBarHeightLandscape,
    safeAreaInsets: withInsets(profile.safeAreaInsets, { ...NO_INSETS, [statusBarEdge]: statusBarHeight }),
    safeAreaInsetsLandscape: withInsets(profile.safeAreaInsetsLandscape, { ...NO_INSETS, [statusBarEdgeLandscape]: statusBarHeightLandscape }),
    cutout: profile.cutout ?? null,
    cutoutLandscape: profile.cutoutLandscape ?? null,
    shell: {
      screenRadius,
      bezel,
      bezelInsets,
      homeButton,
      // The largest adjacent inset is the natural scalar envelope for an
      // asymmetric modern shell. reflectMetrics may replace it with the
      // per-corner ellipse when the profile did not explicitly provide a
      // scalar bodyRadius.
      bodyRadius: profile.shell?.bodyRadius ?? screenRadius + Math.max(...Object.values(bezelInsets)),
    },
  }
}

/**
 * The status bar height for this orientation, in CSS px. 0 means the platform
 * draws no status bar when held this way, which is what iOS does in landscape.
 */
export function statusBarHeightFor(device: ResolvedDevice, orientation: Orientation): number {
  return orientation === 'landscape' ? device.statusBarHeightLandscape : device.statusBarHeight
}

/** The edge occupied by the status-bar strip in this orientation. */
export function statusBarEdgeFor(device: ResolvedDevice, orientation: Orientation): StatusBarEdge {
  return orientation === 'landscape' ? device.statusBarEdgeLandscape : device.statusBarEdge
}

/** The cutout visible in this orientation, if this device stores one. */
export function cutoutFor(device: ResolvedDevice, orientation: Orientation): CutoutSpec | null {
  return orientation === 'landscape' ? device.cutoutLandscape : device.cutout
}

/**
 * The height of the app's own top bar for this orientation, in CSS px. It is a
 * per-platform convention rather than something the screen dictates.
 */
export function navigationBarHeightFor(device: ResolvedDevice, orientation: Orientation): number {
  return orientation === 'landscape' ? device.navigationBarHeightLandscape : device.navigationBarHeight
}

/**
 * The safe-area insets for this orientation, in CSS px from each screen edge.
 * Stored per orientation, never derived: rotating a phone does not scale them.
 */
export function safeAreaInsetsFor(device: ResolvedDevice, orientation: Orientation): EdgeInsets {
  return orientation === 'landscape' ? device.safeAreaInsetsLandscape : device.safeAreaInsets
}
