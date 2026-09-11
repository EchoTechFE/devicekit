// Vitest executes the source-boundary checks in Node; the package browser tsconfig
// intentionally does not include Node's ambient types.
// @ts-expect-error -- node:fs is available in the Vitest runtime only.
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyDemoTheme,
  statusBarTextStyleForTheme,
  type DemoTheme,
} from '../demo/theme.js'

const demoHtml = readFileSync('demo/src/components/DemoPage.astro', 'utf8')
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
    expect(statusBarTextStyleForTheme(theme)).toBe(statusText)
  })

  it('round-trips light and dark without leaving the previous root state', () => {
    for (const theme of ['dark', 'light'] as DemoTheme[]) {
      applyDemoTheme(theme, document.documentElement)
      expect(document.documentElement.dataset.theme).toBe(theme)
      expect(document.documentElement.style.colorScheme).toBe(theme)
    }
  })

  it('maps status-bar text from the selected device appearance', () => {
    const matrix: [DemoTheme, 'black' | 'white'][] = [
      ['light', 'black'],
      ['dark', 'white'],
    ]
    for (const [theme, expected] of matrix) {
      expect(statusBarTextStyleForTheme(theme)).toBe(expected)
    }
  })

  it('uses an accessible icon button in the preview corner and keeps theme syncing outside unrelated apply calls', () => {
    expect(demoHtml).toMatch(/<button[^>]*id="theme-toggle"[^>]*aria-label="Switch to dark theme"/)
    expect(demoHtml).toContain('class="theme-toggle__sun"')
    expect(demoHtml).toContain('class="theme-toggle__moon"')
    expect(demoHtml).not.toContain('theme-switch')
    expect(demoMain).toContain('applyDemoTheme')
    expect(demoMain).toContain('statusBarTextStyleForTheme')
    expect(demoMain).toContain('applyDeviceTheme')
    expect(demoMain).toContain('themeToggle')
    const applyBody = demoMain.slice(demoMain.indexOf('function apply()'), demoMain.indexOf('function selectedTheme'))
    expect(applyBody).not.toContain('statusBarTextStyleForThemeAndNavigation')
    expect(demoMain).not.toContain('darkPageInput')
  })
})
