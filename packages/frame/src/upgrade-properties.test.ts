/**
 * A property assigned before the class is defined lands as a plain own data
 * property, shadowing the accessor `customElements.define()` later puts on
 * the prototype — the platform does not replay it through the setter on
 * upgrade. Without an explicit "upgrade property" step in the constructor,
 * `el.device` after upgrade returns whatever raw value was stashed rather
 * than going through the getter, and the render path that expects a
 * `DeviceProfile | null` chokes on a string.
 *
 * Each case uses its own tag: customElements can't be undefined once
 * registered, and every test needs an element that starts out un-upgraded.
 */
import { afterEach, describe, expect, it } from 'vitest'
import type { DeviceProfile } from '@devicekit/devices'
import { DeviceFrameElement } from './device-frame.js'

let tagCounter = 0
function nextTag(): string {
  tagCounter += 1
  return `x-frame-upgrade-${tagCounter}`
}

interface MutableFrameProps {
  device: string | null | undefined
  orientation: string | null | undefined
  embedded: boolean | null | undefined
  immersive: boolean | null | undefined
  deviceProfile: DeviceProfile | null | undefined
}

function asMutable(el: Element): MutableFrameProps {
  return el as unknown as MutableFrameProps
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('properties set before customElements.define() survive the upgrade', () => {
  it('device: resolves to the parsed profile, not the raw string, once upgraded', () => {
    const tag = nextTag()
    const el = document.createElement(tag)
    asMutable(el).device = 'iPhone 15'

    customElements.define(tag, class extends DeviceFrameElement {})
    document.body.append(el)

    const frame = el as unknown as DeviceFrameElement
    expect(frame.device).not.toBe('iPhone 15')
    expect(frame.device?.name).toBe('iPhone 15')
    expect(el.getAttribute('device')).toBe('iPhone 15')
  })

  it('orientation: reflects onto the attribute and reads back through the getter', () => {
    const tag = nextTag()
    const el = document.createElement(tag)
    asMutable(el).orientation = 'landscape'

    customElements.define(tag, class extends DeviceFrameElement {})
    document.body.append(el)

    const frame = el as unknown as DeviceFrameElement
    expect(frame.orientation).toBe('landscape')
    expect(el.hasAttribute('orientation')).toBe(true)
  })

  it('embedded: reflects onto the presence attribute and reads back true', () => {
    const tag = nextTag()
    const el = document.createElement(tag)
    asMutable(el).embedded = true

    customElements.define(tag, class extends DeviceFrameElement {})
    document.body.append(el)

    const frame = el as unknown as DeviceFrameElement
    expect(frame.embedded).toBe(true)
    expect(el.hasAttribute('embedded')).toBe(true)
  })

  it('immersive: reflects onto the presence attribute and reads back true', () => {
    const tag = nextTag()
    const el = document.createElement(tag)
    asMutable(el).immersive = true

    customElements.define(tag, class extends DeviceFrameElement {})
    document.body.append(el)

    const frame = el as unknown as DeviceFrameElement
    expect(frame.immersive).toBe(true)
    expect(el.hasAttribute('immersive')).toBe(true)
  })

  it('deviceProfile: the setter actually runs, not just a shadowed own property', () => {
    const tag = nextTag()
    const el = document.createElement(tag)
    const profile: DeviceProfile = {
      name: 'Custom',
      os: 'android',
      screen: { width: 300, height: 600 },
      pixelRatio: 2,
    }
    asMutable(el).deviceProfile = profile

    customElements.define(tag, class extends DeviceFrameElement {})
    document.body.append(el)

    const frame = el as unknown as DeviceFrameElement
    expect(frame.deviceProfile).toBe(profile)
    expect(frame.device?.name).toBe('Custom')
  })

  it('setting all five before upgrade does not throw when metrics or contentRect are read afterward', () => {
    const tag = nextTag()
    const el = document.createElement(tag)
    const profile: DeviceProfile = {
      name: 'Custom',
      os: 'android',
      screen: { width: 300, height: 600 },
      pixelRatio: 2,
    }
    const mutable = asMutable(el)
    mutable.device = 'iPhone 15'
    mutable.orientation = 'landscape'
    mutable.embedded = true
    mutable.immersive = true
    mutable.deviceProfile = profile

    customElements.define(tag, class extends DeviceFrameElement {})
    document.body.append(el)

    const frame = el as unknown as DeviceFrameElement
    expect(() => frame.metrics).not.toThrow()
    expect(() => frame.contentRect).not.toThrow()
  })
})
