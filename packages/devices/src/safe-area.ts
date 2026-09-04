/**
 * Turning a device into numbers a page can lay itself out against.
 *
 * Two separate questions, and hosts routinely confuse them:
 *
 *   resolveSafeArea()   which parts of the SCREEN the system decorations own.
 *                       Independent of what the app draws.
 *   resolveWindowSize() how much room the PAGE actually gets, once the app's
 *                       own navigation bar and tab bar have taken theirs.
 *
 * A preview that skips the second one hands the previewed page the full screen
 * height. A mini-program page on the same phone gets roughly 90px less, so a
 * `100vh` layout looks right in the preview and overflows on the device.
 */
import {
  navigationBarHeightFor,
  resolveDevice,
  safeAreaInsetsFor,
  statusBarHeightFor,
  type DeviceProfile,
  type EdgeInsets,
  type Orientation,
  type ScreenSize,
} from './devices.js'

/**
 * The same shape `wx.getWindowInfo().safeArea` has: edges measured from the
 * screen's top-left, plus the box they enclose.
 */
export interface SafeAreaRect {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

/** The screen as it appears in this orientation. Landscape swaps the sides. */
export function orientedScreen(device: DeviceProfile, orientation: Orientation = 'portrait'): ScreenSize {
  const { screen } = device
  return orientation === 'landscape'
    ? { width: screen.height, height: screen.width }
    : { width: screen.width, height: screen.height }
}

/**
 * The device's safe-area insets in this orientation — distances from each edge,
 * the way `env(safe-area-inset-*)` reports them.
 *
 * Read straight off the profile rather than derived from the portrait values,
 * because the two orientations do not follow one another: on a notched iPhone
 * the bottom inset drops from 34 to 21 when rotated, and the iPhone 17 line
 * moved that landscape bottom inset again, from 21 to 20 — the top inset
 * stays 0 in landscape on every iOS device, that generation included.
 */
export function resolveSafeAreaInsets(device: DeviceProfile, orientation: Orientation = 'portrait'): EdgeInsets {
  return safeAreaInsetsFor(resolveDevice(device), orientation)
}

/**
 * The safe area as a rectangle on the screen, which is the shape mini-program
 * hosts report. resolveSafeAreaInsets() is the same information as insets.
 */
export function resolveSafeArea(device: DeviceProfile, orientation: Orientation = 'portrait'): SafeAreaRect {
  const screen = orientedScreen(device, orientation)
  const insets = resolveSafeAreaInsets(device, orientation)

  const top = insets.top
  const left = insets.left
  const right = screen.width - insets.right
  const bottom = screen.height - insets.bottom

  return { top, left, right, bottom, width: right - left, height: bottom - top }
}

/** How much chrome to take off the screen in resolveWindowSize(). */
export interface WindowSizeOptions {
  /** Which way the device is held. Default portrait. */
  orientation?: Orientation
  /**
   * The app's own top bar. `true` uses the device's navigation bar height for
   * this orientation, `false` means a full-screen page that draws its own (a
   * mini-program's `navigationStyle: "custom"`), a number overrides the height
   * outright — which is how a host with its own navigation bar sizes the page.
   */
  navigationBar?: boolean | number
  /** Height of a bottom tab bar, when the page has one. */
  tabBarHeight?: number
}

/**
 * Rejects options that would otherwise subtract a negative number from the
 * screen height and grow the window past it, or hand a non-finite value
 * downstream into layout math.
 */
function assertWindowSizeOptions(options: WindowSizeOptions): void {
  const { navigationBar, tabBarHeight } = options
  if (navigationBar !== undefined && typeof navigationBar !== 'boolean') {
    if (typeof navigationBar !== 'number' || !Number.isFinite(navigationBar) || navigationBar < 0) {
      throw new RangeError(
        `resolveWindowSize: options.navigationBar must be a boolean or a finite number >= 0, got ${navigationBar}`,
      )
    }
  }
  if (tabBarHeight !== undefined) {
    if (typeof tabBarHeight !== 'number' || !Number.isFinite(tabBarHeight) || tabBarHeight < 0) {
      throw new RangeError(`resolveWindowSize: options.tabBarHeight must be a finite number >= 0, got ${tabBarHeight}`)
    }
  }
}

/**
 * The box the page's own content gets: the screen minus the status bar, minus
 * the app's navigation bar, minus its tab bar. This is what a page sees as
 * `windowWidth` / `windowHeight`, and what an emulated viewport should be sized
 * to so that `100vh` means the same thing in the preview and on the device.
 */
export function resolveWindowSize(device: DeviceProfile, options: WindowSizeOptions = {}): ScreenSize {
  assertWindowSizeOptions(options)
  const { orientation = 'portrait', navigationBar = true, tabBarHeight = 0 } = options
  const resolved = resolveDevice(device)
  const screen = orientedScreen(device, orientation)

  const statusBar = statusBarHeightFor(resolved, orientation)
  const navBar = navigationBar === true
    ? navigationBarHeightFor(resolved, orientation)
    : navigationBar === false ? 0 : navigationBar

  return {
    width: screen.width,
    height: Math.max(0, screen.height - statusBar - navBar - tabBarHeight),
  }
}
