/**
 * `formFactor` distinguishes a phone from a tablet, and it has to survive the
 * whole path from a device preset through the frame's own attribute-merging
 * to the generated user agent: a tablet-shaped profile that quietly resolves
 * back to the default `'phone'` would draw the wrong chrome and lie about its
 * UA string. Also checks that the type devicekit hosts import
 * (`DeviceFormFactor`) is actually re-exported from this package's entry
 * point, not just from `@devicekit/devices`.
 */
import { describe, expect, expectTypeOf, it } from 'vitest'
import { findDevice, type DeviceProfile } from '@devicekit/devices'
import type { DeviceFormFactor } from './index.js'
import { profileFromAttributes } from './attributes.js'
import { DeviceFrameElement } from './device-frame.js'

let tagCounter = 0
function nextTag(): string {
  tagCounter += 1
  return `x-frame-formfactor-${tagCounter}`
}

function defineFrame(tag: string): void {
  customElements.define(tag, class extends DeviceFrameElement {})
}

describe('DeviceFormFactor type re-export', () => {
  it('is importable from the package entry and matches the devices package', () => {
    expectTypeOf<DeviceFormFactor>().toEqualTypeOf<'phone' | 'tablet'>()
  })
})

describe('profileFromAttributes carries formFactor through', () => {
  it("passes a tablet preset's formFactor into the merged profile", () => {
    const el = document.createElement('div')
    const named: DeviceProfile = {
      name: 'Some Tablet',
      os: 'android',
      formFactor: 'tablet',
      screen: { width: 800, height: 1280 },
      pixelRatio: 2,
    }
    const merged = profileFromAttributes(el, named, { width: 400, height: 800 })
    expect(merged.formFactor).toBe('tablet')
  })

  it('leaves formFactor absent for a preset that states none, same as no preset at all', () => {
    const el = document.createElement('div')
    const named: DeviceProfile = {
      name: 'Some Phone',
      os: 'ios',
      screen: { width: 390, height: 844 },
      pixelRatio: 3,
    }
    const merged = profileFromAttributes(el, named, { width: 400, height: 800 })
    expect(merged.formFactor).toBeUndefined()
  })
})

describe('<device-frame> formFactor end to end', () => {
  it('an iPad preset resolves to a tablet profile with a desktop-Safari-shaped UA', () => {
    const ipad = findDevice('iPad Pro M4')
    expect(ipad?.formFactor).toBe('tablet')

    const tag = nextTag()
    defineFrame(tag)
    const el = document.createElement(tag) as DeviceFrameElement
    el.setAttribute('device', 'iPad Pro M4')
    document.body.append(el)

    expect(el.profile.formFactor).toBe('tablet')
    expect(el.metrics.userAgent.startsWith('Mozilla/5.0 (Macintosh')).toBe(true)
  })

  it('an Android tablet profile with no explicit userAgent omits "Mobile" from the generated UA', () => {
    // Pixel Tablet is the shared table's own android tablet preset, but it
    // carries an explicit `userAgent` (skipping generation entirely), so the
    // generated-UA path needs a profile that has none.
    expect(findDevice('Pixel Tablet')?.formFactor).toBe('tablet')

    const tag = nextTag()
    defineFrame(tag)
    const el = document.createElement(tag) as DeviceFrameElement
    document.body.append(el)
    el.deviceProfile = {
      name: 'Custom Android Tablet',
      os: 'android',
      formFactor: 'tablet',
      screen: { width: 900, height: 576 },
      pixelRatio: 2,
    }

    expect(el.metrics.userAgent).not.toContain('Mobile')
  })

  it('a HarmonyOS tablet profile reports "Tablet;" and not "Phone;" in its UA', () => {
    const tag = nextTag()
    defineFrame(tag)
    const el = document.createElement(tag) as DeviceFrameElement
    document.body.append(el)
    el.deviceProfile = {
      name: 'Custom Harmony Tablet',
      os: 'harmony',
      formFactor: 'tablet',
      screen: { width: 900, height: 576 },
      pixelRatio: 2,
    }

    expect(el.metrics.userAgent).toContain('Tablet;')
    expect(el.metrics.userAgent).not.toContain('Phone;')
  })
})
