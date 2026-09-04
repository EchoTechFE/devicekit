// @vitest-environment node
/**
 * Guards the package against a `ReferenceError` on the server: `index.ts` and
 * `react/index.tsx` both touch the custom-element registry at module scope
 * (`class ... extends HTMLElement`, `defineDeviceFrame()`), and Node has
 * neither `HTMLElement` nor `customElements`. Every export that does not
 * itself need the DOM must still evaluate and work under plain `import()`.
 */
import { describe, expect, it } from 'vitest'

describe('importing from a server render', () => {
  it('evaluates the root entry without a DOM', async () => {
    await expect(import('./index.js')).resolves.not.toThrow()
  })

  it('computes frame-outer-size numbers with no DOM present', async () => {
    const { frameOuterSize } = await import('./index.js')
    const size = frameOuterSize(
      { name: 'x', os: 'ios', screen: { width: 375, height: 812 }, pixelRatio: 3 },
      'portrait',
    )
    expect(size.width).toBeGreaterThan(0)
    expect(size.height).toBeGreaterThan(0)
  })

  it('lets defineDeviceFrame() no-op when there is no customElements registry', async () => {
    const { defineDeviceFrame } = await import('./index.js')
    expect(() => defineDeviceFrame()).not.toThrow()
  })

  it('evaluates the React entry without a DOM and exports DeviceFrame', async () => {
    const mod = await import('./react/index.js')
    await expect(Promise.resolve(mod)).resolves.not.toThrow()
    expect(mod.DeviceFrame).toBeDefined()
  })
})
