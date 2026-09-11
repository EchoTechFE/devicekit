// Vitest executes this source-contract test in Node; the package browser tsconfig
// intentionally does not include Node's ambient types.
// @ts-expect-error -- node:fs is available in the Vitest runtime only.
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineDemoComponents } from '../demo/components/index.js'

const demoHtml = readFileSync('demo/src/components/DemoPage.astro', 'utf8')
const demoMain = readFileSync('demo/main.ts', 'utf8')
const readme = readFileSync('README.zh-CN.md', 'utf8')

const MP_TAG = 'devicekit-demo-mp-navigation'
const H5_TAG = 'devicekit-demo-h5-navigation'
const TAB_TAG = 'devicekit-demo-tab-bar'

function shadow<T extends Element>(element: HTMLElement, selector: string): T {
  const child = element.shadowRoot?.querySelector<T>(selector)
  if (!child) throw new Error(`missing ${selector}`)
  return child
}

describe('demo navigation and tab components', () => {
  beforeEach(() => {
    document.body.replaceChildren()
    defineDemoComponents()
  })

  it('renders a mini-program navigation component with the navigation slot', () => {
    const element = document.createElement(MP_TAG) as HTMLElement
    element.setAttribute('title', 'Cart')
    document.body.append(element)

    expect(element.getAttribute('slot')).toBe('navigation-bar')
    expect(shadow<HTMLButtonElement>(element, 'button[aria-label="Back"]')).toBeTruthy()
    expect(shadow<HTMLElement>(element, '[data-role="title"]').textContent).toBe('Cart')
    expect(shadow<HTMLElement>(element, '[data-role="back-glyph"]').dataset.variant).toBe('chevron')
  })

  it('switches the back topology through iOS, Android, HarmonyOS, and back to iOS', () => {
    const element = document.createElement(H5_TAG) as HTMLElement
    document.body.append(element)
    const glyph = shadow<HTMLElement>(element, '[data-role="back-glyph"]')

    for (const [os, variant] of [['ios', 'chevron'], ['android', 'arrow'], ['harmony', 'arrow'], ['ios', 'chevron']] as const) {
      element.setAttribute('device-os', os)
      expect(glyph.dataset.variant).toBe(variant)
      expect(element.getAttribute('device-os')).toBe(os)
    }
    expect(shadow<HTMLElement>(element, '[data-role="close-glyph"]')).toBeTruthy()
  })

  it('keeps hit targets semantic and paints glyphs in a separate layer', () => {
    const element = document.createElement(H5_TAG) as HTMLElement
    document.body.append(element)
    const back = shadow<HTMLButtonElement>(element, 'button[aria-label="Back"]')
    const glyph = shadow<HTMLElement>(element, '[data-role="back-glyph"]')
    const style = shadow<HTMLStyleElement>(element, 'style').textContent ?? ''

    expect(back.tagName).toBe('BUTTON')
    expect(back.textContent).toBe('')
    expect(glyph.tagName).toBe('SPAN')
    expect(style).toContain('appearance: none')
    expect(style).toContain('background: currentColor')
    expect(style).toContain('mask-image: var(--demo-icon-back-mask)')
    expect(style).not.toMatch(/[‹✕]/)
  })

  it('tracks the tab active item and absorbs the published bottom safe area', () => {
    const element = document.createElement(TAB_TAG) as HTMLElement
    element.setAttribute('active', 'browse')
    document.body.append(element)

    expect(element.getAttribute('slot')).toBe('tab-bar')
    expect(shadow<HTMLButtonElement>(element, 'button[aria-current="page"]').textContent).toBe('Browse')
    expect(shadow<HTMLButtonElement>(element, 'button[data-tab="home"]').getAttribute('aria-current')).toBeNull()
    const style = shadow<HTMLStyleElement>(element, 'style').textContent ?? ''
    expect(style).toContain('height: 100%')
    expect(style).toContain('padding-bottom: var(--device-safe-area-bottom)')
    expect(style).toMatch(/\[data-role="bar"\][\s\S]*box-sizing: border-box/)
  })

  it('keeps demo components private and removes the old templates and font glyphs', () => {
    expect(demoHtml).not.toContain('tpl-mp')
    expect(demoHtml).not.toContain('tpl-h5')
    expect(demoHtml).not.toContain('tpl-tab')
    expect(demoHtml).not.toMatch(/[‹✕]/)
    expect(demoMain).toContain('defineDemoComponents()')
    expect(demoMain).not.toContain('dataset.deviceOs')
    expect(demoMain).toContain('MINI_PROGRAM_NAVIGATION_TAG')
    expect(demoMain).toContain('H5_NAVIGATION_TAG')
    expect(demoMain).toContain('TAB_BAR_TAG')
    expect(readme).not.toMatch(/[‹✕]/)
  })
})
