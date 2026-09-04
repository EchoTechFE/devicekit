/**
 * A consumer that registers `DeviceFrameElement` itself, under its own tag
 * name, before this package's own `defineDeviceFrame()` ever runs — e.g. a
 * host that re-exports the bare class under a project-specific name. The
 * brand check in define.ts must recognize that registration as "this
 * element", not merely as some unrelated element that happens to be already
 * registered, and must claim the bare tag on it the same way it would if
 * `defineDeviceFrame()` had registered it first — otherwise a later
 * `defineDeviceFrame('another-tag')` call, needing a subclass because the
 * platform forbids one constructor answering to two names, wrongly reuses
 * the un-subclassed `DeviceFrameElement` for the bare tag and throws
 * `NotSupportedError` on the next distinct tag.
 *
 * Deliberately does not import the react entry: importing it defines the
 * default tag at module load, which would set the module-scoped
 * `elementTagClaimed` flag in define.ts before this test gets to observe it
 * starting false.
 */
import { describe, expect, it } from 'vitest'
import { DeviceFrameElement, defineDeviceFrame } from './device-frame.js'

describe('defineDeviceFrame() after a consumer registers the bare class itself', () => {
  it('claims the externally-registered tag and still hands out a distinct second tag', () => {
    customElements.define('x-ext-first', DeviceFrameElement)

    expect(() => defineDeviceFrame('x-ext-first')).not.toThrow()
    expect(() => defineDeviceFrame('x-ext-second')).not.toThrow()

    const secondCtor = customElements.get('x-ext-second')
    expect(secondCtor).not.toBe(DeviceFrameElement)
    expect(Object.getPrototypeOf(secondCtor)).toBe(DeviceFrameElement)
  })
})
