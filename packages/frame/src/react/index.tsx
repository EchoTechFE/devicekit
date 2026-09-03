/**
 * React wrapper around `<device-frame>`.
 *
 * A separate entry (`@devicekit/frame/react`) rather than the package
 * root, so a plain-DOM host that only wants the custom element never pulls
 * React in — see peerDependencies in package.json.
 *
 * React 18 passes unknown props on a hyphenated tag straight through as DOM
 * attributes via `setAttribute`, string-coerced, with no special handling for
 * booleans (unlike built-in elements, `embedded={false}` would land as the
 * literal attribute `embedded="false"` rather than being omitted). This
 * wrapper does that stripping itself, and keeps `deviceProfile` — which has
 * no attribute form — off the attribute list entirely, setting it as a
 * property once the node exists.
 */
import * as React from 'react'
import { useImperativeHandle, useLayoutEffect, useRef } from 'react'
import type { DeviceProfile, Orientation } from '@devicekit/devices'
import { defineDeviceFrame, DEVICE_FRAME_TAG, type DeviceFrameElement, type StatusBarTextStyle } from '../device-frame.js'

defineDeviceFrame()

/**
 * Everything the element takes, plus the usual DOM props. Anything not listed
 * here — `style`, `id`, `onClick` — is passed through to the element untouched.
 */
export interface DeviceFrameProps extends React.HTMLAttributes<HTMLElement> {
  /** A preset's `name`, e.g. `"iPhone 15"`. Unknown names fall back to the defaults. */
  device?: string
  /**
   * A profile that is not in the shared table, for a host carrying its own
   * device list. Wins over `device`; `null` clears it back to the preset.
   */
  deviceProfile?: DeviceProfile | null
  /** Which way the device is held. Default portrait. */
  orientation?: Orientation
  /** Draw a bare screen with no body or chrome, stretched to fill the container. */
  embedded?: boolean
  /** Run the page full height behind the bars instead of below them. */
  immersive?: boolean
  /** false hides the drawn status bar (`status-bar="hidden"`); default shows it. */
  statusBar?: boolean
  /** Ink color of the status bar and home indicator. Default follows the device. */
  statusBarTextStyle?: StatusBarTextStyle
  /** Any CSS color to paint behind the status bar. Default transparent. */
  statusBarBackground?: string
  /** Height of the bar in the `navigation-bar` slot, CSS px. Default: the device's own. */
  navigationBarHeight?: number
  /** Height of the bar in the `tab-bar` slot, CSS px. Default 50. */
  tabBarHeight?: number
  /** The previewed page, plus anything for the `navigation-bar`, `tab-bar` and `overlay` slots. */
  children?: React.ReactNode
}

/**
 * `<device-frame>` as a React component. Registers the element on import, maps
 * props onto its attributes, and forwards a ref to the element itself — which
 * is where `metrics` and `contentRect` are read from.
 */
export const DeviceFrame = React.forwardRef<DeviceFrameElement, DeviceFrameProps>(
  function DeviceFrame(props, forwardedRef) {
    const {
      device,
      deviceProfile,
      orientation,
      embedded,
      immersive,
      statusBar,
      statusBarTextStyle,
      statusBarBackground,
      navigationBarHeight,
      tabBarHeight,
      children,
      className,
      ...rest
    } = props

    const innerRef = useRef<DeviceFrameElement | null>(null)
    useImperativeHandle(forwardedRef, () => innerRef.current as DeviceFrameElement, [])

    // `deviceProfile` has no attribute form (it carries a full object, not a
    // string) — it is only ever set as a property, and only once the node is
    // in the tree. `null` clears an override back to the `device` preset.
    useLayoutEffect(() => {
      if (innerRef.current) innerRef.current.deviceProfile = deviceProfile ?? null
    }, [deviceProfile])

    const attributes: Record<string, string> = {}
    // React does not translate `className` to the `class` attribute for a
    // hyphenated custom-element tag the way it does for built-ins — it has to
    // be mapped by hand or the class list never reaches the DOM node.
    if (className !== undefined) attributes.class = className
    if (device !== undefined) attributes.device = device
    if (orientation !== undefined) attributes.orientation = orientation
    if (embedded) attributes.embedded = ''
    if (immersive) attributes.immersive = ''
    if (statusBar === false) attributes['status-bar'] = 'hidden'
    if (statusBarTextStyle !== undefined) attributes['status-bar-text-style'] = statusBarTextStyle
    if (statusBarBackground !== undefined) attributes['status-bar-background'] = statusBarBackground
    if (navigationBarHeight !== undefined) attributes['navigation-bar-height'] = String(navigationBarHeight)
    if (tabBarHeight !== undefined) attributes['tab-bar-height'] = String(tabBarHeight)

    return React.createElement(
      DEVICE_FRAME_TAG,
      { ...rest, ...attributes, ref: innerRef },
      children,
    )
  },
)

declare global {
  // Augmenting the global JSX.IntrinsicElements map has no ES-module
  // equivalent syntax.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      [DEVICE_FRAME_TAG]: React.DetailedHTMLProps<React.HTMLAttributes<DeviceFrameElement>, DeviceFrameElement> & {
        device?: string
        orientation?: Orientation
        embedded?: boolean
        immersive?: boolean
        cutout?: string
        width?: string | number
        height?: string | number
        'pixel-ratio'?: string | number
        'user-agent'?: string
        'status-bar-height'?: string | number
        'navigation-bar-height'?: string | number
        'tab-bar-height'?: string | number
        'safe-area-top'?: string | number
        'safe-area-right'?: string | number
        'safe-area-bottom'?: string | number
        'safe-area-left'?: string | number
        'status-bar'?: string
        'status-bar-text-style'?: StatusBarTextStyle
        'status-bar-background'?: string
      }
    }
  }
}
