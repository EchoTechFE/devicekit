/**
 * The status bar has no background of its own — it's transparent so the
 * device's status bar icons composite over whatever sits behind them. When a
 * page has no navigation-bar slot, nothing paints behind the status bar
 * except the frame's body/machine color, so the black bezel shows through.
 * The screen needs its own opaque background so it never depends on a
 * navigation bar being present.
 */
import { describe, expect, it } from 'vitest'
import { DEVICE_FRAME_STYLES } from './styles.js'

/**
 * Isolates one top-level rule's declaration block. Anchored to the start of a
 * line so `.screen {` (line-initial) is not confused with a compound
 * selector override that shares the same selector text but never starts a
 * line.
 */
function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.[\]()]/g, '\\$&')
  const match = new RegExp(`\\n${escaped}\\s*\\{([^}]*)\\}`).exec(DEVICE_FRAME_STYLES)
  if (!match) throw new Error(`no top-level rule found for ${selector} in DEVICE_FRAME_STYLES`)
  return (match[1] ?? '').replace(/\s+/g, ' ').trim()
}

describe('DEVICE_FRAME_STYLES screen background', () => {
  it('declares --device-screen-background: #ffffff', () => {
    expect(DEVICE_FRAME_STYLES).toMatch(/--device-screen-background:\s*#ffffff/)
  })

  it('.screen background uses --device-screen-background', () => {
    expect(ruleBody('.screen')).toMatch(/background:\s*var\(--device-screen-background\)/)
  })
})
