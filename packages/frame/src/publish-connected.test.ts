/**
 * `contentrectchange` describes where a page should be positioned in the
 * viewport — meaningless before the frame has ever been laid out on screen.
 * A host that builds the element ahead of mounting it (a lazily-shown preview
 * panel) must not receive an event for a rect nobody can act on yet, and a
 * `refreshContentRect()` call on a disconnected frame must be equally silent.
 * Once connected, exactly one event announces the settled rect; disconnecting
 * stops publication until the frame is reconnected, at which point a moved
 * rect fires again.
 */
import { afterEach, describe, expect, it } from 'vitest'
import type { DeviceProfile } from '@devicekit/devices'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'

defineDeviceFrame()

afterEach(() => {
  document.body.innerHTML = ''
})

describe('contentrectchange only publishes while connected', () => {
  it('property writes and refreshContentRect() are silent until the element is appended', () => {
    const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
    let fired = 0
    el.addEventListener('contentrectchange', () => {
      fired += 1
    })

    const profile: DeviceProfile = {
      name: 'Custom',
      os: 'android',
      screen: { width: 400, height: 800 },
      pixelRatio: 2,
    }
    el.deviceProfile = profile
    expect(fired).toBe(0)

    el.refreshContentRect()
    expect(fired).toBe(0)

    document.body.append(el)
    expect(fired).toBe(1)

    el.remove()
    el.setAttribute('orientation', 'landscape')
    expect(fired).toBe(1)

    // The rect changed while disconnected (orientation flipped); reconnecting
    // has to catch up and publish the moved rect exactly once.
    document.body.append(el)
    expect(fired).toBe(2)
  })
})
