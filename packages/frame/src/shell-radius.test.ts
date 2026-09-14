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

function cornerVariables(el: DeviceFrameElement): { topLeft: string, topRight: string, bottomRight: string, bottomLeft: string } {
  return {
    topLeft: el.style.getPropertyValue('--device-screen-radius-top-left'),
    topRight: el.style.getPropertyValue('--device-screen-radius-top-right'),
    bottomRight: el.style.getPropertyValue('--device-screen-radius-bottom-right'),
    bottomLeft: el.style.getPropertyValue('--device-screen-radius-bottom-left'),
  }
}

afterEach(() => { document.body.innerHTML = '' })

describe('modern shell corner radii follow the screen radius and adjacent oriented insets', () => {
  it('Duo outer uses elliptical per-corner radii in portrait', () => {
    expect(resolveDevice(findDevice('iPhone Duo (outer)')!).shell.bodyRadius).toBe(74)
    const el = mount({ device: 'iPhone Duo (outer)' })
    expect(radiusVariables(el)).toEqual({
      x: '21px 73px 73px 21px',
      y: '19px 73px 73px 19px',
    })
  })

  it('Duo outer rotates the same per-edge rule in landscape', () => {
    expect(resolveDevice(findDevice('iPhone Duo (outer)')!).shell.bodyRadius).toBe(74)
    const el = mount({ device: 'iPhone Duo (outer)', orientation: 'landscape' })
    expect(radiusVariables(el)).toEqual({
      x: '19px 19px 73px 73px',
      y: '21px 21px 73px 73px',
    })
  })

  it('Duo outer publishes the near-right-angle hinge corners and near-semicircle free-edge corners, rotated with orientation', () => {
    const portrait = mount({ device: 'iPhone Duo (outer)' })
    expect(cornerVariables(portrait)).toEqual({ topLeft: '12px', topRight: '66px', bottomRight: '66px', bottomLeft: '12px' })

    const landscape = mount({ device: 'iPhone Duo (outer)', orientation: 'landscape' })
    expect(cornerVariables(landscape)).toEqual({ topLeft: '12px', topRight: '12px', bottomRight: '66px', bottomLeft: '66px' })
  })

  it('publishes body-radius-x/y for a non-uniform screenCorners profile even when bezelInsets stay uniform', () => {
    const base = findDevice('iPhone 15')!
    const el = mount()
    el.deviceProfile = { ...base, shell: { ...base.shell, screenCorners: { topLeft: 10 } } }
    expect(radiusVariables(el)).not.toEqual({ x: '', y: '' })
  })

  it('keeps an explicit scalar bodyRadius on a non-uniform screenCorners profile', () => {
    const base = findDevice('iPhone 15')!
    const el = mount()
    el.deviceProfile = { ...base, shell: { ...base.shell, screenCorners: { topLeft: 10 }, bodyRadius: 63 } }
    expect(el.style.getPropertyValue('--device-body-radius')).toBe('63px')
    expect(radiusVariables(el)).toEqual({ x: '', y: '' })
  })

  it('keeps a zero-radius shell (no screenCorners override) scalar', () => {
    const base = findDevice('iPhone 15')!
    const el = mount()
    el.deviceProfile = { ...base, shell: { ...base.shell, screenRadius: 0 } }
    expect(radiusVariables(el)).toEqual({ x: '', y: '' })
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
