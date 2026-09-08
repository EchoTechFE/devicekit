import { findDevice, resolveDevice } from '@devicekit/devices'
import { describe, expect, it } from 'vitest'
import { frameOuterSize } from './frame-size.js'
import { reflectMetrics } from './reflect.js'
import { orientedShellInsets } from './shell-insets.js'
import { DEVICE_FRAME_BORDER_WIDTH } from './styles.js'

describe('oriented shell insets', () => {
  it('rotates the portrait bottom bezel onto landscape left and keeps size and reflected variables aligned', () => {
    const profile = findDevice('iPhone SE')!
    const metrics = {
      ...resolveDevice(profile),
      orientation: 'landscape' as const,
      screen: { width: 667, height: 375 },
      safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
      safeArea: { top: 0, right: 667, bottom: 375, left: 0, width: 667, height: 375 },
      statusBarHeight: 0,
      navigationBarHeight: 0,
      tabBarHeight: 0,
      window: { width: 667, height: 375 },
      content: { x: 0, y: 0, width: 667, height: 375 },
    }
    const insets = orientedShellInsets(metrics.shell.bezelInsets, 'landscape')
    const style = document.createElement('div').style
    reflectMetrics(style, metrics, false)

    expect(insets).toEqual({ top: 6, right: 44, bottom: 6, left: 48 })
    expect(frameOuterSize(profile, 'landscape')).toEqual({ width: 667 + 48 + 44 + 2 * DEVICE_FRAME_BORDER_WIDTH, height: 375 + 6 + 6 + 2 * DEVICE_FRAME_BORDER_WIDTH })
    expect(style.getPropertyValue('--device-bezel-top')).toBe(`${insets.top}px`)
    expect(style.getPropertyValue('--device-bezel-right')).toBe(`${insets.right}px`)
    expect(style.getPropertyValue('--device-bezel-bottom')).toBe(`${insets.bottom}px`)
    expect(style.getPropertyValue('--device-bezel-left')).toBe(`${insets.left}px`)
  })
})
