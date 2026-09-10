import { afterEach, describe, expect, it } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'
import { DEVICE_FRAME_STYLES } from './styles.js'
import { STATUS_BAR_STYLES } from './status-bar-styles.js'

defineDeviceFrame()

function mountFrame(device: string): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  el.setAttribute('device', device)
  document.body.append(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

function ruleBlock(styles: string, selector: string): string {
  const escaped = selector.replace(/[.[\]()]/g, (char) => `\\${char}`)
  const match = new RegExp(`^${escaped}\\s*\\{([^}]*)\\}`, 'm').exec(styles)
  if (!match) throw new Error(`no rule found for selector: ${selector}`)
  return match[1]!
}

function pxProperty(rule: string, property: string): number {
  const match = new RegExp(`\\b${property}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)px`).exec(rule)
  if (!match) throw new Error(`no px value for ${property}`)
  return Number(match[1])
}

function duoIndicatorBounds(el: DeviceFrameElement): {
  top?: number
  bottom?: number
  left?: number
  right?: number
} {
  const metrics = el.metrics
  const indicator = ruleBlock(
    STATUS_BAR_STYLES,
    '.status-bar[data-layout="ios-duo"] .status-bar__wifi',
  )
  const width = pxProperty(indicator, 'width')
  if (metrics.statusBarEdge === 'top') {
    const icons = ruleBlock(
      STATUS_BAR_STYLES,
      '.status-bar[data-edge="top"][data-layout="ios-duo"] .status-bar__icons',
    )
    const top = pxProperty(icons, 'top')
    const right = pxProperty(icons, 'right')
    const glyph = ruleBlock(
      STATUS_BAR_STYLES,
      '.status-bar[data-edge="top"][data-layout="ios-duo"] .status-bar__wifi::before',
    )
    const glyphLeft = pxProperty(glyph, 'left')
    const glyphTop = pxProperty(glyph, 'top')
    const glyphWidth = pxProperty(glyph, 'width')
    const glyphHeight = pxProperty(glyph, 'height')
    const left = metrics.screen.width - right - width + glyphLeft
    return {
      top: top + glyphTop,
      bottom: top + glyphTop + glyphHeight,
      left,
      right: left + glyphWidth,
    }
  }

  const topCutout = el.shadowRoot!.querySelector<HTMLElement>('.status-bar')!.dataset.topCutout === 'true'
  const icons = ruleBlock(
    STATUS_BAR_STYLES,
    topCutout
      ? '.status-bar[data-edge="right"][data-layout="ios-duo"][data-top-cutout="true"] .status-bar__icons'
      : '.status-bar[data-edge="right"][data-layout="ios-duo"] .status-bar__icons',
  )
  const centerInset = Number(/left:\s*calc\(50%\s*-\s*(\d+(?:\.\d+)?)px\)/.exec(icons)?.[1])
  if (!Number.isFinite(centerInset)) throw new Error('no right-edge Duo indicator center inset')
  const strip = Number.parseFloat(
    el.shadowRoot!.querySelector<HTMLElement>('.status-bar')!.style.width,
  )
  const center = strip / 2 - centerInset
  const glyph = ruleBlock(
    STATUS_BAR_STYLES,
    topCutout
      ? '.status-bar[data-edge="right"][data-layout="ios-duo"][data-top-cutout="true"] .status-bar__wifi::before'
      : '.status-bar[data-edge="right"][data-layout="ios-duo"] .status-bar__wifi::before',
  )
  const glyphLeft = pxProperty(glyph, 'left')
  const glyphWidth = pxProperty(glyph, 'width')
  const left = metrics.screen.width - strip + center - width / 2 + glyphLeft
  return { left, right: left + glyphWidth }
}

describe('status-bar edge geometry', () => {
  it('keeps top-edge devices on their existing content geometry', () => {
    const el = mountFrame('iPhone X')
    const bar = el.shadowRoot!.querySelector<HTMLElement>('.status-bar')!
    expect(el.metrics.statusBarEdge).toBe('top')
    expect(el.metrics.content).toEqual({ x: 0, y: 44, width: 375, height: 768 })
    expect(bar.dataset.edge).toBe('top')
  })

  it('renders Duo outer as a transparent right-edge strip over full-width content', () => {
    const el = mountFrame('iPhone Duo (outer)')
    const bar = el.shadowRoot!.querySelector<HTMLElement>('.status-bar')!
    expect(el.metrics.statusBarEdge).toBe('right')
    expect(el.metrics.window).toEqual({ width: 466, height: 678 })
    expect(el.metrics.content).toEqual({ x: 0, y: 0, width: 466, height: 678 })
    expect(bar.dataset).toMatchObject({ edge: 'right', layout: 'ios-duo', topCutout: 'true' })
    expect(bar.style.width).toBe('44px')
    expect(
      Number.parseFloat(bar.querySelector<HTMLElement>('.status-bar__notch')!.style.left),
    ).toBeCloseTo(-21.1, 2)
    el.setAttribute('orientation', 'landscape')
    expect(bar.dataset.topCutout).toBe('false')
    expect(el.metrics.window).toEqual({ width: 678, height: 466 })
    expect(el.metrics.content).toEqual({ x: 0, y: 0, width: 678, height: 466 })
  })

  it('draws Duo outer’s stored landscape camera in the right strip, even when the status bar is hidden', () => {
    const el = mountFrame('iPhone Duo (outer)')
    el.setAttribute('orientation', 'landscape')
    const bar = el.shadowRoot!.querySelector<HTMLElement>('.status-bar')!
    const cutout = bar.querySelector<HTMLElement>('.status-bar__notch')!
    expect(el.metrics.cutout).toEqual({
      shape: 'circle',
      width: 37,
      height: 37,
      top: 401,
      centerX: 0.934,
    })
    expect(cutout.hidden).toBe(false)
    expect(Number.parseFloat(cutout.style.left)).toBeCloseTo(-19.25, 1)
    expect(cutout.style.top).toBe('401px')

    el.setAttribute('status-bar', 'hidden')
    expect(cutout.hidden).toBe(false)
    expect(Number.parseFloat(cutout.style.left)).toBeCloseTo(-19.25, 1)
  })

  it('keeps legacy iPhone landscape cutouts hidden', () => {
    const el = mountFrame('iPhone X')
    el.setAttribute('orientation', 'landscape')
    const cutout = el.shadowRoot!.querySelector<HTMLElement>('.status-bar__notch')!
    expect(el.metrics.cutout).toBeNull()
    expect(cutout.hidden).toBe(true)
  })

  it('keeps content and chrome backgrounds full-width under the transparent right strip', () => {
    const el = mountFrame('iPhone Duo (outer)')
    el.setAttribute('immersive', '')
    expect(el.metrics.content).toEqual({ x: 0, y: 0, width: 466, height: 678 })

    expect(ruleBlock(DEVICE_FRAME_STYLES, ':host([immersive]) .content')).toMatch(
      /right:\s*0(px)?\s*;/,
    )
    expect(ruleBlock(DEVICE_FRAME_STYLES, '.content')).toMatch(/right:\s*0(px)?\s*;/)
    expect(ruleBlock(DEVICE_FRAME_STYLES, '.navigation-bar')).toMatch(/right:\s*0(px)?\s*;/)
    expect(ruleBlock(DEVICE_FRAME_STYLES, '.navigation-bar')).toMatch(
      /height:\s*calc\(var\(--device-status-bar-inset-top\)\s*\+\s*var\(--device-navigation-bar-height\)\)/,
    )
    expect(ruleBlock(DEVICE_FRAME_STYLES, '::slotted([slot="navigation-bar"])')).toMatch(
      /padding-top:\s*var\(--device-status-bar-inset-top\)/,
    )
    expect(ruleBlock(DEVICE_FRAME_STYLES, '.tab-bar')).toMatch(/right:\s*0(px)?\s*;/)
  })

  it('keeps a hidden outer cutout in the same right-strip geometry as a visible bar', () => {
    const el = mountFrame('iPhone Duo (outer)')
    const bar = el.shadowRoot!.querySelector<HTMLElement>('.status-bar')!
    const cutout = bar.querySelector<HTMLElement>('.status-bar__notch')!
    const visible = { left: cutout.style.left, width: bar.style.width }

    el.setAttribute('status-bar', 'hidden')
    expect(cutout.style.left).toBe(visible.left)
    expect(bar.style.width).toBe(visible.width)
  })

  it('uses the non-overlapping Duo arrangement on the inner right edge', () => {
    const el = mountFrame('iPhone Duo (inner)')
    el.setAttribute('orientation', 'landscape')
    const bar = el.shadowRoot!.querySelector<HTMLElement>('.status-bar')!
    expect(bar.dataset).toMatchObject({ edge: 'right', layout: 'ios-duo', topCutout: 'false' })

    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="right"][data-layout="ios-duo"] .status-bar__time',
      ),
    ).toMatch(/writing-mode:\s*horizontal-tb/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="right"][data-layout="ios-duo"] .status-bar__time',
      ),
    ).toMatch(/top:\s*33px/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="right"][data-layout="ios-duo"] .status-bar__time',
      ),
    ).toMatch(/left:\s*calc\(50%\s*-\s*24px\)/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="right"][data-layout="ios-duo"] .status-bar__time',
      ),
    ).toMatch(/font-size:\s*15px/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="right"][data-layout="ios-duo"] .status-bar__icons',
      ),
    ).toMatch(/top:\s*53px/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="right"][data-layout="ios-duo"] .status-bar__icons',
      ),
    ).toMatch(/left:\s*calc\(50%\s*-\s*24px\)/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="right"][data-layout="ios-duo"][data-top-cutout="true"] .status-bar__time',
      ),
    ).toMatch(/top:\s*77px/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="right"][data-layout="ios-duo"][data-top-cutout="true"] .status-bar__time',
      ),
    ).toMatch(/left:\s*calc\(50%\s*-\s*26px\)/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="right"][data-layout="ios-duo"][data-top-cutout="true"] .status-bar__icons',
      ),
    ).toMatch(/top:\s*100px/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="right"][data-layout="ios-duo"][data-top-cutout="true"] .status-bar__icons',
      ),
    ).toMatch(/left:\s*calc\(50%\s*-\s*25px\)/)
    expect(
      ruleBlock(STATUS_BAR_STYLES, '.status-bar[data-edge="right"][data-layout] .status-bar__time'),
    ).toMatch(/writing-mode:\s*vertical-rl/)
  })

  it('uses the Duo status arrangement for inner portrait instead of ios-classic', () => {
    const el = mountFrame('iPhone Duo (inner)')
    const bar = el.shadowRoot!.querySelector<HTMLElement>('.status-bar')!
    expect(bar.dataset).toMatchObject({ edge: 'top', layout: 'ios-duo' })
    expect(
      ruleBlock(STATUS_BAR_STYLES, '.status-bar[data-layout="ios-duo"] .status-bar__signal'),
    ).toMatch(/display:\s*none/)
    expect(
      ruleBlock(STATUS_BAR_STYLES, '.status-bar[data-layout="ios-duo"] .status-bar__battery'),
    ).toMatch(/display:\s*none/)
    expect(
      ruleBlock(STATUS_BAR_STYLES, '.status-bar[data-layout="ios-duo"] .status-bar__wifi'),
    ).toMatch(/width:\s*44px/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="top"][data-layout="ios-duo"] .status-bar__icons',
      ),
    ).toMatch(/top:\s*22px/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="top"][data-layout="ios-duo"] .status-bar__icons',
      ),
    ).toMatch(/right:\s*22px/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="top"][data-layout="ios-duo"] .status-bar__icons',
      ),
    ).toMatch(/transform:\s*none/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="top"][data-layout="ios-duo"] .status-bar__time',
      ),
    ).toMatch(/top:\s*48px/)
    expect(
      ruleBlock(
        STATUS_BAR_STYLES,
        '.status-bar[data-edge="top"][data-layout="ios-duo"] .status-bar__time',
      ),
    ).toMatch(/right:\s*72px/)
    expect(
      ruleBlock(STATUS_BAR_STYLES, '.status-bar[data-layout="ios-duo"] .status-bar__wifi::before'),
    ).toMatch(/mask:\s*url\(/)
    expect(
      ruleBlock(STATUS_BAR_STYLES, '.status-bar[data-layout="ios-duo"] .status-bar__wifi::after'),
    ).toMatch(/content:\s*none/)
  })

  it('draws Duo’s open-ring connectivity glyph without a frosted button backing', () => {
    const indicator = ruleBlock(
      STATUS_BAR_STYLES,
      '.status-bar[data-layout="ios-duo"] .status-bar__wifi',
    )
    expect(indicator).toMatch(/width:\s*44px/)
    expect(indicator).toMatch(/height:\s*44px/)
    expect(indicator).toMatch(/border:\s*0/)
    expect(indicator).toMatch(/background:\s*transparent/)
    expect(indicator).toMatch(/backdrop-filter:\s*none/)
    expect(indicator).toMatch(/box-shadow:\s*none/)

    const glyph = ruleBlock(
      STATUS_BAR_STYLES,
      '.status-bar[data-layout="ios-duo"] .status-bar__wifi::before',
    )
    expect(glyph).toMatch(/width:\s*36px/)
    expect(glyph).toMatch(/height:\s*40px/)
    expect(glyph).toMatch(/stroke-linecap='round'/)
    const webkitMask = /-webkit-mask:\s*url\("([^"]+)"\)/.exec(glyph)?.[1] ?? ''
    expect(webkitMask.match(/<circle/g) ?? []).toHaveLength(5)
    const lowerDots = [...webkitMask.matchAll(/<circle cx='(?:9|15|21|27)' cy='([\d.]+)'/g)].map(
      (match) => Number(match[1]),
    )
    expect(lowerDots).toHaveLength(4)
    expect(lowerDots[0]).toBe(lowerDots[3])
    expect(lowerDots[1]).toBe(lowerDots[2])
    expect(lowerDots[1]).toBeGreaterThan(lowerDots[0]!)
    const viewBoxWidth = Number(/viewBox='0 0 ([\d.]+)/.exec(webkitMask)?.[1])
    const strokeWidth = Number(/stroke-width='([\d.]+)'/.exec(webkitMask)?.[1])
    const outerRadius = Number(/A([\d.]+) [\d.]+/.exec(webkitMask)?.[1])
    expect(outerRadius + strokeWidth / 2).toBeLessThanOrEqual(viewBoxWidth / 2)

    const topGlyph = ruleBlock(
      STATUS_BAR_STYLES,
      '.status-bar[data-edge="top"][data-layout="ios-duo"] .status-bar__wifi::before',
    )
    expect(topGlyph).toMatch(/left:\s*3px/)
    expect(topGlyph).toMatch(/top:\s*1px/)
    expect(topGlyph).toMatch(/width:\s*39px/)
    expect(topGlyph).toMatch(/height:\s*43px/)
    const sideGlyph = ruleBlock(
      STATUS_BAR_STYLES,
      '.status-bar[data-edge="right"][data-layout="ios-duo"] .status-bar__wifi::before',
    )
    expect(sideGlyph).toMatch(/width:\s*40px/)
    expect(sideGlyph).toMatch(/height:\s*43px/)
    const cameraSideGlyph = ruleBlock(
      STATUS_BAR_STYLES,
      '.status-bar[data-edge="right"][data-layout="ios-duo"][data-top-cutout="true"] .status-bar__wifi::before',
    )
    expect(cameraSideGlyph).toMatch(/left:\s*1px/)
    expect(cameraSideGlyph).toMatch(/top:\s*1px/)
    expect(cameraSideGlyph).toMatch(/width:\s*42px/)
    expect(cameraSideGlyph).toMatch(/height:\s*46px/)
  })

  it('keeps the CSS-drawn Duo indicator outside safe content in every stored orientation', () => {
    const poses = [
      ['iPhone Duo (outer)', 'portrait'],
      ['iPhone Duo (outer)', 'landscape'],
      ['iPhone Duo (inner)', 'portrait'],
      ['iPhone Duo (inner)', 'landscape'],
    ] as const

    for (const [device, orientation] of poses) {
      const el = mountFrame(device)
      if (orientation === 'landscape') el.setAttribute('orientation', orientation)
      const box = duoIndicatorBounds(el)
      if (el.metrics.statusBarEdge === 'top') {
        expect(box.top, `${device} ${orientation}`).toBeGreaterThanOrEqual(0)
        expect(box.bottom, `${device} ${orientation}`).toBeLessThanOrEqual(el.metrics.safeArea.top)
      } else {
        expect(box.left, `${device} ${orientation}`).toBeGreaterThanOrEqual(
          el.metrics.safeArea.right,
        )
        expect(box.right, `${device} ${orientation}`).toBeLessThanOrEqual(el.metrics.screen.width)
      }
    }
  })
})
