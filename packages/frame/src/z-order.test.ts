/**
 * The stacking order the shadow tree draws in. Slotted bars sit above the
 * page; the home indicator is a real gesture-bar phone's pill floating over
 * the tab bar, not tucked beneath it; the status bar stays above both slotted
 * bars; host-owned overlay content rides on top of everything. Read straight
 * out of the generated stylesheet so this breaks the moment a z-index value
 * moves without anyone touching this file.
 */
import { describe, expect, it } from 'vitest'
import { DEVICE_FRAME_STYLES } from './styles.js'

function zIndexOf(selector: string): number {
  const escaped = selector.replace(/[.[\]]/g, '\\$&')
  const match = DEVICE_FRAME_STYLES.match(new RegExp(`${escaped}\\s*\\{[^}]*z-index:\\s*(\\d+)`))
  if (!match) throw new Error(`no z-index found for selector "${selector}"`)
  return Number(match[1])
}

describe('chrome layer stacking order', () => {
  const navigationBar = zIndexOf('.navigation-bar')
  const tabBar = zIndexOf('.tab-bar')
  const homeIndicator = zIndexOf('.home-indicator')
  const statusBar = zIndexOf('.status-bar')
  const overlay = zIndexOf('.overlay')

  it('draws the home indicator above the tab bar, the way a gesture-bar phone floats the pill over it', () => {
    expect(homeIndicator).toBeGreaterThan(tabBar)
  })

  it('keeps the home indicator below the overlay layer', () => {
    expect(homeIndicator).toBeLessThan(overlay)
  })

  it('keeps the status bar above both slotted bars', () => {
    expect(statusBar).toBeGreaterThan(navigationBar)
    expect(statusBar).toBeGreaterThan(tabBar)
  })

  it('keeps the overlay above everything else', () => {
    expect(overlay).toBeGreaterThan(statusBar)
  })
})
