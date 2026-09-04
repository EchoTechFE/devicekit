/**
 * The live clock has to actually be the wall clock, not just "some timer
 * ticking every 60s from whenever the element connected": a tick that lands
 * mid-minute has to show the *current* minute right away, the next tick has
 * to land on the minute boundary rather than 60s after an arbitrary start
 * time, and a previewer that was backgrounded and comes back has to redraw
 * on `visibilitychange` instead of waiting for the next aligned tick.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'

defineDeviceFrame()

function timeText(el: DeviceFrameElement): string | null {
  return el.shadowRoot?.querySelector('.status-bar__time')?.textContent ?? null
}

function createLiveFrame(): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  el.setAttribute('device', 'iPhone 15')
  el.setAttribute('status-bar', 'live')
  return el
}

let hiddenDescriptor: PropertyDescriptor | undefined

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 0, 1, 8, 5, 43))
  hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden')
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.useRealTimers()
  if (hiddenDescriptor) Object.defineProperty(document, 'hidden', hiddenDescriptor)
  else delete (document as { hidden?: boolean }).hidden
})

describe('live clock minute alignment', () => {
  it('shows the current minute immediately, then ticks exactly on minute boundaries', () => {
    const el = createLiveFrame()
    document.body.append(el)

    expect(timeText(el)).toBe('08:05')
    expect(vi.getTimerCount()).toBe(1)

    // 43s into the minute at connect time; 17s more crosses 08:06:00.
    vi.advanceTimersByTime(17_000)
    expect(timeText(el)).toBe('08:06')
    expect(vi.getTimerCount()).toBe(1)

    vi.advanceTimersByTime(60_000)
    expect(timeText(el)).toBe('08:07')
    expect(vi.getTimerCount()).toBe(1)
  })

  it('redraws on visibilitychange without waiting for the next aligned tick, and stops for good on disconnect', () => {
    const el = createLiveFrame()
    document.body.append(el)
    expect(timeText(el)).toBe('08:05')

    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    vi.setSystemTime(new Date(2026, 0, 1, 8, 10, 43))
    // No timer advanced — only the visibilitychange redraw should move the text.
    document.dispatchEvent(new Event('visibilitychange'))
    expect(timeText(el)).toBe('08:10')

    el.remove()
    expect(vi.getTimerCount()).toBe(0)

    const textBeforeStaleEvent = timeText(el)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(timeText(el)).toBe(textBeforeStaleEvent)
    expect(vi.getTimerCount()).toBe(0)
  })
})
