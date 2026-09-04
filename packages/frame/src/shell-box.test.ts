import { describe, expect, it } from 'vitest'
import { DEVICE_FRAME_STYLES } from './styles.js'

/*
 * The frame border must sit outside the screen size, or a 375pt iPhone renders
 * a screen a couple of pixels narrower than its own metrics and CSS variables
 * say. Two invariants: the sizing rule is content-box (or a border-box calc
 * that folds the border width back in), and it lives on a shadow-tree .body
 * element, not :host, because a light-DOM `* { box-sizing: border-box }` reset
 * overrides :host declarations and would silently reintroduce the shrink.
 */
describe('.body box model keeps the frame border outside the screen size', () => {
  const hostRule = DEVICE_FRAME_STYLES.split('\n.body {')[1]?.split('\n}')[0] ?? ''

  it('sizes the body in the shadow tree, not on :host', () => {
    const host = DEVICE_FRAME_STYLES.split(':host {')[1]?.split('\n}')[0] ?? ''
    expect(host).not.toMatch(/^\s*width\s*:/m)
    expect(host).not.toMatch(/^\s*border\s*:/m)
    expect(hostRule).toMatch(/border\s*:\s*var\(--device-frame-border\)/)
  })

  it('is content-box sized purely by --device-width/--device-height, or border-box sized with a border-width variable folded into the calc', () => {
    const boxSizing = hostRule.match(/box-sizing\s*:\s*(content-box|border-box)/)?.[1]
    expect(boxSizing).toBeDefined()

    // Only the declaration line, not the --device-width/--device-height
    // custom property lines further up the same rule.
    const widthDecl = hostRule.match(/^\s*width\s*:\s*([^;]+);/m)?.[1] ?? ''

    if (boxSizing === 'content-box') {
      expect(widthDecl.replace(/\s+/g, '')).toBe('var(--device-width)')
    }
    else {
      expect(widthDecl).toMatch(/--device-bezel/)
      // some border-width custom property must also enter the calc, distinct
      // from --device-bezel, or the border still eats into the box.
      const borderWidthVars = widthDecl.match(/var\(--[\w-]*border[\w-]*\)/g) ?? []
      expect(borderWidthVars.length).toBeGreaterThan(0)
    }
  })

  it(':host([embedded]) .body still collapses to a plain fill: width/height 100%, no padding, no border', () => {
    const embeddedRule = DEVICE_FRAME_STYLES.split(':host([embedded]) .body {')[1]?.split('}')[0] ?? ''
    expect(embeddedRule).toMatch(/width\s*:\s*100%/)
    expect(embeddedRule).toMatch(/height\s*:\s*100%/)
    expect(embeddedRule).toMatch(/padding\s*:\s*0\b/)
    expect(embeddedRule).toMatch(/border\s*:\s*0\b/)
  })
})
