import { describe, expect, it } from 'vitest'
import { applySfSymbolMasks, normalizeSfSymbolPayload } from './sf-symbols.js'

const MASKS = {
  signal: 'data:image/png;base64,c2lnbmFs',
  wifi: 'data:image/png;base64,d2lmaQ==',
  battery: 'data:image/png;base64,YmF0dGVyeQ==',
}
const CSS_MASKS = {
  signal: `url("${MASKS.signal}")`,
  wifi: `url("${MASKS.wifi}")`,
  battery: `url("${MASKS.battery}")`,
}

function frame(): HTMLElement {
  return document.createElement('device-frame')
}

describe('the dev-only SF Symbols bridge', () => {
  it('injects all native masks for a regular iOS layout', () => {
    const el = frame()
    const payload = normalizeSfSymbolPayload({ status: 'native', masks: MASKS })
    expect(applySfSymbolMasks(el, 'ios', 'ios-cutout', payload)).toBe('native')
    expect(el.style.getPropertyValue('--device-status-bar-signal-image')).toBe(CSS_MASKS.signal)
    expect(el.style.getPropertyValue('--device-status-bar-wifi-image')).toBe(CSS_MASKS.wifi)
    expect(el.style.getPropertyValue('--device-status-bar-battery-image')).toBe(CSS_MASKS.battery)
  })

  it('clears native masks when changing from iOS to Android', () => {
    const el = frame()
    const payload = normalizeSfSymbolPayload({ status: 'native', masks: MASKS })
    applySfSymbolMasks(el, 'ios', 'ios-cutout', payload)
    expect(applySfSymbolMasks(el, 'android', 'android', payload)).toBe('fallback')
    expect(el.style.getPropertyValue('--device-status-bar-signal-image')).toBe('')
    expect(el.style.getPropertyValue('--device-status-bar-wifi-image')).toBe('')
    expect(el.style.getPropertyValue('--device-status-bar-battery-image')).toBe('')
  })

  it('falls back when the provider response is incomplete', () => {
    const el = frame()
    const payload = normalizeSfSymbolPayload({ status: 'native', masks: { signal: MASKS.signal } })
    expect(payload).toEqual({ status: 'fallback', masks: null })
    expect(applySfSymbolMasks(el, 'ios', 'ios-cutout', payload)).toBe('fallback')
    expect(el.style.getPropertyValue('--device-status-bar-wifi-image')).toBe('')
  })

  it('keeps the generator-to-provider-to-client payload native across a second normalize', () => {
    const providerJson = normalizeSfSymbolPayload({ status: 'native', masks: MASKS })
    const clientJson = normalizeSfSymbolPayload(JSON.parse(JSON.stringify(providerJson)))
    const el = frame()

    expect(clientJson).toEqual(providerJson)
    expect(applySfSymbolMasks(el, 'ios', 'ios-cutout', clientJson)).toBe('native')
    expect(el.style.getPropertyValue('--device-status-bar-wifi-image')).toBe(CSS_MASKS.wifi)
  })

  it('never injects SF Wi-Fi into Duo topology', () => {
    const el = frame()
    const payload = normalizeSfSymbolPayload({ status: 'native', masks: MASKS })
    expect(applySfSymbolMasks(el, 'ios', 'ios-duo', payload)).toBe('fallback')
    expect(el.style.getPropertyValue('--device-status-bar-wifi-image')).toBe('')
  })

  it('reports fallback and clears masks if a caller supplies an invalid raw CSS image', () => {
    const el = frame()
    expect(applySfSymbolMasks(el, 'ios', 'ios-cutout', {
      status: 'native',
      masks: { signal: 'data:image/png;base64,not valid', wifi: MASKS.wifi, battery: MASKS.battery },
    })).toBe('fallback')
    expect(el.style.getPropertyValue('--device-status-bar-signal-image')).toBe('')
  })
})
