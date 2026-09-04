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
 * literal attribute `embedded="false"` rather than being omitted). React 19
 * assigns any prop the element already exposes (`name in element`) as a JS
 * property instead. The wrapper works on both because it only ever hands over
 * values that mean the same thing down either path — see the `embedded` /
 * `immersive` note below — and the element reflects property writes onto the
 * matching attribute.
 *
 * `deviceProfile` stays off the attribute list entirely — it carries an object,
 * not a string — and is set as a property once the node exists.
 */
import * as React from 'react'
import { useImperativeHandle, useLayoutEffect, useRef } from 'react'
import type { CutoutShape, DeviceOS, DeviceProfile, Orientation } from '@devicekit/devices'
import { defineDeviceFrame, DEVICE_FRAME_TAG, type DeviceFrameElement } from '../device-frame.js'
import { CONTENT_RECT_CHANGE_EVENT } from '../element-events.js'
import { sameContentRect, type ContentRect } from '../content-rect.js'
import type { StatusBarTextStyle } from '../metrics.js'

// On import in a browser, so the default tag is upgraded before React's first
// commit. A server render has no registry and skips it; the component defines
// the element again on mount, which is where a hydrating page picks it up.
//
// Swallowed here rather than left to throw: a host that already owns
// `device-frame` for something unrelated should not crash merely for having
// imported this module — `createDeviceFrameComponent('its-own-tag')` exists
// precisely so that host can opt into a tag that does not collide. The
// collision is not hidden for good, though — mounting the plain `DeviceFrame`
// (which binds to the default tag) runs `defineDeviceFrame()` again from the
// layout effect below and throws the same error there, where a per-mount
// failure is the right shape for it.
if (typeof customElements !== 'undefined') {
  try {
    defineDeviceFrame()
  } catch {
    // See comment above.
  }
}

/**
 * Everything the element takes, plus the usual DOM props. Anything not listed
 * here — `style`, `id`, `onClick` — is passed through to the element untouched.
 */
export interface DeviceFrameProps extends React.HTMLAttributes<HTMLElement> {
  /** A preset's `name`, e.g. `"iPhone 15"`. Unknown names fall back to the defaults. */
  device?: string | undefined
  /**
   * A profile that is not in the shared table, for a host carrying its own
   * device list. Wins over `device`; `null` clears it back to the preset.
   */
  deviceProfile?: DeviceProfile | null | undefined
  /** Which platform's chrome to draw. Default: the preset's, or iOS. */
  os?: DeviceOS | undefined
  /** Which way the device is held. Default portrait. */
  orientation?: Orientation | undefined
  /** Draw a bare screen with no body or chrome, stretched to fill the container. */
  embedded?: boolean | undefined
  /** Run the page full height behind the bars instead of below them. */
  immersive?: boolean | undefined
  /** A cutout shape's name, or `"none"` to clear the preset's. */
  cutout?: CutoutShape | 'none' | undefined
  /** Screen width in CSS px, for a host with no preset. Default: the preset's. */
  width?: number | undefined
  /** Screen height in CSS px, for a host with no preset. Default: the preset's. */
  height?: number | undefined
  /** Physical pixels per CSS px the previewed page should report. */
  pixelRatio?: number | undefined
  /** What the previewed page should report as `navigator.userAgent`. */
  userAgent?: string | undefined
  /** Status bar height in CSS px, for both orientations. Default: the device's own. */
  statusBarHeight?: number | undefined
  /** Safe-area inset from the screen's top edge, CSS px. */
  safeAreaTop?: number | undefined
  /** Safe-area inset from the screen's right edge, CSS px. */
  safeAreaRight?: number | undefined
  /** Safe-area inset from the screen's bottom edge, CSS px. */
  safeAreaBottom?: number | undefined
  /** Safe-area inset from the screen's left edge, CSS px. */
  safeAreaLeft?: number | undefined
  /**
   * `false` hides the drawn status bar, `true` (the default) shows it at 9:41,
   * `"live"` runs the host's real clock, and any other string is drawn as the
   * time literally.
   */
  statusBar?: boolean | 'live' | (string & {}) | undefined
  /**
   * Ink color of the status bar and home indicator. Default is black; it is
   * not inferred from the device, platform or background.
   */
  statusBarTextStyle?: StatusBarTextStyle | undefined
  /** Any CSS color to paint behind the status bar. Default transparent. */
  statusBarBackground?: string | undefined
  /** Height of the bar in the `navigation-bar` slot, CSS px. Default: the device's own. */
  navigationBarHeight?: number | undefined
  /** Height of the bar in the `tab-bar` slot, CSS px. Default 50. */
  tabBarHeight?: number | undefined
  /**
   * Fires on the element's `contentrectchange` event — the previewed page's
   * geometry moved or resized. Also fires once, synchronously after mount,
   * with the rect the frame started at — a host only listening for later
   * moves would otherwise never learn the starting geometry, since the
   * element's own first publish happens during commit, before this handler
   * is attached.
   */
  onContentRectChange?: ((event: CustomEvent<ContentRect>) => void) | undefined
  /** The previewed page, plus anything for the `navigation-bar`, `tab-bar` and `overlay` slots. */
  children?: React.ReactNode | undefined
}

