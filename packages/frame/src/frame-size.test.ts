import { findDevice, resolveDevice } from '@devicekit/devices'
import { describe, expect, it } from 'vitest'
import { frameOuterSize } from './index.js'
import { DEVICE_FRAME_BORDER_WIDTH } from './styles.js'

const iPhone15 = findDevice('iPhone 15')!

describe('frameOuterSize', () => {
  it('adds the body bezel and the frame hairline border, on every side, to the portrait screen', () => {
    const bezel = resolveDevice(iPhone15).shell.bezel
    const margin = bezel + DEVICE_FRAME_BORDER_WIDTH
    const size = frameOuterSize(iPhone15, 'portrait')
    expect(size).toEqual({ width: 393 + 2 * margin, height: 852 + 2 * margin })
  })

  it('swaps width and height in landscape before adding the same margin', () => {
    const bezel = resolveDevice(iPhone15).shell.bezel
    const margin = bezel + DEVICE_FRAME_BORDER_WIDTH
    const size = frameOuterSize(iPhone15, 'landscape')
    expect(size).toEqual({ width: 852 + 2 * margin, height: 393 + 2 * margin })
  })

  it('takes exactly two arguments — embedding no longer changes the outer size call shape', () => {
    expect(frameOuterSize.length).toBe(2)
  })
})
