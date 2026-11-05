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

  it('.body border-radius accepts per-corner elliptical variables with scalar fallback', () => {
    expect(ruleBody('.body')).toMatch(
      /border-radius:\s*var\(--device-body-css-border-radius,\s*var\(--device-frame-radius,\s*var\(--device-body-radius-x,\s*calc\(var\(--device-body-radius\)\s*\+\s*var\(--device-frame-border-width\)\)\)\s*\/\s*var\(--device-body-radius-y,\s*calc\(var\(--device-body-radius\)\s*\+\s*var\(--device-frame-border-width\)\)\)\)\)/,
    )
  })

  it('.screen uses per-corner effective radii that each preserve the host override calculation', () => {
    expect(ruleBody('.screen')).toMatch(
      /border-radius:\s*var\(--device-screen-css-border-radius,\s*var\(--device-screen-radius-effective-top-left\)\s*var\(--device-screen-radius-effective-top-right\)\s*var\(--device-screen-radius-effective-bottom-right\)\s*var\(--device-screen-radius-effective-bottom-left\)\)/,
    )
    for (const corner of ['top-left', 'top-right', 'bottom-right', 'bottom-left']) {
      const pattern = new RegExp(
        `--device-screen-radius-effective-${corner}:\\s*max\\(0px,\\s*calc\\(var\\(--device-frame-radius,\\s*calc\\(var\\(--device-screen-radius-${corner}\\)\\s*\\+\\s*var\\(--device-bezel\\)\\s*\\+\\s*var\\(--device-frame-border-width\\)\\)\\)\\s*-\\s*var\\(--device-bezel\\)\\s*-\\s*var\\(--device-frame-border-width\\)\\)\\)`,
      )
      expect(DEVICE_FRAME_STYLES).toMatch(pattern)
    }
  })

  it('.screen declares corner-shape from --device-screen-corner-shape (continuous only on screen)', () => {
    expect(ruleBody('.screen')).toMatch(/corner-shape:\s*var\(--device-screen-corner-shape\)/)
    expect(ruleBody('.body')).not.toMatch(/corner-shape/)
  })

  it('keeps circular border-radius fallback vars; continuous paint is inline Figma clip-path', () => {
    const screen = ruleBody('.screen')
    // CSS-var clip-path hook stays present but inert for continuous;
    // authoritative paint is inline Figma clip-path from DeviceFrame.
    expect(screen).toMatch(/clip-path:\s*var\(--device-screen-clip-path/)
    expect(screen).toMatch(/mask-image:\s*none/)
    expect(screen).toMatch(/border-radius:\s*var\(--device-screen-css-border-radius,/)
    expect(DEVICE_FRAME_STYLES).toMatch(/inline.*Figma|Figma.*clip-path/i)
    expect(DEVICE_FRAME_STYLES).not.toMatch(/@supports\s+not\s*\(corner-shape:\s*squircle\)/)
    const body = ruleBody('.body')
    expect(body).toMatch(/overflow:\s*var\(--device-body-overflow,\s*hidden\)/)
    expect(body).toMatch(/--device-body-css-border-radius/)
  })
})

