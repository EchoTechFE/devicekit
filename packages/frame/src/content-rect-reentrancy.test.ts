/**
 * Guards `contentrectchange` ordering when a listener synchronously mutates an
 * attribute that moves the content region again — the common case is a
 * listener that flips `immersive` in response to the very rect it just
 * received. `#publishContentRect` dispatches from inside that same call
 * stack, so the resulting nested dispatch runs to completion (calling every
 * listener, including ones registered after the reentrant one) before the
 * outer dispatch resumes and finishes notifying its own remaining listeners
 * with the now-stale `detail` it captured before the nesting happened. A
 * listener registered after the reentrant one therefore sees the newer state
 * first and the stale one second — a host positioning a native view from
 * this event would place it one step behind wherever the frame actually
 * settled.
 */
import { afterEach, describe, expect, it } from 'vitest'
import {
  CONTENT_RECT_CHANGE_EVENT,
  DEVICE_FRAME_TAG,
  defineDeviceFrame,
  type DeviceFrameElement,
} from './device-frame.js'
import type { ContentRect } from './content-rect.js'

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

/**
 * jsdom never lays anything out, so the only thing that moves `contentRect`
 * here is `immersive`: it zeroes out the space reserved for the status and
 * navigation bars. Reading the getter has no side effect on its own — only
 * `#publishContentRect` touches the element's last-published state — so this
 * can compute both candidate rects up front without disturbing anything.
 */
function rectFor(el: DeviceFrameElement, immersive: boolean): ContentRect {
  const original = el.immersive
  el.immersive = immersive
  const rect = el.contentRect
  el.immersive = original
  return rect
}

/**
 * Stubs the screen box, settles the element on the non-immersive baseline,
 * then attaches two listeners (A before B) and fires one external change.
 * A reacts to its own first call by flipping `immersive` back, nesting a
 * second `contentrectchange` dispatch inside the first.
 */
function arrangeReentrantTrigger(el: DeviceFrameElement) {
  const screenEl = el.shadowRoot!.querySelector<HTMLElement>('.screen')!
  screenEl.getBoundingClientRect = () => new DOMRect(10, 20, 196.5, 426)

  el.immersive = false
  el.refreshContentRect()

  const before = rectFor(el, false)
  const after = rectFor(el, true)

  const detailsA: ContentRect[] = []
  const detailsB: ContentRect[] = []
  let reentered = false

  el.addEventListener(CONTENT_RECT_CHANGE_EVENT, (e) => {
    detailsA.push(e.detail)
    if (!reentered) {
      reentered = true
      el.immersive = false
    }
  })
  el.addEventListener(CONTENT_RECT_CHANGE_EVENT, (e) => {
    detailsB.push(e.detail)
  })

  el.immersive = true // the outer change; A's handler nests a second one on top of it

  return { before, after, detailsA, detailsB }
}

describe('reentrant contentrectchange listeners', () => {
  it('notifies every listener in the order the states actually occurred, not new-then-old', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    const { before, after, detailsA, detailsB } = arrangeReentrantTrigger(el)

    // Sanity: the toggle used to drive this scenario has to actually move
    // the region, or the rest of the assertions would pass for the wrong
    // reason (no second dispatch at all).
    expect(before.y).not.toBe(after.y)

    // `after` happened first (the outer change), `before` second (A's nested
    // flip-back). Every listener should see them in that order.
    expect(detailsA).toEqual([after, before])
    expect(detailsB).toEqual([after, before])
  })

  it('leaves the element settled on the value its last listener actually saw', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    const { detailsB } = arrangeReentrantTrigger(el)

    expect(el.contentRect).toEqual(detailsB[detailsB.length - 1])
  })

  it('bounds a chain of reentrant toggles without overflowing the stack', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    const screenEl = el.shadowRoot!.querySelector<HTMLElement>('.screen')!
    screenEl.getBoundingClientRect = () => new DOMRect(10, 20, 196.5, 426)
    el.immersive = false
    el.refreshContentRect()

    const detailsA: ContentRect[] = []
    const detailsB: ContentRect[] = []
    let flips = 0

    el.addEventListener(CONTENT_RECT_CHANGE_EVENT, (e) => {
      detailsA.push(e.detail)
      if (flips < 3) {
        flips++
        el.immersive = !el.immersive
      }
    })
    el.addEventListener(CONTENT_RECT_CHANGE_EVENT, (e) => {
      detailsB.push(e.detail)
    })

    expect(() => {
      el.immersive = true
    }).not.toThrow()

    expect(flips).toBe(3)
    // One dispatch for the outer change plus one per flip — bounded by the
    // flip cap, not left to run away.
    expect(detailsA.length).toBeLessThanOrEqual(4)
    expect(detailsB.length).toBeLessThanOrEqual(4)

    for (const details of [detailsA, detailsB]) {
      for (let i = 1; i < details.length; i++) {
        expect(details[i]).not.toEqual(details[i - 1])
      }
    }
  })
})
