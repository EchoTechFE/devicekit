/**
 * `<device-frame>` — the phone a preview pretends to be.
 *
 * It draws the body, the screen, the status bar (time, glyphs, cutout) and the
 * home indicator at the device's own size, and nothing else. Whatever is being
 * previewed rides in the default slot: a mini-app's own frame, an `<iframe>`, a
 * bare `<div>`. The element never reaches into that content.
 *
 * A host that draws its own bars — a mini-program's title bar and tab bar, an
 * in-app browser's back bar — puts them in the `navigation-bar` and `tab-bar`
 * slots. The frame reserves the right height for each and takes it out of the
 * reported window size, so the previewed page is handed the same room it would
 * get on the device. `immersive` is the other arrangement: the bars stay on
 * screen, but the page runs full height behind them and keeps clear of them
 * itself, which is `navigationStyle: "custom"` and the in-app H5 that draws its
 * own title bar.
 *
 * What cannot ride in a slot — an Electron `WebContentsView` is not a DOM node
 * — is positioned by the host instead, from `contentRect` and the
 * `contentrectchange` event. The frame publishes the geometry and stops there;
 * it owns no iframe and no view of its own.
 *
 * A custom element rather than a framework component because the hosts that
 * need it do not share a framework: a React panel in a desktop app, a plain
 * web page, a documentation site whose preview stages are pure CSS.
 *
 * The chrome lives in the shadow root; slotted content stays in the light DOM,
 * so the host's own stylesheets keep reaching it. The resolved metrics are
 * reflected onto the host as CSS custom properties, which is how slotted
 * content lays itself out against the same numbers the frame drew.
 */
import {
  DEFAULT_DEVICE,
  findDevice,
  navigationBarHeightFor,
  orientedScreen,
  resolveDevice,
  resolveSafeArea,
  resolveWindowSize,
  safeAreaInsetsFor,
  statusBarHeightFor,
  type CutoutSpec,
  type DeviceProfile,
  type DeviceShell,
  type EdgeInsets,
  type Orientation,
  type SafeAreaRect,
  type ScreenSize,
} from '@devicekit/devices'
import { profileFromAttributes, toOrientation, toPositiveNumber } from './attributes.js'
import { EMPTY_BOX, sameContentRect, toViewportRect, type ContentBox, type ContentRect } from './content-rect.js'
import { StatusBar, statusBarTextColor } from './status-bar.js'
import { DEVICE_FRAME_STYLES } from './styles.js'

/**
 * What a slotted tab bar costs when the host does not say how tall its own is.
 *
 * Unlike the status bar and the navigation bar, this is **not** device data: no
 * device table states a tab bar height, because a tab bar is the app's chrome
 * rather than the phone's. This is the height mini-program tab bars conventionally
 * use; a host whose bar is a different height sets `tab-bar-height`.
 */
const DEFAULT_TAB_BAR_HEIGHT = 50

const EMPTY_RECT: SafeAreaRect = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }
const EMPTY_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 }
const EMPTY_SIZE: ScreenSize = { width: 0, height: 0 }

/** Fired when {@link DeviceFrameElement.contentRect} moves or resizes. */
export const CONTENT_RECT_CHANGE_EVENT = 'contentrectchange'

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
 * The element `<device-frame>` registers to. Read the resolved numbers off
 * `metrics` and `contentRect`; everything else is driven by attributes, which
 * `observedAttributes` lists.
 */
export class DeviceFrameElement extends HTMLElement {
  /** Every attribute the frame draws from; changing any of them re-renders it. */
  static get observedAttributes(): string[] {
    return [
      'device',
      'os',
      'orientation',
      'embedded',
      'immersive',
      'width',
      'height',
      'pixel-ratio',
      'user-agent',
      'cutout',
      'status-bar-height',
      'navigation-bar-height',
      'tab-bar-height',
      'safe-area-top',
      'safe-area-right',
      'safe-area-bottom',
      'safe-area-left',
      'status-bar',
      'status-bar-text-style',
      'status-bar-background',
    ]
  }

  /**
   * A profile that is not in the shared table. Set as a property (there is no
   * attribute form) when a host carries its own device list; it wins over the
   * `device` attribute.
   */
  get deviceProfile(): DeviceProfile | null {
    return this.#deviceProfile
  }

  set deviceProfile(profile: DeviceProfile | null) {
    this.#deviceProfile = profile
    this.#render()
  }

  #deviceProfile: DeviceProfile | null = null
  #statusBar: StatusBar | null = null
  #homeIndicatorEl: HTMLElement | null = null
  #navigationBarEl: HTMLElement | null = null
  #navigationBarSlot: HTMLSlotElement | null = null
  #tabBarEl: HTMLElement | null = null
  #tabBarSlot: HTMLSlotElement | null = null
  #screenEl: HTMLElement | null = null
  #lastContentRect: ContentRect | null = null
  #resizeObserver: ResizeObserver | null = null

  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = DEVICE_FRAME_STYLES
    // The body (bezel, border, radius) lives inside the shadow tree on purpose:
    // sizing rules on :host lose to any light-DOM `* { box-sizing: border-box }`
    // reset, which would shave the border off the screen's width.
    const body = document.createElement('div')
    body.className = 'body'
    body.append(this.#buildScreen())
    shadow.append(style, body)
  }

