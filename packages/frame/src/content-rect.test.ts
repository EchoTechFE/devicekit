import { afterEach, describe, expect, it } from 'vitest'
import { sameContentRect, toViewportRect } from './content-rect.js'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'

defineDeviceFrame()

interface ContentRect {
  x: number
  y: number
  width: number
  height: number
  scale: number
}

/*
 * The contract under test, spelled out here rather than imported: the tests
 * describe what a host needs from the element (a tab bar that costs height, an
 * immersive mode that gives it back, and a content rectangle it can position a
 * webview with), and must not be shaped by how the element happens to compute it.
 */
interface ContentFrame extends DeviceFrameElement {
  readonly contentRect: ContentRect
  readonly metrics: DeviceFrameElement['metrics'] & {
    tabBarHeight: number
    content: { x: number, y: number, width: number, height: number }
  }
}

function mountFrame(attributes: Record<string, string> = {}): ContentFrame {
  const el = document.createElement(DEVICE_FRAME_TAG) as ContentFrame
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
  document.body.append(el)
  return el
}

function shadowEl(el: DeviceFrameElement, selector: string): HTMLElement {
  return el.shadowRoot!.querySelector<HTMLElement>(selector)!
}

const statusBar = (el: DeviceFrameElement): HTMLElement => shadowEl(el, '.status-bar')
const navigationBarEl = (el: DeviceFrameElement): HTMLElement => shadowEl(el, '.navigation-bar')
const tabBarEl = (el: DeviceFrameElement): HTMLElement => shadowEl(el, '.tab-bar')

// slotchange fires on a microtask, so the shadow DOM only catches up after one
// await; el.metrics is a plain getter and already sees the assigned node.
async function fillSlot(el: DeviceFrameElement, name: string): Promise<void> {
  const node = document.createElement('div')
  node.slot = name
  el.append(node)
  await Promise.resolve()
}

// iPhone X portrait: 375x812 screen, 44 status bar, 44 iOS navigation bar.
const SCREEN_W = 375
const SCREEN_H = 812
const STATUS = 44
const NAV = 44
const DEFAULT_TAB = 50

afterEach(() => {
  document.body.innerHTML = ''
})

describe('the tab-bar slot', () => {
  it('costs nothing when empty', () => {
    const el = mountFrame({ device: 'iPhone X' })
    expect(el.metrics.tabBarHeight).toBe(0)
    expect(el.style.getPropertyValue('--device-tab-bar-height')).toBe('0px')
    expect(tabBarEl(el).hidden).toBe(true)
    expect(el.metrics.window.height).toBe(SCREEN_H - STATUS)
  })

  it('takes the default height once something is slotted into it, and shrinks the window by it', async () => {
    const el = mountFrame({ device: 'iPhone X' })
    await fillSlot(el, 'tab-bar')

    expect(tabBarEl(el).hidden).toBe(false)
    expect(el.metrics.tabBarHeight).toBe(DEFAULT_TAB)
    expect(el.style.getPropertyValue('--device-tab-bar-height')).toBe(`${DEFAULT_TAB}px`)
    expect(el.metrics.window.height).toBe(SCREEN_H - STATUS - DEFAULT_TAB)
  })

  it('an explicit tab-bar-height attribute overrides the default', async () => {
    const el = mountFrame({ device: 'iPhone X', 'tab-bar-height': '60' })
    await fillSlot(el, 'tab-bar')

    expect(el.metrics.tabBarHeight).toBe(60)
    expect(el.metrics.window.height).toBe(SCREEN_H - STATUS - 60)
  })

  // Zero included: a bar that is on screen but reserves nothing would be drawn
  // over the page. That arrangement is `immersive`, and a host that wants no bar
  // at all slots nothing into it.
  it('falls back to the default when the attribute is not a positive number', async () => {
    for (const value of ['0', '-20', 'tall']) {
      const el = mountFrame({ device: 'iPhone X', 'tab-bar-height': value })
      await fillSlot(el, 'tab-bar')
      // Carrying the attribute value into the diff names which one broke.
      expect({ value, height: el.metrics.tabBarHeight }).toEqual({ value, height: DEFAULT_TAB })
    }
  })

  it('subtracts status bar, navigation bar and tab bar together', async () => {
    const el = mountFrame({ device: 'iPhone X' })
    await fillSlot(el, 'navigation-bar')
    await fillSlot(el, 'tab-bar')

    expect(el.metrics.navigationBarHeight).toBe(NAV)
    expect(el.metrics.tabBarHeight).toBe(DEFAULT_TAB)
    expect(el.metrics.window.height).toBe(SCREEN_H - STATUS - NAV - DEFAULT_TAB)
  })

  it('floors the window at zero instead of reporting a negative height', async () => {
    const el = mountFrame({ device: 'iPhone X', 'tab-bar-height': '9999' })
    await fillSlot(el, 'tab-bar')

    expect(el.metrics.window.height).toBe(0)
  })

  it('draws no tab bar in embedded mode, where the host supplies its own chrome', async () => {
    const el = mountFrame({ device: 'iPhone X', embedded: '' })
    await fillSlot(el, 'tab-bar')

    expect(el.metrics.tabBarHeight).toBe(0)
    expect(tabBarEl(el).hidden).toBe(true)
  })
})

