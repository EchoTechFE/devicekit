import { describe, expect, it } from 'vitest'
import { devicePath, deviceSlug } from './demo-device-url.js'

describe('deviceSlug', () => {
  it('makes stable, readable paths from punctuation-heavy device names', () => {
    expect(deviceSlug('iPhone 18 Pro')).toBe('iphone-18-pro')
    expect(deviceSlug('HUAWEI Mate X5 (inner)')).toBe('huawei-mate-x5-inner')
    expect(deviceSlug('iPad Pro 12.9-inch (6th gen)')).toBe('ipad-pro-12-9-inch-6th-gen')
  })
})

describe('devicePath', () => {
  it('keeps every device page below the devices collection', () => {
    expect(devicePath('iPhone Duo')).toBe('devices/iphone-duo/')
  })
})
