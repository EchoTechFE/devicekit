/**
 * Guards `#publishContentRect`'s reentrancy loop against listeners that never
 * stop mutating the attributes that move the content region. The reentrancy
 * contract (see content-rect-reentrancy.test.ts) only bounds how a *finite*
 * chain of nested dispatches is ordered — it says nothing about a listener
 * pair that keeps flipping attributes forever, and the `do { … } while
 * (pending)` loop that contract relies on has no other exit: fed an unbounded
 * cycle, it spins synchronously and never returns control to whatever set the
 * attribute that started it, hanging the host page. A loop breaker has to cut
 * that cycle short — bounded by the handful of distinct rects two boolean-ish
 * attributes can actually produce — log once so the runaway listener pair is
 * diagnosable, and leave the assignment that triggered it able to return.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
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

/**
 * jsdom never lays anything out, so `immersive` (zeroes the bar reservations)
 * and `orientation` (swaps the screen box) are the only two attributes that
 * actually move `contentRect` here — together they span at most four distinct
 * rects, which is the bound a loop breaker has to respect.
 */
function stubScreenBox(el: DeviceFrameElement): void {
  const screenEl = el.shadowRoot!.querySelector<HTMLElement>('.screen')!
  screenEl.getBoundingClientRect = () => new DOMRect(10, 20, 196.5, 426)
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('unbounded reentrant contentrectchange listeners', () => {
  it(
    'stops an uncapped mutual-toggle cycle, logs it once, and lets the triggering assignment return',
    () => {
      const el = mountFrame({ device: 'iPhone 14 Pro' })
      stubScreenBox(el)
      el.immersive = false
      el.orientation = 'portrait'
      el.refreshContentRect()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      // Both listeners see the same dispatched sequence, so recording it once
      // (off listener A) is enough to check what actually went out.
      const dispatched: ContentRect[] = []

      // Neither listener caps itself — each reacts to every rect it is handed
      // by flipping the attribute it owns, with no counter and no bail-out.
      el.addEventListener(CONTENT_RECT_CHANGE_EVENT, (e) => {
        dispatched.push(e.detail)
        el.immersive = !el.immersive
      })
      el.addEventListener(CONTENT_RECT_CHANGE_EVENT, () => {
        el.orientation = el.orientation === 'portrait' ? 'landscape' : 'portrait'
      })

      // The whole point: this assignment must come back, not hang the test
      // (and, in a real host, the caller) forever.
      expect(() => {
        el.immersive = true
      }).not.toThrow()

      const distinctRects = new Set(dispatched.map((rect) => JSON.stringify(rect)))
      expect(distinctRects.size).toBeLessThanOrEqual(4)

      expect(errorSpy).toHaveBeenCalledTimes(1)
      const [message] = errorSpy.mock.calls[0] ?? []
      expect(String(message)).toContain('contentrectchange')
    },
    3000,
  )

  it(
    're-syncs on refreshContentRect() after a runaway cycle if the published state fell behind',
    () => {
      const el = mountFrame({ device: 'iPhone 14 Pro' })
      stubScreenBox(el)
      el.immersive = false
      el.orientation = 'portrait'
      el.refreshContentRect()

      vi.spyOn(console, 'error').mockImplementation(() => {})

      const onImmersive = (): void => {
        el.immersive = !el.immersive
      }
      const onOrientation = (): void => {
        el.orientation = el.orientation === 'portrait' ? 'landscape' : 'portrait'
      }
      const details: ContentRect[] = []
      const record = (e: CustomEvent<ContentRect>): void => {
        details.push(e.detail)
      }
      el.addEventListener(CONTENT_RECT_CHANGE_EVENT, onImmersive)
      el.addEventListener(CONTENT_RECT_CHANGE_EVENT, onOrientation)
      el.addEventListener(CONTENT_RECT_CHANGE_EVENT, record)

      el.immersive = true

      el.removeEventListener(CONTENT_RECT_CHANGE_EVENT, onImmersive)
      el.removeEventListener(CONTENT_RECT_CHANGE_EVENT, onOrientation)
      el.removeEventListener(CONTENT_RECT_CHANGE_EVENT, record)

      const lastPublished = details[details.length - 1]
      const actual = el.contentRect
      const handler = vi.fn()
      el.addEventListener(CONTENT_RECT_CHANGE_EVENT, handler)

      el.refreshContentRect()

      if (JSON.stringify(lastPublished) !== JSON.stringify(actual)) {
        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler.mock.calls[0]![0].detail).toEqual(actual)
      } else {
        expect(handler).not.toHaveBeenCalled()
      }
    },
    3000,
  )

  it(
    'does not treat an ordinary bounded reentrant chain as a runaway loop',
    () => {
      const el = mountFrame({ device: 'iPhone 14 Pro' })
      stubScreenBox(el)
      el.immersive = false
      el.refreshContentRect()

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      let flips = 0

      el.addEventListener(CONTENT_RECT_CHANGE_EVENT, () => {
        if (flips < 3) {
          flips++
          el.immersive = !el.immersive
        }
      })

      el.immersive = true

      expect(flips).toBe(3)
      expect(errorSpy).not.toHaveBeenCalled()
    },
    3000,
  )
})
