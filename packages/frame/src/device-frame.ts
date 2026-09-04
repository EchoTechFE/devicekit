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
  assertDeviceProfile,
  DEFAULT_DEVICE,
  findDevice,
  navigationBarHeightFor,
  resolveDevice,
  type DeviceProfile,
  type Orientation,
} from '@devicekit/devices'
import { profileFromAttributes, toOrientation, toPositiveNumber } from './attributes.js'
import { sameContentRect, toViewportRect, type ContentRect } from './content-rect.js'
import {
  CONTENT_RECT_OSCILLATION_MESSAGE,
  CONTENT_RECT_OSCILLATION_THRESHOLD,
  countPublishedRepeats,
} from './content-rect-oscillation.js'
import { CONTENT_RECT_CHANGE_EVENT, type DeviceFrameElementEventMap } from './element-events.js'
import { computeDeviceMetrics, DEFAULT_TAB_BAR_HEIGHT, type DeviceMetrics, type StatusBarTextStyle } from './metrics.js'
import { reflectAttribute, reflectFlag, reflectMetrics } from './reflect.js'
import { StatusBar, statusBarTextColor } from './status-bar.js'
import { adoptDeviceFrameStyles } from './styles.js'
import { upgradeProperties } from './upgrade-properties.js'

export { CONTENT_RECT_CHANGE_EVENT }
export type { DeviceFrameElementEventMap, DeviceMetrics, StatusBarTextStyle }

/**
 * `HTMLElement` is missing when this module is evaluated on a server, and a
 * class whose `extends` clause throws takes the whole entry point down with it
 * — including the pure geometry helpers a server render legitimately wants.
 * The stand-in is never instantiated: nothing constructs the element without a
 * custom-element registry, which Node has none of either.
 */
const HTMLElementBase = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement

/**
 * Identifies a class as this package's element, so {@link defineDeviceFrame} can
 * tell a duplicate of the same implementation — bundled twice, hot-reloaded —
 * from a foreign element squatting the tag. Exported (rather than module-private)
 * because define.ts, which registers the element, lives in its own file — see
 * that file for why the import runs the other way.
 */
export const DEVICE_FRAME_BRAND = Symbol.for('@devicekit/frame')

/**
 * The element `<device-frame>` registers to. Read the resolved numbers off
 * `metrics` and `contentRect`; everything else is driven by attributes, which
 * `observedAttributes` lists.
 */
export class DeviceFrameElement extends HTMLElementBase {
  /** Read by {@link defineDeviceFrame}; subclasses inherit it, which is the point. */
  static readonly [DEVICE_FRAME_BRAND] = true

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
   * A profile that is not in the shared table. Set as a property (no attribute
   * form) when a host carries its own device list; it wins over `device`.
   */
  get deviceProfile(): DeviceProfile | null {
    return this.#deviceProfile
  }

  set deviceProfile(profile: DeviceProfile | null) {
    // Validated before anything is assigned: this bypasses the shared device
    // table entirely, so a bad shape has no other gate before it reaches
    // layout math that reads `os` and `screen` unconditionally.
    if (profile !== null && profile !== undefined) assertDeviceProfile(profile)
    this.#deviceProfile = profile
    if (this.#ready) this.#render()
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
  // Guards `#publishContentRect` against the reentrant dispatch a listener triggers
  // by mutating an attribute in response to the event it just received (see that method).
  #publishingContentRect = false
  #contentRectPublishPending = false
  // Caps the oscillation breaker below to one console.error per episode.
  #oscillationReported = false
  // attributeChangedCallback can fire before connectedCallback; gates #render().
  #ready = false

  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })
    adoptDeviceFrameStyles(shadow)
    // The body (bezel, border, radius) lives inside the shadow tree: sizing rules on
    // :host lose to a light-DOM `* { box-sizing: border-box }` reset, which would shave the border off the screen's width.
    const body = document.createElement('div')
    body.className = 'body'
    body.append(this.#buildScreen())
    shadow.append(body)
    // Replays properties set before define() upgraded this instance (own
    // properties shadowing the setters) — here, not connectedCallback, since a
    // getter can run via attributeChangedCallback first. No-op when synchronous.
    upgradeProperties(this, ['device', 'deviceProfile', 'orientation', 'embedded', 'immersive'])
  }