  /** Renders and starts watching the host's box for moves the attributes miss. */
  connectedCallback(): void {
    this.#render()
    // The content rect is in viewport coordinates, so it moves when the host
    // resizes or rescales the frame — neither of which goes through an
    // attribute. Guarded because jsdom has no ResizeObserver; there, the rect
    // still updates on every attribute change, which is all a test can observe.
    if (typeof ResizeObserver === 'undefined') return
    this.#resizeObserver ??= new ResizeObserver(() => this.#publishContentRect())
    this.#resizeObserver.observe(this)
  }

  /** Stops the status bar clock and the resize observer. */
  disconnectedCallback(): void {
    this.#statusBar?.stop()
    this.#resizeObserver?.disconnect()
  }

  /** Any observed attribute changing re-renders from scratch; none is cached. */
  attributeChangedCallback(): void {
    this.#render()
  }

  /**
   * The preset this frame is showing, or null when no attribute names one — the
   * frame then falls back to loose `width` / `height` / `cutout` attributes,
   * which is how a host with a single hardcoded screen size uses this element.
   */
  get device(): DeviceProfile | null {
    return this.#deviceProfile ?? findDevice(this.getAttribute('device')) ?? null
  }

  /** Which way the device is held. Anything but `landscape` reads as portrait. */
  get orientation(): Orientation {
    return toOrientation(this.getAttribute('orientation'))
  }

  /**
   * The frame draws no body, no bezel and no chrome, and stretches to fill its
   * container instead of standing at the device's own size — a bare screen for
   * a host that supplies its own surround.
   */
  get embedded(): boolean {
    return this.hasAttribute('embedded')
  }

  /**
   * The page draws behind the bars instead of below them. The bars stay on
   * screen — the page is expected to keep clear of them itself, using the
   * heights the frame reports.
   */
  get immersive(): boolean {
    return this.hasAttribute('immersive')
  }

  /**
   * The preset with the loose attributes (`width`, `pixel-ratio`, `cutout`,
   * `safe-area-*` …) folded over it — the profile the frame actually drew.
   */
  get profile(): DeviceProfile {
    return profileFromAttributes(this, this.device, DEFAULT_DEVICE.screen)
  }

