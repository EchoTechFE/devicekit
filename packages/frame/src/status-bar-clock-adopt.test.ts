/**
 * `#startClock()` records the document it attached the `visibilitychange`
 * listener to (`this.element.ownerDocument` at start time) and `stop()` must
 * remove it from that same document — not from whatever document the host
 * happens to belong to when `stop()` runs. `adoptNode()` moving the host to a
 * different document between start and stop is the case that would silently
 * leak the listener on the original document if `stop()` naively read
 * `ownerDocument` again instead of the recorded one.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'

defineDeviceFrame()

function createLiveFrame(): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  el.setAttribute('device', 'iPhone 15')
  el.setAttribute('status-bar', 'live')
  return el
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 0, 1, 8, 5, 43))
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('live clock survives adoptNode without leaking or double-removing listeners', () => {
  it('removes the visibilitychange listener from the original document, not the adopted one, on stop()', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const el = createLiveFrame()
    document.body.append(el)

    const visibilityAdds = addSpy.mock.calls.filter((call) => call[0] === 'visibilitychange')
    expect(visibilityAdds).toHaveLength(1)
    const [addCall] = visibilityAdds
    if (!addCall) throw new Error('expected a visibilitychange add call')
    const listener = addCall[1]

    const otherDocument = document.implementation.createHTMLDocument('other')
    const otherAddSpy = vi.spyOn(otherDocument, 'addEventListener')
    const otherRemoveSpy = vi.spyOn(otherDocument, 'removeEventListener')

    // adoptNode() detaches the host from its current parent (the CEReactions
    // steps for that detach run disconnectedCallback -> stop()), then flips
    // ownerDocument to the target document — and the disconnectedCallback
    // reaction is only actually invoked once every synchronous step of
    // adoptNode() has finished, i.e. *after* ownerDocument has already become
    // otherDocument. So by the time stop() runs, `this.element.ownerDocument`
    // already reads as the adopted-into document; only the cached
    // `#listeningDocument` still points at the document the listener is
    // really on.
    otherDocument.adoptNode(el)
    expect(el.ownerDocument).toBe(otherDocument)

    const visibilityRemoves = removeSpy.mock.calls.filter((call) => call[0] === 'visibilitychange')
    expect(visibilityRemoves).toHaveLength(1)
    const [removeCall] = visibilityRemoves
    if (!removeCall) throw new Error('expected a visibilitychange remove call')
    expect(removeCall[1]).toBe(listener)

    // Nothing was ever added to, or removed from, the document the element
    // ended up in — the listener never followed the adopt.
    expect(otherAddSpy).not.toHaveBeenCalledWith('visibilitychange', expect.anything())
    expect(otherRemoveSpy).not.toHaveBeenCalledWith('visibilitychange', expect.anything())

    expect(vi.getTimerCount()).toBe(0)
  })
})
