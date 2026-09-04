import { describe, expect, it } from 'vitest'
import { statusBarEars } from './cutout.js'
import { DEVICES, findDevice, resolveDevice } from '@devicekit/devices'
import type { CutoutSpec } from '@devicekit/devices'

describe('statusBarEars', () => {
  it('returns null when there is no cutout to make room around', () => {
    expect(statusBarEars(null, 375)).toBeNull()
  })

  it('splits the screen into two equal ears for a centered cutout (iPhone X: 375 screen, 209-wide notch)', () => {
    const iphoneX = findDevice('iPhone X')!
    expect(statusBarEars(iphoneX.cutout!, iphoneX.screen.width)).toEqual({ left: 83, right: 83 })
  })

  it('gives unequal ears for an off-center cutout, and the two ears plus the cutout still span the screen', () => {
    const cutout: CutoutSpec = { shape: 'notch', width: 100, height: 30, top: 0, centerX: 0.3 }
    const screenWidth = 400
    const ears = statusBarEars(cutout, screenWidth)!
    expect(ears.left).not.toBe(ears.right)
    expect(ears.left + ears.right + cutout.width).toBe(screenWidth)
  })
})

describe('every tabled cutout leaves room for the status bar icon group', () => {
  // .status-bar__icons is signal(17) + gap(6) + wifi(16) + gap(6) + battery(25) = 70px,
  // and it needs an 8px margin from the ear's inner edge not to touch the cutout.
  const MIN_RIGHT_EAR = 70 + 8

  it('holds the icon group in the right ear for every device with a cutout', () => {
    const tooNarrow = DEVICES
      .filter((d) => d.cutout !== undefined)
      .filter((d) => {
        const resolved = resolveDevice(d)
        const ears = statusBarEars(resolved.cutout, d.screen.width)
        return ears === null || ears.right < MIN_RIGHT_EAR
      })
      .map((d) => d.name)
    expect(tooNarrow).toEqual([])
  })
})
