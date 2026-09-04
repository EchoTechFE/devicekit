/**
 * `onContentRectChange` is the wrapper's own listener prop, not a DOM
 * attribute or property the element itself exposes: React does not wire an
 * arbitrary `onFoo` prop on a hyphenated custom-element tag to
 * `addEventListener` the way it does for built-ins (see the class comment in
 * react/index.tsx on how React 18 vs 19 handle unknown props). The wrapper
 * has to attach the listener itself in an effect, and detach the previous one
 * on every prop swap — including StrictMode's mount/unmount/remount, which
 * must not leave two listeners racing.
 */
import * as React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ContentRect } from '../content-rect.js'
import type { DeviceFrameElement } from '../device-frame.js'
import { DeviceFrame } from './index.js'

afterEach(() => {
  cleanup()
})

const rect: ContentRect = { x: 0, y: 0, width: 100, height: 100, scale: 1 }

function fireContentRectChange(el: Element): void {
  el.dispatchEvent(new CustomEvent<ContentRect>('contentrectchange', { detail: rect }))
}

describe('<DeviceFrame onContentRectChange>', () => {
  it('calls the current handler, swaps it on rerender, and detaches when cleared', () => {
    const ref = React.createRef<DeviceFrameElement>()
    const h1 = vi.fn()
    const h2 = vi.fn()

    const { rerender } = render(<DeviceFrame device="iPhone 15" onContentRectChange={h1} ref={ref} />)
    const el = ref.current!
    // Mounting replays the element's starting rect once; every dispatch after
    // that must reach the handler exactly once, or a listener was attached twice.
    expect(h1).toHaveBeenCalledTimes(1)
    fireContentRectChange(el)
    expect(h1).toHaveBeenCalledTimes(2)
    expect(h2).not.toHaveBeenCalled()

    rerender(<DeviceFrame device="iPhone 15" onContentRectChange={h2} ref={ref} />)
    fireContentRectChange(el)
    expect(h1).toHaveBeenCalledTimes(2)
    expect(h2).toHaveBeenCalledTimes(1)

    rerender(<DeviceFrame device="iPhone 15" onContentRectChange={undefined} ref={ref} />)
    fireContentRectChange(el)
    expect(h1).toHaveBeenCalledTimes(2)
    expect(h2).toHaveBeenCalledTimes(1)
  })

  it('does not double-invoke under StrictMode', () => {
    const ref = React.createRef<DeviceFrameElement>()
    const h1 = vi.fn()
    const h2 = vi.fn()

    const { rerender } = render(
      <React.StrictMode>
        <DeviceFrame device="iPhone 15" onContentRectChange={h1} ref={ref} />
      </React.StrictMode>,
    )
    const el = ref.current!
    // The replay fires exactly once; StrictMode does not double it.
    expect(h1).toHaveBeenCalledTimes(1)
    fireContentRectChange(el)
    expect(h1).toHaveBeenCalledTimes(2)

    rerender(
      <React.StrictMode>
        <DeviceFrame device="iPhone 15" onContentRectChange={h2} ref={ref} />
      </React.StrictMode>,
    )
    fireContentRectChange(el)
    expect(h1).toHaveBeenCalledTimes(2)
    expect(h2).toHaveBeenCalledTimes(1)

    rerender(
      <React.StrictMode>
        <DeviceFrame device="iPhone 15" onContentRectChange={undefined} ref={ref} />
      </React.StrictMode>,
    )
    fireContentRectChange(el)
    expect(h1).toHaveBeenCalledTimes(2)
    expect(h2).toHaveBeenCalledTimes(1)
  })
})
