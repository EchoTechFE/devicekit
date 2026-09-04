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
import type { DeviceMetrics } from './metrics.js'

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
export function reflectMetrics(style: CSSStyleDeclaration, metrics: DeviceMetrics, embedded: boolean): void {
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
  style.setProperty('--device-navigation-bar-height', `${metrics.navigationBarHeight}px`)
  style.setProperty('--device-tab-bar-height', `${metrics.tabBarHeight}px`)
  style.setProperty('--device-window-width', `${metrics.window.width}px`)
  style.setProperty('--device-window-height', `${metrics.window.height}px`)
  style.setProperty('--device-safe-area-top', `${insets.top}px`)
  style.setProperty('--device-safe-area-right', `${insets.right}px`)
  style.setProperty('--device-safe-area-bottom', `${insets.bottom}px`)
  style.setProperty('--device-safe-area-left', `${insets.left}px`)
  style.setProperty('--device-screen-radius', `${shell.screenRadius}px`)
  style.setProperty('--device-bezel', `${shell.bezel}px`)
  style.setProperty('--device-body-radius', `${shell.bodyRadius}px`)
}
