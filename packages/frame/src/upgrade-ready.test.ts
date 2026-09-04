/**
 * A frame that starts life already in the document — a preview panel that
 * builds the node, sets its own properties, then calls `customElements.define()`
 * — has to end up publishing exactly the content rect it actually settled on,
 * not an intermediate one from a default device nobody asked for. The
 * pre-upgrade `attributeChangedCallback` the platform runs ahead of
 * `connectedCallback`'s own `upgradeProperties()` call must not let a
 * bystander observe that in-between state.
 */
import { afterEach, describe, expect, it } from 'vitest'
import type { DeviceProfile } from '@devicekit/devices'
import type { ContentRect } from './content-rect.js'
import { DeviceFrameElement } from './device-frame.js'

let tagCounter = 0
function nextTag(): string {
  tagCounter += 1
  return `x-frame-upgrade-ready-${tagCounter}`
}

interface MutableFrameProps {
  device: string | null | undefined
  orientation: string | null | undefined
  deviceProfile: DeviceProfile | null | undefined
}

function asMutable(el: Element): MutableFrameProps {
  return el as unknown as MutableFrameProps
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('upgrading an already-connected, already-configured element', () => {
  it('publishes exactly one contentrectchange, carrying the final (tablet, landscape) rect', () => {
    const tag = nextTag()
    const el = document.createElement(tag)
    document.body.append(el)

    const tabletProfile: DeviceProfile = {
      name: 'Custom Android Tablet',
      os: 'android',
      formFactor: 'tablet',
      screen: { width: 576, height: 900 },
      pixelRatio: 2,
    }
    const mutable = asMutable(el)
    mutable.deviceProfile = tabletProfile
    mutable.orientation = 'landscape'
    el.setAttribute('status-bar', 'hidden')

    let totalFired = 0
    el.addEventListener('contentrectchange', () => {
      totalFired += 1
    })

    let onceDetail: ContentRect | undefined
    el.addEventListener(
      'contentrectchange',
      (event) => {
        onceDetail = (event as CustomEvent<ContentRect>).detail
      },
      { once: true },
    )

    customElements.define(tag, class extends DeviceFrameElement {})

    const frame = el as unknown as DeviceFrameElement
    expect(totalFired).toBe(1)
    expect(onceDetail).toEqual(frame.contentRect)
    // The tablet's landscape width (900) is what distinguishes the correct
    // final rect from the iPhone-shaped default the frame starts with.
    expect(onceDetail?.width).toBe(900)
  })

  it('does not throw when `device` was set as a raw string before upgrade, alongside an observed attribute', () => {
    const tag = nextTag()
    const el = document.createElement(tag)
    document.body.append(el)
    asMutable(el).device = 'iPhone 15'
    el.setAttribute('status-bar', 'hidden')

    expect(() => customElements.define(tag, class extends DeviceFrameElement {})).not.toThrow()

    const frame = el as unknown as DeviceFrameElement
    expect(frame.device?.name).toBe('iPhone 15')
  })
})
