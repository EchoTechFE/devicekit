/**
 * Two hosts sharing a page can each register `<device-frame>` under their own
 * tag name — one already owns the plain tag, another wants a scoped prefix.
 * `defineDeviceFrame()` has to make that possible without smashing into the
 * platform's own rule that one constructor cannot answer to two different
 * custom-element names (`customElements.define()` throws `NotSupportedError`
 * for that), and calling it twice for the same second tag must stay a no-op,
 * the same guarantee the default tag already gets.
 */
import { describe, expect, it } from 'vitest'
import { DeviceFrameElement, defineDeviceFrame } from './device-frame.js'

describe('defineDeviceFrame() under a second tag name', () => {
  it('registers a second, independent tag without throwing, and repeats are a no-op', () => {
    defineDeviceFrame()

    expect(() => defineDeviceFrame('x-frame-r7')).not.toThrow()
    expect(document.createElement('x-frame-r7')).toBeInstanceOf(DeviceFrameElement)
    expect(() => defineDeviceFrame('x-frame-r7')).not.toThrow()
    expect(customElements.get('x-frame-r7')).toBeDefined()
  })
})
