import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'
import { DEVICE_FRAME_STYLES } from './styles.js'

defineDeviceFrame()

function mountFrame(attributes: Record<string, string> = {}): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
  document.body.append(el)
  return el
}

function shadowEl(el: DeviceFrameElement, selector: string): HTMLElement {
  return el.shadowRoot!.querySelector<HTMLElement>(selector)!
}

const statusBar = (el: DeviceFrameElement): HTMLElement => shadowEl(el, '.status-bar')
const homeIndicator = (el: DeviceFrameElement): HTMLElement => shadowEl(el, '.home-indicator')
const cutoutEl = (el: DeviceFrameElement): HTMLElement => shadowEl(el, '.status-bar__notch')
const navigationBarEl = (el: DeviceFrameElement): HTMLElement => shadowEl(el, '.navigation-bar')

afterEach(() => {
  document.body.innerHTML = ''
})

describe('resolving which phone to draw', () => {
  it('takes size, status bar height and safe area from the named preset (iPhone X)', () => {
    const el = mountFrame({ device: 'iPhone X' })
    expect(el.metrics.screen).toEqual({ width: 375, height: 812 })
    expect(el.metrics.statusBarHeight).toBe(44)
    expect(el.metrics.cutout?.shape).toBe('notch')
    expect(el.metrics.safeArea).toMatchObject({ top: 44, bottom: 778 })
  })

  it('accepts loose dimensions with no preset, which is how a host with one hardcoded screen uses it', () => {
    const el = mountFrame({ width: '375', height: '812', cutout: 'none' })
    expect(el.device).toBeNull()
    expect(el.metrics.screen).toEqual({ width: 375, height: 812 })
    expect(el.metrics.cutout).toBeNull()
  })

  it('lets explicit attributes override the preset they sit next to', () => {
    const el = mountFrame({ device: 'iPhone X', width: '414', 'safe-area-bottom': '0' })
    expect(el.metrics.screen.width).toBe(414)
    expect(el.metrics.safeArea.bottom).toBe(812)
    // Untouched fields still come from the preset.
    expect(el.metrics.screen.height).toBe(812)
  })

  it('ignores an unknown preset name and a malformed dimension rather than drawing nothing', () => {
    const el = mountFrame({ device: 'Nokia 3310', width: 'wide', height: '-5' })
    expect(el.device).toBeNull()
    expect(Number.isNaN(el.metrics.screen.width)).toBe(false)
    expect(Number.isNaN(el.metrics.screen.height)).toBe(false)
  })

  it('prefers a host-supplied profile over the named preset', () => {
    const el = mountFrame({ device: 'iPhone X' })
    el.deviceProfile = {
      name: 'Pixel 9',
      os: 'android',
      screen: { width: 412, height: 915 },
      pixelRatio: 3,
      safeAreaInsets: { bottom: 24 },
    }
    expect(el.metrics.screen).toEqual({ width: 412, height: 915 })
    // android has no statusBarHeight of its own here, so it falls to the
    // Android platform default (24), which also happens to match the inset
    // supplied above — the assertion below is about statusBarHeight only.
    expect(el.metrics.statusBarHeight).toBe(24)
  })
})