describe('immersive mode', () => {
  it('gives the window the whole screen, with every bar still drawn and still reporting its height', async () => {
    const el = mountFrame({ device: 'iPhone X', immersive: '' })
    await fillSlot(el, 'navigation-bar')
    await fillSlot(el, 'tab-bar')

    expect(el.metrics.window).toMatchObject({ width: SCREEN_W, height: SCREEN_H })
    // The page draws under the bars but needs their heights to pad itself.
    expect(el.metrics.statusBarHeight).toBe(STATUS)
    expect(el.metrics.navigationBarHeight).toBe(NAV)
    expect(el.metrics.tabBarHeight).toBe(DEFAULT_TAB)
    expect(statusBar(el).hidden).toBe(false)
    expect(navigationBarEl(el).hidden).toBe(false)
    expect(tabBarEl(el).hidden).toBe(false)
  })

  // The landscape navigation bar (32 on iOS) is what a rotated non-immersive
  // window would lose here, so this says more than "the screen rotated".
  it('follows the rotated screen and still gives back the whole of it', async () => {
    const el = mountFrame({ device: 'iPhone X', immersive: '', orientation: 'landscape' })
    await fillSlot(el, 'navigation-bar')

    expect(el.metrics.navigationBarHeight).toBe(32)
    expect(el.metrics.window).toMatchObject({ width: SCREEN_H, height: SCREEN_W })
    expect(el.metrics.content).toEqual({ x: 0, y: 0, width: SCREEN_H, height: SCREEN_W })
  })
})

describe('the content rectangle in screen coordinates', () => {
  it('starts below the status and navigation bars and is as tall as the window', async () => {
    const el = mountFrame({ device: 'iPhone X' })
    await fillSlot(el, 'navigation-bar')
    await fillSlot(el, 'tab-bar')

    expect(el.metrics.content).toEqual({
      x: 0,
      y: STATUS + NAV,
      width: SCREEN_W,
      height: el.metrics.window.height,
    })
  })

  it('covers the whole screen when immersive', () => {
    const el = mountFrame({ device: 'iPhone X', immersive: '' })
    expect(el.metrics.content).toEqual({ x: 0, y: 0, width: SCREEN_W, height: SCREEN_H })
  })

  it('is empty in embedded mode, where there is no device screen to sit in', () => {
    const el = mountFrame({ device: 'iPhone X', embedded: '' })
    expect(el.metrics.content).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })
})

