import type { PresetDeviceProfile } from '@devicekit/devices'
import { describe, expect, it } from 'vitest'
import { DEMO_DEFAULT_DEVICE_NAME, newestDevicesFirst } from './demo-device-order.js'

function device(name: string, releaseYear: number): PresetDeviceProfile {
  return {
    name,
    os: 'ios',
    screen: { width: 390, height: 844 },
    pixelRatio: 3,
    system: 'iOS 18.0',
    releaseYear,
  }
}

describe('newestDevicesFirst', () => {
  it('sorts devices by release year without changing the input order for ties', () => {
    const devices = [
      device('Older', 2024),
      device('Newest A', 2026),
      device('Middle', 2025),
      device('Newest B', 2026),
    ]

    expect(newestDevicesFirst(devices).map(({ name }) => name)).toEqual([
      'Newest A',
      'Newest B',
      'Middle',
      'Older',
    ])
    expect(devices.map(({ name }) => name)).toEqual(['Older', 'Newest A', 'Middle', 'Newest B'])
  })
})

describe('DEMO_DEFAULT_DEVICE_NAME', () => {
  it('defaults the demo to iPhone 18 Pro', () => {
    expect(DEMO_DEFAULT_DEVICE_NAME).toBe('iPhone 18 Pro')
  })
})
