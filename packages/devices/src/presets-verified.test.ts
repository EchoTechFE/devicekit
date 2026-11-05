import { describe, expect, it } from 'vitest'
import { resolveDevice, type EdgeInsets } from './devices.js'
import { findDevice, IOS_DEVICES } from './presets/index.js'

/**
 * One assertion per row of the device verification table this file encodes.
 * Each title ends with a marker naming where its target value came from:
 * measured = read on the iOS Simulator or a real device.
 * spec = from the maker's published dimensions.
 * decision = a deliberate choice documented in the test body.
 */

function device(name: string) {
  const profile = findDevice(name)
  if (!profile) throw new Error(`no such preset: ${name}`)
  return resolveDevice(profile)
}

const insets = (top: number, right: number, bottom: number, left: number): EdgeInsets => ({ top, right, bottom, left })

describe('A. iOS presets', () => {
  it('Home-button iPhones — square screen corners, body radius 38 (spec: flat LCD panels, no rounded display until iPhone X)', () => {
    const homeButtonPhones = IOS_DEVICES.filter(p => p.formFactor !== 'tablet' && resolveDevice(p).shell.homeButton !== null)
    expect(homeButtonPhones.length).toBeGreaterThanOrEqual(13)
    for (const profile of homeButtonPhones) {
      const d = resolveDevice(profile)
      expect(d.shell.screenRadius, `${profile.name} screenRadius`).toBe(0)
      expect(d.shell.bodyRadius, `${profile.name} bodyRadius`).toBe(38)
    }
  })

  describe('iPhone XR / iPhone 11 — sb 48, safe area 48/34, landscape 48/48/21 (measured)', () => {
    it.each(['iPhone XR', 'iPhone 11'])('%s', (name) => {
      const d = device(name)
      expect(d.statusBarHeight, 'statusBarHeight').toBe(48)
      expect(d.safeAreaInsets, 'safeAreaInsets').toEqual(insets(48, 0, 34, 0))
      expect(d.safeAreaInsetsLandscape, 'safeAreaInsetsLandscape').toEqual(insets(0, 48, 21, 48))
      // safearea.info DeviceHub 227×32 (ADV/CANONICAL agree); bottom 21.5 bezel; ear unset.
      expect(d.cutout, 'cutout').toEqual({
        shape: 'notch', width: 227, height: 32, top: 0, bottomRadius: 21.5,
      })
    })
  })

  it('iPhone XS Max — notch cutout + landscape 44/44/21 + safe area 44/34 (portrait/landscape insets measured, notch size from spec)', () => {
    const d = device('iPhone XS Max')
    expect(d.cutout).toEqual({ shape: 'notch', width: 209, height: 30, top: 0, bottomRadius: 20, topRadius: 6 })
    expect(d.safeAreaInsetsLandscape).toEqual(insets(0, 44, 21, 44))
    expect(d.safeAreaInsets).toEqual(insets(44, 0, 34, 0))
  })

  it('iPhone 11 Pro — safe area 44/34, landscape 44/44/21 (measured)', () => {
    const d = device('iPhone 11 Pro')
    expect(d.safeAreaInsets).toEqual(insets(44, 0, 34, 0))
    expect(d.safeAreaInsetsLandscape).toEqual(insets(0, 44, 21, 44))
  })

  it('iPhone 11 Pro Max — landscape 44/44/21 (measured)', () => {
    expect(device('iPhone 11 Pro Max').safeAreaInsetsLandscape).toEqual(insets(0, 44, 21, 44))
  })

  describe('12/13 mini family — sb 50, safe area 50/34, landscape 50/50/21 (measured)', () => {
    it.each(['iPhone 12 Mini', 'iPhone 13 Mini', 'iPhone 12/13 mini'])('%s', (name) => {
      const d = device(name)
      expect(d.statusBarHeight, 'statusBarHeight').toBe(50)
      expect(d.safeAreaInsets, 'safeAreaInsets').toEqual(insets(50, 0, 34, 0))
      expect(d.safeAreaInsetsLandscape, 'safeAreaInsetsLandscape').toEqual(insets(0, 50, 21, 50))
    })

    // DeviceHub / safearea.info supersede the old Simulator icon-clearance lock (192×30).
    it('iPhone 12 Mini cutout matches safearea.info DeviceHub notch (226×34) + ADV bottom ≈20', () => {
      expect(device('iPhone 12 Mini').cutout).toEqual({
        shape: 'notch', width: 226, height: 34, top: 0, bottomRadius: 20,
      })
    })

    it('iPhone 13 Mini / merged mini use safearea.info 13 mini notch (174×37) + ADV bottom ≈21', () => {
      const expected = {
        shape: 'notch', width: 174, height: 37, top: 0, bottomRadius: 21,
      }
      expect(device('iPhone 13 Mini').cutout).toEqual(expected)
      expect(device('iPhone 12/13 mini').cutout).toEqual(expected)
    })
  })

  describe('iPad screen corners — home-button iPads are square, full-screen iPads are rounded', () => {
    it.each(['iPad', 'iPad (gen 5)', 'iPad (gen 6)', 'iPad (gen 7)', 'iPad Pro 10.5-inch'])('%s has screenRadius 0', (name) => {
      expect(device(name).shell.screenRadius).toBe(0)
    })
    it.each(['iPad Mini', 'iPad (gen 11)', 'iPad Air', 'iPad Air M2', 'iPad Pro 11', 'iPad Pro M4', 'iPad Pro 12.9-inch', 'iPad Pro', 'iPad Pro 13'])('%s has screenRadius 18', (name) => {
      expect(device(name).shell.screenRadius).toBe(18)
    })
  })

  describe('12/13 (Pro) family — landscape 47/47/21 (measured)', () => {
    it.each(['iPhone 12', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 12/13 (Pro)'])('%s', (name) => {
      expect(device(name).safeAreaInsetsLandscape).toEqual(insets(0, 47, 21, 47))
    })
  })

  // decision: the merged 12/13 preset's cutout takes 'iPhone 13' 's value, matching how
  // 'iPhone 12/13 Pro Max' uses 161. The simulator can't measure a cutout, so this is an
  // equality relationship, not a concrete size.
  it("iPhone 12/13 (Pro) cutout matches iPhone 13's cutout (decision, cannot be measured on device)", () => {
    expect(device('iPhone 12/13 (Pro)').cutout).toEqual(device('iPhone 13').cutout)
  })

  describe('12/13 Pro Max family — landscape 47/47/21 (measured)', () => {
    it.each(['iPhone 12 Pro Max', 'iPhone 13 Pro Max', 'iPhone 12/13 Pro Max'])('%s', (name) => {
      expect(device(name).safeAreaInsetsLandscape).toEqual(insets(0, 47, 21, 47))
    })
  })

  it('iPhone 17 — landscape 62/62/20 (measured, iOS 26.5)', () => {
    expect(device('iPhone 17').safeAreaInsetsLandscape).toEqual(insets(0, 62, 20, 62))
  })

  it('iPhone 17e — landscape 47/47/20 (measured)', () => {
    expect(device('iPhone 17e').safeAreaInsetsLandscape).toEqual(insets(0, 47, 20, 47))
  })

  it('iPhone 17 Pro — landscape top 0, rest 62/62/20 kept (measured)', () => {
    expect(device('iPhone 17 Pro').safeAreaInsetsLandscape).toEqual(insets(0, 62, 20, 62))
  })

  it('iPhone 17 Pro Max — landscape bottom 20 (measured)', () => {
    expect(device('iPhone 17 Pro Max').safeAreaInsetsLandscape).toEqual(insets(0, 62, 20, 62))
  })

  describe('iPhone Air / iPhone 17 Air — screen/inset/cutout target values (screen+inset measured; pill width 125.3 measured, top 20 derived from clock centerline 38.7)', () => {
    it.each(['iPhone Air', 'iPhone 17 Air'])('%s', (name) => {
      const d = device(name)
      expect(d.screen, 'screen').toEqual({ width: 420, height: 912 })
      expect(d.pixelRatio, 'pixelRatio').toBe(3)
      expect(d.statusBarHeight, 'statusBarHeight').toBe(54)
      expect(d.safeAreaInsets, 'safeAreaInsets').toEqual(insets(68, 0, 34, 0))
      expect(d.safeAreaInsetsLandscape, 'safeAreaInsetsLandscape').toEqual(insets(0, 68, 20, 68))
      expect(d.cutout, 'cutout').toEqual({ shape: 'pill', width: 125, height: 37, top: 20 })
    })
  })

  // decision: the two are identical — comparing the fields listed for this group, excluding
  // system/userAgent (spec doesn't require the version string to be kept in sync).
  it('iPhone Air and iPhone 17 Air are identical apart from name: screen/inset/cutout', () => {
    const air = device('iPhone Air')
    const air17 = device('iPhone 17 Air')
    const fields = ['screen', 'pixelRatio', 'statusBarHeight', 'safeAreaInsets', 'safeAreaInsetsLandscape', 'cutout'] as const
    for (const field of fields) expect(air17[field], field).toEqual(air[field])
  })

  describe('legacy iPhones (4/5/5-SE/6/6+/7/7+/8/8+) — sb 20, safe area {top 20}, landscape sb 0 (spec: iOS 7+ portrait 20pt, iPhone hides it in landscape)', () => {
    it.each([
      'iPhone 4',
      'iPhone 5',
      'iPhone 5/SE',
      'iPhone 6',
      'iPhone 6 Plus',
      'iPhone 7',
      'iPhone 7 Plus',
      'iPhone 8',
      'iPhone 8 Plus',
      'iPhone 6/7/8',
      'iPhone 6/7/8 Plus',
    ])('%s', (name) => {
      const d = device(name)
      expect(d.statusBarHeight, 'statusBarHeight').toBe(20)
      expect(d.safeAreaInsets, 'safeAreaInsets').toEqual(insets(20, 0, 0, 0))
      expect(d.statusBarHeightLandscape, 'statusBarHeightLandscape').toBe(0)
    })
  })

  it('iPad Mini — screen 744x1133 @2 (measured, iPad mini 6 / A17 Pro)', () => {
    const d = device('iPad Mini')
    expect(d.screen).toEqual({ width: 744, height: 1133 })
    expect(d.pixelRatio).toBe(2)
  })

  it('iPad (gen 11) — screen 820x1180 @2 (measured, iPad-A16)', () => {
    const d = device('iPad (gen 11)')
    expect(d.screen).toEqual({ width: 820, height: 1180 })
    expect(d.pixelRatio).toBe(2)
  })

  it('iPad Pro M4 — screen 834x1210 @2, 11-inch (measured)', () => {
    const d = device('iPad Pro M4')
    expect(d.screen).toEqual({ width: 834, height: 1210 })
    expect(d.pixelRatio).toBe(2)
  })

  describe('full-screen iPad — sb 24 (portrait) / 24 (landscape), safe area top24/bottom25 both orientations (measured)', () => {
    it.each([
      'iPad Mini',
      'iPad (gen 11)',
      'iPad Air',
      'iPad Air M2',
      'iPad Pro 11',
      'iPad Pro M4',
      'iPad Pro 12.9-inch',
      'iPad Pro',
      'iPad Pro 13',
    ])('%s', (name) => {
      const d = device(name)
      expect(d.statusBarHeight, 'statusBarHeight').toBe(24)
      expect(d.statusBarHeightLandscape, 'statusBarHeightLandscape').toBe(24)
      expect(d.safeAreaInsets, 'safeAreaInsets').toEqual(insets(24, 0, 25, 0))
      expect(d.safeAreaInsetsLandscape, 'safeAreaInsetsLandscape').toEqual(insets(24, 0, 25, 0))
    })
  })

  it('home-button iPad (gen 7) — sb 20 both orientations, safe area {top 20} both orientations (measured)', () => {
    const d = device('iPad (gen 7)')
    expect(d.statusBarHeight).toBe(20)
    expect(d.statusBarHeightLandscape).toBe(20)
    expect(d.safeAreaInsets).toEqual(insets(20, 0, 0, 0))
    expect(d.safeAreaInsetsLandscape).toEqual(insets(20, 0, 0, 0))
  })

  describe('home-button iPad (gen 5/6, iPad, iPad Pro 10.5-inch) — sb 20 both orientations (spec, simulator runtime unsupported, unverified)', () => {
    it.each(['iPad', 'iPad (gen 5)', 'iPad (gen 6)', 'iPad Pro 10.5-inch'])('%s', (name) => {
      const d = device(name)
      expect(d.statusBarHeight).toBe(20)
      expect(d.statusBarHeightLandscape).toBe(20)
      expect(d.safeAreaInsets).toEqual(insets(20, 0, 0, 0))
      expect(d.safeAreaInsetsLandscape).toEqual(insets(20, 0, 0, 0))
    })
  })

  // Traditional top-edge iPhones hide their status bar in landscape. Duo's right-edge status
  // bar is covered by the dedicated status-bar-edge tests instead of weakening this invariant.
  it('every traditional top-edge iPhone hides its status bar in landscape', () => {
    const iphones = IOS_DEVICES.filter((d) => d.name.startsWith('iPhone') && device(d.name).statusBarEdgeLandscape === 'top')
    expect(iphones.length).toBeGreaterThan(0)
    const offenders = iphones.filter((d) => device(d.name).statusBarHeightLandscape !== 0)
    expect(offenders.map((d) => d.name)).toEqual([])
  })

  it('iPhone 17 Pro Max locks screenRadius 62 (ScreenCorners / same as 17 Pro)', () => {
    expect(device('iPhone 17 Pro Max').shell.screenRadius).toBe(62)
  })


  describe('ScreenCorners radius buckets (locked)', () => {
    it.each([
      ['iPhone X', 39],
      ['iPhone XR', 41.5],
      ['iPhone 12 Mini', 44],
      ['iPhone 12', 47.33],
      ['iPhone 12 Pro', 47.33],
      ['iPhone 13 Pro', 47.33],
      ['iPhone 14', 47.33],
      ['iPhone 12 Pro Max', 53.33],
      ['iPhone 14 Plus', 53.33],
      ['iPhone 14 Pro', 55],
      ['iPhone 15', 55],
      ['iPhone 16 Pro Max', 62],
      ['iPhone 17 Pro', 62],
      ['iPhone 17 Pro Max', 62],
    ] as const)('%s screenRadius %s', (name, radius) => {
      expect(device(name).shell.screenRadius).toBe(radius)
    })
  })

  it('every modern iPhone with a cutout declares an explicit screenRadius (no DEFAULT 38)', () => {
    const offenders = IOS_DEVICES.filter((p) => {
      if (p.formFactor === 'tablet') return false
      if (!p.cutout) return false
      return p.shell?.screenRadius === undefined
    })
    expect(offenders.map((p) => p.name)).toEqual([])
  })

  it('iPhone Duo screens use DeviceHub layout points and continuous free-edge radius 59', () => {
    const outer = device('iPhone Duo (outer)')
    const inner = device('iPhone Duo (inner)')
    expect(outer.screen).toEqual({ width: 466, height: 678 })
    expect(inner.screen).toEqual({ width: 669, height: 951 })
    expect(outer.shell.screenRadius).toBe(59)
    expect(outer.shell.screenCorners).toEqual({ topLeft: 8, topRight: 59, bottomRight: 59, bottomLeft: 8 })
    expect(inner.shell.screenRadius).toBe(59)
    expect(outer.shell.cornerCurve).toBe('continuous')
    expect(inner.safeAreaInsets).toEqual(insets(82, 0, 34, 0))
    expect(inner.safeAreaInsetsLandscape).toEqual(insets(0, 84, 34, 0))
    expect(outer.safeAreaInsets).toEqual(insets(0, 84, 34, 0))
    expect(outer.safeAreaInsetsLandscape).toEqual(insets(0, 84, 34, 0))
    expect(outer.cutout).toEqual({ shape: 'circle', width: 37, height: 37, top: 26, centerX: 0.9 })
  })


})

