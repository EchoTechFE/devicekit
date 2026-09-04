/**
 * Guards `set deviceProfile(v)`: a caller-supplied profile skips the shared
 * device table entirely, so nothing else checks its shape before it reaches
 * layout math that assumes `os` and `screen` exist. The setter has to defer
 * to `@devicekit/devices`'s own `assertDeviceProfile` — the table's single
 * source of truth for what a valid profile looks like — rather than growing
 * a second, drifting copy of that shape check here, and it has to reject
 * before touching any element state so a bad assignment can't half-apply.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { assertDeviceProfile, type DeviceProfile } from '@devicekit/devices'
import { defineDeviceFrame, DEVICE_FRAME_TAG, type DeviceFrameElement } from './device-frame.js'

defineDeviceFrame()

function mountFrame(): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  document.body.append(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

const VALID_PROFILE: DeviceProfile = {
  name: 'Custom Phone',
  os: 'ios',
  screen: { width: 390, height: 844 },
  pixelRatio: 3,
}

describe('deviceProfile setter validation', () => {
  it('rejects a profile missing required fields with a TypeError naming the field', () => {
    const el = mountFrame()
    expect(() => {
      el.deviceProfile = {} as DeviceProfile
    }).toThrow(TypeError)
    expect(() => {
      el.deviceProfile = {} as DeviceProfile
    }).toThrow(/deviceProfile\.os/)
  })

  it('rejects a profile whose screen is not an object', () => {
    const el = mountFrame()
    expect(() => {
      el.deviceProfile = { os: 'ios', screen: null } as unknown as DeviceProfile
    }).toThrow(/deviceProfile\.screen/)
  })

  it('rejects a value that is not an object at all', () => {
    const el = mountFrame()
    expect(() => {
      el.deviceProfile = 'iPhone' as unknown as DeviceProfile
    }).toThrow(TypeError)
  })

  it('leaves the element on its previous profile and metrics readable after a rejected assignment', () => {
    const el = mountFrame()
    el.deviceProfile = VALID_PROFILE

    expect(() => {
      el.deviceProfile = { os: 'ios', screen: null } as unknown as DeviceProfile
    }).toThrow(TypeError)

    expect(el.deviceProfile).toEqual(VALID_PROFILE)
    expect(() => el.metrics).not.toThrow()
  })

  it('accepts a well-formed profile', () => {
    const el = mountFrame()
    el.deviceProfile = VALID_PROFILE
    expect(el.metrics.screen).toEqual(VALID_PROFILE.screen)
  })

  it('defers to the shared devices validator rather than duplicating its rules', () => {
    expect(() => assertDeviceProfile({} as DeviceProfile)).toThrow(TypeError)
  })
})
