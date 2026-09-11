import { describe, expect, it } from 'vitest'
import { DEVICES } from '@devicekit/devices'
import { applyDeviceTheme, deviceThemeFor, DEVICE_THEME_MAP } from '../demo/device-theme.js'

function device(name: string) {
  const profile = DEVICES.find((candidate) => candidate.name === name)
  if (profile === undefined) throw new Error(`missing test device ${name}`)
  return profile
}

describe('demo device theme registry', () => {
  it('ships only the five UI families represented by the device profiles', () => {
    expect(Object.keys(DEVICE_THEME_MAP)).toEqual([
      'ios',
      'android-stock',
      'android-samsung',
      'android-hyperos',
      'harmony',
    ])
  })

  it.each([
    ['light', '#f2f2f7', '#000000', '#007aff'],
    ['dark', '#000000', '#ffffff', '#0a84ff'],
  ] as const)('maps iOS %s to one UIKit semantic palette', (appearance, screen, text, accent) => {
    const theme = deviceThemeFor(device('iPhone 18 Pro'), appearance)

    expect(theme.label).toBe('iOS')
    expect(theme.system).toBe('iOS 27.0')
    expect(theme.library).toBe('UIKit semantic colors')
    expect(theme.tokens['--device-screen-background']).toBe(screen)
    expect(theme.tokens['--demo-page-color']).toBe(text)
    expect(theme.tokens['--demo-tab-active']).toBe(accent)
    expect(theme.statusBarTextStyle).toBe(appearance === 'dark' ? 'white' : 'black')
  })

  it('writes only the selected family tokens onto the current frame chrome', () => {
    const frame = document.createElement('div')
    const navigation = document.createElement('div')
    const tabBar = document.createElement('div')

    const theme = applyDeviceTheme([frame, navigation, tabBar], device('iPhone 18 Pro'), 'dark')

    expect(frame.dataset.uiTheme).toBe('ios-ios-27-0-dark')
    expect(frame.style.getPropertyValue('--device-screen-background')).toBe('#000000')
    expect(navigation.style.getPropertyValue('--demo-navigation-background')).toBe('#1c1c1e')
    expect(tabBar.style.getPropertyValue('--demo-tab-active')).toBe('#0a84ff')
    expect(theme.id).toBe('ios-ios-27-0-dark')
  })

  it('keeps the system release in the resolved theme while reusing the family palette', () => {
    const legacy = deviceThemeFor(device('iPhone 4'), 'light')
    const current = deviceThemeFor(device('iPhone 18 Pro'), 'light')

    expect(legacy.system).toBe('iOS 7.1')
    expect(current.system).toBe('iOS 27.0')
    expect(legacy.id).not.toBe(current.id)
    expect(legacy.tokens).toEqual(current.tokens)
  })
})
