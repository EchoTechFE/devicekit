/**
 * Where the status bar's time, glyph cluster and midline sit, as pure numbers
 * derived from a resolved device.
 *
 * This is the single owner of that geometry: status-bar.ts only writes these
 * numbers onto the DOM as `data-layout` and `--sb-*` custom properties, and
 * styles.ts only reads them. Nothing else — a padding-top hack, a pair of
 * "ear" widths either side of the cutout — computes position, so there is one
 * place to fix when a measurement is wrong instead of two that can drift.
 */
import { statusBarHeightFor, type Orientation, type ResolvedDevice } from '@devicekit/devices'

/**
 * The device's screen width in this orientation. Not orientedScreen() itself:
 * that takes a DeviceProfile, whose optional `cutout` rejects the resolved
 * `CutoutSpec | null` this module already has in hand.
 */
function screenWidthFor(device: ResolvedDevice, orientation: Orientation): number {
  return orientation === 'landscape' ? device.screen.height : device.screen.width
}

export type StatusBarLayoutMode = 'ios-cutout' | 'ios-classic' | 'ipad' | 'android'

export interface StatusBarLayout {
  mode: StatusBarLayoutMode
  /** This orientation's status bar height; 0 means the bar itself is hidden. */
  height: number
  /** Glyph row's vertical center, relative to the screen's top edge. */
  centerY: number
  /** Glyph scale, 1 = the 375pt-wide notch iPhone the measurements were taken on. */
  scale: number
  /** Time ink's left edge; null means horizontally centered (ios-classic). */
  timeLeft: number | null
  /** Battery outline's right edge, distance from the screen's right edge. */
  trailing: number
  /** ios-classic only: signal+Wi-Fi cluster's left edge. Null everywhere else. */
  leadingIcons: number | null
}

/** iOS reports a short side this wide or more only on an iPad. */
const IPAD_SHORT_SIDE = 744
/** The notch iPhone (375pt wide) the glyph measurements were taken on. */
const BASE_WIDTH = 375
const MAX_SCALE = 1.17

function modeFor(device: ResolvedDevice): StatusBarLayoutMode {
  if (device.os === 'ios') {
    const shortSide = Math.min(device.screen.width, device.screen.height)
    if (shortSide >= IPAD_SHORT_SIDE) return 'ipad'
    return device.cutout ? 'ios-cutout' : 'ios-classic'
  }
  // android and harmony: harmony has no layout of its own measured yet, so it
  // borrows android's until someone measures a real device.
  return 'android'
}

interface CutoutTableRow {
  width: number
  pixelRatio: number
  statusBarHeight: number
  timeLeft: number
  trailing: number
  scale: number
  /** Notch rows only — a pill's centerY is always its own midline. */
  centerY?: number
}

/**
 * Measured (width, pixelRatio, statusBarHeight) -> geometry, one row per
 * shipped cutout phone. A pill row omits centerY because it is always the
 * island's own midline (cutout.top + cutout.height / 2), not a fixed number.
 */
