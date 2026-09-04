/**
 * `customElements.upgrade()` runs the constructor on an element that was
 * created, configured, and left detached from the document — a builder that
 * assembles the node off-screen before deciding whether to mount it at all.
 * `connectedCallback` never runs for a detached element, so a pre-upgrade own
 * property (`device` as a raw string, shadowing the getter) only gets
 * replayed if the constructor itself does it; relying on `connectedCallback`
 * leaves `device`/`profile`/`metrics`/`contentRect` unreadable until the
 * element happens to be appended, if ever.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { DeviceFrameElement } from './device-frame.js'

let tagCounter = 0
function nextTag(): string {
  tagCounter += 1
  return `x-frame-upgrade-detached-${tagCounter}`
}

interface MutableFrameProps {
  device: string | null | undefined
}

function asMutable(el: Element): MutableFrameProps {
  return el as unknown as MutableFrameProps
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('customElements.upgrade() on a detached, pre-configured element', () => {
  it('reads device/profile/metrics/contentRect without throwing, before any append', () => {
    const tag = nextTag()
    const el = document.createElement(tag)
    asMutable(el).device = 'iPhone 15'

    customElements.define(tag, class extends DeviceFrameElement {})
    expect(() => customElements.upgrade(el)).not.toThrow()

    const frame = el as unknown as DeviceFrameElement
    expect(() => frame.device).not.toThrow()
    expect(frame.device).toBeTypeOf('object')
    expect(frame.device?.name).toBe('iPhone 15')
    expect(() => frame.profile).not.toThrow()
    expect(() => frame.metrics).not.toThrow()
    expect(() => frame.contentRect).not.toThrow()
  })

  it('publishes exactly one contentrectchange once the upgraded element is appended', () => {
    const tag = nextTag()
    const el = document.createElement(tag)
    asMutable(el).device = 'iPhone 15'

    customElements.define(tag, class extends DeviceFrameElement {})
    customElements.upgrade(el)

    let fired = 0
    el.addEventListener('contentrectchange', () => {
      fired += 1
    })

    document.body.append(el)

    expect(fired).toBe(1)
  })
})