describe('CSS custom properties reflect the resolved metrics', () => {
  it('publishes screen size, DPR and safe-area insets for slotted content to lay out against', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    expect(el.style.getPropertyValue('--device-width')).toBe('393px')
    expect(el.style.getPropertyValue('--device-height')).toBe('852px')
    expect(el.style.getPropertyValue('--device-pixel-ratio')).toBe('3')
    expect(el.style.getPropertyValue('--device-safe-area-top')).toBe('59px')
    expect(el.style.getPropertyValue('--device-safe-area-bottom')).toBe('34px')
  })

  it('publishes the safe area as insets, the way env(safe-area-inset-*) reports it', () => {
    const el = mountFrame({ device: 'iPhone X', orientation: 'landscape' })
    expect(el.style.getPropertyValue('--device-safe-area-left')).toBe('44px')
    expect(el.style.getPropertyValue('--device-safe-area-right')).toBe('44px')
    expect(el.style.getPropertyValue('--device-safe-area-top')).toBe('0px')
    expect(el.style.getPropertyValue('--device-safe-area-bottom')).toBe('21px')
  })

  it('redraws when the selected device changes', () => {
    const el = mountFrame({ device: 'iPhone SE' })
    expect(homeIndicator(el).hidden).toBe(true)
    el.setAttribute('device', 'iPhone 16 Pro')
    expect(el.metrics.screen.width).toBe(402)
    expect(homeIndicator(el).hidden).toBe(false)
    expect(el.style.getPropertyValue('--device-safe-area-top')).toBe('62px')
  })
})

describe('embedded mode', () => {
  it('drops all phone chrome and reports zero insets', () => {
    const el = mountFrame({ device: 'iPhone X', embedded: '' })
    expect(el.metrics.safeArea).toEqual({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 })
    expect(el.metrics.statusBarHeight).toBe(0)
    expect(statusBar(el).hidden).toBe(true)
    expect(homeIndicator(el).hidden).toBe(true)
  })

  it('removes the device size variables so the container drives sizing instead', () => {
    const el = mountFrame({ device: 'iPhone X', embedded: '' })
    expect(el.style.getPropertyValue('--device-width')).toBe('')
    expect(el.style.getPropertyValue('--device-height')).toBe('')
  })
})

describe('the navigation-bar slot', () => {
  it('costs nothing when empty: zero height, and the window keeps the full screen minus only the status bar', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    expect(el.metrics.navigationBarHeight).toBe(0)
    expect(navigationBarEl(el).hidden).toBe(true)
    expect(el.style.getPropertyValue('--device-navigation-bar-height')).toBe('0px')
    // 852 screen height - 54 status bar - 0 navigation bar.
    expect(el.metrics.window.height).toBe(852 - 54)
    expect(el.style.getPropertyValue('--device-window-height')).toBe(`${852 - 54}px`)
  })

  // slotchange fires on a microtask, the same as it does in a real browser —
  // the element only redraws its DOM once that event reaches it, even though
  // el.metrics (a plain getter) already sees the assigned node synchronously.
  it('takes the device navigation bar height once something is slotted into it, and shrinks the window by it', async () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    const bar = document.createElement('div')
    bar.slot = 'navigation-bar'
    el.append(bar)
    await Promise.resolve()

    // iOS portrait navigation bar is 44 on every iPhone.
    expect(el.metrics.navigationBarHeight).toBe(44)
    expect(navigationBarEl(el).hidden).toBe(false)
    expect(el.style.getPropertyValue('--device-navigation-bar-height')).toBe('44px')
    expect(el.metrics.window.height).toBe(852 - 54 - 44)
  })

  it('an explicit navigation-bar-height attribute overrides the slotted-content height', async () => {
    const el = mountFrame({ device: 'iPhone 14 Pro', 'navigation-bar-height': '20' })
    const bar = document.createElement('div')
    bar.slot = 'navigation-bar'
    el.append(bar)
    await Promise.resolve()

    expect(el.metrics.navigationBarHeight).toBe(20)
    expect(el.metrics.window.height).toBe(852 - 54 - 20)
  })
})

