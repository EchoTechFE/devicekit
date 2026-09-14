/**
 * How `<device-frame>` publishes state outward: property writes onto its own
 * attributes, and the resolved metrics onto the host as CSS custom properties.
 *
 * The attribute helpers exist because a host can reach the element through two
 * doors. React 18 hands every prop on a hyphenated tag to `setAttribute`, but
 * React 19 assigns anything already present on the instance (`name in element`)
 * as a JS property instead — and an accessor with no setter throws in strict
 * mode, which every ES module is. So each attribute-backed accessor takes a
 * setter, and the setter writes the attribute rather than any private state:
 * the attribute stays the single source of truth, and the two doors cannot
 * disagree.
 */
import type { DeviceProfile } from '@devicekit/devices'
import type { DeviceMetrics } from './metrics.js'
import { orientedShellCorners, orientedShellInsets } from './shell-insets.js'
import { DEVICE_FRAME_BORDER_WIDTH } from './styles.js'

/** A value-carrying attribute. `null`/`undefined` clear it, matching `removeAttribute`. */
export function reflectAttribute(el: Element, name: string, value: string | null | undefined): void {
  if (value === null || value === undefined) el.removeAttribute(name)
  else el.setAttribute(name, value)
}

/**
 * A presence attribute. Coerced rather than passed straight to
 * `toggleAttribute`, whose second argument means "toggle" when undefined — the
 * value React 19 hands over for a prop that was just removed.
 */
export function reflectFlag(el: Element, name: string, value: boolean | null | undefined): void {
  el.toggleAttribute(name, Boolean(value))
}

/**
 * Publishes the resolved metrics as custom properties on the host, so slotted
 * content sizes itself against exactly what the frame drew instead of being
 * told the same numbers a second time through another channel.
 *
 * The safe area is published as insets, matching what `env(safe-area-inset-*)`
 * would report, rather than as the rectangle's own coordinates.
 */
export function reflectMetrics(style: CSSStyleDeclaration, metrics: DeviceMetrics, embedded: boolean, profile?: DeviceProfile): void {
  if (embedded) {
    style.removeProperty('--device-width')
    style.removeProperty('--device-height')
  }
  else {
    style.setProperty('--device-width', `${metrics.screen.width}px`)
    style.setProperty('--device-height', `${metrics.screen.height}px`)
  }

  const { safeAreaInsets: insets, shell } = metrics
  style.setProperty('--device-pixel-ratio', `${metrics.pixelRatio}`)
  style.setProperty('--device-status-bar-height', `${metrics.statusBarHeight}px`)
  style.setProperty('--device-status-bar-edge', metrics.statusBarEdge)
  style.setProperty('--device-status-bar-inset-top', `${metrics.statusBarEdge === 'top' ? metrics.statusBarHeight : 0}px`)
  style.setProperty('--device-status-bar-inset-right', `${metrics.statusBarEdge === 'right' ? metrics.statusBarHeight : 0}px`)
  style.setProperty('--device-navigation-bar-height', `${metrics.navigationBarHeight}px`)
  style.setProperty('--device-tab-bar-height', `${metrics.tabBarHeight}px`)
  style.setProperty('--device-window-width', `${metrics.window.width}px`)
  style.setProperty('--device-window-height', `${metrics.window.height}px`)
  style.setProperty('--device-safe-area-top', `${insets.top}px`)
  style.setProperty('--device-safe-area-right', `${insets.right}px`)
  style.setProperty('--device-safe-area-bottom', `${insets.bottom}px`)
  style.setProperty('--device-safe-area-left', `${insets.left}px`)
  style.setProperty('--device-screen-radius', `${shell.screenRadius}px`)
  const corners = orientedShellCorners(shell.screenCorners, metrics.orientation)
  style.setProperty('--device-screen-radius-top-left', `${corners.topLeft}px`)
  style.setProperty('--device-screen-radius-top-right', `${corners.topRight}px`)
  style.setProperty('--device-screen-radius-bottom-right', `${corners.bottomRight}px`)
  style.setProperty('--device-screen-radius-bottom-left', `${corners.bottomLeft}px`)
  style.setProperty('--device-bezel', `${shell.bezel}px`)
  const shellInsets = orientedShellInsets(shell.bezelInsets, metrics.orientation)
  style.setProperty('--device-bezel-top', `${shellInsets.top}px`)
  style.setProperty('--device-bezel-right', `${shellInsets.right}px`)
  style.setProperty('--device-bezel-bottom', `${shellInsets.bottom}px`)
  style.setProperty('--device-bezel-left', `${shellInsets.left}px`)
  style.setProperty('--device-body-radius', `${shell.bodyRadius}px`)

  // Rounded modern screens stay concentric with each adjacent edge even when
  // the bezel is asymmetric. Legacy square screens intentionally keep their
  // explicit scalar bodyRadius semantics and therefore do not publish these
  // modern per-corner variables.
  const uniformInsets = shellInsets.top === shellInsets.right
    && shellInsets.right === shellInsets.bottom
    && shellInsets.bottom === shellInsets.left
  const uniformCorners = corners.topLeft === corners.topRight
    && corners.topRight === corners.bottomRight
    && corners.bottomRight === corners.bottomLeft
  // A caller-provided scalar is an explicit shell contract, even when the
  // screen also has asymmetric insets or corners. Automatic elliptical radii
  // apply only when the profile leaves bodyRadius unspecified.
  const explicitBodyRadius = profile?.shell?.bodyRadius !== undefined
  const allCornersZero = Object.values(corners).every(v => v === 0)
  if (allCornersZero || (uniformInsets && uniformCorners) || explicitBodyRadius) {
    style.removeProperty('--device-body-radius-x')
    style.removeProperty('--device-body-radius-y')
  }
  else {
    const x = {
      topLeft: corners.topLeft + shellInsets.left + DEVICE_FRAME_BORDER_WIDTH,
      topRight: corners.topRight + shellInsets.right + DEVICE_FRAME_BORDER_WIDTH,
      bottomRight: corners.bottomRight + shellInsets.right + DEVICE_FRAME_BORDER_WIDTH,
      bottomLeft: corners.bottomLeft + shellInsets.left + DEVICE_FRAME_BORDER_WIDTH,
    }
    const y = {
      topLeft: corners.topLeft + shellInsets.top + DEVICE_FRAME_BORDER_WIDTH,
      topRight: corners.topRight + shellInsets.top + DEVICE_FRAME_BORDER_WIDTH,
      bottomRight: corners.bottomRight + shellInsets.bottom + DEVICE_FRAME_BORDER_WIDTH,
      bottomLeft: corners.bottomLeft + shellInsets.bottom + DEVICE_FRAME_BORDER_WIDTH,
    }
    style.setProperty('--device-body-radius-x', `${x.topLeft}px ${x.topRight}px ${x.bottomRight}px ${x.bottomLeft}px`)
    style.setProperty('--device-body-radius-y', `${y.topLeft}px ${y.topRight}px ${y.bottomRight}px ${y.bottomLeft}px`)
  }
}
