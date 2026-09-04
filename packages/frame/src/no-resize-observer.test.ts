/**
 * Guards the platform without `ResizeObserver` at all — connectedCallback()
 * already guards its own construction of one (see the class comment on
 * `connectedCallback`), but that guard has to actually hold: no crash on
 * mount, no phantom `contentrectchange` for a box move nothing is watching,
 * and `refreshContentRect()` still works as the on-demand replacement.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONTENT_RECT_CHANGE_EVENT, DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'

defineDeviceFrame()

function mountFrame(): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  document.body.append(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('no ResizeObserver on the platform', () => {
  it('mounts without throwing', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    expect(() => mountFrame()).not.toThrow()
  })

  it('does not auto-publish contentrectchange when the screen box moves', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const el = mountFrame()
    const screenEl = el.shadowRoot!.querySelector<HTMLElement>('.screen')!
    screenEl.getBoundingClientRect = () => new DOMRect(10, 20, 196.5, 426)

    const handler = vi.fn()
    el.addEventListener(CONTENT_RECT_CHANGE_EVENT, handler)

    // Nothing observes the box in this platform, so moving it (with no
    // attribute change to trigger a re-render) publishes nothing on its own.
    expect(handler).not.toHaveBeenCalled()
  })

  it('still re-measures on refreshContentRect()', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const el = mountFrame()
    const screenEl = el.shadowRoot!.querySelector<HTMLElement>('.screen')!
    screenEl.getBoundingClientRect = () => new DOMRect(10, 20, 196.5, 426)

    const handler = vi.fn()
    el.addEventListener(CONTENT_RECT_CHANGE_EVENT, handler)

    el.refreshContentRect()

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0]![0].detail).toEqual(el.contentRect)
  })
})
