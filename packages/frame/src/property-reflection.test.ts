/**
 * `device`, `orientation`, `embedded` and `immersive` are read straight off
 * attributes but exposed as getter-only accessors. React 19 assigns any prop
 * that satisfies `name in element` as a JS property rather than through
 * `setAttribute` — a getter with no setter throws in strict mode (every ES
 * module is strict), so a host on React 19 crashes setting props this wrapper
 * has always accepted under React 18. These guard that assigning the property
 * reflects onto the attribute the same way `setAttribute` already does, and
 * that the getter keeps resolving from whichever one was written last.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'

defineDeviceFrame()

/**
 * The real accessors are getter-only, so TypeScript treats `el.device = ...`
 * as an assignment to a read-only property. This view exists purely to let
 * the test compile while it performs the actual runtime assignment the
 * setters are expected to accept once they exist.
 */
interface MutableFrameProps {
  device: string | null | undefined
  orientation: string | null | undefined
  embedded: boolean | null | undefined
  immersive: boolean | null | undefined
}

function asMutable(el: DeviceFrameElement): MutableFrameProps {
  return el as unknown as MutableFrameProps
}

function mountFrame(): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  document.body.append(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('property setters mirror the attribute path', () => {
  it('device: assigning a name reflects the attribute and the getter resolves that profile', () => {
    const el = mountFrame()
    expect(() => {
      asMutable(el).device = 'iPhone 15'
    }).not.toThrow()
    expect(el.getAttribute('device')).toBe('iPhone 15')
    expect(el.device?.name).toBe('iPhone 15')
  })

  it('device: assigning null or undefined removes the attribute', () => {
    const el = mountFrame()
    el.setAttribute('device', 'iPhone 15')

    expect(() => {
      asMutable(el).device = null
    }).not.toThrow()
    expect(el.hasAttribute('device')).toBe(false)

    el.setAttribute('device', 'iPhone 15')
    expect(() => {
      asMutable(el).device = undefined
    }).not.toThrow()
    expect(el.hasAttribute('device')).toBe(false)
  })

  it('orientation: assigning reflects the attribute', () => {
    const el = mountFrame()
    expect(() => {
      asMutable(el).orientation = 'landscape'
    }).not.toThrow()
    expect(el.getAttribute('orientation')).toBe('landscape')
    expect(el.orientation).toBe('landscape')
  })

  it('embedded: assigning true sets the presence attribute, false removes it', () => {
    const el = mountFrame()
    expect(() => {
      asMutable(el).embedded = true
    }).not.toThrow()
    expect(el.hasAttribute('embedded')).toBe(true)

    expect(() => {
      asMutable(el).embedded = false
    }).not.toThrow()
    expect(el.hasAttribute('embedded')).toBe(false)
  })

  it('immersive: assigning true sets the presence attribute, false removes it', () => {
    const el = mountFrame()
    expect(() => {
      asMutable(el).immersive = true
    }).not.toThrow()
    expect(el.hasAttribute('immersive')).toBe(true)

    expect(() => {
      asMutable(el).immersive = false
    }).not.toThrow()
    expect(el.hasAttribute('immersive')).toBe(false)
  })
})
