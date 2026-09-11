// Vitest executes the source-boundary checks in Node; the package browser tsconfig
// intentionally does not include Node's ambient types.
// @ts-expect-error -- node:fs is available in the Vitest runtime only.
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyDemoTheme,
  statusBarTextStyleForThemeAndNavigation,
  type DemoNavigation,
  type DemoTheme,
} from '../demo/theme.js'

const demoHtml = readFileSync('demo/index.html', 'utf8')
const demoMain = readFileSync('demo/main.ts', 'utf8')

describe('demo theme controller', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.removeProperty('color-scheme')
  })

  it.each([
    ['light', 'light', 'black'],
    ['dark', 'dark', 'white'],
  ] as const)('publishes %s on the root and maps status text to %s', (theme, colorScheme, statusText) => {
    expect(applyDemoTheme(theme, document.documentElement)).toBe(theme)
    expect(document.documentElement.dataset.theme).toBe(theme)
    expect(document.documentElement.style.colorScheme).toBe(colorScheme)
    expect(statusBarTextStyleForThemeAndNavigation(theme, 'none')).toBe(statusText)
  })

  it('round-trips light and dark without leaving the previous root state', () => {
    for (const theme of ['dark', 'light'] as DemoTheme[]) {
      applyDemoTheme(theme, document.documentElement)
      expect(document.documentElement.dataset.theme).toBe(theme)
      expect(document.documentElement.style.colorScheme).toBe(theme)
    }
  })

  it('maps theme and navigation together before a status-bar style is applied', () => {
    const matrix: [DemoTheme, DemoNavigation, 'black' | 'white'][] = [
      ['light', 'none', 'black'],
      ['light', 'mp', 'black'],
      ['light', 'h5', 'white'],
      ['dark', 'none', 'white'],
      ['dark', 'mp', 'white'],
      ['dark', 'h5', 'white'],
    ]
    for (const [theme, navigation, expected] of matrix) {
      expect(statusBarTextStyleForThemeAndNavigation(theme, navigation)).toBe(expected)
    }
  })

  it('uses accessible radio controls and keeps theme syncing outside unrelated apply calls', () => {
    expect(demoHtml).toMatch(/<fieldset[^>]*class="[^"]*theme-switch[^"]*"[^>]*>/)
    expect(demoHtml).toMatch(/<input[^>]*type="radio"[^>]*value="light"[^>]*checked/)
    expect(demoHtml).toMatch(/<input[^>]*type="radio"[^>]*value="dark"/)
    expect(demoHtml).toContain('>Light<')
    expect(demoHtml).toContain('>Dark<')
    expect(demoMain).toContain('applyDemoTheme')
    expect(demoMain).toContain('statusBarTextStyleForThemeAndNavigation')
    expect(demoMain).toContain('themeInputs')
    const applyBody = demoMain.slice(demoMain.indexOf('function apply()'), demoMain.indexOf('function selectedTheme'))
    expect(applyBody).not.toContain('statusBarTextStyleForThemeAndNavigation')
    expect(demoMain).not.toContain('darkPageInput')
  })
})