describe('the cutout draws only in portrait', () => {
  it('shows the cutout in portrait, wired to the resolved metrics', () => {
    const el = mountFrame({ device: 'iPhone X' })
    expect(cutoutEl(el).hidden).toBe(false)
    expect(cutoutEl(el).style.width).toBe(`${el.metrics.cutout!.width}px`)
    expect(cutoutEl(el).style.height).toBe(`${el.metrics.cutout!.height}px`)
  })

  // Android keeps its status bar visible in landscape, so this reaches the
  // portrait-only check with the bar still on screen.
  it('hides the cutout in landscape even though the device has one, and the status bar stays up', () => {
    const el = mountFrame({ device: 'Pixel 9 Pro', orientation: 'landscape' })
    expect(el.metrics.cutout).not.toBeNull()
    expect(statusBar(el).hidden).toBe(false)
    expect(cutoutEl(el).hidden).toBe(true)
  })

  // iOS drops the whole bar in landscape. The cutout still has to report itself
  // hidden: anything reading the element directly gets its own state, not the
  // ancestor's.
  it('hides the cutout in landscape on iOS, where the whole status bar is gone', () => {
    const el = mountFrame({ device: 'iPhone X', orientation: 'landscape' })
    expect(el.metrics.cutout).not.toBeNull()
    expect(statusBar(el).hidden).toBe(true)
    expect(cutoutEl(el).hidden).toBe(true)
  })

  it('hides the cutout again after rotating from portrait to landscape', () => {
    const el = mountFrame({ device: 'iPhone X' })
    expect(cutoutEl(el).hidden).toBe(false)
    el.setAttribute('orientation', 'landscape')
    expect(cutoutEl(el).hidden).toBe(true)
  })

  it('draws no cutout at all on a device without one', () => {
    expect(cutoutEl(mountFrame({ device: 'iPhone SE' })).hidden).toBe(true)
  })

  /*
   * Where the cutout sits across the screen is written inline, so the
   * stylesheet must not place it as well: an inline `left` outranks the sheet's,
   * but a `transform` there still slides the box off that spot — far enough to
   * hang the notch over the edge of the screen. jsdom lays nothing out, so the
   * shift is invisible to every other test here; asserted against the
   * stylesheet text instead.
   */
  it('leaves the cutout where its inline left puts it', () => {
    const rule = DEVICE_FRAME_STYLES.split('.status-bar__notch {')[1]?.split('}')[0] ?? ''
    expect(rule).not.toMatch(/\bleft\s*:/)
    expect(rule).not.toMatch(/\btransform\s*:/)
  })
})

/*
 * Asserted against the stylesheet text because jsdom resolves no cascade: the
 * bug this guards is a cascade result, an author `display` on .status-bar
 * beating the UA sheet's `[hidden] { display: none }` so `hidden` draws anyway.
 * Every element the frame hides needs either its own hidden rule or no author
 * `display` at all.
 */
describe('hiding an element the stylesheet gave a display to', () => {
  it('.status-bar has a hidden rule of its own', () => {
    expect(DEVICE_FRAME_STYLES).toContain('.status-bar[hidden]')
  })

  it('no other hideable element declares a display that would need one', () => {
    for (const selector of ['.home-indicator', '.navigation-bar', '.status-bar__notch']) {
      const rule = DEVICE_FRAME_STYLES.split(selector)[1]?.split('}')[0] ?? ''
      expect(rule).not.toMatch(/\bdisplay\s*:/)
    }
  })
})

// The home indicator's bar is drawn with .home-indicator::before, so it can only follow the
// inline color the element sets if the stylesheet paints it with currentColor rather than a
// hardcoded shade.
describe('the home indicator bar is paintable in either foreground color', () => {
  it('draws .home-indicator::before with currentColor, not a fixed shade', () => {
    const rule = DEVICE_FRAME_STYLES.split('.home-indicator::before')[1]?.split('}')[0] ?? ''
    expect(rule).toMatch(/background\s*:\s*currentColor/)
  })

  it('leaves no hardcoded dark shade anywhere in the stylesheet for it to fall back to', () => {
    expect(DEVICE_FRAME_STYLES).not.toContain('#111827')
  })
})

describe('the home indicator', () => {
  it('shows only on devices whose safe area reports a bottom inset', () => {
    // iPhone X: portrait bottom inset 34 (gesture bar). iPhone SE: 0 (home button).
    expect(homeIndicator(mountFrame({ device: 'iPhone X' })).hidden).toBe(false)
    expect(homeIndicator(mountFrame({ device: 'iPhone SE' })).hidden).toBe(true)
  })

  it('keeps showing in landscape, since the gesture bar does not rotate away', () => {
    expect(homeIndicator(mountFrame({ device: 'iPhone X', orientation: 'landscape' })).hidden).toBe(false)
  })
})

