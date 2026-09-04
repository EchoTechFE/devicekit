import { describe, expect, it } from 'vitest'
import { deviceNameKey } from './device-names.js'
import { DEVICE_NAMES } from './device-names.generated.js'
import { DEVICES, findDevice } from './presets/index.js'
import { DEVICE_NAMES as FROM_INDEX, deviceNameKey as keyFromIndex, type DeviceName } from './index.js'

describe('deviceNameKey', () => {
  it.each([
    ['iPhone 16 Pro', 'iPhone_16_Pro'],
    ['iPhone 6/7/8 Plus', 'iPhone_6_7_8_Plus'],
    ['iPhone 12/13 (Pro)', 'iPhone_12_13_Pro'],
    ['iPad Pro 10.5-inch', 'iPad_Pro_10_5_inch'],
    ['iPad (gen 5)', 'iPad_gen_5'],
    ['Samsung Galaxy S8+', 'Samsung_Galaxy_S8'],
    ['Pixel 4a (5G)', 'Pixel_4a_5G'],
    ['HUAWEI Mate X5 (inner)', 'HUAWEI_Mate_X5_inner'],
    ['3rd Gen Thing', '_3rd_Gen_Thing'],
    ['  spaced  ', 'spaced'],
  ])('turns %s into %s', (name, expected) => {
    expect(deviceNameKey(name)).toBe(expected)
  })
})

describe('DEVICE_NAMES', () => {
  it('maps every device name to itself under its key', () => {
    const map = DEVICE_NAMES as Record<string, string>
    for (const device of DEVICES) {
      expect(map[deviceNameKey(device.name)]).toBe(device.name)
    }
  })

  it('has exactly one entry per device in the table', () => {
    expect(Object.keys(DEVICE_NAMES).length).toBe(DEVICES.length)
  })

  it('resolves every value back to a real device via findDevice', () => {
    for (const value of Object.values(DEVICE_NAMES)) {
      expect(findDevice(value)?.name).toBe(value)
    }
  })

  it('uses only legal identifier keys with no double underscore', () => {
    for (const key of Object.keys(DEVICE_NAMES)) {
      expect(key).toMatch(/^[A-Za-z_][A-Za-z0-9_]*$/)
      expect(key).not.toContain('__')
    }
  })

  it('never collides two different device names onto the same key', () => {
    const keys = new Set(DEVICES.map((d) => deviceNameKey(d.name)))
    expect(keys.size).toBe(DEVICES.length)
  })
})

describe('index re-exports', () => {
  it('re-exports the same DEVICE_NAMES object', () => {
    expect(FROM_INDEX).toBe(DEVICE_NAMES)
  })

  it('re-exports the same deviceNameKey function', () => {
    expect(keyFromIndex).toBe(deviceNameKey)
  })

  it('lets a constant name resolve through findDevice', () => {
    expect(findDevice(DEVICE_NAMES.iPhone_16_Pro)?.name).toBe('iPhone 16 Pro')
  })

  it('types DeviceName as the union of device name literals', () => {
    const ok: DeviceName = DEVICE_NAMES.iPhone_16_Pro
    expect(ok).toBe('iPhone 16 Pro')

    // @ts-expect-error 非设备名不能赋给 DeviceName
    const bad: DeviceName = 'not a device'
    expect(bad).toBe('not a device')
  })
})
