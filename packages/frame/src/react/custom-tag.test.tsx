/**
 * Some hosts want the frame under their own tag name — a page that already
 * defines `<device-frame>` for something else, or one that scopes every
 * custom element behind a shared prefix. `createDeviceFrameComponent(tag)` is
 * the React-side counterpart of `defineDeviceFrame(tag)`: a component bound
 * to a caller-chosen tag, defaulting to the package's own tag when called
 * with no argument.
 */
import * as React from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DEVICE_FRAME_TAG, DeviceFrameElement } from '../device-frame.js'
import { createDeviceFrameComponent } from './index.js'

afterEach(() => {
  cleanup()
})

describe('createDeviceFrameComponent()', () => {
  it('renders under a caller-chosen tag, and the ref resolves to that upgraded element', () => {
    const MyFrame = createDeviceFrameComponent('my-frame-r7')
    const ref = React.createRef<DeviceFrameElement>()

    const { container } = render(<MyFrame device="iPhone 15" ref={ref} />)

    const el = container.querySelector('my-frame-r7')
    expect(el).not.toBeNull()
    expect(el).toBeInstanceOf(DeviceFrameElement)
    expect(ref.current?.metrics.screen.width).toBe(393)
  })

  it('falls back to the package default tag when called with no argument', () => {
    const DefaultFrame = createDeviceFrameComponent()
    const { container } = render(<DefaultFrame device="iPhone 15" />)
    expect(container.querySelector(DEVICE_FRAME_TAG)).not.toBeNull()
  })
})
