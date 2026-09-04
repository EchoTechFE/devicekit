/**
 * `#publishContentRect`'s oscillation breaker (content-rect-loop.test.ts)
 * used to call `console.error` every time a batch tripped it, so a listener
 * pair that keeps oscillating across many separate outer calls — not just
 * within one reentrant batch — floods the console once per call instead of
 * once per onset. `#oscillationReported` has to latch on the first trip,
 * suppress the message on every subsequent still-oscillating batch, and
 * reset once a batch actually settles, so a *new* onset after the listeners
 * are fixed and broken again is reported too.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONTENT_RECT_CHANGE_EVENT, DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'

defineDeviceFrame()

function mountFrame(attributes: Record<string, string> = {}): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
  document.body.append(el)
  return el
}

function stubScreenBox(el: DeviceFrameElement): void {
  const screenEl = el.shadowRoot!.querySelector<HTMLElement>('.screen')!
  screenEl.getBoundingClientRect = () => new DOMRect(10, 20, 196.5, 426)
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('oscillation logging is latched, not per-batch', () => {
  it('logs once across three consecutive still-oscillating refreshContentRect() calls', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    stubScreenBox(el)
    el.immersive = false
    el.orientation = 'portrait'
    el.refreshContentRect()

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Each batch has to be kicked off by an attribute change, or by the state
    // the breaker's own last break left mismatched — the breaker exits its loop
    // without publishing the rect it last computed, so `#lastContentRect` stays
    // on the previously *published* rect while the listener has since flipped
    // `immersive` again; a bare refreshContentRect() with no attribute change in
    // between re-measures to that same already-published rect and short-circuits
    // before the listener ever runs. Flipping the attribute directly is what
    // actually starts a batch here.
    el.addEventListener(CONTENT_RECT_CHANGE_EVENT, () => {
      el.immersive = !el.immersive
    })

    el.immersive = true
    el.refreshContentRect()
    el.refreshContentRect()

    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('reports a new onset again after the batch settles in between', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    stubScreenBox(el)
    el.immersive = false
    el.orientation = 'portrait'
    el.refreshContentRect()

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const oscillate = (): void => {
      el.immersive = !el.immersive
    }
    el.addEventListener(CONTENT_RECT_CHANGE_EVENT, oscillate)

    el.immersive = true
    expect(errorSpy).toHaveBeenCalledTimes(1)

    // Remove the runaway listener and let one refresh settle normally —
    // this batch does not trip the breaker, so it resets the latch.
    el.removeEventListener(CONTENT_RECT_CHANGE_EVENT, oscillate)
    el.refreshContentRect()
    expect(errorSpy).toHaveBeenCalledTimes(1)

    // Reinstalling the runaway listener alone changes nothing yet — the rect
    // already matches what was last published, so only flipping the attribute
    // again actually starts a fresh onset, which must be reported, not
    // swallowed by the earlier latch.
    el.addEventListener(CONTENT_RECT_CHANGE_EVENT, oscillate)
    el.immersive = !el.immersive
    expect(errorSpy).toHaveBeenCalledTimes(2)
  })
})
