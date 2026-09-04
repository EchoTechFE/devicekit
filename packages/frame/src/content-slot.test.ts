// Guards a single invariant: DOM slotted into the default slot must land
// inside the box `metrics.content` reports (below the status bar and
// navigation bar, above the tab bar), not at screen y=0 underneath the
// chrome. `.screen` is `flex-direction: column` and the status/navigation/
// tab bars are `position: absolute`, so the default slot needs its own
// `.content` wrapper with matching absolute positioning — this file exists
// to keep that wrapper's existence and its CSS in sync with metrics.content.
import { afterEach, describe, expect, it } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'
import { DEVICE_FRAME_STYLES } from './styles.js'

defineDeviceFrame()

function mountFrame(attributes: Record<string, string> = {}): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
  document.body.append(el)
  return el
}

function shadowEl(el: DeviceFrameElement, selector: string): HTMLElement | null {
  return el.shadowRoot!.querySelector<HTMLElement>(selector)
}

/**
 * jsdom does not cascade a shadow root's <style> rules into
 * getComputedStyle — verified against the frame's existing `.navigation-bar`
 * (which is `position: absolute` in styles.ts) before writing these tests:
 * getComputedStyle reported `position: static`, `top: auto`. So instead of
 * reading computed style off a live element, these tests parse the rule
 * text out of DEVICE_FRAME_STYLES directly. A block is found by anchoring
 * the selector to the start of a line, which is what tells `.content {`
 * apart from the longer `:host([immersive]) .content {` selector below it.
 */
function ruleBlock(selector: string): string {
  const escaped = selector.replace(/[.[\]()]/g, (c) => `\\${c}`)
  const match = new RegExp(`^${escaped}\\s*\\{([^}]*)\\}`, 'm').exec(DEVICE_FRAME_STYLES)
  if (!match) throw new Error(`no rule found for selector: ${selector}`)
  return match[1]!
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('the default slot sits inside a positioned .content wrapper', () => {
  it('parents the unnamed slot in .content, a direct child of .screen', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    const screenEl = shadowEl(el, '.screen')!
    const defaultSlot = el.shadowRoot!.querySelector<HTMLSlotElement>('slot:not([name])')!
    const contentEl = defaultSlot.parentElement

    expect(contentEl).not.toBeNull()
    expect(contentEl!.classList.contains('content')).toBe(true)
    expect(contentEl!.parentElement).toBe(screenEl)
  })

  it('positions .content below the status/navigation bars and above the tab bar', () => {
    const rule = ruleBlock('.content')
    expect(rule).toMatch(/position:\s*absolute/)
    expect(rule).toMatch(/top:[^;]*--device-status-bar-height/)
    expect(rule).toMatch(/top:[^;]*--device-navigation-bar-height/)
    expect(rule).toMatch(/bottom:[^;]*--device-tab-bar-height/)
  })

  it('fills the whole screen when immersive, same as metrics.content does', () => {
    const rule = ruleBlock(':host([immersive]) .content')
    expect(rule).toMatch(/top:\s*0(px)?\s*;/)
    expect(rule).toMatch(/bottom:\s*0(px)?\s*;/)
  })
})

describe('metrics.content and the CSS chrome variables agree on the same numbers', () => {
  it('metrics.content.y equals status bar height + navigation bar height, matching the published CSS variables', async () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    const bar = document.createElement('div')
    bar.slot = 'navigation-bar'
    el.append(bar)
    await Promise.resolve()

    expect(el.metrics.navigationBarHeight).toBe(44)
    expect(el.metrics.content.y).toBe(el.metrics.statusBarHeight + el.metrics.navigationBarHeight)
    expect(el.style.getPropertyValue('--device-status-bar-height')).toBe(`${el.metrics.statusBarHeight}px`)
    expect(el.style.getPropertyValue('--device-navigation-bar-height')).toBe(`${el.metrics.navigationBarHeight}px`)
  })
})
