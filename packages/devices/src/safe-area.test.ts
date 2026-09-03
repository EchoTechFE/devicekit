import { describe, expect, it } from 'vitest'
import type { DeviceProfile } from './devices.js'
import { findDevice } from './presets/index.js'
import { orientedScreen, resolveSafeArea, resolveSafeAreaInsets, resolveWindowSize } from './safe-area.js'

function preset(name: string): DeviceProfile {
  const device = findDevice(name)
  if (!device) throw new Error(`fixture device missing from presets: ${name}`)
  return device
}

describe('orientedScreen', () => {
  it('reports the portrait screen unchanged by default and when asked explicitly', () => {
    expect(orientedScreen(preset('iPhone X'))).toEqual({ width: 375, height: 812 })
    expect(orientedScreen(preset('iPhone X'), 'portrait')).toEqual({ width: 375, height: 812 })
  })

  it('swaps width and height in landscape, because rotating the phone genuinely does', () => {
    expect(orientedScreen(preset('iPhone X'), 'landscape')).toEqual({ width: 812, height: 375 })
  })
})

describe('resolveWindowSize', () => {
  // iPhone X: statusBarHeight 44, portrait navigation bar defaults to the
  // iOS platform value of 44, the same on every iPhone.
  it('portrait: takes the status bar and the app navigation bar out of the screen', () => {
    const size = resolveWindowSize(preset('iPhone X'))
    expect(size).toEqual({ width: 375, height: 812 - 44 - 44 })
  })

  // Landscape: iOS hides the status bar (0), and the landscape navigation
  // bar is 32, not the portrait 44 — the bug this guards against is reusing
  // the portrait navigation bar height after rotation.
  it('landscape: takes out the landscape navigation bar (32), not the portrait one (44)', () => {
    const size = resolveWindowSize(preset('iPhone X'), { orientation: 'landscape' })
    expect(size).toEqual({ width: 812, height: 375 - 0 - 32 })
  })

  it('navigationBar: false takes nothing for the app bar, for a page that draws its own', () => {
    const size = resolveWindowSize(preset('iPhone X'), { navigationBar: false })
    expect(size).toEqual({ width: 375, height: 812 - 44 })
  })

  it('navigationBar: <number> overrides the height outright, for a host with its own bar', () => {
    const size = resolveWindowSize(preset('iPhone X'), { navigationBar: 10 })
    expect(size).toEqual({ width: 375, height: 812 - 44 - 10 })
  })

  it('a tab bar taller than what is left never drives the height negative', () => {
    const size = resolveWindowSize(preset('iPhone SE'), { tabBarHeight: 10_000 })
    expect(size.height).toBe(0)
  })
})

describe('resolveSafeArea stays self-consistent with resolveSafeAreaInsets', () => {
  const cases: Array<[string, 'portrait' | 'landscape']> = [
    ['iPhone X', 'portrait'],
    ['iPhone X', 'landscape'],
    ['iPhone 17 Pro', 'landscape'],
    ['Nexus 5', 'portrait'],
  ]

  for (const [name, orientation] of cases) {
    it(`${name} ${orientation}: the rect is exactly the oriented screen minus the insets`, () => {
      const device = preset(name)
      const screen = orientedScreen(device, orientation)
      const insets = resolveSafeAreaInsets(device, orientation)
      const rect = resolveSafeArea(device, orientation)

      expect(rect.top).toBe(insets.top)
      expect(rect.left).toBe(insets.left)
      expect(rect.right).toBe(screen.width - insets.right)
      expect(rect.bottom).toBe(screen.height - insets.bottom)
      expect(rect.width).toBe(rect.right - rect.left)
      expect(rect.height).toBe(rect.bottom - rect.top)
    })
  }
})
