/**
 * The bar across the top of the simulated screen: time, cutout, signal/wifi/
 * battery glyphs.
 *
 * Split out of the element because it owns something the rest of the frame does
 * not — a running clock — and a timer that has to be stopped when the element
 * leaves the document is easier to get right when one object starts and stops
 * it.
 */
import { cutoutBorderRadius, cutoutLeft } from './cutout.js'
import { computeStatusBarLayout, type StatusBarLayout } from './status-bar-layout.js'
import type { Orientation, ResolvedDevice } from '@devicekit/devices'

/** The canonical Apple marketing time, and this element's default. */
const DEFAULT_STATUS_BAR_TIME = '9:41'
const LIVE_CLOCK_INTERVAL_MS = 60_000

/** What drawing the bar needs from the frame's resolved metrics. */
export interface StatusBarMetrics {
  device: ResolvedDevice
  orientation: Orientation
}

/** Everything {@link StatusBar.render} needs beyond the resolved metrics. */
export interface StatusBarRenderOptions {
  /** The frame's decision, not this bar's — see {@link StatusBar.render}. */
  visible: boolean
  /** The `status-bar` attribute: `"live"`, a literal string, or unset for 9:41. */
  mode: string | null
  /** The `status-bar-text-style` attribute. */
  textStyle: string | null
  /** The `status-bar-background` attribute, or null to stay transparent. */
  background: string | null
}

function currentClockText(now: Date): string {
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * `status-bar-text-style` mirrors 微信's `navigationBarTextStyle`: it is the one
 * switch for the whole body chrome's foreground, not just the time/icons — the
 * home indicator reads this too, so both stay in sync with a single attribute.
 */
export function statusBarTextColor(textStyle: string | null): string {
  return textStyle === 'white' ? '#ffffff' : '#000000'
}

export class StatusBar {
  readonly element: HTMLElement

  #timeEl: HTMLElement
  #cutoutEl: HTMLElement
  #clockTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'status-bar'
    this.element.setAttribute('aria-hidden', 'true')

    this.#timeEl = document.createElement('span')
    this.#timeEl.className = 'status-bar__time'

    this.#cutoutEl = document.createElement('div')
    this.#cutoutEl.className = 'status-bar__notch'

    const icons = document.createElement('div')
    icons.className = 'status-bar__icons'
    for (const glyph of ['signal', 'wifi', 'battery']) {
      const span = document.createElement('span')
      span.className = `status-bar__${glyph}`
      icons.append(span)
    }

    this.element.append(this.#timeEl, this.#cutoutEl, icons)
  }

  /**
   * `visible` is the frame's decision, not this bar's: iOS draws no status bar
   * in landscape, `status-bar="hidden"` switches it off, and embedded mode has
   * no phone chrome at all.
   *
   * `mode` is the `status-bar` attribute: `"live"` tracks the wall clock the way
   * a real phone does, any other value is shown verbatim, and the default is the
   * canonical 9:41 — a fixed time keeps screenshots and visual diffs stable.
   *
   * `background` colors the strip explicitly — for a host without a slotted
   * navigation bar to inherit a color from, or an app-level status bar tint
   * (Android's pre-15 `statusBarColor`). Unset stays transparent, which is the
   * bar's ordinary state: a real status bar has no paint of its own.
   */
  render(metrics: StatusBarMetrics, options: StatusBarRenderOptions): void {
    const { device, orientation } = metrics
    const { visible, mode, textStyle, background } = options
    this.element.hidden = !visible
    if (background) this.element.style.backgroundColor = background
    else this.element.style.removeProperty('background-color')

    // Ahead of the early return: the cutout and the layout variables have to
    // follow orientation even when the whole bar is gone, or they keep the
    // previous orientation's state on an element anyone can read.
    this.#renderCutout(device, orientation)
    const layout = computeStatusBarLayout(device, orientation)
    this.#renderLayout(layout)

    if (!visible) {
      this.stop()
      return
    }

    this.element.style.height = `${layout.height}px`
    this.element.style.color = statusBarTextColor(textStyle)

    if (mode === 'live') {
      this.#startClock()
      return
    }
    this.stop()
    this.#timeEl.textContent = mode ?? DEFAULT_STATUS_BAR_TIME
  }

  /**
   * Publishes the resolved layout as `data-layout` plus `--sb-*` custom
   * properties, so styles.ts can position the time and icon cluster without
   * knowing anything about devices — see status-bar-layout.ts for the rules.
   * `timeLeft`/`leadingIcons` clear rather than write `null`: the stylesheet's
   * `var(--sb-time-left, 50%)` fallback is what centers ios-classic's time.
   */
  #renderLayout(layout: StatusBarLayout): void {
    this.element.dataset.layout = layout.mode
    this.element.style.setProperty('--sb-trailing', `${layout.trailing}px`)
    this.element.style.setProperty('--sb-center-y', `${layout.centerY}px`)
    this.element.style.setProperty('--sb-scale', `${layout.scale}`)

    if (layout.timeLeft === null) this.element.style.removeProperty('--sb-time-left')
    else this.element.style.setProperty('--sb-time-left', `${layout.timeLeft}px`)

    if (layout.leadingIcons === null) this.element.style.removeProperty('--sb-leading-icons')
    else this.element.style.setProperty('--sb-leading-icons', `${layout.leadingIcons}px`)
  }

  /**
   * The cutout is portrait-only: rotated, it is a different shape in a different
   * place than the one this bar draws, while the screen it costs is reported
   * through the landscape insets all the same.
   */
  #renderCutout(device: ResolvedDevice, orientation: Orientation): void {
    const cutout = orientation === 'portrait' ? device.cutout : null
    this.#cutoutEl.hidden = cutout === null

    if (!cutout) {
      delete this.#cutoutEl.dataset.shape
      return
    }

    // The stylesheet keys shape-specific paint (the notch's outward-curving
    // ears) off this attribute; geometry alone can't tell a notch from a pill.
    this.#cutoutEl.dataset.shape = cutout.shape
    this.#cutoutEl.style.width = `${cutout.width}px`
    this.#cutoutEl.style.height = `${cutout.height}px`
    this.#cutoutEl.style.top = `${cutout.top}px`
    // Portrait only, so the device's own screen width is the current one.
    this.#cutoutEl.style.left = `${cutoutLeft(cutout, device.screen.width)}px`
    this.#cutoutEl.style.borderRadius = cutoutBorderRadius(cutout)
  }

  #startClock(): void {
    const tick = (): void => {
      this.#timeEl.textContent = currentClockText(new Date())
    }
    tick()
    if (this.#clockTimer !== null) return
    this.#clockTimer = setInterval(tick, LIVE_CLOCK_INTERVAL_MS)
  }

  /** Stops the clock. Called on every non-live render and when the frame leaves the document. */
  stop(): void {
    if (this.#clockTimer === null) return
    clearInterval(this.#clockTimer)
    this.#clockTimer = null
  }
}
