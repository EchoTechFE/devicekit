/**
 * computeStatusBarLayout()'s measured CUTOUT_TABLE rows are keyed on
 * (width, pixelRatio, statusBarHeight). pixelRatio is a rendering detail —
 * how many device pixels a CSS px covers — not a geometry input; the glyph
 * layout at a given CSS width and status bar height should be identical
 * regardless of how many physical pixels back it. Keying the lookup on
 * pixelRatio means a device whose measured pixelRatio doesn't match the
 * table row it would otherwise hit falls through to the untabled formula
 * path and gets different numbers for no geometric reason.
 */
import { describe, expect, it } from 'vitest'
import { computeStatusBarLayout } from './status-bar-layout.js'
import { findDevice, resolveDevice } from '@devicekit/devices'
import type { ResolvedDevice } from '@devicekit/devices'

describe('status bar layout is unaffected by pixelRatio alone', () => {
  it.each(['iPhone 16 Pro', 'iPhone 14'] as const)(
    'a %s with pixelRatio forced to 2 lays out identically to the real (pixelRatio 3) device',
    (name) => {
      const device = resolveDevice(findDevice(name)!)
      expect(device.pixelRatio).not.toBe(2)

      const atDpr2: ResolvedDevice = { ...device, pixelRatio: 2 }

      expect(computeStatusBarLayout(atDpr2, 'portrait')).toEqual(computeStatusBarLayout(device, 'portrait'))
    },
  )
})
