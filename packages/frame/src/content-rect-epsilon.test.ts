/**
 * `sameContentRect()` used to compare fields with `===`, so a rect that
 * settled at, say, 100.00000000001 instead of 100 because of accumulated
 * floating-point layout math counted as "moved" and republished on every
 * ResizeObserver callback. A host repositioning a native view on
 * `contentrectchange` paid for that on every frame. `CONTENT_RECT_EPSILON`
 * is the tolerance below which a difference is layout noise, not a real
 * move; it has to stay well under a CSS pixel so an actual sub-pixel reflow
 * — which a native overlay does need to track — still publishes.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { CONTENT_RECT_EPSILON, sameContentRect, type ContentRect } from './content-rect.js'
import { CONTENT_RECT_CHANGE_EVENT, DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'

defineDeviceFrame()

function mountFrame(attributes: Record<string, string> = {}): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
  document.body.append(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('CONTENT_RECT_EPSILON', () => {
  it('is 1e-3', () => {
    expect(CONTENT_RECT_EPSILON).toBe(1e-3)
  })
})

describe('sameContentRect() with a tolerance', () => {
  const base: ContentRect = { x: 0, y: 88, width: 375, height: 724, scale: 1 }

  it('treats a 1e-10 difference as the same rect', () => {
    const jittered: ContentRect = { ...base, x: base.x + 1e-10 }
    expect(sameContentRect(base, jittered)).toBe(true)
  })

  it('treats a 0.01 difference as a real move', () => {
    const moved: ContentRect = { ...base, x: base.x + 0.01 }
    expect(sameContentRect(base, moved)).toBe(false)
  })
})

describe('the element applies the same tolerance to its own re-measurements', () => {
  it('does not republish for a sub-tolerance jitter, but does for a real offset', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    const screenEl = el.shadowRoot!.querySelector<HTMLElement>('.screen')!

    let left = 10
    screenEl.getBoundingClientRect = () => new DOMRect(left, 20, 196.5, 426)

    let fired = 0
    el.addEventListener(CONTENT_RECT_CHANGE_EVENT, () => {
      fired += 1
    })

    el.refreshContentRect()
    expect(fired).toBe(1)

    left += 1e-9
    el.refreshContentRect()
    expect(fired).toBe(1)

    left += 0.5
    el.refreshContentRect()
    expect(fired).toBe(2)
  })
})