describe('landscape', () => {
  it('swaps the screen and hides the status bar, which iOS itself does', () => {
    const el = mountFrame({ device: 'iPhone X', orientation: 'landscape' })
    expect(el.metrics.screen).toEqual({ width: 812, height: 375 })
    expect(el.style.getPropertyValue('--device-width')).toBe('812px')
    expect(statusBar(el).hidden).toBe(true)
  })

  it('goes back to portrait chrome when rotated back', () => {
    const el = mountFrame({ device: 'iPhone X', orientation: 'landscape' })
    el.setAttribute('orientation', 'portrait')
    expect(statusBar(el).hidden).toBe(false)
    expect(el.metrics.screen).toEqual({ width: 375, height: 812 })
  })
})

describe('status bar foreground follows the requested text style', () => {
  it('defaults to black and switches to white on request', () => {
    expect(statusBar(mountFrame({ device: 'iPhone X' })).style.color).toBe('rgb(0, 0, 0)')
    expect(statusBar(mountFrame({ device: 'iPhone X', 'status-bar-text-style': 'white' })).style.color).toBe('rgb(255, 255, 255)')
  })
})

// status-bar-text-style is the single switch for the whole chrome foreground (it maps to
// navigationBarTextStyle), so the home indicator has to track it the same way the status
// bar's own text does — a dark phone body with a black indicator is invisible on it.
describe('status-bar-text-style is the single switch for all body chrome, home indicator included', () => {
  it('defaults the home indicator to black, same as the status bar', () => {
    expect(homeIndicator(mountFrame({ device: 'iPhone X' })).style.color).toBe('rgb(0, 0, 0)')
  })

  it('switches both the status bar and the home indicator to white together', () => {
    const el = mountFrame({ device: 'iPhone X', 'status-bar-text-style': 'white' })
    expect(statusBar(el).style.color).toBe('rgb(255, 255, 255)')
    expect(homeIndicator(el).style.color).toBe('rgb(255, 255, 255)')
  })

  it('switches both back to black when the attribute is set back', () => {
    const el = mountFrame({ device: 'iPhone X', 'status-bar-text-style': 'white' })
    el.setAttribute('status-bar-text-style', 'black')
    expect(statusBar(el).style.color).toBe('rgb(0, 0, 0)')
    expect(homeIndicator(el).style.color).toBe('rgb(0, 0, 0)')
  })

  it('keeps the home indicator following the attribute in landscape, where the status bar itself is hidden on iOS', () => {
    const el = mountFrame({ device: 'iPhone X', orientation: 'landscape', 'status-bar-text-style': 'white' })
    expect(statusBar(el).hidden).toBe(true)
    expect(homeIndicator(el).hidden).toBe(false)
    expect(homeIndicator(el).style.color).toBe('rgb(255, 255, 255)')
  })
})

describe('slotted content stays in the light DOM', () => {
  it('so the host stylesheets that target it still reach it', () => {
    const el = mountFrame({ device: 'iPhone X' })
    const content = document.createElement('iframe')
    el.append(content)
    expect(content.getRootNode()).toBe(document)
    expect(el.shadowRoot!.contains(content)).toBe(false)
  })
})

