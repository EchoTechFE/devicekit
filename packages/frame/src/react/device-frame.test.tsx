import { act, createRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import type { DeviceProfile } from '@devicekit/devices'
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

const customProfile: DeviceProfile = {
  name: 'Custom Test Phone',
  os: 'android',
  screen: { width: 400, height: 800 },
  pixelRatio: 2,
}

describe('<DeviceFrame>', () => {
  it('renders and registers the underlying custom element', () => {
    mount(<DeviceFrame device="iPhone 15" />)
    expect(customElements.get('device-frame')).toBeDefined()
    expect(container!.querySelector('device-frame')).not.toBeNull()
  })

  it('maps string/boolean props onto matching attributes, and omits embedded when false', () => {
    mount(
      <DeviceFrame
        device="iPhone 15"
        orientation="landscape"
        embedded
        statusBarTextStyle="white"
      />,
    )
    const el = container!.querySelector('device-frame')!
    expect(el.getAttribute('device')).toBe('iPhone 15')
    expect(el.getAttribute('orientation')).toBe('landscape')
    expect(el.getAttribute('status-bar-text-style')).toBe('white')
    expect(el.hasAttribute('embedded')).toBe(true)

    mount(<DeviceFrame device="iPhone 15" embedded={false} />)
    const el2 = container!.querySelector('device-frame')!
    expect(el2.hasAttribute('embedded')).toBe(false)
  })

  it('sets deviceProfile as a property, updates it on rerender, and clears it when passed null', () => {
    mount(<DeviceFrame deviceProfile={customProfile} />)
    const el = container!.querySelector('device-frame') as DeviceFrameElement
    expect(el.deviceProfile).toBe(customProfile)

    const updated: DeviceProfile = { ...customProfile, name: 'Updated Phone' }
    act(() => root!.render(<DeviceFrame deviceProfile={updated} />))
    expect(el.deviceProfile).toBe(updated)

    act(() => root!.render(<DeviceFrame deviceProfile={null} />))
    expect(el.deviceProfile).toBeNull()
  })

  it('forwards a ref to the DeviceFrameElement instance', () => {
    const ref = createRef<DeviceFrameElement>()
    mount(<DeviceFrame device="iPhone 15" ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current!.tagName.toLowerCase()).toBe('device-frame')
    expect(ref.current).toBe(container!.querySelector('device-frame'))
  })

  it('passes className through and renders children into the default and named slots', () => {
    mount(
      <DeviceFrame device="iPhone 15" className="my-frame">
        <div data-testid="nav" slot="navigation-bar">
          nav
        </div>
        <div data-testid="page">page</div>
      </DeviceFrame>,
    )
    const el = container!.querySelector('device-frame')!
    expect(el.className).toBe('my-frame')
    expect(el.querySelector('[data-testid="nav"]')?.getAttribute('slot')).toBe('navigation-bar')
    expect(el.querySelector('[data-testid="page"]')).not.toBeNull()
  })
})
