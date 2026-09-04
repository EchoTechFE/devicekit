/**
 * What `<device-frame>` reports it drew with, and the fallbacks behind it.
 *
 * A shape rather than a getter's return type written inline, so a host can
 * take `DeviceMetrics` as a parameter without importing the element class —
 * and so the element file stays about drawing a phone.
 */
import {
  type CutoutSpec,
  type DeviceProfile,
  type DeviceShell,
  type EdgeInsets,
  type Orientation,
  orientedScreen,
  resolveDevice,
  resolveSafeArea,
  resolveWindowSize,
  safeAreaInsetsFor,
  type SafeAreaRect,
  type ScreenSize,
  statusBarHeightFor,
} from '@devicekit/devices'
import { EMPTY_BOX, type ContentBox } from './content-rect.js'

/**
 * What a slotted tab bar costs when the host does not say how tall its own is.
 *
 * Unlike the status bar and the navigation bar, this is **not** device data: no
 * device table states a tab bar height, because a tab bar is the app's chrome
 * rather than the phone's. This is the height mini-program tab bars conventionally
 * use; a host whose bar is a different height sets `tab-bar-height`.
 */
export const DEFAULT_TAB_BAR_HEIGHT = 50

/** What an embedded frame reports: a plain screen has no phone chrome to measure. */
export const EMPTY_RECT: SafeAreaRect = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }
export const EMPTY_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 }
export const EMPTY_SIZE: ScreenSize = { width: 0, height: 0 }

/**
 * The ink color of the drawn status bar and home indicator: `black` for a
 * light page under them, `white` for a dark one.
 */
export type StatusBarTextStyle = 'black' | 'white'

/** What the frame resolved from its attributes — the numbers it drew with. */
export interface DeviceMetrics {
  /** The screen in the current orientation. */
  screen: ScreenSize
  /** Which way the device is held, from the `orientation` attribute. */
  orientation: Orientation
  /** Physical pixels per CSS px on the real device — 3 on most iPhones. */
  pixelRatio: number
  /** What a page emulating this device should report as `navigator.userAgent`. */
  userAgent: string
  statusBarHeight: number
  /** Zero unless the `navigation-bar` slot has content. */
  navigationBarHeight: number
  /** Zero unless the `tab-bar` slot has content. */
  tabBarHeight: number
  /** Edges measured from the screen's top-left, like `wx.getWindowInfo().safeArea`. */
  safeArea: SafeAreaRect
  /** The same information as distances from each edge, like `env(safe-area-inset-*)`. */
  safeAreaInsets: EdgeInsets
  /**
   * What the previewed page actually gets: the screen minus the status bar, the
   * navigation bar and the tab bar — or the whole screen when `immersive`, where
   * the page draws under all three.
   */
  window: ScreenSize
  /** Where that window sits on the screen. */
  content: ContentBox
  cutout: CutoutSpec | null
  shell: Required<DeviceShell>
}

/**
 * Resolves a profile plus the frame's own attributes into the numbers it
 * draws with. Pulled out of the element so it can be exercised without a DOM:
 * everything it needs — the profile, the orientation, whether the frame is
 * embedded or immersive, and the two slot-dependent bar heights the element
 * alone can measure — comes in as arguments.
 */
export function computeDeviceMetrics(
  profile: DeviceProfile,
  orientation: Orientation,
  embedded: boolean,
  immersive: boolean,
  navigationBarHeight: number,
  tabBarHeight: number,
): DeviceMetrics {
  const resolved = resolveDevice(profile)

  if (embedded) {
    return {
      screen: EMPTY_SIZE,
      orientation,
      pixelRatio: resolved.pixelRatio,
      userAgent: resolved.userAgent,
      statusBarHeight: 0,
      navigationBarHeight: 0,
      tabBarHeight: 0,
      safeArea: EMPTY_RECT,
      safeAreaInsets: EMPTY_INSETS,
      window: EMPTY_SIZE,
      content: EMPTY_BOX,
      cutout: null,
      shell: resolved.shell,
    }
  }

  const screen = orientedScreen(profile, orientation)
  const statusBarHeight = statusBarHeightFor(resolved, orientation)

  // Immersive is the mini-program's `navigationStyle: "custom"` and the
  // in-app H5 that draws its own title bar: the bars are still on screen, but
  // the page runs the full height behind them and pads itself using the
  // heights reported here.
  const window = immersive
    ? screen
    : resolveWindowSize(profile, { orientation, navigationBar: navigationBarHeight, tabBarHeight })

  return {
    screen,
    orientation,
    pixelRatio: resolved.pixelRatio,
    userAgent: resolved.userAgent,
    statusBarHeight,
    navigationBarHeight,
    tabBarHeight,
    safeArea: resolveSafeArea(profile, orientation),
    safeAreaInsets: safeAreaInsetsFor(resolved, orientation),
    window,
    content: {
      x: 0,
      y: immersive ? 0 : statusBarHeight + navigationBarHeight,
      width: window.width,
      height: window.height,
    },
    cutout: resolved.cutout,
    shell: resolved.shell,
  }
}
