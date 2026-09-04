/**
 * `onContentRectChange` starting out `undefined` and only later receiving a
 * function used to leave that handler permanently blind to the frame's
 * current geometry. The wrapped DOM listener unconditionally wrote
 * `lastDelivered.current = event.detail` before calling the caller's handler
 * — including while `contentRectHandlerRef.current` was `undefined` — so by
 * the time a real handler showed up on a later rerender, `lastDelivered`
 * already matched the element's `contentRect` and the mount-time replay
 * effect (keyed on `[]`, run once) had no reason to fire again. Any geometry
 * change that happened while the handler was absent was silently swallowed
 * the same way. The fix tracks "is a handler currently attached" as its own
 * layout-effect dependency and replays the current rect whenever that flips
 * from absent to present and the geometry actually moved since — without
 * recording a delivery for an absent handler in the first place.
 */
import * as React from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ContentRect } from '../content-rect.js'
import type { DeviceFrameElement } from '../device-frame.js'
import { DeviceFrame } from './index.js'

afterEach(() => {
  cleanup()
})

function stubScreenBox(el: DeviceFrameElement, box: { x: number, y: number, width: number, height: number }): void {
  const screenEl = el.shadowRoot!.querySelector<HTMLElement>('.screen')!
  screenEl.getBoundingClientRect = () => new DOMRect(box.x, box.y, box.width, box.height)
}

function expectSameRect(actual: ContentRect, expected: ContentRect): void {
  expect(actual.x).toBeCloseTo(expected.x, 3)
  expect(actual.y).toBeCloseTo(expected.y, 3)
  expect(actual.width).toBeCloseTo(expected.width, 3)
  expect(actual.height).toBeCloseTo(expected.height, 3)
  expect(actual.scale).toBeCloseTo(expected.scale, 3)
}

describe('<DeviceFrame onContentRectChange> attached after mount', () => {
  it('replays exactly once on a plain mount with a handler already in place', () => {
    const handler = vi.fn()
    const ref = React.createRef<DeviceFrameElement>()

    render(<DeviceFrame device="iPhone 15" onContentRectChange={handler} ref={ref} />)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('delivers the current rect once when a handler first appears on rerender', () => {
    const handler = vi.fn()
    const ref = React.createRef<DeviceFrameElement>()

    const { rerender } = render(<DeviceFrame device="iPhone 15" ref={ref} />)
    const el = ref.current!
    expect(handler).not.toHaveBeenCalled()

    rerender(<DeviceFrame device="iPhone 15" onContentRectChange={handler} ref={ref} />)

    expect(handler).toHaveBeenCalledTimes(1)
    expectSameRect(handler.mock.calls[0]![0].detail, el.contentRect)
  })

  it('replays the moved rect when the handler returns after geometry changed while it was gone', () => {
    const handler = vi.fn()
    const ref = React.createRef<DeviceFrameElement>()

    const { rerender } = render(<DeviceFrame device="iPhone 15" onContentRectChange={handler} ref={ref} />)
    const el = ref.current!
    expect(handler).toHaveBeenCalledTimes(1)

    rerender(<DeviceFrame device="iPhone 15" ref={ref} />)

    stubScreenBox(el, { x: 40, y: 0, width: 300, height: 600 })
    act(() => {
      el.refreshContentRect()
    })

    rerender(<DeviceFrame device="iPhone 15" onContentRectChange={handler} ref={ref} />)

    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler.mock.calls[1]![0].detail.x).toBe(40)
  })

  it('does not replay on return when the geometry never changed while the handler was gone', () => {
    const handler = vi.fn()
    const ref = React.createRef<DeviceFrameElement>()

    const { rerender } = render(<DeviceFrame device="iPhone 15" onContentRectChange={handler} ref={ref} />)
    expect(handler).toHaveBeenCalledTimes(1)

    rerender(<DeviceFrame device="iPhone 15" ref={ref} />)
    rerender(<DeviceFrame device="iPhone 15" onContentRectChange={handler} ref={ref} />)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not re-replay across rerenders that only pass a new inline handler', () => {
    const calls: Array<CustomEvent<ContentRect>> = []
    const ref = React.createRef<DeviceFrameElement>()

    const { rerender } = render(
      <DeviceFrame device="iPhone 15" onContentRectChange={(e) => calls.push(e)} ref={ref} />,
    )
    expect(calls).toHaveLength(1)

    for (let i = 0; i < 3; i++) {
      rerender(<DeviceFrame device="iPhone 15" onContentRectChange={(e) => calls.push(e)} ref={ref} />)
    }

    expect(calls).toHaveLength(1)
  })

  it('still replays exactly once under StrictMode with a handler already in place', () => {
    const handler = vi.fn()
    const ref = React.createRef<DeviceFrameElement>()

    render(
      <React.StrictMode>
        <DeviceFrame device="iPhone 15" onContentRectChange={handler} ref={ref} />
      </React.StrictMode>,
    )

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