describe('status bar time', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function time(el: DeviceFrameElement): string {
    return el.shadowRoot!.querySelector<HTMLElement>('.status-bar__time')!.textContent ?? ''
  }

  it('shows the canonical fixed time by default, so screenshots stay stable', () => {
    expect(time(mountFrame({ device: 'iPhone X' }))).toBe('9:41')
  })

  it('tracks the wall clock when asked to, and keeps ticking', () => {
    vi.setSystemTime(new Date(2026, 0, 1, 8, 5))
    const el = mountFrame({ device: 'iPhone X', 'status-bar': 'live' })
    expect(time(el)).toBe('08:05')

    vi.advanceTimersByTime(60_000)
    expect(time(el)).toBe('08:06')
  })

  it('stops the clock when the frame leaves the document', () => {
    const el = mountFrame({ device: 'iPhone X', 'status-bar': 'live' })
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    el.remove()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('runs one clock no matter how many times it is asked to redraw', () => {
    const el = mountFrame({ device: 'iPhone X', 'status-bar': 'live' })
    el.setAttribute('device', 'iPhone 14')
    el.setAttribute('device', 'iPhone 16 Pro')
    expect(vi.getTimerCount()).toBe(1)
  })

  it('hides the whole bar on request and runs no clock behind it', () => {
    const el = mountFrame({ device: 'iPhone X', 'status-bar': 'hidden' })
    expect(statusBar(el).hidden).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('runs no clock in landscape, where there is no bar to run it in', () => {
    mountFrame({ device: 'iPhone X', 'status-bar': 'live', orientation: 'landscape' })
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('registration', () => {
  it('tolerates being defined more than once, since a host may bundle it twice', () => {
    expect(() => {
      defineDeviceFrame()
      defineDeviceFrame()
    }).not.toThrow()
  })
})

describe('status bar layout variables follow the resolved device (computeStatusBarLayout is the single owner of this geometry)', () => {
  it('publishes the ios-cutout time/trailing variables for a device with a centered notch (iPhone X, a tabled row)', () => {
    const el = mountFrame({ device: 'iPhone X' })
    expect(statusBar(el).dataset.layout).toBe('ios-cutout')
    expect(statusBar(el).style.getPropertyValue('--sb-time-left')).toBe('31.3px')
    expect(statusBar(el).style.getPropertyValue('--sb-trailing')).toBe('14.3px')
  })

  it('centers the time instead for a device with no cutout', () => {
    const el = mountFrame({ device: 'iPhone 6/7/8' })
    expect(statusBar(el).dataset.layout).toBe('ios-classic')
    expect(statusBar(el).style.getPropertyValue('--sb-time-left')).toBe('')
    expect(statusBar(el).style.getPropertyValue('--sb-leading-icons')).toBe('6px')
  })

  it('hides the cutout element in landscape, where it is not drawn', () => {
    const el = mountFrame({ device: 'iPhone X', orientation: 'landscape' })
    const notch = el.shadowRoot!.querySelector<HTMLElement>('.status-bar__notch')!
    expect(notch.hidden).toBe(true)
  })
})

describe('status-bar-height and safe-area-* overrides apply to both orientations, like navigation-bar-height does', () => {
  it('an explicit status-bar-height attribute overrides the landscape status bar height too', () => {
    const el = mountFrame({ device: 'Pixel 8', orientation: 'landscape', 'status-bar-height': '20' })
    expect(el.metrics.statusBarHeight).toBe(20)
  })

  it('an explicit safe-area-bottom attribute overrides the landscape safe area too', () => {
    const el = mountFrame({
      os: 'ios',
      width: '375',
      height: '812',
      orientation: 'landscape',
      'safe-area-bottom': '30',
    })
    expect(el.metrics.safeAreaInsets.bottom).toBe(30)
  })
})

describe('status bar content is centered on a Dynamic Island, not on the bar\'s own height', () => {
  it('centers .status-bar__time/icons on the island midline via --sb-center-y (iPhone 14 Pro: top 11, height 37 -> 29.5)', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    expect(statusBar(el).style.getPropertyValue('--sb-center-y')).toBe('29.5px')
  })

  it('falls back to the tabled notch centerY, not the island formula, for a notch device', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    el.setAttribute('device', 'iPhone X')
    expect(statusBar(el).style.getPropertyValue('--sb-center-y')).toBe('23px')
  })
})
