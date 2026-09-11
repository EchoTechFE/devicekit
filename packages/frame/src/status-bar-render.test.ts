import { afterEach, describe, expect, it } from 'vitest'
import { findDevice, type StatusBarStyle } from '@devicekit/devices'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from './device-frame.js'
import { STATUS_BAR_ICON_METRICS } from './status-bar-icons.js'
import { STATUS_BAR_STYLES } from './status-bar-styles.js'

defineDeviceFrame()

function mountFrame(attributes: Record<string, string> = {}): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, value)
  document.body.append(el)
  return el
}

function statusBar(el: DeviceFrameElement): HTMLElement {
  return el.shadowRoot!.querySelector<HTMLElement>('.status-bar')!
}

function mountDuoWithStyle(style: StatusBarStyle): DeviceFrameElement {
  const el = mountFrame()
  const profile = findDevice('iPhone Duo (inner)')!
  el.deviceProfile = { ...profile, statusBarStyle: style }
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('the rendered status bar carries its layout mode and geometry as data-layout/CSS variables', () => {
  it('iPhone 15 renders ios-cutout with the pill-derived variables', () => {
    const bar = statusBar(mountFrame({ device: 'iPhone 15' }))
    expect(bar.dataset.layout).toBe('ios-cutout')
    expect(bar.style.getPropertyValue('--sb-time-left')).toBe('54.3px')
    expect(bar.style.getPropertyValue('--sb-trailing')).toBe('32.7px')
    expect(bar.style.getPropertyValue('--sb-center-y')).toBe('29.5px')
    expect(bar.style.getPropertyValue('--sb-scale')).toBe('1.11')
  })

  it('Pixel 7 renders the android layout', () => {
    const bar = statusBar(mountFrame({ device: 'Pixel 7' }))
    expect(bar.dataset.layout).toBe('android')
    expect(bar.style.getPropertyValue('--sb-time-left')).toBe('31px')
  })

  it.each([
    ['Pixel 7', 'android-stock', '31px', '28px', '1'],
    ['Samsung Galaxy A55', 'android-samsung', '28px', '24px', '1'],
    ['HUAWEI Mate 60 Pro', 'harmony', '27px', '22px', '1.02'],
  ])('%s publishes family geometry through the status-bar DOM', (device, style, timeLeft, trailing, scale) => {
    const bar = statusBar(mountFrame({ device }))
    expect(bar.dataset.style).toBe(style)
    expect(bar.dataset.layout).toBe('android')
    expect(bar.style.getPropertyValue('--sb-time-left')).toBe(timeLeft)
    expect(bar.style.getPropertyValue('--sb-trailing')).toBe(trailing)
    expect(bar.style.getPropertyValue('--sb-scale')).toBe(scale)
  })

  it('uses a visual family independent of the shared Android topology', () => {
    expect(statusBar(mountFrame({ device: 'iPhone 15' })).dataset.style).toBe('ios')
    expect(statusBar(mountFrame({ device: 'Pixel 7' })).dataset.style).toBe('android-stock')
    expect(statusBar(mountFrame({ device: 'Samsung Galaxy A55' })).dataset.style).toBe('android-samsung')
    expect(statusBar(mountFrame({ device: 'HUAWEI Mate 60 Pro' })).dataset.style).toBe('harmony')
  })

  it('ships distinct, deterministic paint tokens for every visual family', () => {
    for (const style of ['ios', 'android-stock', 'android-samsung', 'harmony']) {
      expect(STATUS_BAR_STYLES).toContain(`.status-bar[data-style="${style}"]`)
    }
    expect(STATUS_BAR_STYLES).toContain('font-family: Roboto')
    expect(STATUS_BAR_STYLES).toContain('font-family: "SamsungOne"')
    expect(STATUS_BAR_STYLES).toContain('font-family: "HarmonyOS Sans"')
    expect(STATUS_BAR_STYLES).toContain('data-style="android-samsung"] .status-bar__battery')
    expect(STATUS_BAR_STYLES).toContain('data-style="harmony"] .status-bar__wifi')
    expect(STATUS_BAR_STYLES).toContain('var(--device-status-bar-signal-image')
    expect(STATUS_BAR_STYLES).toContain('var(--device-status-bar-wifi-image')
    expect(STATUS_BAR_STYLES).toContain('var(--device-status-bar-battery-image')
  })

  it('uses three independent family signal and Wi-Fi path tokens', () => {
    const ruleFor = (selector: string): string => {
      const start = STATUS_BAR_STYLES.lastIndexOf(`${selector} {`)
      const end = STATUS_BAR_STYLES.indexOf('\n}', start)
      return STATUS_BAR_STYLES.slice(start, end)
    }
    const signalRules = ['android-stock', 'android-samsung', 'harmony']
      .map((style) => ruleFor(`.status-bar[data-style="${style}"] .status-bar__signal`))
    const wifiRules = ['android-stock', 'android-samsung', 'harmony']
      .map((style) => ruleFor(`.status-bar[data-style="${style}"] .status-bar__wifi`))
    expect(new Set(signalRules).size).toBe(3)
    expect(new Set(wifiRules).size).toBe(3)
    for (const rule of [...signalRules, ...wifiRules]) expect(rule).toMatch(/--status-bar-(signal|wifi)-mask:/)
    const batteryRules = ['android-stock', 'android-samsung', 'harmony']
      .map((style) => ruleFor(`.status-bar[data-style="${style}"] .status-bar__battery`))
    expect(new Set(batteryRules).size).toBe(3)
    for (const rule of batteryRules) expect(rule).toMatch(/--status-bar-battery-mask:/)
  })

  it('renders every icon through a real centered ink pseudo-layer', () => {
    for (const name of ['signal', 'wifi', 'battery']) {
      const ruleStart = STATUS_BAR_STYLES.lastIndexOf(`.status-bar__${name}::before {`)
      const ruleEnd = STATUS_BAR_STYLES.indexOf('\n}', ruleStart)
      const rule = STATUS_BAR_STYLES.slice(ruleStart, ruleEnd)
      expect(rule).toContain(`width: calc(var(--sb-${name}-ink-width`)
      expect(rule).toContain(`height: calc(var(--sb-${name}-ink-height`)
      expect(rule).toContain(`--sb-${name}-ink-offset-y`)
      expect(STATUS_BAR_STYLES).toContain('background: currentColor')
      expect(rule).toContain(`--device-status-bar-${name}-image`)
    }
    expect(STATUS_BAR_STYLES).not.toMatch(/\.status-bar__battery\s*\{[^}]*border:\s*1px/s)
    expect(STATUS_BAR_STYLES).not.toContain('.status-bar__battery::after')
  })

  it('keeps iOS icon boxes and ink dimensions scaled by the layout scale', () => {
    const signalStart = STATUS_BAR_STYLES.indexOf('\n.status-bar__signal {\n  width:') + 1
    const signal = STATUS_BAR_STYLES.slice(signalStart, STATUS_BAR_STYLES.indexOf('\n}', signalStart))
    const inkStart = STATUS_BAR_STYLES.indexOf('.status-bar__signal::before {\n')
    const ink = STATUS_BAR_STYLES.slice(
      inkStart,
      STATUS_BAR_STYLES.indexOf('\n}', inkStart),
    )
    expect(signal).toMatch(/width:\s*calc\(var\(--sb-signal-width[^)]*\)\s*\*\s*var\(--sb-scale,\s*1\)\)/)
    expect(signal).toMatch(/height:\s*calc\(var\(--sb-signal-height[^)]*\)\s*\*\s*var\(--sb-scale,\s*1\)\)/)
    expect(ink).toMatch(/width:\s*calc\(var\(--sb-signal-ink-width[^)]*\)\s*\*\s*var\(--sb-scale,\s*1\)\)/)
    expect(ink).toMatch(/height:\s*calc\(var\(--sb-signal-ink-height[^)]*\)\s*\*\s*var\(--sb-scale,\s*1\)\)/)
  })

  it('raises the project-owned iOS fallback Wi-Fi ink to its shared raster centerline', () => {
    expect(STATUS_BAR_ICON_METRICS.ios.wifi.inkOffsetY).toBe(-0.25)
  })

  it('keeps notch and pill host boxes as distinct scaled iOS generations', () => {
    const notch = statusBar(mountFrame({ device: 'iPhone X' }))
    const pill = statusBar(mountFrame({ device: 'iPhone 15' }))
    expect(notch.dataset.cutoutShape).toBe('notch')
    expect(pill.dataset.cutoutShape).toBe('pill')
    expect(notch.style.getPropertyValue('--sb-scale')).toBe('1')
    expect(pill.style.getPropertyValue('--sb-scale')).toBe('1.11')
    expect(STATUS_BAR_STYLES).toMatch(/data-cutout-shape="notch"\] \.status-bar__signal\s*\{\s*width:\s*calc\(17px \* var\(--sb-scale, 1\)\)/)
    expect(STATUS_BAR_STYLES).toMatch(/data-cutout-shape="pill"\] \.status-bar__signal\s*\{\s*width:\s*calc\(18px \* var\(--sb-scale, 1\)\)/)
  })

  it('iPhone SE renders ios-classic with the leading-icons variable, since its time is centered rather than left-anchored', () => {
    const bar = statusBar(mountFrame({ device: 'iPhone SE' }))
    expect(bar.dataset.layout).toBe('ios-classic')
    expect(bar.style.getPropertyValue('--sb-leading-icons')).toBe('6px')
  })

  it.each([
    ['iPhone X', 'notch'],
    ['iPhone 15', 'pill'],
  ])('%s publishes the cutout shape on the status-bar parent', (device, shape) => {
    const bar = statusBar(mountFrame({ device }))
    expect(bar.dataset.cutoutShape).toBe(shape)
  })

  it('keeps classic and iPad topology in the parent layout dataset without inventing a cutout shape', () => {
    const classic = statusBar(mountFrame({ device: 'iPhone SE' }))
    expect(classic.dataset.layout).toBe('ios-classic')
    expect(classic.dataset.cutoutShape).toBeUndefined()

    const ipad = statusBar(mountFrame({ device: 'iPad Pro 11' }))
    expect(ipad.dataset.layout).toBe('ipad')
    expect(ipad.dataset.cutoutShape).toBeUndefined()
  })

  it('clears a previous parent cutout shape when switching to a device without a cutout', () => {
    const el = mountFrame({ device: 'iPhone X' })
    const bar = statusBar(el)
    expect(bar.dataset.cutoutShape).toBe('notch')

    el.setAttribute('device', 'iPhone SE')

    expect(bar.dataset.cutoutShape).toBeUndefined()
  })

  it('keeps iOS shape and tablet paint tokens visibly distinct', () => {
    expect(STATUS_BAR_STYLES).toContain('.status-bar[data-cutout-shape="notch"]')
    expect(STATUS_BAR_STYLES).toContain('.status-bar[data-cutout-shape="pill"]')
    expect(STATUS_BAR_STYLES).toContain('.status-bar[data-layout="ipad"] .status-bar__signal')
  })

  it.each(['android-stock', 'android-samsung', 'harmony'] as const)('%s override keeps the Duo connectivity host geometry', (style) => {
    const bar = statusBar(mountDuoWithStyle(style))
    expect(bar.dataset.layout).toBe('ios-duo')
    expect(bar.dataset.style).toBe(style)

    // jsdom does not resolve shadow-root stylesheet cascade reliably. Inspect
    // the final authored rule instead: its order is the contract that makes
    // the topology win over each visual family's Wi-Fi paint rule.
    const selector = '.status-bar[data-layout="ios-duo"] .status-bar__wifi'
    const topologyStart = STATUS_BAR_STYLES.lastIndexOf(`${selector} {`)
    const topologyEnd = STATUS_BAR_STYLES.indexOf('\n}', topologyStart)
    const topologyRule = STATUS_BAR_STYLES.slice(topologyStart, topologyEnd)
    for (const family of ['android-stock', 'android-samsung', 'harmony']) {
      expect(topologyStart).toBeGreaterThan(
        STATUS_BAR_STYLES.lastIndexOf(`.status-bar[data-style="${family}"] .status-bar__wifi {`),
      )
    }
    expect(topologyRule).toMatch(/width:\s*44px/)
    expect(topologyRule).toMatch(/height:\s*44px/)
    expect(topologyRule).toMatch(/background:\s*transparent/)
    expect(topologyRule).toMatch(/-webkit-mask:\s*none/)
    expect(topologyRule).toMatch(/mask:\s*none/)
  })

  it('lets the Duo topology fully own its connectivity ink transform', () => {
    const selector = '.status-bar[data-layout="ios-duo"] .status-bar__wifi::before'
    const topologyStart = STATUS_BAR_STYLES.lastIndexOf(`${selector} {`)
    const topologyEnd = STATUS_BAR_STYLES.indexOf('\n}', topologyStart)
    const topologyRule = STATUS_BAR_STYLES.slice(topologyStart, topologyEnd)

    expect(topologyRule).toMatch(/transform:\s*none/)
    expect(topologyRule).toMatch(/left:\s*4px/)
    expect(topologyRule).toMatch(/top:\s*2px/)
  })

  it.each([
    ['Pixel 9', 'android-stock', ['13px', '12.6px', '11.5px', '11px', '0px'], ['13px', '12.6px', '12px', '8.5px', '-0.25px'], ['8px', '12.6px', '8px', '10.5px', '0.25px']],
    ['Samsung Galaxy A55', 'android-samsung', ['14px', '12px', '13px', '11px', '0px'], ['14px', '12px', '13px', '10px', '0px'], ['20px', '10px', '20px', '10px', '0px']],
    ['HUAWEI Mate 60 Pro', 'harmony', ['12px', '12px', '11px', '12px', '0px'], ['13px', '11px', '13px', '10px', '-0.75px'], ['8px', '12px', '8px', '12px', '-0.5px']],
  ] as const)('%s publishes independent icon box and ink metrics', (device, style, signal, wifi, battery) => {
    const bar = statusBar(mountFrame({ device }))
    expect(bar.dataset.style).toBe(style)
    for (const [name, metrics] of [['signal', signal], ['wifi', wifi], ['battery', battery]] as const) {
      const [width, height, inkWidth, inkHeight, inkOffsetY] = metrics
      expect(bar.style.getPropertyValue(`--sb-${name}-width`)).toBe(width)
      expect(bar.style.getPropertyValue(`--sb-${name}-height`)).toBe(height)
      expect(bar.style.getPropertyValue(`--sb-${name}-ink-width`)).toBe(inkWidth)
      expect(bar.style.getPropertyValue(`--sb-${name}-ink-height`)).toBe(inkHeight)
      expect(bar.style.getPropertyValue(`--sb-${name}-ink-offset-y`)).toBe(inkOffsetY)
    }
  })
})