const CUTOUT_TABLE: CutoutTableRow[] = [
  { width: 375, pixelRatio: 3, statusBarHeight: 44, timeLeft: 31.3, trailing: 14.3, scale: 1.00, centerY: 23.0 },
  { width: 375, pixelRatio: 3, statusBarHeight: 50, timeLeft: 26.7, trailing: 24.5, scale: 0.95, centerY: 26.3 },
  { width: 390, pixelRatio: 3, statusBarHeight: 47, timeLeft: 36.0, trailing: 18.3, scale: 1.02, centerY: 24.8 },
  { width: 414, pixelRatio: 2, statusBarHeight: 48, timeLeft: 35.0, trailing: 17.0, scale: 1.05, centerY: 25.0 },
  { width: 414, pixelRatio: 3, statusBarHeight: 44, timeLeft: 40.7, trailing: 21.4, scale: 1.05, centerY: 22.7 },
  { width: 428, pixelRatio: 3, statusBarHeight: 47, timeLeft: 45.3, trailing: 27.4, scale: 1.11, centerY: 24.3 },
  { width: 393, pixelRatio: 3, statusBarHeight: 54, timeLeft: 54.3, trailing: 32.7, scale: 1.11 },
  { width: 402, pixelRatio: 3, statusBarHeight: 54, timeLeft: 56.7, trailing: 35.4, scale: 1.11 },
  { width: 420, pixelRatio: 3, statusBarHeight: 54, timeLeft: 59.3, trailing: 34.7, scale: 1.17 },
  { width: 430, pixelRatio: 3, statusBarHeight: 54, timeLeft: 62.3, trailing: 42.6, scale: 1.17 },
  { width: 440, pixelRatio: 3, statusBarHeight: 54, timeLeft: 65.3, trailing: 40.7, scale: 1.17 },
]

type OrientationlessLayout = Omit<StatusBarLayout, 'mode' | 'height'>

function iosCutoutLayout(device: ResolvedDevice, orientation: Orientation, height: number): OrientationlessLayout {
  // Non-null: modeFor only picks ios-cutout when the device has one.
  const cutout = device.cutout!
  const width = screenWidthFor(device, orientation)
  const isPill = cutout.shape === 'pill'
  // A pill floats clear of the top edge; its own midline is what the glyph
  // row centers on, not the bar's. A notch sits flush and needs no correction.
  const islandMidline = cutout.top + cutout.height / 2

  const row = CUTOUT_TABLE.find((r) =>
    r.width === width && r.pixelRatio === device.pixelRatio && r.statusBarHeight === height)
  if (row) {
    return {
      timeLeft: row.timeLeft,
      trailing: row.trailing,
      scale: row.scale,
      centerY: isPill ? islandMidline : row.centerY!,
      leadingIcons: null,
    }
  }

  // Untabled width: derive from the clear space either side of the cutout,
  // the same "ear" a device without a measured row still has.
  const ear = (width - cutout.width) / 2
  const scale = Math.min(Math.max(width / BASE_WIDTH, 1), MAX_SCALE)
  if (isPill) {
    return { timeLeft: ear / 2 - 13, trailing: ear / 2, centerY: islandMidline, scale, leadingIcons: null }
  }
  return {
    timeLeft: ear / 2 - 10,
    trailing: Math.max(ear / 2 - 27, 10),
    centerY: height / 2 + 1,
    scale,
    leadingIcons: null,
  }
}

function iosClassicLayout(height: number): OrientationlessLayout {
  return { timeLeft: null, leadingIcons: 6, trailing: 14, centerY: height / 2, scale: 1 }
}

function ipadLayout(height: number): OrientationlessLayout {
  // Full-screen iPads report a 24pt status bar; the home-button generation
  // reports 20. Nothing in between ships, so the split is a plain threshold.
  const fullScreen = height >= 24
  return {
    timeLeft: fullScreen ? 17 : 7,
    trailing: fullScreen ? 15.5 : 5.5,
    centerY: height / 2,
    scale: 1,
    leadingIcons: null,
  }
}

function androidLayout(height: number): OrientationlessLayout {
  return { timeLeft: 31, trailing: 28, centerY: height / 2, scale: 1, leadingIcons: null }
}

export function computeStatusBarLayout(device: ResolvedDevice, orientation: Orientation): StatusBarLayout {
  const mode = modeFor(device)
  const height = statusBarHeightFor(device, orientation)

  switch (mode) {
    case 'ios-cutout':
      return { mode, height, ...iosCutoutLayout(device, orientation, height) }
    case 'ios-classic':
      return { mode, height, ...iosClassicLayout(height) }
    case 'ipad':
      return { mode, height, ...ipadLayout(height) }
    case 'android':
      return { mode, height, ...androidLayout(height) }
  }
}
