import { afterEach, describe, expect, it } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'
import { findDevice, resolveDevice } from '@devicekit/devices'
import {
  applyContinuousScreenPaint,
  clearContinuousScreenPaint,
  continuousScreenClipPath,
} from './continuous-corner-mask.js'

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
    expect(resolveDevice(findDevice('iPhone Duo (outer)')!).shell.bodyRadius).toBe(67)
    const el = mount({ device: 'iPhone Duo (outer)' })
    expect(radiusVariables(el)).toEqual({
      x: '17px 66px 66px 17px',
      y: '15px 66px 66px 15px',
    })
  })

  it('Duo outer rotates the same per-edge rule in landscape', () => {
    expect(resolveDevice(findDevice('iPhone Duo (outer)')!).shell.bodyRadius).toBe(67)
    const el = mount({ device: 'iPhone Duo (outer)', orientation: 'landscape' })
    expect(radiusVariables(el)).toEqual({
      x: '15px 15px 66px 66px',
      y: '17px 17px 66px 66px',
    })
  })

  it('Duo outer publishes the near-right-angle hinge corners and near-semicircle free-edge corners, rotated with orientation', () => {
    const portrait = mount({ device: 'iPhone Duo (outer)' })
    expect(cornerVariables(portrait)).toEqual({ topLeft: '8px', topRight: '59px', bottomRight: '59px', bottomLeft: '8px' })

    const landscape = mount({ device: 'iPhone Duo (outer)', orientation: 'landscape' })
    expect(cornerVariables(landscape)).toEqual({ topLeft: '8px', topRight: '8px', bottomRight: '59px', bottomLeft: '59px' })
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


describe('screen continuous paint path', () => {
  it('iOS continuous applies inline Figma clip-path on screen and body (rounded chrome)', () => {
    const ios = mount({ device: 'iPhone 17 Pro' })
    expect(ios.style.getPropertyValue('--device-screen-corner-shape')).toBe('round')
    expect(ios.style.getPropertyValue('--device-screen-css-border-radius')).toBe('0')
    expect(ios.style.getPropertyValue('--device-body-css-border-radius')).toBe('0')
    expect(ios.style.getPropertyValue('--device-body-overflow')).toBe('hidden')
    const iosScreen = ios.shadowRoot?.querySelector('.screen') as HTMLElement
    const clip = iosScreen.style.clipPath || iosScreen.style.getPropertyValue('clip-path')
    expect(clip.startsWith('path(')).toBe(true)
    expect(iosScreen.style.getPropertyValue('mask-image')).toBe('none')
    const body = ios.shadowRoot?.querySelector('.body') as HTMLElement
    expect(body.style.overflow).toBe('hidden')
    const bodyClip = body.style.clipPath || body.style.getPropertyValue('clip-path')
    expect(bodyClip.startsWith('path(')).toBe(true)

    const android = mount({ device: 'Galaxy S24' })
    expect(android.style.getPropertyValue('--device-screen-corner-shape')).toBe('round')
    expect(android.style.getPropertyValue('--device-screen-css-border-radius')).toBe('')
    expect(android.style.getPropertyValue('--device-body-overflow')).toBe('')
    const androidScreen = android.shadowRoot?.querySelector('.screen') as HTMLElement
    expect(androidScreen.style.clipPath || androidScreen.style.getPropertyValue('clip-path')).toBe('')
  })

  it('clip builder returns a Figma path() clip for continuous paint', () => {
    const clip = continuousScreenClipPath(80, 120, { topLeft: 20, topRight: 20, bottomRight: 20, bottomLeft: 20 })
    expect(clip.startsWith('path("')).toBe(true)
    expect(clip).toContain('M ')
    expect(continuousScreenClipPath(0, 10, { topLeft: 1, topRight: 1, bottomRight: 1, bottomLeft: 1 })).toBe('none')
  })
})

describe('applyContinuousScreenPaint fallback gate', () => {
  function paintHost() {
    const host = document.createElement('div')
    const screen = document.createElement('div')
    const body = document.createElement('div')
    document.body.append(host, screen, body)
    return { host, screen, body }
  }

  it('when clip is none: keeps circular CSS radius (not 0) and clears body overrides', () => {
    const { host, screen, body } = paintHost()
    host.style.setProperty('--device-screen-css-border-radius', '0')
    host.style.setProperty('--device-body-css-border-radius', '0')
    host.style.setProperty('--device-body-overflow', 'hidden')
    body.style.overflow = 'hidden'

    const mode = applyContinuousScreenPaint({
      screen,
      body,
      hostStyle: host.style,
      clip: 'none',
    })
    expect(mode).toBe('circular-fallback')
    expect(host.style.getPropertyValue('--device-screen-css-border-radius')).toBe('')
    expect(host.style.getPropertyValue('--device-body-css-border-radius')).toBe('')
    expect(host.style.getPropertyValue('--device-body-overflow')).toBe('')
    expect(body.style.overflow).toBe('')
    expect(screen.style.clipPath || screen.style.getPropertyValue('clip-path')).toBe('')
  })

  it('when clip is path(): applies hard clip, zeroes CSS radii, applies bodyClip when provided', () => {
    const { host, screen, body } = paintHost()
    const clip = continuousScreenClipPath(40, 60, { topLeft: 10, topRight: 10, bottomRight: 10, bottomLeft: 10 })
    const bodyClip = continuousScreenClipPath(52, 72, { topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16 })
    expect(clip.startsWith('path("')).toBe(true)
    const mode = applyContinuousScreenPaint({
      screen,
      body,
      hostStyle: host.style,
      clip,
      bodyClip,
    })
    expect(mode).toBe('continuous-clip')
    expect(host.style.getPropertyValue('--device-screen-css-border-radius')).toBe('0')
    expect(host.style.getPropertyValue('--device-body-css-border-radius')).toBe('0')
    expect(host.style.getPropertyValue('--device-body-overflow')).toBe('hidden')
    expect(body.style.overflow).toBe('hidden')
    expect(screen.style.clipPath).toBe(clip)
    expect(screen.style.getPropertyValue('mask-image')).toBe('none')
    expect(body.style.clipPath).toBe(bodyClip)
  })

  it('clearContinuousScreenPaint removes clip and continuous radius overrides', () => {
    const { host, screen, body } = paintHost()
    const clip = continuousScreenClipPath(40, 60, { topLeft: 10, topRight: 10, bottomRight: 10, bottomLeft: 10 })
    applyContinuousScreenPaint({ screen, body, hostStyle: host.style, clip })
    clearContinuousScreenPaint({ screen, body, hostStyle: host.style })
    expect(host.style.getPropertyValue('--device-screen-css-border-radius')).toBe('')
    expect(host.style.getPropertyValue('--device-body-overflow')).toBe('')
    expect(screen.style.clipPath || screen.style.getPropertyValue('clip-path')).toBe('')
    expect(body.style.overflow).toBe('')
  })
})