/**
 * Builds a `<device-frame>` React component bound to `tag` — the package's
 * own tag by default, or a caller-chosen one for a host that already owns
 * `device-frame` for something else, or scopes every custom element behind
 * its own prefix. `defineDeviceFrame(tag)` registers a subclass for any tag
 * past the first (see define.ts), so two components built this way coexist
 * without the platform's one-constructor-one-name rule getting in the way.
 */
export function createDeviceFrameComponent(
  tag: string = DEVICE_FRAME_TAG,
): React.ForwardRefExoticComponent<DeviceFrameProps & React.RefAttributes<DeviceFrameElement>> {
  const Component = React.forwardRef<DeviceFrameElement, DeviceFrameProps>(function DeviceFrame(props, forwardedRef) {
    const {
      device,
      deviceProfile,
      os,
      orientation,
      embedded,
      immersive,
      cutout,
      width,
      height,
      pixelRatio,
      userAgent,
      statusBarHeight,
      safeAreaTop,
      safeAreaRight,
      safeAreaBottom,
      safeAreaLeft,
      statusBar,
      statusBarTextStyle,
      statusBarBackground,
      navigationBarHeight,
      tabBarHeight,
      onContentRectChange,
      children,
      className,
      ...rest
    } = props

    const innerRef = useRef<DeviceFrameElement | null>(null)
    useImperativeHandle(forwardedRef, () => innerRef.current as DeviceFrameElement, [])

    // A ref rather than a dependency, so re-renders that pass a new inline
    // handler don't tear down and re-attach the DOM listener every time.
    const contentRectHandlerRef = useRef(onContentRectChange)
    contentRectHandlerRef.current = onContentRectChange
    // Tracks which element the mount-time contentrectchange replay below has
    // already fired for, so StrictMode's setup/cleanup/setup on the same node
    // replays once rather than twice — see that effect.
    const replayedFor = useRef<DeviceFrameElement | null>(null)
    // The last rect actually handed to the caller's handler, kept independent
    // of `replayedFor`: Suspense can clean up this layout effect (tearing
    // down the wrapped listener) while leaving the same connected element in
    // place, and the element's geometry can change while nothing is
    // listening. `replayedFor` alone would then skip the replay on remount
    // because it still names this element — this ref is what tells the retry
    // apart from a StrictMode double-invoke on an unchanged rect.
    const lastDelivered = useRef<ContentRect | null>(null)

    // The import-time call above covers every browser host; this is the one for
    // a page hydrated from a server render, or the second-and-later component
    // built by createDeviceFrameComponent(), where that call was skipped. Also
    // where an unrelated element already squatting `tag` actually throws — see
    // the import-time try/catch above for why it is not thrown from there.
    useLayoutEffect(() => {
      defineDeviceFrame(tag)
    }, [])

    // `deviceProfile` has no attribute form (it carries a full object, not a
    // string) — it is only ever set as a property, and only once the node is
    // in the tree. `null` clears an override back to the `device` preset.
    useLayoutEffect(() => {
      if (innerRef.current) innerRef.current.deviceProfile = deviceProfile ?? null
    }, [deviceProfile])

    // Declared after the two effects above — effects run in declaration
    // order, and the initial replay dispatched below has to see the element
    // as fully upgraded and carrying its deviceProfile, not the state it was
    // in when connectedCallback ran during commit.
    useLayoutEffect(() => {
      const el = innerRef.current
      if (!el) return
      const listener = (event: CustomEvent<ContentRect>): void => {
        const handler = contentRectHandlerRef.current
        if (!handler) return
        lastDelivered.current = event.detail
        handler(event)
      }
      el.addEventListener(CONTENT_RECT_CHANGE_EVENT, listener)
      // The element already published its first contentrectchange from
      // connectedCallback, synchronously during this same commit — before this
      // effect, and so before any listener existed to hear it. Replay it now
      // so a host that only listens through this prop still learns the
      // frame's starting geometry, not just the moves after mount. Not a
      // duplicate for the *caller's* listener: a child's effects run before
      // its parent's, so a parent that attaches its own listener via `ref` in
      // its own effect has not registered one yet when this fires.
      //
      // Guarded per element identity plus rect, not identity alone: in
      // StrictMode this effect's setup runs, is torn down, and runs again on
      // the same commit against the same DOM node with the same rect, and a
      // second replay there would hand the host two initial events for one
      // connect. But Suspense can also tear this effect down (unhearing the
      // element) while keeping the same connected node mounted underneath,
      // hidden, where its geometry can move — the resuming setup sees a
      // familiar element with a stale `lastDelivered`, and that mismatch is
      // exactly what says a replay is owed. `replayedFor`/`lastDelivered`
      // survive the teardown (they are refs, not state); a real unmount
      // followed by a fresh mount gets a new node and always replays.
      if (replayedFor.current !== el || !sameContentRect(lastDelivered.current, el.contentRect)) {
        replayedFor.current = el
        el.dispatchEvent(new CustomEvent<ContentRect>(CONTENT_RECT_CHANGE_EVENT, { detail: el.contentRect }))
      }
      return () => el.removeEventListener(CONTENT_RECT_CHANGE_EVENT, listener)
    }, [])

    // A handler that arrives later — or is supplied for the first time —
    // than mount has missed both the connectedCallback publish (replayed
    // above, before it existed) and every geometry change while it was
    // absent (the listener above only records `lastDelivered` when a
    // handler is there to receive it). Catch it up here: a boolean
    // dependency, not the handler reference itself, so a caller passing a
    // fresh inline function every render doesn't retrigger this on each
    // commit — only a genuine present/absent transition does.
    const hasContentRectHandler = onContentRectChange !== undefined
    useLayoutEffect(() => {
      const el = innerRef.current
      if (!el || !hasContentRectHandler) return
      if (!sameContentRect(lastDelivered.current, el.contentRect)) {
        el.dispatchEvent(new CustomEvent<ContentRect>(CONTENT_RECT_CHANGE_EVENT, { detail: el.contentRect }))
      }
    }, [hasContentRectHandler])

    const attributes: Record<string, string | boolean> = {}
    const set = (name: string, value: string | number | undefined): void => {
      if (value !== undefined) attributes[name] = String(value)
    }

    // React does not translate `className` to the `class` attribute for a
    // hyphenated custom-element tag the way it does for built-ins — it has to
    // be mapped by hand or the class list never reaches the DOM node.
    set('class', className)
    set('device', device)
    set('os', os)
    set('orientation', orientation)
    set('cutout', cutout)
    set('width', width)
    set('height', height)
    set('pixel-ratio', pixelRatio)
    set('user-agent', userAgent)
    set('status-bar-height', statusBarHeight)
    set('safe-area-top', safeAreaTop)
    set('safe-area-right', safeAreaRight)
    set('safe-area-bottom', safeAreaBottom)
    set('safe-area-left', safeAreaLeft)
    set('status-bar-text-style', statusBarTextStyle)
    set('status-bar-background', statusBarBackground)
    set('navigation-bar-height', navigationBarHeight)
    set('tab-bar-height', tabBarHeight)
    // `false` and `undefined` mean "leave it off" either way. `true` rather
    // than the empty string because both paths have to agree: React 18 writes
    // the attribute `embedded="true"`, which the element reads as present, and
    // React 19 assigns the property, where `''` would be a falsy boolean and
    // switch the mode off.
    if (embedded) attributes.embedded = true
    if (immersive) attributes.immersive = true
    // `true` is the element's own default and says nothing; `false` hides the
    // bar; a string is the mode, which the element reads as "live" or a literal.
    if (statusBar === false) attributes['status-bar'] = 'hidden'
    else if (typeof statusBar === 'string') attributes['status-bar'] = statusBar

    return React.createElement(
      tag,
      { ...rest, ...attributes, ref: innerRef },
      children,
    )
  })

  Component.displayName = tag === DEVICE_FRAME_TAG ? 'DeviceFrame' : `DeviceFrame(${tag})`
  return Component
}

