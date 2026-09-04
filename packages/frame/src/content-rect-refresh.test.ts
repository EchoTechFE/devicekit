/**
 * Guards `refreshContentRect()`, the escape hatch for moves ResizeObserver
 * cannot see: a CSS `transform: scale()` on the host resizes nothing in the
 * box-model sense, so the observer never fires even though the viewport rect
 * a native overlay would position against has moved. The method has to
 * re-measure on demand and still respect the same "only fire on an actual
 * change" contract `#publishContentRect` already keeps for attribute-driven
 * re-renders.
 *
 * Also guards that `contentrectchange`'s `CustomEvent<T>` carries `ContentRect`
 * as its `detail` type, so a listener does not have to cast past `Event`.
 */
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
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

describe('refreshContentRect()', () => {
  it('re-measures the screen box and fires contentrectchange only when it moved', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    const screenEl = el.shadowRoot!.querySelector<HTMLElement>('.screen')!
    const stubbedRect = new DOMRect(10, 20, 196.5, 426)
    screenEl.getBoundingClientRect = () => stubbedRect

    const handler = vi.fn()
    el.addEventListener(CONTENT_RECT_CHANGE_EVENT, handler)

    el.refreshContentRect()

    expect(handler).toHaveBeenCalledTimes(1)
    const event = handler.mock.calls[0]![0] as CustomEvent<ContentRect>
    expect(event.detail).toEqual(el.contentRect)
    expect(event.detail.y).toBe(el.contentRect.y)
    expect(event.detail.scale).toBe(0.5)

    el.refreshContentRect()
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('types contentrectchange as CustomEvent<ContentRect> on addEventListener', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    el.addEventListener(CONTENT_RECT_CHANGE_EVENT, (e) => {
      expectTypeOf(e.detail).toEqualTypeOf<ContentRect>()
    })
  })
})
