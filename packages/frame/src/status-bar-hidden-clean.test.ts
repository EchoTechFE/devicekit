/**
 * `render()`'s hidden branch (no status bar in landscape or embedded mode) and
 * `#renderCutout`'s no-cutout branch used to stop at hiding the element and
 * clearing `data-shape` — the inline geometry and text from whatever state
 * came before stayed on the node. A previewer that starts landscape or
 * embedded should read identically to one that started portrait/chrome and
 * was switched afterward; leftover inline styles on an element nobody is
 * supposed to be looking at are invisible until something reads them anyway
 * (a snapshot test, a host caching computed style), so this compares the two
 * construction orders property by property.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'

defineDeviceFrame()

function statusBar(el: DeviceFrameElement): HTMLElement {
  return el.shadowRoot!.querySelector<HTMLElement>('.status-bar')!
}

function timeEl(el: DeviceFrameElement): HTMLElement {
  return el.shadowRoot!.querySelector<HTMLElement>('.status-bar__time')!
}

function cutoutEl(el: DeviceFrameElement): HTMLElement {
  return el.shadowRoot!.querySelector<HTMLElement>('.status-bar__notch')!
}

const GEOMETRY_PROPS = ['height', 'width', 'top', 'left', 'border-radius'] as const

afterEach(() => {
  document.body.innerHTML = ''
})

describe('status bar leaves no stale inline state when hidden or cutout-less', () => {
  it('a landscape-created frame matches one created portrait then switched to landscape', () => {
    const direct = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
    direct.setAttribute('device', 'iPhone 15')
    direct.setAttribute('orientation', 'landscape')
    document.body.append(direct)

    const converted = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
    converted.setAttribute('device', 'iPhone 15')
    converted.setAttribute('status-bar', 'live')
    document.body.append(converted)
    converted.orientation = 'landscape'

    expect(statusBar(direct).hidden).toBe(true)
    expect(statusBar(converted).hidden).toBe(true)

    expect(timeEl(converted).textContent).toBe(timeEl(direct).textContent)
    expect(timeEl(direct).textContent).toBe('')

    for (const prop of ['height', 'color'] as const) {
      expect(statusBar(converted).style.getPropertyValue(prop)).toBe(statusBar(direct).style.getPropertyValue(prop))
      expect(statusBar(direct).style.getPropertyValue(prop)).toBe('')
    }
  })

  it('an embedded-created frame matches one created normal then switched to embedded', () => {
    const direct = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
    direct.setAttribute('device', 'iPhone 15')
    direct.setAttribute('embedded', '')
    document.body.append(direct)

    const converted = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
    converted.setAttribute('device', 'iPhone 15')
    document.body.append(converted)
    converted.embedded = true

    expect(statusBar(direct).hidden).toBe(true)
    expect(statusBar(converted).hidden).toBe(true)

    expect(timeEl(converted).textContent).toBe(timeEl(direct).textContent)
    expect(timeEl(direct).textContent).toBe('')

    for (const prop of ['height', 'color'] as const) {
      expect(statusBar(converted).style.getPropertyValue(prop)).toBe(statusBar(direct).style.getPropertyValue(prop))
      expect(statusBar(direct).style.getPropertyValue(prop)).toBe('')
    }
  })

  it('a frame created without a cutout matches one created with one then rotated to landscape (where iPhone 15 has none)', () => {
    // iPhone 15's cutout is portrait-only (see status-bar.ts's #renderCutout);
    // rotating to landscape is the same "cutout disappears" transition as
    // switching to a cutout-less device, and exercises it without depending
    // on a second preset's exact geometry.
    const direct = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
    direct.setAttribute('device', 'iPhone 15')
    direct.setAttribute('orientation', 'landscape')
    document.body.append(direct)

    const converted = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
    converted.setAttribute('device', 'iPhone 15')
    document.body.append(converted)
    converted.orientation = 'landscape'

    expect(cutoutEl(direct).hidden).toBe(true)
    expect(cutoutEl(converted).hidden).toBe(true)
    expect(cutoutEl(direct).dataset.shape).toBeUndefined()
    expect(cutoutEl(converted).dataset.shape).toBeUndefined()

    for (const prop of GEOMETRY_PROPS) {
      expect(cutoutEl(converted).style.getPropertyValue(prop)).toBe(cutoutEl(direct).style.getPropertyValue(prop))
      expect(cutoutEl(direct).style.getPropertyValue(prop)).toBe('')
    }
  })
})
