import { afterEach, describe, expect, it } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'

defineDeviceFrame()

function mount(inputMode?: string): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  if (inputMode !== undefined) el.setAttribute('input-mode', inputMode)
  document.body.append(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('input-mode', () => {
  it('defaults to mobile and exposes the resolved mode for slotted content', () => {
    const el = mount()

    expect(el.inputMode).toBe('mobile')
    expect(el.dataset.devicekitInputMode).toBe('mobile')
  })

  it.each(['mobile', 'mobile-no-touch', 'desktop', 'desktop-touch'] as const)(
    'accepts %s',
    (inputMode) => {
      const el = mount(inputMode)

      expect(el.inputMode).toBe(inputMode)
      expect(el.dataset.devicekitInputMode).toBe(inputMode)
    },
  )

  it('falls back to mobile for an unsupported mode', () => {
    const el = mount('gamepad')

    expect(el.inputMode).toBe('mobile')
    expect(el.dataset.devicekitInputMode).toBe('mobile')
  })

  it('reflects property assignments onto the input-mode attribute', () => {
    const el = mount()
    el.inputMode = 'desktop-touch'

    expect(el.getAttribute('input-mode')).toBe('desktop-touch')
    expect(el.dataset.devicekitInputMode).toBe('desktop-touch')
  })
})
