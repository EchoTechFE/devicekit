import { afterEach, describe, expect, it } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, DiminaDeviceFrame } from './device-frame.js'
import { DEVICE_FRAME_STYLES } from './styles.js'

defineDeviceFrame()

function mountFrame(attributes: Record<string, string> = {}): DiminaDeviceFrame {
  const el = document.createElement(DEVICE_FRAME_TAG) as DiminaDeviceFrame
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
  document.body.append(el)
  return el
}

function shadowEl(el: DiminaDeviceFrame, selector: string): HTMLElement {
  return el.shadowRoot!.querySelector<HTMLElement>(selector)!
}

const statusBar = (el: DiminaDeviceFrame): HTMLElement => shadowEl(el, '.status-bar')
const cutoutEl = (el: DiminaDeviceFrame): HTMLElement => shadowEl(el, '.status-bar__notch')

afterEach(() => {
  document.body.innerHTML = ''
})

/*
 * The navigation-bar slot wrapper currently starts below the status bar
 * (`top: var(--device-status-bar-height)`), so a host title bar can never
 * paint behind the status bar the way a real app's does. It needs to cover
 * the status bar too, with the slotted content itself padded down to clear
 * it — the wrapper's height and position, not the content's own layout,
 * describe the device chrome.
 */
describe('the navigation-bar slot wrapper covers the status bar', () => {
  it('starts at the top of the frame and spans both bars, not just its own', () => {
    const rule = DEVICE_FRAME_STYLES.split('.navigation-bar {')[1]?.split('}')[0] ?? ''
    expect(rule).toMatch(/\btop\s*:\s*0\b/)
    expect(rule).not.toMatch(/top\s*:\s*var\(--device-status-bar-height\)/)
    expect(rule).toMatch(/height\s*:\s*calc\(\s*var\(--device-status-bar-height\)\s*\+\s*var\(--device-navigation-bar-height\)\s*\)/)
  })

  it('pads the slotted content itself down past the status bar', () => {
    const rule = DEVICE_FRAME_STYLES.split('::slotted([slot="navigation-bar"])')[1]?.split('}')[0] ?? ''
    // !important on all three: a host's own `padding: 0 12px` shorthand would
    // otherwise beat the shadow rule and zero the top inset.
    expect(rule).toMatch(/padding-top\s*:\s*var\(--device-status-bar-height\)\s*!important/)
    expect(rule).toMatch(/box-sizing\s*:\s*border-box\s*!important/)
    expect(rule).toMatch(/height\s*:\s*100%\s*!important/)
  })

  // Non-regression guard: the wrapper growing taller must not change what the
  // frame reports as content geometry — #navigationBarHeight() must keep
  // measuring the device's own bar height, not the slotted element's height.
  it('leaves metrics.content.y and --device-navigation-bar-height unchanged', async () => {
    const el = mountFrame({ device: 'iPhone X' })
    const bar = document.createElement('div')
    bar.slot = 'navigation-bar'
    el.append(bar)
    await Promise.resolve()

    expect(el.metrics.content.y).toBe(88)
    expect(el.style.getPropertyValue('--device-navigation-bar-height')).toBe('44px')
  })
})

/*
 * Hosts that want to theme the status bar strip (matching a page's
 * navigation-bar-background-color, for instance) currently have no way to —
 * the bar is always transparent over whatever the frame paints beneath it.
 */
describe('status-bar-background colors the status bar strip', () => {
  it('is observed', () => {
    expect(DiminaDeviceFrame.observedAttributes).toContain('status-bar-background')
  })

  it('sets the status bar background when present', () => {
    const el = mountFrame({ device: 'iPhone X', 'status-bar-background': '#07c160' })
    expect(statusBar(el).style.backgroundColor).toBe('rgb(7, 193, 96)')
  })

  it('clears the background again once the attribute is removed', () => {
    const el = mountFrame({ device: 'iPhone X', 'status-bar-background': '#07c160' })
    el.removeAttribute('status-bar-background')
    expect(statusBar(el).style.backgroundColor).toBe('')
  })

  it('leaves the status bar transparent when never set', () => {
    const el = mountFrame({ device: 'iPhone X' })
    expect(statusBar(el).style.backgroundColor).toBe('')
  })

  it('does not affect metrics or fire contentrectchange', () => {
    const el = mountFrame({ device: 'iPhone X' })
    let changes = 0
    el.addEventListener('contentrectchange', () => {
      changes += 1
    })
    const before = JSON.stringify(el.metrics)

    el.setAttribute('status-bar-background', '#07c160')

    expect(JSON.stringify(el.metrics)).toBe(before)
    expect(changes).toBe(0)
  })

  it('does not un-hide the status bar in iOS landscape', () => {
    const el = mountFrame({ device: 'iPhone X', orientation: 'landscape' })
    expect(statusBar(el).hidden).toBe(true)
    el.setAttribute('status-bar-background', '#07c160')
    expect(statusBar(el).hidden).toBe(true)
  })
})

/*
 * The cutout element only ever carries geometry today (width/height/top/left/
 * border-radius) — nothing on it says which shape it is, so the stylesheet
 * cannot paint the ears/rim a notch needs and a pill or a punch-hole camera
 * must not have.
 */
describe('the cutout marks its own shape for the stylesheet to style', () => {
  it('is "notch" for a notch device', () => {
    const el = mountFrame({ device: 'iPhone X' })
    expect(cutoutEl(el).dataset.shape).toBe('notch')
  })

  it('is "pill" for a Dynamic Island device', () => {
    const el = mountFrame({ device: 'iPhone 14 Pro' })
    expect(cutoutEl(el).dataset.shape).toBe('pill')
  })

  it('is "circle" for a punch-hole camera device', () => {
    const el = mountFrame({ device: 'Pixel 8' })
    expect(cutoutEl(el).dataset.shape).toBe('circle')
  })

  it('is unset on a device with no cutout at all', () => {
    const el = mountFrame({ device: 'iPhone 8' })
    expect(cutoutEl(el).dataset.shape).toBeUndefined()
  })

  it('the stylesheet has notch-only ear/rim rules keyed off the shape', () => {
    expect(DEVICE_FRAME_STYLES).toContain('.status-bar__notch[data-shape="notch"]::before')
    expect(DEVICE_FRAME_STYLES).toContain('.status-bar__notch[data-shape="notch"]::after')
  })
})