  /** Renders and starts watching the host's box for moves the attributes miss. */
  connectedCallback(): void {
    this.#ready = true
    // Re-adopts styles: adoptNode() may have moved this to another Document.
    if (this.shadowRoot) adoptDeviceFrameStyles(this.shadowRoot)
    this.#render()
    // The content rect is in viewport coordinates, so it moves when the host resizes
    // or rescales the frame — neither goes through an attribute. Guarded because jsdom
    // has no ResizeObserver; there, the rect still updates on every attribute change.
    if (typeof ResizeObserver === 'undefined') return
    this.#resizeObserver ??= new ResizeObserver(() => this.#publishContentRect())
    this.#resizeObserver.observe(this)
  }

  /** Stops the status bar clock and the resize observer. */
  disconnectedCallback(): void {
    this.#statusBar?.stop()
    this.#resizeObserver?.disconnect()
  }

  /**
   * Any observed attribute changing re-renders from scratch; none is cached.
   * Ignored before connectedCallback — see `#ready`.
   */
  attributeChangedCallback(): void {
    if (this.#ready) this.#render()
  }

  /**
   * The preset this frame is showing, or null when no attribute names one — the
   * frame then falls back to loose `width` / `height` / `cutout` attributes,
   * which is how a host with a single hardcoded screen size uses this element.
   * Writing takes a preset's name and reflects it onto the `device` attribute,
   * while reading returns the resolved profile — see reflect.ts for why both.
   */
  get device(): DeviceProfile | null {
    return this.#deviceProfile ?? findDevice(this.getAttribute('device')) ?? null
  }

  set device(name: string | null | undefined) {
    reflectAttribute(this, 'device', name)
  }

  /**
   * Which way the device is held. Anything but `landscape` reads as portrait.
   * Writing reflects onto the attribute; reading returns the parsed value.
   */
  get orientation(): Orientation {
    return toOrientation(this.getAttribute('orientation'))
  }

  set orientation(value: string | null | undefined) {
    reflectAttribute(this, 'orientation', value)
  }

  /**
   * The frame draws no body, no bezel and no chrome, and stretches to fill its
   * container instead of standing at the device's own size — a bare screen for
   * a host that supplies its own surround. Writing reflects onto the presence
   * attribute.
   */
  get embedded(): boolean {
    return this.hasAttribute('embedded')
  }

  set embedded(value: boolean | null | undefined) {
    reflectFlag(this, 'embedded', value)
  }

  /**
   * The page draws behind the bars instead of below them. The bars stay on
   * screen — the page is expected to keep clear of them itself, using the
   * heights the frame reports. Writing reflects onto the presence attribute.
   */
  get immersive(): boolean {
    return this.hasAttribute('immersive')
  }

  set immersive(value: boolean | null | undefined) {
    reflectFlag(this, 'immersive', value)
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
    return computeDeviceMetrics(
      this.profile,
      this.orientation,
      this.embedded,
      this.immersive,
      this.#navigationBarHeight(),
      this.#tabBarHeight(),
    )
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
    return toViewportRect(content, screen.width, screen.height, box)
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

    // `.screen` is a flex column and every bar on it is absolutely positioned,
    // so a bare slot would start at y=0, under the status and navigation bars.
    // The wrapper is what puts slotted content in the box `metrics.content`
    // reports — the CSS behind it is in styles.ts.
    const content = document.createElement('div')
    content.className = 'content'
    content.append(document.createElement('slot'))

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
    reflectMetrics(this.style, metrics, this.embedded)

    const statusBarMode = this.getAttribute('status-bar')
    const showStatusBar = !this.embedded && statusBarMode !== 'hidden' && metrics.statusBarHeight > 0
    // The live clock is a real timer this element solely owns, so it runs only
    // while the element is in the document — off-screen it draws a fixed time.
    const mode = statusBarMode === 'live' && !this.isConnected ? null : statusBarMode
    // Same resolveDevice() the metrics getter already ran — status-bar-layout.ts
    // needs the full resolved shape (os, pixelRatio, both orientations' status
    // bar heights), which the flattened DeviceMetrics doesn't carry.
    this.#statusBar.render({ device: resolveDevice(this.profile), orientation: metrics.orientation }, {
      visible: showStatusBar,
      mode,
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

  addEventListener<K extends keyof DeviceFrameElementEventMap>(
    type: K,
    listener: (this: DeviceFrameElement, ev: DeviceFrameElementEventMap[K]) => unknown,
    options?: boolean | AddEventListenerOptions,
  ): void
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void
  /** Typed so a `contentrectchange` listener reads `detail` without casting past `Event`. */
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    super.addEventListener(type, listener, options)
  }

  removeEventListener<K extends keyof DeviceFrameElementEventMap>(
    type: K,
    listener: (this: DeviceFrameElement, ev: DeviceFrameElementEventMap[K]) => unknown,
    options?: boolean | EventListenerOptions,
  ): void
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
    super.removeEventListener(type, listener, options)
  }

