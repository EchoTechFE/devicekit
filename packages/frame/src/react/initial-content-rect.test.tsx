/**
 * The element fires its first `contentrectchange` synchronously from
 * `connectedCallback`, during React's commit — before any `useEffect` has
 * run. A host mounting `<DeviceFrame onContentRectChange>` and expecting to
 * hear about the frame's starting geometry, not just changes after mount,
 * needs that first event too; a listener attached only in an effect misses
 * it.
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

describe('<DeviceFrame onContentRectChange> initial mount', () => {
  it('fires once on mount with the mounted element\'s own contentRect, then again after a geometry-changing rerender', () => {
    const ref = React.createRef<DeviceFrameElement>()
    const handler = vi.fn()

    const { rerender } = render(<DeviceFrame device="iPhone 15" onContentRectChange={handler} ref={ref} />)
    const el = ref.current!

    expect(handler).toHaveBeenCalledTimes(1)
    const firstEvent = handler.mock.calls[0]?.[0] as CustomEvent<ContentRect>
    expect(firstEvent.detail).toEqual(el.contentRect)
    expect(firstEvent.target).toBe(el)

    rerender(<DeviceFrame device="iPhone 15" orientation="landscape" onContentRectChange={handler} ref={ref} />)
    expect(handler).toHaveBeenCalledTimes(2)
  })
})
