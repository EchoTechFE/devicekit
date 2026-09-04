/**
 * React 19 changed how a custom element receives props: anything already
 * present on the instance (`name in element`) is assigned as a property, and
 * only the rest goes through `setAttribute`/`removeAttribute`. `<DeviceFrame>`
 * has no control over which path React takes — it only decides what values to
 * hand over — so the wrapper's correctness under React 19 depends on the
 * element accepting property assignment for every prop name it also exposes
 * as a getter. This replays that rule by hand (this workspace pins React 18,
 * so the real React 19 reconciler isn't available to run it for real) against
 * a bare element and checks the result matches what React 18's actual
 * `setAttribute` path produces for the same props.
 */
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEVICE_FRAME_TAG, defineDeviceFrame, type DeviceFrameElement } from '../device-frame.js'
import { DeviceFrame } from './index.js'

// `vi.spyOn(React, 'createElement')` can't redefine a named export on an ESM
// namespace object ("Module namespace is not configurable"), so the call is
// captured by replacing the module instead — `createElement` becomes a
// `vi.fn` wrapping the real implementation, everything else stays identical.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return { ...actual, createElement: vi.fn(actual.createElement) }
})

defineDeviceFrame()

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
  document.body.innerHTML = ''
})

/** The props DeviceFrame handed to `React.createElement` for the tag itself. */
function capturePropsForTag(node: React.ReactElement): Record<string, unknown> {
  mount(node)
  const spy = vi.mocked(React.createElement)
  const call = spy.mock.calls.find(([type]) => type === DEVICE_FRAME_TAG)
  if (!call) throw new Error('DeviceFrame never rendered the device-frame tag')
  return call[1] as Record<string, unknown>
}

/**
 * React 19's actual rule, replayed against a real element: property path when
 * the name already exists on the instance, attribute path otherwise.
 */
function applyReact19PropertyRules(el: DeviceFrameElement, props: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(props)) {
    if (key === 'ref' || key === 'children' || key === 'key') continue
    if (key in el) (el as unknown as Record<string, unknown>)[key] = value
    else if (value === null || value === undefined) el.removeAttribute(key)
    else el.setAttribute(key, String(value))
  }
}

describe('DeviceFrame props applied under React 19 property-assignment rules', () => {
  it('apply without throwing and match the React 18 attribute output', () => {
    const props = capturePropsForTag(
      <DeviceFrame device="iPhone 15" orientation="landscape" embedded immersive />,
    )
    const react18El = container!.querySelector(DEVICE_FRAME_TAG) as DeviceFrameElement

    const fresh = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
    document.body.append(fresh)

    expect(() => applyReact19PropertyRules(fresh, props)).not.toThrow()
    expect(fresh.getAttribute('device')).toBe(react18El.getAttribute('device'))
    expect(fresh.getAttribute('orientation')).toBe(react18El.getAttribute('orientation'))
    expect(fresh.hasAttribute('embedded')).toBe(react18El.hasAttribute('embedded'))
    expect(fresh.hasAttribute('immersive')).toBe(react18El.hasAttribute('immersive'))
  })

  it('embedded going from present to undefined removes the attribute via the property path', () => {
    const fresh = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
    fresh.setAttribute('embedded', '')
    document.body.append(fresh)
    expect(fresh.hasAttribute('embedded')).toBe(true)

    expect(() => applyReact19PropertyRules(fresh, { embedded: undefined })).not.toThrow()
    expect(fresh.hasAttribute('embedded')).toBe(false)
  })
})
