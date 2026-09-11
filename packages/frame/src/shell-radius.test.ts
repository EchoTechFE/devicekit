import { afterEach, describe, expect, it } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'
import { findDevice, resolveDevice } from '@devicekit/devices'

defineDeviceFrame()

function mount(attributes: Record<string, string> = {}): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
  document.body.append(el)
  return el
}

function radiusVariables(el: DeviceFrameElement): { x: string, y: string } {
  return {
    x: el.style.getPropertyValue('--device-body-radius-x'),
    y: el.style.getPropertyValue('--device-body-radius-y'),
  }
}

afterEach(() => { document.body.innerHTML = '' })

describe('modern shell corner radii follow the screen radius and adjacent oriented insets', () => {
  it('Duo outer uses elliptical per-corner radii in portrait', () => {
    expect(resolveDevice(findDevice('iPhone Duo (outer)')!).shell.bodyRadius).toBe(50)
    const el = mount({ device: 'iPhone Duo (outer)' })
    expect(radiusVariables(el)).toEqual({
      x: '51px 49px 49px 51px',
      y: '49px 49px 49px 49px',
    })
  })

  it('Duo outer rotates the same per-edge rule in landscape', () => {
    expect(resolveDevice(findDevice('iPhone Duo (outer)')!).shell.bodyRadius).toBe(50)
    const el = mount({ device: 'iPhone Duo (outer)', orientation: 'landscape' })
    expect(radiusVariables(el)).toEqual({
      x: '49px 49px 49px 49px',
      y: '51px 51px 49px 49px',
    })
  })

  it.each(['iPhone Duo (inner)', 'iPhone 15'])('%s keeps its scalar bodyRadius for uniform bezels', (name) => {
    const shell = resolveDevice(findDevice(name)!).shell
    const el = mount({ device: name })
    expect(el.style.getPropertyValue('--device-body-radius')).toBe(`${shell.bodyRadius}px`)
    expect(radiusVariables(el)).toEqual({ x: '', y: '' })
  })

  it('keeps an explicit scalar bodyRadius on a uniform custom profile', () => {
    const base = findDevice('iPhone 15')!
    const el = mount()
    el.deviceProfile = { ...base, shell: { ...base.shell, bodyRadius: 63 } }
    expect(el.style.getPropertyValue('--device-body-radius')).toBe('63px')
    expect(radiusVariables(el)).toEqual({ x: '', y: '' })
  })

  it('keeps an explicit scalar bodyRadius on a non-uniform modern custom profile', () => {
    const base = findDevice('iPhone 15')!
    const el = mount()
    el.deviceProfile = {
      ...base,
      shell: { ...base.shell, bezelInsets: { left: 8 }, bodyRadius: 63 },
    }
    expect(el.style.getPropertyValue('--device-body-radius')).toBe('63px')
    expect(radiusVariables(el)).toEqual({ x: '', y: '' })
  })
})

describe('legacy shell bodyRadius remains scalar', () => {
  it('iPhone SE keeps the explicit bodyRadius path instead of receiving modern corner variables', () => {
    const el = mount({ device: 'iPhone SE' })
    expect(el.style.getPropertyValue('--device-body-radius')).toBe('38px')
    expect(radiusVariables(el)).toEqual({ x: '', y: '' })
  })
})