describe('contentRect in viewport coordinates', () => {
  /*
   * jsdom measures every element as a zero rect, so the scale is unmeasurable
   * and the host offset is zero: contentRect then has to come out as the screen
   * rect itself. Asserting the relation rather than pixel numbers keeps the test
   * about the mapping instead of about jsdom's measurements.
   */
  it('falls back to scale 1 and the screen rect when nothing can be measured', async () => {
    const el = mountFrame({ device: 'iPhone X' })
    await fillSlot(el, 'navigation-bar')

    expect(el.contentRect).toEqual({ ...el.metrics.content, scale: 1 })
  })

  it('tracks immersive mode the same way metrics.content does', () => {
    const el = mountFrame({ device: 'iPhone X', immersive: '' })
    expect(el.contentRect).toEqual({ ...el.metrics.content, scale: 1 })
  })
})

describe('the contentrectchange event', () => {
  function countChanges(el: DeviceFrameElement): () => number {
    let count = 0
    el.addEventListener('contentrectchange', () => {
      count += 1
    })
    return () => count
  }

  it('stays quiet on a redraw that leaves the content rectangle alone', () => {
    const el = mountFrame({ device: 'iPhone X' })
    const changes = countChanges(el)
    const before = changes()

    el.setAttribute('status-bar-text-style', 'white')

    expect(changes()).toBe(before)
  })

  it('fires once when rotating moves the content rectangle', () => {
    const el = mountFrame({ device: 'iPhone X' })
    const changes = countChanges(el)
    const before = changes()

    el.setAttribute('orientation', 'landscape')

    expect(changes()).toBe(before + 1)
  })

  it('fires once when immersive mode moves the content rectangle', () => {
    const el = mountFrame({ device: 'iPhone X' })
    const changes = countChanges(el)
    const before = changes()

    el.setAttribute('immersive', '')

    expect(changes()).toBe(before + 1)
  })

  it('carries the new content rectangle as its detail', () => {
    const el = mountFrame({ device: 'iPhone X' })
    let detail: ContentRect | null = null
    el.addEventListener('contentrectchange', (event) => {
      detail = (event as CustomEvent<ContentRect>).detail
    })

    el.setAttribute('orientation', 'landscape')

    expect(detail).toEqual(el.contentRect)
  })
})

/*
 * The projection itself, called directly with a measured box.
 *
 * jsdom does no layout, so every getBoundingClientRect() reached through the
 * element is zeroes and scale is always 1 — a frame scaled down to fit a panel,
 * which is the case this rectangle exists for, cannot be reached that way.
 */
describe('projecting the content box onto the page', () => {
  const box = (left: number, top: number, width: number): DOMRect =>
    ({ left, top, width, height: 0, right: left + width, bottom: top, x: left, y: top, toJSON: () => ({}) })

  const content = { x: 0, y: 88, width: 375, height: 724 }

  it('leaves the box alone when the frame is drawn at device size', () => {
    expect(toViewportRect(content, 375, box(0, 0, 375)))
      .toEqual({ x: 0, y: 88, width: 375, height: 724, scale: 1 })
  })

  it('scales the box and offsets it by where the screen actually is', () => {
    // Half size, and pushed 20px right / 10px down by the host's own layout.
    expect(toViewportRect(content, 375, box(20, 10, 187.5)))
      .toEqual({ x: 20, y: 54, width: 187.5, height: 362, scale: 0.5 })
  })

  it('reports logical geometry unscaled when the screen cannot be measured', () => {
    expect(toViewportRect(content, 375, box(0, 0, 0)))
      .toEqual({ x: 0, y: 88, width: 375, height: 724, scale: 1 })
  })

  it('counts a change of scale alone as a change', () => {
    const empty = { x: 0, y: 0, width: 0, height: 0 }
    const full = toViewportRect(empty, 375, box(0, 0, 375))
    const half = toViewportRect(empty, 375, box(0, 0, 187.5))

    expect(sameContentRect(full, full)).toBe(true)
    expect(sameContentRect(full, half)).toBe(false)
    expect(sameContentRect(null, full)).toBe(false)
  })
})
