/**
 * Isolated regression for the StrictMode initial-replay bug fixed alongside
 * content-rect-prop.test.tsx: `useLayoutEffect([])` used to run its whole
 * body — including the "replay the pre-effect contentrectchange" dispatch —
 * on every StrictMode setup, so mount→cleanup→setup produced two initial
 * calls instead of one. Kept as its own file so this specific contract (exactly
 * one call after a StrictMode mount, nothing more) has a single, minimal
 * reproduction independent of the rest of that file's rerender/detach cases.
 */
import * as React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DeviceFrameElement } from '../device-frame.js'
import { DeviceFrame } from './index.js'

afterEach(() => {
  cleanup()
})

describe('<DeviceFrame onContentRectChange> under StrictMode', () => {
  it('fires the initial replay exactly once after mount', () => {
    const ref = React.createRef<DeviceFrameElement>()
    const handler = vi.fn()

    render(
      <React.StrictMode>
        <DeviceFrame device="iPhone 15" onContentRectChange={handler} ref={ref} />
      </React.StrictMode>,
    )

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
