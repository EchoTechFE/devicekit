import { afterEach, describe, expect, it } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'

defineDeviceFrame()

function mount(interactionMode?: string): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  if (interactionMode !== undefined) el.setAttribute('interaction-mode', interactionMode)
  document.body.append(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('interaction-mode', () => {
  it('defaults to mobile and exposes the resolved mode for slotted content', () => {
    const el = mount()

    expect(el.interactionMode).toBe('mobile')
    expect(el.dataset.devicekitInteractionMode).toBe('mobile')
  })

  it.each(['mobile', 'mobile-no-touch', 'desktop', 'desktop-touch'] as const)(
    'accepts %s',
    (interactionMode) => {
      const el = mount(interactionMode)

      expect(el.interactionMode).toBe(interactionMode)
      expect(el.dataset.devicekitInteractionMode).toBe(interactionMode)
    },
  )

  it('falls back to mobile for an unsupported mode', () => {
    const el = mount('gamepad')

    expect(el.interactionMode).toBe('mobile')
    expect(el.dataset.devicekitInteractionMode).toBe('mobile')
  })

  it('reflects property assignments onto the interaction-mode attribute', () => {
    const el = mount()
    el.interactionMode = 'desktop-touch'

    expect(el.getAttribute('interaction-mode')).toBe('desktop-touch')
    expect(el.dataset.devicekitInteractionMode).toBe('desktop-touch')
  })
})
