import { describe, expect, it } from 'vitest'
import { resolveDevice, type EdgeInsets } from './devices.js'
import { findDevice, IOS_DEVICES } from './presets/index.js'

/**
 * One assertion per row of the device verification table this file encodes.
 * Each row's target value is either a measured UIKit/statusBarManager
 * reading on the matching simulator or a published spec, as noted per group.
 */

function device(name: string) {
  const profile = findDevice(name)
  if (!profile) throw new Error(`no such preset: ${name}`)
  return resolveDevice(profile)
}

const insets = (top: number, right: number, bottom: number, left: number): EdgeInsets => ({ top, right, bottom, left })

describe('A. iOS presets (FIX-SPEC.md section A)', () => {
  describe('iPhone XR / iPhone 11 — sb 48, safe area 48/34, landscape 48/48/21 (实测)', () => {
    it.each(['iPhone XR', 'iPhone 11'])('%s', (name) => {
      const d = device(name)
      expect(d.statusBarHeight, 'statusBarHeight').toBe(48)
      expect(d.safeAreaInsets, 'safeAreaInsets').toEqual(insets(48, 0, 34, 0))
      expect(d.safeAreaInsetsLandscape, 'safeAreaInsetsLandscape').toEqual(insets(0, 48, 21, 48))
    })
  })

  it('iPhone XS Max — notch cutout + landscape 44/44/21 + safe area 44/34 (横竖 inset 实测, notch 尺寸=规格)', () => {
    const d = device('iPhone XS Max')
    expect(d.cutout).toEqual({ shape: 'notch', width: 209, height: 30, top: 0 })
    expect(d.safeAreaInsetsLandscape).toEqual(insets(0, 44, 21, 44))
    expect(d.safeAreaInsets).toEqual(insets(44, 0, 34, 0))
  })

  it('iPhone 11 Pro — safe area 44/34, landscape 44/44/21 (实测)', () => {
    const d = device('iPhone 11 Pro')
    expect(d.safeAreaInsets).toEqual(insets(44, 0, 34, 0))
    expect(d.safeAreaInsetsLandscape).toEqual(insets(0, 44, 21, 44))
  })

  it('iPhone 11 Pro Max — landscape 44/44/21 (实测)', () => {
    expect(device('iPhone 11 Pro Max').safeAreaInsetsLandscape).toEqual(insets(0, 44, 21, 44))
  })

  describe('12/13 mini family — sb 50, safe area 50/34, landscape 50/50/21 (实测)', () => {
    it.each(['iPhone 12 Mini', 'iPhone 13 Mini', 'iPhone 12/13 mini'])('%s', (name) => {
      const d = device(name)
      expect(d.statusBarHeight, 'statusBarHeight').toBe(50)
      expect(d.safeAreaInsets, 'safeAreaInsets').toEqual(insets(50, 0, 34, 0))
      expect(d.safeAreaInsetsLandscape, 'safeAreaInsetsLandscape').toEqual(insets(0, 50, 21, 50))
      // Icons start at x=285.7 on the simulator with ~2pt clearance, so the notch cannot be wider than this.
      expect(d.cutout, 'cutout').toEqual({ shape: 'notch', width: 192, height: 30, top: 0 })
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

  describe('12/13 (Pro) family — landscape 47/47/21 (实测)', () => {
    it.each(['iPhone 12', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 12/13 (Pro)'])('%s', (name) => {
      expect(device(name).safeAreaInsetsLandscape).toEqual(insets(0, 47, 21, 47))
    })
  })

  // 决策: 12/13 合并 preset 的刘海取 'iPhone 13' 的值, 与 'iPhone 12/13 Pro Max' 用 161 一致.
  // 模拟器无法测刘海, 所以这是相等关系, 不是具体尺寸.
  it("iPhone 12/13 (Pro) cutout matches iPhone 13's cutout (决策，无法上机实测)", () => {
    expect(device('iPhone 12/13 (Pro)').cutout).toEqual(device('iPhone 13').cutout)
  })

  describe('12/13 Pro Max family — landscape 47/47/21 (实测)', () => {
    it.each(['iPhone 12 Pro Max', 'iPhone 13 Pro Max', 'iPhone 12/13 Pro Max'])('%s', (name) => {
      expect(device(name).safeAreaInsetsLandscape).toEqual(insets(0, 47, 21, 47))
    })
  })

  it('iPhone 17 — landscape 62/62/20 (实测 iOS 26.5)', () => {
    expect(device('iPhone 17').safeAreaInsetsLandscape).toEqual(insets(0, 62, 20, 62))
  })

  it('iPhone 17e — landscape 47/47/20 (实测)', () => {
    expect(device('iPhone 17e').safeAreaInsetsLandscape).toEqual(insets(0, 47, 20, 47))
  })

  it('iPhone 17 Pro — landscape top 0, rest 62/62/20 kept (实测)', () => {
    expect(device('iPhone 17 Pro').safeAreaInsetsLandscape).toEqual(insets(0, 62, 20, 62))
  })

  it('iPhone 17 Pro Max — landscape bottom 20 (实测)', () => {
    expect(device('iPhone 17 Pro Max').safeAreaInsetsLandscape).toEqual(insets(0, 62, 20, 62))
  })

  describe('iPhone Air / iPhone 17 Air — screen/inset/cutout target values (screen+inset 实测；pill 宽 125.3 实测, top 20 由时间中线 38.7 推出)', () => {
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

  // 两条完全一致 (决策) — 比较 FIX-SPEC 列出的字段, 不含 system/userAgent (spec 未要求同步版本号).
  it('iPhone Air 与 iPhone 17 Air 除 name 外, screen/inset/cutout 完全一致', () => {
    const air = device('iPhone Air')
    const air17 = device('iPhone 17 Air')
    const fields = ['screen', 'pixelRatio', 'statusBarHeight', 'safeAreaInsets', 'safeAreaInsetsLandscape', 'cutout'] as const
    for (const field of fields) expect(air17[field], field).toEqual(air[field])
  })

  describe('legacy iPhones (4/5/5-SE/6/6+/7/7+/8/8+) — sb 20, safe area {top 20}, landscape sb 0 (规格: iOS 7+ 竖屏 20pt，iPhone 横屏隐藏)', () => {
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

  it('iPad Mini — screen 744x1133 @2 (实测 iPad mini 6 / A17 Pro)', () => {
    const d = device('iPad Mini')
    expect(d.screen).toEqual({ width: 744, height: 1133 })
    expect(d.pixelRatio).toBe(2)
  })

  it('iPad (gen 11) — screen 820x1180 @2 (实测 iPad-A16)', () => {
    const d = device('iPad (gen 11)')
    expect(d.screen).toEqual({ width: 820, height: 1180 })
    expect(d.pixelRatio).toBe(2)
  })

  it('iPad Pro M4 — screen 834x1210 @2, 11 英寸 (实测)', () => {
    const d = device('iPad Pro M4')
    expect(d.screen).toEqual({ width: 834, height: 1210 })
    expect(d.pixelRatio).toBe(2)
  })

  describe('全面屏 iPad — sb 24 (竖) / 24 (横), 安全区 top24/bottom25 双朝向 (实测)', () => {
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

  it('Home 键 iPad (gen 7) — sb 20 双朝向, 安全区 {top 20} 双朝向 (实测)', () => {
    const d = device('iPad (gen 7)')
    expect(d.statusBarHeight).toBe(20)
    expect(d.statusBarHeightLandscape).toBe(20)
    expect(d.safeAreaInsets).toEqual(insets(20, 0, 0, 0))
    expect(d.safeAreaInsetsLandscape).toEqual(insets(20, 0, 0, 0))
  })

  describe('Home 键 iPad (gen 5/6, iPad, iPad Pro 10.5-inch) — sb 20 双朝向 (规格，模拟器 runtime 不支持，未验证)', () => {
    it.each(['iPad', 'iPad (gen 5)', 'iPad (gen 6)', 'iPad Pro 10.5-inch'])('%s', (name) => {
      const d = device(name)
      expect(d.statusBarHeight).toBe(20)
      expect(d.statusBarHeightLandscape).toBe(20)
      expect(d.safeAreaInsets).toEqual(insets(20, 0, 0, 0))
      expect(d.safeAreaInsetsLandscape).toEqual(insets(20, 0, 0, 0))
    })
  })

  // iPhone 横屏没有状态栏, 含 legacy/SE. iPhone X/8/8 Plus 这条只能规格核对（标"未验证"），
  // 但断言本身对全体 iPhone 无差别地成立.
  it('every iPhone preset hides its status bar in landscape (statusBarHeightLandscape 0)', () => {
    const iphones = IOS_DEVICES.filter((d) => d.name.startsWith('iPhone'))
    expect(iphones.length).toBeGreaterThan(0)
    const offenders = iphones.filter((d) => device(d.name).statusBarHeightLandscape !== 0)
    expect(offenders.map((d) => d.name)).toEqual([])
  })
})

describe('B. Android presets (FIX-SPEC.md section B, 依据 android-spec.md)', () => {
  it('Samsung S21 FE — pixelRatio 3 (1080x2400 -> 360x800)', () => {
    const d = device('Samsung S21 FE')
    expect(d.pixelRatio).toBe(3)
    expect(d.screen).toEqual({ width: 360, height: 800 })
  })

  it('Pixel Tablet — screen is 800x1280 dp, not the 1600x2560 px panel', () => {
    const d = device('Pixel Tablet')
    expect(d.pixelRatio).toBe(2)
    expect(d.screen).toEqual({ width: 800, height: 1280 })
  })

  describe('Galaxy S20 / S20 Plus — system Android 10, UA 版本同步', () => {
    it.each(['Galaxy S20', 'Galaxy S20 Plus'])('%s', (name) => {
      const d = device(name)
      expect(d.system).toBe('Android 10')
      expect(d.userAgent).toContain('Android 10;')
    })
  })

  describe('Galaxy S21 / S21 Plus / S21 Ultra — system Android 11, UA 版本同步', () => {
    it.each(['Galaxy S21', 'Galaxy S21 Plus', 'Galaxy S21 Ultra'])('%s', (name) => {
      const d = device(name)
      expect(d.system).toBe('Android 11')
      expect(d.userAgent).toContain('Android 11;')
    })
  })

  describe('Galaxy Z Fold 6 / Flip 6 及 Cover/inner 变体 — system Android 14, UA 版本同步', () => {
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

  describe('Galaxy Z Fold 7 / Flip 7 及变体 — system Android 16, UA 版本同步', () => {
    it.each(['Galaxy Z Fold 7', 'Galaxy Z Fold 7 Cover', 'Galaxy Z Flip 7', 'Galaxy Z Flip 7 Cover'])('%s', (name) => {
      const d = device(name)
      expect(d.system).toBe('Android 16')
      expect(d.userAgent).toContain('Android 16;')
    })
  })

  describe('Galaxy Z Fold 5（含 inner）— system Android 13, UA 版本同步', () => {
    it.each(['Galaxy Z Fold 5', 'Galaxy Z Fold 5 (inner)'])('%s', (name) => {
      const d = device(name)
      expect(d.system).toBe('Android 13')
      expect(d.userAgent).toContain('Android 13;')
    })
  })

  it('Nexus 10 — system Android 5.1, UA 版本同步', () => {
    const d = device('Nexus 10')
    expect(d.system).toBe('Android 5.1')
    expect(d.userAgent).toContain('Android 5.1;')
  })

  it('Samsung Galaxy S8+ — system Android 7.0, UA 型号 SM-G955U', () => {
    const d = device('Samsung Galaxy S8+')
    expect(d.system).toBe('Android 7.0')
    expect(d.userAgent).toContain('Android 7.0;')
    expect(d.userAgent).toContain('SM-G955U')
  })

  it('Samsung Galaxy A51/71 — UA 型号 SM-A515F, system Android 10, UA 版本同步', () => {
    const d = device('Samsung Galaxy A51/71')
    expect(d.system).toBe('Android 10')
    expect(d.userAgent).toContain('Android 10;')
    expect(d.userAgent).toContain('SM-A515F')
  })

  it('Pixel 3 XL — UA 设备串为 "Pixel 3 XL"（当前串写成了 "Pixel 3"）', () => {
    expect(device('Pixel 3 XL').userAgent).toContain('Pixel 3 XL')
  })

  it('Pixel 7 Pro — statusBarHeight 41, cutout circle 25/25/top8 (AVD 实测；screen/pixelRatio 保持现值)', () => {
    const d = device('Pixel 7 Pro')
    expect(d.statusBarHeight).toBe(41)
    expect(d.cutout).toEqual({ shape: 'circle', width: 25, height: 25, top: 8 })
    expect(d.screen).toEqual({ width: 412, height: 892 })
    expect(d.pixelRatio).toBe(3.5)
  })
})

describe('C. HarmonyOS presets (FIX-SPEC.md section C)', () => {
  it('HUAWEI Mate 60 — screen.height 827 (width 374 保持)', () => {
    const d = device('HUAWEI Mate 60')
    expect(d.screen).toEqual({ width: 374, height: 827 })
  })
})
