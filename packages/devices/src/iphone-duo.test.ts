import { describe, expect, it } from 'vitest'
import { assertDeviceProfile, DEVICE_NAMES, findDevice, resolveDevice, resolveSafeArea, resolveWindowSize, safeAreaInsetsFor, statusBarEdgeFor, type DeviceProfile } from './index.js'

describe('iPhone Duo provisional profiles', () => {
  it('stores both screens, their edge-oriented chrome, and the outer camera', () => {
    const outer = findDevice('iPhone Duo (outer)')
    const inner = findDevice('iPhone Duo (inner)')

    expect(outer).toBeDefined()
    expect(inner).toBeDefined()
    expect(outer).toMatchObject({
      screen: { width: 466, height: 678 }, pixelRatio: 3, system: 'iOS 27.1', releaseYear: 2026,
      statusBarHeight: 44, statusBarHeightLandscape: 44, statusBarEdge: 'right', statusBarEdgeLandscape: 'right',
      safeAreaInsets: { top: 12, right: 68, bottom: 12, left: 0 },
      safeAreaInsetsLandscape: { top: 12, right: 68, bottom: 12, left: 0 },
      cutout: { shape: 'circle', width: 37, height: 37, top: 26, centerX: 0.9 },
    })
    expect(inner).toMatchObject({
      screen: { width: 626, height: 890 }, pixelRatio: 3, system: 'iOS 27.1', releaseYear: 2026,
      statusBarHeight: 24, statusBarHeightLandscape: 44, statusBarEdge: 'top', statusBarEdgeLandscape: 'right',
      safeAreaInsets: { top: 68, bottom: 34 },
      safeAreaInsetsLandscape: { right: 68 },
    })
    const resolvedOuter = resolveDevice(outer!)
    const resolvedInner = resolveDevice(inner!)
    expect(safeAreaInsetsFor(resolvedOuter, 'portrait')).toEqual({ top: 12, right: 68, bottom: 12, left: 0 })
    expect(safeAreaInsetsFor(resolvedInner, 'landscape')).toEqual({ top: 0, right: 68, bottom: 0, left: 0 })
    expect(statusBarEdgeFor(resolvedOuter, 'portrait')).toBe('right')
    expect(statusBarEdgeFor(resolvedInner, 'landscape')).toBe('right')
    expect(DEVICE_NAMES.iPhone_Duo_outer).toBe('iPhone Duo (outer)')
    expect(DEVICE_NAMES.iPhone_Duo_inner).toBe('iPhone Duo (inner)')
  })

  it('keeps the provisional camera and 44px status indicator outside each safe content rectangle', () => {
    const outer = findDevice('iPhone Duo (outer)')!
    const inner = findDevice('iPhone Duo (inner)')!
    const outerPortraitSafe = resolveSafeArea(outer)
    const outerLandscapeSafe = resolveSafeArea(outer, 'landscape')
    const innerPortraitSafe = resolveSafeArea(inner)
    const innerLandscapeSafe = resolveSafeArea(inner, 'landscape')

    // The frame draws the top indicator from y=22 and keeps side indicators
    // inside the 68px strip; Duo values remain provisional Apple-image calibration.
    expect(innerPortraitSafe.top).toBeGreaterThanOrEqual(22 + 44)
    expect(outer.screen.width - 25 - 44 + 2).toBeGreaterThanOrEqual(outerPortraitSafe.right)
    expect(inner.screen.height - 25 - 44 + 2).toBeGreaterThanOrEqual(innerLandscapeSafe.right)

    const portraitCameraLeft = outer.screen.width * outer.cutout!.centerX! - outer.cutout!.width / 2
    const landscapeCameraLeft = outer.screen.height * outer.cutoutLandscape!.centerX! - outer.cutoutLandscape!.width / 2
    expect(portraitCameraLeft).toBeGreaterThanOrEqual(outerPortraitSafe.right)
    expect(landscapeCameraLeft).toBeGreaterThanOrEqual(outerLandscapeSafe.right)
  })

  it('keeps a transparent right-edge strip over the full window, while top-edge behavior remains unchanged', () => {
    const rightEdge = {
      name: 'Right edge fixture', os: 'ios', screen: { width: 100, height: 200 }, pixelRatio: 1,
      statusBarHeight: 20, statusBarEdge: 'right', navigationBarHeight: 30,
    } as DeviceProfile
    const topEdge: DeviceProfile = { ...rightEdge, name: 'Top edge fixture', statusBarEdge: 'top' } as DeviceProfile

    expect(resolveWindowSize(rightEdge)).toEqual({ width: 100, height: 170 })
    expect(resolveWindowSize(topEdge)).toEqual({ width: 100, height: 150 })
  })

  it('rejects status-bar edges other than top and right', () => {
    expect(() => assertDeviceProfile({
      name: 'Invalid edge', os: 'ios', screen: { width: 100, height: 200 }, pixelRatio: 1, statusBarEdge: 'bottom',
    })).toThrow(/statusBarEdge/)
  })
})
