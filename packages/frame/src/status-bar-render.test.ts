import { afterEach, describe, expect, it } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DiminaDeviceFrame } from './device-frame.js'

defineDeviceFrame()

function mountFrame(attributes: Record<string, string> = {}): DiminaDeviceFrame {
  const el = document.createElement(DEVICE_FRAME_TAG) as DiminaDeviceFrame
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
  document.body.append(el)
  return el
}

function statusBar(el: DiminaDeviceFrame): HTMLElement {
  return el.shadowRoot!.querySelector<HTMLElement>('.status-bar')!
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('the rendered status bar carries its layout mode and geometry as data-layout/CSS variables', () => {
  it('iPhone 15 renders ios-cutout with the pill-derived variables', () => {
    const bar = statusBar(mountFrame({ device: 'iPhone 15' }))
    expect(bar.dataset.layout).toBe('ios-cutout')
    expect(bar.style.getPropertyValue('--sb-time-left')).toBe('54.3px')
    expect(bar.style.getPropertyValue('--sb-trailing')).toBe('32.7px')
    expect(bar.style.getPropertyValue('--sb-center-y')).toBe('29.5px')
    expect(bar.style.getPropertyValue('--sb-scale')).toBe('1.11')
  })

  it('Pixel 7 renders the android layout', () => {
    const bar = statusBar(mountFrame({ device: 'Pixel 7' }))
    expect(bar.dataset.layout).toBe('android')
    expect(bar.style.getPropertyValue('--sb-time-left')).toBe('31px')
  })

  it('iPhone SE renders ios-classic with the leading-icons variable, since its time is centered rather than left-anchored', () => {
    const bar = statusBar(mountFrame({ device: 'iPhone SE' }))
    expect(bar.dataset.layout).toBe('ios-classic')
    expect(bar.style.getPropertyValue('--sb-leading-icons')).toBe('6px')
  })
})
