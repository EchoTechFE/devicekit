/**
 * The `.body` / `.screen` corner radii fold the frame's hairline border width
 * into the radius math (see DEVICE_FRAME_BORDER_WIDTH in styles.ts): the body
 * radius sits outside the border, so the border needs to be added on top of
 * it to stay concentric with the screen, and the screen radius sits inside
 * both the bezel and the border, so both need to be subtracted — floored at
 * 0 so a body radius smaller than the bezel+border never asks for a negative
 * radius.
 */
import { describe, expect, it } from 'vitest'
import { DEVICE_FRAME_STYLES } from './styles.js'

/**
 * Isolates one top-level rule's declaration block. Anchored to the start of a
 * line so `.body {` (line-initial) is not confused with the compound
 * `:host([embedded]) .body {` override, which shares the same selector text
 * but never starts a line.
 */
function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.[\]()]/g, '\\$&')
  const match = new RegExp(`\\n${escaped}\\s*\\{([^}]*)\\}`).exec(DEVICE_FRAME_STYLES)
  if (!match) throw new Error(`no top-level rule found for ${selector} in DEVICE_FRAME_STYLES`)
  return (match[1] ?? '').replace(/\s+/g, ' ').trim()
}

describe('DEVICE_FRAME_STYLES corner radius variables', () => {
  it('declares --device-frame-border-width: 1px', () => {
    expect(DEVICE_FRAME_STYLES).toMatch(/--device-frame-border-width:\s*1px/)
  })

  it('builds --device-frame-border from --device-frame-border-width', () => {
    expect(DEVICE_FRAME_STYLES).toMatch(/--device-frame-border:[^;]*var\(--device-frame-border-width\)/)
  })

  it('.body border-radius adds the border width to the resolved body radius', () => {
    expect(ruleBody('.body')).toMatch(
      /border-radius:\s*var\(--device-frame-radius,\s*calc\(var\(--device-body-radius\)\s*\+\s*var\(--device-frame-border-width\)\)\)/,
    )
  })

  it('.screen border-radius subtracts the bezel and border width, floored at 0', () => {
    expect(ruleBody('.screen')).toMatch(
      /border-radius:\s*max\(0px,\s*calc\(\s*var\(--device-frame-radius,\s*calc\(var\(--device-screen-radius\)\s*\+\s*var\(--device-bezel\)\s*\+\s*var\(--device-frame-border-width\)\)\)\s*-\s*var\(--device-bezel\)\s*-\s*var\(--device-frame-border-width\)\)\)/,
    )
  })
})
