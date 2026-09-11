import { describe, expect, it } from 'vitest'
import { DEVICE_FRAME_STYLES } from './styles.js'

describe('DEVICE_FRAME_STYLES touch cursor', () => {
  it('uses a centered circular cursor only for the two touch modes', () => {
    expect(DEVICE_FRAME_STYLES).toContain(':host([data-devicekit-input-mode="mobile"]) .screen')
    expect(DEVICE_FRAME_STYLES).toContain(':host([data-devicekit-input-mode="desktop-touch"]) .screen')
    expect(DEVICE_FRAME_STYLES).toMatch(
      /cursor:\s*url\("data:image\/svg\+xml,[^"]+"\)\s*12\s+12,\s*auto/,
    )
  })

  it('uses the normal cursor for the two mouse modes', () => {
    expect(DEVICE_FRAME_STYLES).toContain(':host([data-devicekit-input-mode="mobile-no-touch"]) .screen')
    expect(DEVICE_FRAME_STYLES).toContain(':host([data-devicekit-input-mode="desktop"]) .screen')
    expect(DEVICE_FRAME_STYLES).toMatch(/cursor:\s*auto;/)
  })
})
