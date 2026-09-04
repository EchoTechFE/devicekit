/**
 * `defineDeviceFrame` has to tolerate the ordinary duplicate-define cases — a
 * host that bundles this package twice, or hot-reloads a module — without
 * crashing. But a genuinely different element already squatting the tag name
 * is a real conflict a host needs to see; silently returning would leave the
 * host's own markup drawing someone else's element under a name it thinks is
 * `<device-frame>`. `customElements.define` never lets a tag be undefined, so
 * every case here uses its own tag name.
 */
import { describe, expect, it } from 'vitest'
import { DeviceFrameElement, defineDeviceFrame } from './device-frame.js'

/** The identity marker a compatible re-definition (HMR, duplicate bundling) is checked against. */
const FRAME_MARKER = Symbol.for('@devicekit/frame')

describe('defineDeviceFrame registration conflicts', () => {
  it('throws, naming the tag, when an unrelated element already owns it', () => {
    const tag = 'x-foreign-frame-1'
    customElements.define(tag, class extends HTMLElement {})
    expect(() => defineDeviceFrame(tag)).toThrow(tag)
  })

  it('is idempotent when DeviceFrameElement itself already owns the tag', () => {
    const tag = 'x-idempotent-frame-1'
    defineDeviceFrame(tag)
    expect(() => defineDeviceFrame(tag)).not.toThrow()
  })

  it('accepts a compatible re-definition — same package, different class identity (HMR/duplicate bundling)', () => {
    const tag = 'x-twin-frame-1'
    class Twin extends DeviceFrameElement {}
    customElements.define(tag, Twin)
    expect(() => defineDeviceFrame(tag)).not.toThrow()
  })

  it('marks DeviceFrameElement with the package identity symbol the twin check relies on', () => {
    expect((DeviceFrameElement as unknown as Record<symbol, unknown>)[FRAME_MARKER]).toBe(true)
  })
})