/**
 * `<device-frame>` as a React component. Maps props onto its attributes and
 * forwards a ref to the element itself — which is where `metrics` and
 * `contentRect` are read from. For a host that wants the element under its
 * own tag name, see {@link createDeviceFrameComponent}.
 */
export const DeviceFrame = createDeviceFrameComponent()

/**
 * What `<device-frame>` accepts when written as a JSX tag directly, rather than
 * through {@link DeviceFrame}: the element's attributes under their real
 * kebab-case names, since nothing maps them there.
 */
export interface DeviceFrameIntrinsicAttributes
  extends React.DetailedHTMLProps<React.HTMLAttributes<DeviceFrameElement>, DeviceFrameElement> {
  device?: string | undefined
  os?: DeviceOS | undefined
  orientation?: Orientation | undefined
  /**
   * Presence is the whole signal. `false` is not accepted on the raw tag: on
   * React 18 it would set the literal attribute `embedded="false"`, which the
   * element reads as present and would turn the mode **on**. Omit the prop
   * instead — or use {@link DeviceFrame}, which strips it.
   */
  embedded?: true | undefined
  /** Presence is the whole signal — see `embedded` for why `false` is not accepted. */
  immersive?: true | undefined
  cutout?: CutoutShape | 'none' | undefined
  width?: string | number | undefined
  height?: string | number | undefined
  'pixel-ratio'?: string | number | undefined
  'user-agent'?: string | undefined
  'status-bar-height'?: string | number | undefined
  'navigation-bar-height'?: string | number | undefined
  'tab-bar-height'?: string | number | undefined
  'safe-area-top'?: string | number | undefined
  'safe-area-right'?: string | number | undefined
  'safe-area-bottom'?: string | number | undefined
  'safe-area-left'?: string | number | undefined
  'status-bar'?: string | undefined
  'status-bar-text-style'?: StatusBarTextStyle | undefined
  'status-bar-background'?: string | undefined
}

declare global {
  // Augmenting the global JSX.IntrinsicElements map has no ES-module
  // equivalent syntax. This is the map React 18 and the classic runtime read.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      [DEVICE_FRAME_TAG]: DeviceFrameIntrinsicAttributes
    }
  }
}

// React 19 dropped the global JSX namespace and keeps its own inside the
// `react` module, so both maps have to carry the tag: whichever version the
// host installed, one of these is the one its JSX transform consults.
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      [DEVICE_FRAME_TAG]: DeviceFrameIntrinsicAttributes
    }
  }
}
