/**
 * The status bar's live clock is a `setInterval` — a real timer, not just
 * state. Nothing should tick while the frame isn't in the document (a preview
 * panel can build an off-screen element well before mounting it), and leaving
 * the document has to stop it for good rather than merely losing the
 * reference: the frame is the clock's only owner, and the DOM is the only
 * signal it gets that the host went away.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'

defineDeviceFrame()

function createLiveFrame(): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  el.setAttribute('device', 'iPhone 15')
  return el
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('live clock timer follows connection to the document', () => {
  it('setting status-bar="live" before the element is connected starts no timer', () => {
    const el = createLiveFrame()
    el.setAttribute('status-bar', 'live')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('connecting an already-live element starts the timer', () => {
    const el = createLiveFrame()
    el.setAttribute('status-bar', 'live')
    document.body.append(el)
    expect(vi.getTimerCount()).toBeGreaterThan(0)
  })

  it('disconnecting stops the timer, and a later unrelated attribute change does not restart it', () => {
    const el = createLiveFrame()
    el.setAttribute('status-bar', 'live')
    document.body.append(el)
    expect(vi.getTimerCount()).toBeGreaterThan(0)

    document.body.removeChild(el)
    expect(vi.getTimerCount()).toBe(0)

    // orientation re-renders the frame same as any observed attribute; that
    // render must not resurrect a timer for an element no longer on screen.
    el.setAttribute('orientation', 'landscape')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('reconnecting a live element resumes the clock', () => {
    const el = createLiveFrame()
    el.setAttribute('status-bar', 'live')
    document.body.append(el)
    document.body.removeChild(el)
    expect(vi.getTimerCount()).toBe(0)

    document.body.append(el)
    expect(vi.getTimerCount()).toBeGreaterThan(0)
  })
})