describe('B. Android presets', () => {

  it('Galaxy S24 / S24 Ultra / Pixel 9 Pro expose measured screen radius, safe area, and cutout', () => {
    const s24 = device('Galaxy S24')
    expect(s24.shell.screenRadius).toBe(36)
    expect(s24.safeAreaInsets).toEqual(insets(34, 0, 15, 0))
    expect(s24.cutout?.shape).toBe('circle')

    const ultra = device('Galaxy S24 Ultra')
    expect(ultra.screen).toEqual({ width: 384, height: 832 })
    expect(ultra.pixelRatio).toBe(2.8125)
    expect(ultra.shell.screenRadius).toBe(2.13)
    expect(ultra.safeAreaInsets).toEqual(insets(34, 0, 15, 0))

    const pixel = device('Pixel 9 Pro')
    expect(pixel.shell.screenRadius).toBe(52.33)
    expect(pixel.safeAreaInsets).toEqual(insets(52, 0, 24, 0))
    expect(pixel.statusBarHeight).toBe(52)
    expect(pixel.shell.cornerCurve).toBe('circular')
  })

  it('Samsung S21 FE — windowinsets FHD window 360x780 @3 (was 360x800)', () => {
    const d = device('Samsung S21 FE')
    expect(d.pixelRatio).toBe(3)
    expect(d.screen).toEqual({ width: 360, height: 780 })
    expect(d.shell.screenRadius).toBe(40.33)
  })

  // windowinsets.info gesture captures — radius + safeDrawing (bottom included).
  describe('windowinsets-backed Android screen geometry', () => {
    it.each([
      ['Galaxy S23', 36, 27, 15, { width: 360, height: 780 }, 3],
      ['Galaxy S23 Plus', 35.91, 26, 15, { width: 384, height: 832 }, 2.8125],
      ['Galaxy S23 Ultra', 3.91, 33, 15, { width: 384, height: 823 }, 2.8125],
      ['Galaxy S22', 34, 27, 15, { width: 360, height: 780 }, 3],
      ['Galaxy S22 Ultra', 35.91, 27, 15, { width: 384, height: 823 }, 2.8125],
      ['Galaxy S24 Plus', 35.91, 34, 15, { width: 384, height: 832 }, 2.8125],
      ['Samsung Galaxy A55', 41.96, 32, 15, { width: 384, height: 832 }, 2.8125],
      ['Pixel 8', 39.62, 50, 24, { width: 412, height: 915 }, 2.625],
      ['Pixel 7', 17.9, 52, 24, { width: 412, height: 915 }, 2.625],
      ['Pixel 7a', 17.9, 45, 24, { width: 412, height: 915 }, 2.625],
      ['Pixel 6a', 17.9, 50, 24, { width: 412, height: 915 }, 2.625],
      ['Pixel 8 Pro', 30.33, 50, 24, { width: 448, height: 997 }, 3],
      ['Pixel 9', 50.29, 54, 24, { width: 412, height: 924 }, 2.625],
      ['Pixel 9 Pro XL', 51, 53, 24, { width: 448, height: 997 }, 3],
      ['Pixel 10 Pro', 52.33, 52, 24, { width: 427, height: 952 }, 3],
    ] as const)('%s radius/safe/window', (name, radius, top, bottom, screen, pr) => {
      const d = device(name)
      expect(d.shell.screenRadius, 'screenRadius').toBe(radius)
      expect(d.safeAreaInsets).toEqual(insets(top, 0, bottom, 0))
      expect(d.statusBarHeight).toBe(top)
      expect(d.screen).toEqual(screen)
      expect(d.pixelRatio).toBe(pr)
      expect(d.shell.cornerCurve).toBe('circular')
    })
  })

  it('legacy flat Android panels — explicit screenRadius 2 (no WI; honesty vs default 16)', () => {
    for (const name of [
      'Nexus 5',
      'Nexus 5X',
      'Nexus 6',
      'Nexus 4',
      'Nexus 6P',
      'Nexus 7',
      'Nexus 10',
      'Galaxy Note 3',
      'Galaxy Note II',
      'Galaxy S III',
      'Galaxy S5',
      'LG Optimus L70',
      'Moto G4',
    ]) {
      expect(device(name).shell.screenRadius, name).toBe(2)
    }
  })

  it('Pixel 2 / Pixel 2 XL — OEM sysui_rounded_size defaults (XDA/SystemUI); no WI', () => {
    expect(device('Pixel 2').shell.screenRadius).toBe(0)
    expect(device('Pixel 2 XL').shell.screenRadius).toBe(26)
  })

    it('Galaxy Z Flip 7 Cover — WI cover window + asymmetric corners + bottom pill cutout', () => {
    const d = device('Galaxy Z Flip 7 Cover')
    expect(d.screen).toEqual({ width: 361, height: 399 })
    expect(d.pixelRatio).toBe(2.625)
    expect(d.shell.screenRadius).toBe(6.1)
    expect(d.shell.screenCorners).toEqual({ topLeft: 6.1, topRight: 6.1, bottomRight: 41.14, bottomLeft: 41.14 })
    expect(d.cutout).toEqual({ shape: 'pill', width: 198, height: 84, top: 315, centerX: 0.726 })
    expect(d.safeAreaInsets.bottom).toBe(84)
  })

  it('Pixel Tablet — screen is 800x1280 dp, not the 1600x2560 px panel', () => {
    const d = device('Pixel Tablet')
    expect(d.pixelRatio).toBe(2)
    expect(d.screen).toEqual({ width: 800, height: 1280 })
  })

  describe('Galaxy S20 / S20 Plus — system Android 10, UA version in sync', () => {
    it.each(['Galaxy S20', 'Galaxy S20 Plus'])('%s', (name) => {
      const d = device(name)
      expect(d.system).toBe('Android 10')
      expect(d.userAgent).toContain('Android 10;')
    })
  })

  describe('Galaxy S21 / S21 Plus / S21 Ultra — system Android 11, UA version in sync', () => {
    it.each(['Galaxy S21', 'Galaxy S21 Plus', 'Galaxy S21 Ultra'])('%s', (name) => {
      const d = device(name)
      expect(d.system).toBe('Android 11')
      expect(d.userAgent).toContain('Android 11;')
    })
  })

  describe('Galaxy Z Fold 6 / Flip 6 and Cover/inner variants — system Android 14, UA version in sync', () => {
    it.each([
      'Galaxy Z Fold 6',
      'Galaxy Z Fold 6 (inner)',
      'Galaxy Z Fold 6 Cover',
      'Galaxy Z Flip 6',
      'Galaxy Z Flip 6 Cover',
    ])('%s', (name) => {
      const d = device(name)
      expect(d.system).toBe('Android 14')
      expect(d.userAgent).toContain('Android 14;')
    })
  })

  describe('Galaxy Z Fold 7 / Flip 7 and variants — system Android 16, UA version in sync', () => {
    it.each(['Galaxy Z Fold 7', 'Galaxy Z Fold 7 Cover', 'Galaxy Z Flip 7', 'Galaxy Z Flip 7 Cover'])('%s', (name) => {
      const d = device(name)
      expect(d.system).toBe('Android 16')
      expect(d.userAgent).toContain('Android 16;')
    })
  })

  describe('Galaxy Z Fold 5 (including inner) — system Android 13, UA version in sync', () => {
    it.each(['Galaxy Z Fold 5', 'Galaxy Z Fold 5 (inner)'])('%s', (name) => {
      const d = device(name)
      expect(d.system).toBe('Android 13')
      expect(d.userAgent).toContain('Android 13;')
    })
  })

  it('Nexus 10 — system Android 5.1, UA version in sync', () => {
    const d = device('Nexus 10')
    expect(d.system).toBe('Android 5.1')
    expect(d.userAgent).toContain('Android 5.1;')
  })

  it('Samsung Galaxy S8+ — system Android 7.0, UA model SM-G955U', () => {
    const d = device('Samsung Galaxy S8+')
    expect(d.system).toBe('Android 7.0')
    expect(d.userAgent).toContain('Android 7.0;')
    expect(d.userAgent).toContain('SM-G955U')
  })

  it('Samsung Galaxy A51/71 — UA model SM-A515F, system Android 10, UA version in sync', () => {
    const d = device('Samsung Galaxy A51/71')
    expect(d.system).toBe('Android 10')
    expect(d.userAgent).toContain('Android 10;')
    expect(d.userAgent).toContain('SM-A515F')
  })

  it('Pixel 3 XL — UA device string should be "Pixel 3 XL" (currently written as "Pixel 3")', () => {
    expect(device('Pixel 3 XL').userAgent).toContain('Pixel 3 XL')
  })

  it('Pixel 5 — left-edge punch-hole centerX from windowinsets.info bounds', () => {
    expect(device('Pixel 5').cutout).toEqual({
      shape: 'circle', width: 49, height: 49, top: 0, centerX: 0.063,
    })
  })

  it('Pixel 9 Pro Fold (inner) — right-edge hole centerX from windowinsets.info bounds', () => {
    expect(device('Pixel 9 Pro Fold (inner)').cutout).toEqual({
      shape: 'circle', width: 56, height: 56, top: 0, centerX: 0.967,
    })
  })

  it('Pixel 7 Pro — statusBarHeight 41, cutout circle 25/25/top8 (AVD measured; screen/pixelRatio kept at current values)', () => {
    const d = device('Pixel 7 Pro')
    expect(d.statusBarHeight).toBe(41)
    expect(d.cutout).toEqual({ shape: 'circle', width: 25, height: 25, top: 8 })
    expect(d.screen).toEqual({ width: 412, height: 892 })
    expect(d.pixelRatio).toBe(3.5)
  })
})

describe('C. HarmonyOS presets', () => {
  it('HUAWEI Mate 60 — screen.height 827 (width 374 unchanged)', () => {
    const d = device('HUAWEI Mate 60')
    expect(d.screen).toEqual({ width: 374, height: 827 })
  })
})
