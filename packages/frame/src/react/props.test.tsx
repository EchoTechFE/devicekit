/**
 * Guards the React wrapper's attribute mapping for the props layered on top
 * of the original set: numeric/string passthroughs that mirror an attribute
 * name 1:1 or camelCase-to-kebab-case, and `statusBar` widened from a plain
 * boolean to `boolean | 'live' | string` so a host can drive a live clock or
 * pin an arbitrary label without reaching past the wrapper for the attribute.
 * Also guards that mounting produces no React `act(...)` warning, which only
 * a correctly configured `IS_REACT_ACT_ENVIRONMENT` prevents.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DeviceFrameElement } from '../device-frame.js'
import { DeviceFrame } from './index.js'

let container: HTMLDivElement | null = null
let root: Root | null = null

function mount(node: React.ReactElement): HTMLDivElement {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => root!.render(node))
  return container
}

afterEach(() => {
  if (root) act(() => root!.unmount())
  container?.remove()
  container = null
  root = null
})

describe('<DeviceFrame> newly-added props', () => {
  it('maps os, cutout, geometry and safe-area props onto their kebab-case attributes', () => {
    mount(
      <DeviceFrame
        os="android"
        cutout="none"
        width={360}
        height={800}
        pixelRatio={2}
        userAgent="UA"
        statusBarHeight={30}
        safeAreaTop={30}
        safeAreaRight={0}
        safeAreaBottom={20}
        safeAreaLeft={0}
        statusBar="live"
      />,
    )
    const el = container!.querySelector('device-frame')!
    expect(el.getAttribute('os')).toBe('android')
    expect(el.getAttribute('cutout')).toBe('none')
    expect(el.getAttribute('width')).toBe('360')
    expect(el.getAttribute('height')).toBe('800')
    expect(el.getAttribute('pixel-ratio')).toBe('2')
    expect(el.getAttribute('user-agent')).toBe('UA')
    expect(el.getAttribute('status-bar-height')).toBe('30')
    expect(el.getAttribute('safe-area-top')).toBe('30')
    expect(el.getAttribute('safe-area-right')).toBe('0')
    expect(el.getAttribute('safe-area-bottom')).toBe('20')
    expect(el.getAttribute('safe-area-left')).toBe('0')
    expect(el.getAttribute('status-bar')).toBe('live')
  })

  it('drives the resolved metrics, not just the attribute strings', () => {
    mount(
      <DeviceFrame
        width={360}
        height={800}
        pixelRatio={2}
        safeAreaTop={30}
        safeAreaRight={0}
        safeAreaBottom={20}
        safeAreaLeft={0}
      />,
    )
    const el = container!.querySelector('device-frame') as DeviceFrameElement
    expect(el.metrics.screen.width).toBe(360)
    expect(el.metrics.screen.height).toBe(800)
    expect(el.metrics.pixelRatio).toBe(2)
    expect(el.metrics.safeAreaInsets.bottom).toBe(20)
  })

  it('widens statusBar to boolean | "live" | string', () => {
    mount(<DeviceFrame statusBar={false} />)
    const hidden = container!.querySelector('device-frame')!
    expect(hidden.getAttribute('status-bar')).toBe('hidden')

    mount(<DeviceFrame statusBar={true} />)
    const shown = container!.querySelector('device-frame')!
    expect(shown.hasAttribute('status-bar')).toBe(false)

    mount(<DeviceFrame statusBar="12:00" />)
    const custom = container!.querySelector('device-frame')!
    expect(custom.getAttribute('status-bar')).toBe('12:00')
  })

  it('mounts with no React act(...) warning', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mount(<DeviceFrame device="iPhone 15" />)
    for (const call of errorSpy.mock.calls) {
      expect(String(call[0])).not.toContain('act(')
    }
    errorSpy.mockRestore()
  })
})