  /**
   * Re-measures the screen and fires `contentrectchange` if the region moved.
   *
   * The resize observer covers everything that changes the host's own box, but
   * a CSS `transform: scale()` on the frame or an ancestor changes no box at
   * all while moving the viewport rect a native view is positioned against, and
   * so does scrolling an ancestor. A host that does either calls this; the
   * "only fire on an actual change" contract is the same one attribute-driven
   * re-renders already keep. A no-op while disconnected — see `#publishContentRect`.
   */
  refreshContentRect(): void {
    this.#publishContentRect()
  }

  /**
   * Announces the content region, but only when it actually moved. A host that
   * repositions a native view on this event would otherwise do it on every
   * clock tick and every status-bar restyle.
   *
   * A `contentrectchange` listener is free to mutate an attribute in
   * response — flipping `immersive` back off is the common case — which
   * re-renders synchronously and calls back in here from inside `dispatchEvent`.
   * Letting that nested call dispatch its own event would run every listener
   * to completion (including ones registered after the reentrant one) before
   * the outer dispatch resumes, so a later listener would see the newer state
   * first and the outer call's now-stale rect second. Instead a reentrant call
   * just records that another rect is pending and returns; the outer call
   * loops, so every listener is notified in the order the states actually
   * occurred, and the loop only stops once a pass computes a rect that turns
   * out to already be the last one published.
   *
   * That loop has no exit of its own for a listener pair that keeps mutating
   * attributes forever, cycling the rect through a handful of shapes without
   * settling — see content-rect-oscillation.ts for the breaker that stops it
   * and leaves `#lastContentRect` on the last dispatched rect, so
   * `refreshContentRect()` can resync. `#oscillationReported` caps it to one
   * console.error per episode, resetting when a batch ends without tripping it.
   *
   * Disconnected, `getBoundingClientRect()` reports all zeroes — nothing worth
   * announcing — and `#lastContentRect` stays untouched, so the real rect
   * computed on (re)connect is never mistaken for a repeat of that zero one.
   */
  #publishContentRect(): void {
    if (!this.#ready || !this.isConnected) return
    if (this.#publishingContentRect) {
      this.#contentRectPublishPending = true
      return
    }
    this.#publishingContentRect = true
    try {
      const published: ContentRect[] = []
      let oscillated = false
      do {
        this.#contentRectPublishPending = false
        const rect = this.contentRect
        if (sameContentRect(this.#lastContentRect, rect)) break
        if (countPublishedRepeats(published, rect) >= CONTENT_RECT_OSCILLATION_THRESHOLD) {
          oscillated = true
          if (!this.#oscillationReported) console.error(CONTENT_RECT_OSCILLATION_MESSAGE)
          this.#oscillationReported = true
          break
        }
        published.push(rect)
        this.#lastContentRect = rect
        this.dispatchEvent(new CustomEvent<ContentRect>(CONTENT_RECT_CHANGE_EVENT, { detail: rect }))
      } while (this.#contentRectPublishPending)
      if (!oscillated) this.#oscillationReported = false
    } finally {
      this.#publishingContentRect = false
    }
  }
}

// DEVICE_FRAME_TAG and defineDeviceFrame() live in define.ts, a separate
// module kept under the 500-line file-length limit; re-exported here because
// most of this package's own tests, and downstream imports scattered before
// that split, reach for them via './device-frame.js'.
export { DEVICE_FRAME_TAG, defineDeviceFrame } from './define.js'