  /**
   * The metrics the frame drew with. Embedded mode reports zeroes: it is a
   * plain screen with no phone chrome, so there is no status bar to sit under
   * and no home indicator to avoid.
   */
  get metrics(): DeviceMetrics {
    const orientation = this.orientation
    const profile = this.profile
    const resolved = resolveDevice(profile)

    if (this.embedded) {
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
    const navigationBarHeight = this.#navigationBarHeight()
    const tabBarHeight = this.#tabBarHeight()

    // Immersive is the mini-program's `navigationStyle: "custom"` and the
    // in-app H5 that draws its own title bar: the bars are still on screen, but
    // the page runs the full height behind them and pads itself using the
    // heights reported here.
    const window = this.immersive
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
        y: this.immersive ? 0 : statusBarHeight + navigationBarHeight,
        width: window.width,
        height: window.height,
      },
      cutout: resolved.cutout,
      shell: resolved.shell,
    }
  }

  /**
   * The content region in viewport coordinates, for a host placing a view that
   * is not in the DOM. Everything in-DOM should use the default slot instead,
   * which the frame has already laid out.
   */
  get contentRect(): ContentRect {
    const { content, screen } = this.metrics
    // The screen, not the host: content coordinates start at the screen's
    // top-left, and the host box also contains the bezel around it.
    const box = (this.#screenEl ?? this).getBoundingClientRect()
    return toViewportRect(content, screen.width, box)
  }

  /**
   * The navigation bar costs nothing until something is slotted into it: a host
   * that draws no bar of its own should not have its page shortened by one.
   */
  #navigationBarHeight(): number {
    const assigned = this.#navigationBarSlot?.assignedNodes({ flatten: true }) ?? []
    if (assigned.length === 0) return 0
    const override = toPositiveNumber(this.getAttribute('navigation-bar-height'))
    if (override !== undefined) return override
    return navigationBarHeightFor(resolveDevice(this.profile), this.orientation)
  }

  /**
   * Same rule as the navigation bar: nothing slotted, nothing reserved. The
   * fallback is a convention rather than a device measurement, which is why the
   * attribute exists.
   *
   * A slotted bar of height zero would be drawn over the page rather than above
   * it, so zero falls back too: that arrangement is `immersive`, and a host that
   * wants no tab bar slots nothing.
   */
  #tabBarHeight(): number {
    const assigned = this.#tabBarSlot?.assignedNodes({ flatten: true }) ?? []
    if (assigned.length === 0) return 0
    const override = toPositiveNumber(this.getAttribute('tab-bar-height'))
    return override !== undefined && override > 0 ? override : DEFAULT_TAB_BAR_HEIGHT
  }

  #buildScreen(): HTMLElement {
    const screen = document.createElement('div')
    screen.className = 'screen'

    const content = document.createElement('slot')

    this.#homeIndicatorEl = document.createElement('div')
    this.#homeIndicatorEl.className = 'home-indicator'
    this.#homeIndicatorEl.setAttribute('aria-hidden', 'true')

    this.#statusBar = new StatusBar()
    this.#navigationBarEl = this.#buildSlottedBar('navigation-bar')
    this.#navigationBarSlot = this.#navigationBarEl.firstElementChild as HTMLSlotElement
    this.#tabBarEl = this.#buildSlottedBar('tab-bar')
    this.#tabBarSlot = this.#tabBarEl.firstElementChild as HTMLSlotElement

    const overlay = document.createElement('div')
    overlay.className = 'overlay'
    const overlaySlot = document.createElement('slot')
    overlaySlot.name = 'overlay'
    overlay.append(overlaySlot)

    screen.append(
      content,
      this.#homeIndicatorEl,
      this.#tabBarEl,
      this.#navigationBarEl,
      this.#statusBar.element,
      overlay,
    )
    this.#screenEl = screen
    return screen
  }

  /**
   * A bar the host fills: the navigation bar under the status bar, the tab bar
   * at the foot. Both take pointer events — what a host slots in is a real bar
   * with real buttons — and both cost the page nothing until something is in
   * them, so the frame re-measures whenever the slot's contents change.
   */
  #buildSlottedBar(name: string): HTMLElement {
    const bar = document.createElement('div')
    bar.className = name

    const slot = document.createElement('slot')
    slot.name = name
    slot.addEventListener('slotchange', () => this.#render())

    bar.append(slot)
    return bar
  }

  /**
   * iOS draws no status bar in landscape, which its landscape height of 0 says;
   * platforms that keep theirs get one either way.
   */
  #render(): void {
    if (!this.#statusBar || !this.#homeIndicatorEl) return

    const metrics = this.metrics
    this.#reflectMetrics(metrics)

    const statusBarMode = this.getAttribute('status-bar')
    const showStatusBar = !this.embedded && statusBarMode !== 'hidden' && metrics.statusBarHeight > 0
    // Same resolveDevice() the metrics getter already ran — status-bar-layout.ts
    // needs the full resolved shape (os, pixelRatio, both orientations' status
    // bar heights), which the flattened DeviceMetrics doesn't carry.
    this.#statusBar.render({ device: resolveDevice(this.profile), orientation: metrics.orientation }, {
      visible: showStatusBar,
      mode: statusBarMode,
      textStyle: this.getAttribute('status-bar-text-style'),
      background: this.getAttribute('status-bar-background'),
    })

    // Unconditional, not gated on showStatusBar: iOS landscape hides the status
    // bar but the home indicator still has to track status-bar-text-style.
    this.#homeIndicatorEl.style.color = statusBarTextColor(this.getAttribute('status-bar-text-style'))
    this.#homeIndicatorEl.hidden = this.embedded || metrics.safeAreaInsets.bottom <= 0
    if (this.#navigationBarEl) this.#navigationBarEl.hidden = metrics.navigationBarHeight <= 0
    if (this.#tabBarEl) this.#tabBarEl.hidden = metrics.tabBarHeight <= 0
    this.#publishContentRect()
  }

  /**
   * Announces the content region, but only when it actually moved. A host that
   * repositions a native view on this event would otherwise do it on every
   * clock tick and every status-bar restyle.
   */
  #publishContentRect(): void {
    const rect = this.contentRect
    if (sameContentRect(this.#lastContentRect, rect)) return
    this.#lastContentRect = rect
    this.dispatchEvent(new CustomEvent<ContentRect>(CONTENT_RECT_CHANGE_EVENT, { detail: rect }))
  }

  /**
   * Publishes the resolved metrics as custom properties on the host, so slotted
   * content sizes itself against exactly what the frame drew instead of being
   * told the same numbers a second time through another channel.
   *
   * The safe area is published as insets, matching what `env(safe-area-inset-*)`
   * would report, rather than as the rectangle's own coordinates.
   */
  #reflectMetrics(metrics: DeviceMetrics): void {
    const { style } = this
    if (this.embedded) {
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
}

/** The tag name defineDeviceFrame() registers unless given another. */
export const DEVICE_FRAME_TAG = 'device-frame'

/**
 * Registers the element. Safe to call more than once — a host that bundles this
 * package twice, or hot-reloads, must not crash on the duplicate definition.
 *
 * @param tag the custom element name, for a host that already owns
 *   `device-frame` or wants the element under its own prefix
 */
export function defineDeviceFrame(tag: string = DEVICE_FRAME_TAG): void {
  if (customElements.get(tag)) return
  customElements.define(tag, DeviceFrameElement)
}
