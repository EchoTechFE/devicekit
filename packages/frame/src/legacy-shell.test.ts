import { findDevice, resolveDevice } from '@devicekit/devices'
import { afterEach, describe, expect, it } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'
import { frameOuterSize } from './frame-size.js'
import { DEVICE_FRAME_BORDER_WIDTH, DEVICE_FRAME_STYLES } from './styles.js'

defineDeviceFrame()

function mount(attributes: Record<string, string>): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
  document.body.append(el)
  return el
}

afterEach(() => { document.body.innerHTML = '' })

describe('legacy iPhone shell', () => {
  it('resolves a distinct top/bottom bezel and physical Home button, while modern iPhones keep the uniform shell', () => {
    const legacy = resolveDevice(findDevice('iPhone SE')!)
    const modern = resolveDevice(findDevice('iPhone 15')!)

    expect(legacy.shell.bezelInsets.top).toBeGreaterThan(legacy.shell.bezel)
    expect(legacy.shell.bezelInsets.bottom).toBeGreaterThan(legacy.shell.bezel)
    expect(legacy.shell.homeButton).toEqual({ diameter: 30 })
    expect(modern.shell.bezelInsets).toEqual({ top: modern.shell.bezel, right: modern.shell.bezel, bottom: modern.shell.bezel, left: modern.shell.bezel })
    expect(modern.shell.homeButton).toBeNull()
  })

  it('adds each oriented shell edge to frameOuterSize', () => {
    const profile = findDevice('iPhone 7 Plus')!
    const shell = resolveDevice(profile).shell
    expect(frameOuterSize(profile, 'portrait')).toEqual({
      width: 414 + shell.bezelInsets.left + shell.bezelInsets.right + 2 * DEVICE_FRAME_BORDER_WIDTH,
      height: 736 + shell.bezelInsets.top + shell.bezelInsets.bottom + 2 * DEVICE_FRAME_BORDER_WIDTH,
    })
    expect(frameOuterSize(profile, 'landscape')).toEqual({
      width: 736 + shell.bezelInsets.top + shell.bezelInsets.bottom + 2 * DEVICE_FRAME_BORDER_WIDTH,
      height: 414 + shell.bezelInsets.left + shell.bezelInsets.right + 2 * DEVICE_FRAME_BORDER_WIDTH,
    })
  })

  it('rotates the button from the portrait bottom onto its 48px landscape left bezel', () => {
    const portrait = mount({ device: 'iPhone SE' })
    const landscape = mount({ device: 'iPhone SE', orientation: 'landscape' })
    const modern = mount({ device: 'iPhone 15' })

    expect(portrait.shadowRoot!.querySelector<HTMLElement>('.home-button')?.hidden).toBe(false)
    expect(portrait.shadowRoot!.querySelector<HTMLElement>('.home-button')?.dataset.edge).toBe('bottom')
    expect(landscape.shadowRoot!.querySelector<HTMLElement>('.home-button')?.dataset.edge).toBe('left')
    expect(modern.shadowRoot!.querySelector('.home-button')).toBeNull()
    expect(portrait.style.getPropertyValue('--device-bezel-top')).toBe('44px')
    expect(landscape.style.getPropertyValue('--device-bezel-left')).toBe('48px')
    expect(DEVICE_FRAME_STYLES).toMatch(/padding:\s*var\(--device-bezel-top\)/)
  })

  it('restores the Home button and shell variables after legacy → modern → legacy', () => {
    const el = mount({ device: 'iPhone SE' })
    expect(el.shadowRoot!.querySelector<HTMLElement>('.home-button')?.dataset.edge).toBe('bottom')
    el.setAttribute('device', 'iPhone 15')
    expect(el.shadowRoot!.querySelector('.home-button')).toBeNull()
    el.setAttribute('device', 'iPhone SE')
    const button = el.shadowRoot!.querySelector<HTMLElement>('.home-button')!
    expect(button.parentElement?.className).toBe('body')
    expect(button.dataset.edge).toBe('bottom')
    expect(el.style.getPropertyValue('--device-bezel-bottom')).toBe('48px')
  })

  it('restores the Home button after embedded mode is removed', () => {
    const el = mount({ device: 'iPhone SE' })
    el.embedded = true
    expect(el.shadowRoot!.querySelector('.home-button')).toBeNull()
    el.embedded = false
    expect(el.shadowRoot!.querySelector<HTMLElement>('.home-button')?.parentElement?.className).toBe('body')
    expect(el.style.getPropertyValue('--device-bezel-top')).toBe('44px')
  })
})

describe('hidden status-bar retains physical cutouts', () => {
  it('keeps the Dynamic Island but hides time and icons', () => {
    const el = mount({ device: 'iPhone 17 Pro Max', 'status-bar': 'hidden' })
    const root = el.shadowRoot!
    expect(root.querySelector<HTMLElement>('.status-bar__notch')!.hidden).toBe(false)
    expect(root.querySelector<HTMLElement>('.status-bar__notch')!.dataset.shape).toBe('pill')
    expect(root.querySelector<HTMLElement>('.status-bar__time')!.hidden).toBe(true)
    expect(root.querySelector<HTMLElement>('.status-bar__icons')!.hidden).toBe(true)
    expect(root.querySelector<HTMLElement>('.status-bar')!.style.backgroundColor).toBe('')
    expect(DEVICE_FRAME_STYLES).toMatch(/\.status-bar__icons\[hidden\]\s*\{\s*display:\s*none;/)
  })

  it('does not paint a status-bar background while only the cutout remains', () => {
    const el = mount({ device: 'iPhone 15', 'status-bar': 'hidden', 'status-bar-background': '#07c160' })
    expect(el.shadowRoot!.querySelector<HTMLElement>('.status-bar')!.style.backgroundColor).toBe('')
  })

  it('does not retain a cutout in landscape or embedded mode', () => {
    const landscape = mount({ device: 'iPhone 15', orientation: 'landscape', 'status-bar': 'hidden' })
    const embedded = mount({ device: 'iPhone 15', embedded: '', 'status-bar': 'hidden' })
    expect(landscape.shadowRoot!.querySelector<HTMLElement>('.status-bar__notch')!.hidden).toBe(true)
    expect(embedded.shadowRoot!.querySelector<HTMLElement>('.status-bar__notch')!.hidden).toBe(true)
  })

  it('restores status-bar content without replacing the cutout when toggled', () => {
    const el = mount({ device: 'iPhone 15', 'status-bar': 'hidden' })
    const root = el.shadowRoot!
    el.removeAttribute('status-bar')
    expect(root.querySelector<HTMLElement>('.status-bar__notch')!.hidden).toBe(false)
    expect(root.querySelector<HTMLElement>('.status-bar__time')!.hidden).toBe(false)
    expect(root.querySelector<HTMLElement>('.status-bar__icons')!.hidden).toBe(false)
  })
})
