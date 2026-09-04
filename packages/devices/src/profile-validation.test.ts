// assertDeviceProfile() is the one place a caller-supplied DeviceProfile gets
// checked before the rest of the package trusts its shape. resolveDevice()
// and resolveWindowSize() read every optional field with `??`, so a profile
// with a negative or non-finite value for one of them does not fail loudly —
// it silently produces a window size or safe area that lies. These cases pin
// what has to be rejected, and that resolveDevice() and resolveWindowSize()
// actually call the check rather than trusting their input.
import { describe, expect, it } from 'vitest'
import {
  assertDeviceProfile,
  DEVICES,
  resolveDevice,
  resolveWindowSize,
  type DeviceProfile,
} from './index.js'

/** A profile that passes every rule, so each case below can break exactly one field. */
const VALID: DeviceProfile = {
  name: 'Validation Fixture',
  os: 'ios',
  screen: { width: 375, height: 812 },
  pixelRatio: 3,
}

function expectRejects(value: unknown, label: string | undefined, ...expectedSubstrings: string[]): void {
  const run = (): void => {
    if (label === undefined) assertDeviceProfile(value)
    else assertDeviceProfile(value, label)
  }
  expect(run).toThrow(TypeError)
  try {
    run()
    throw new Error('expected assertDeviceProfile to throw')
  } catch (err) {
    expect(err).toBeInstanceOf(TypeError)
    const message = (err as Error).message
    for (const substring of expectedSubstrings) expect(message).toContain(substring)
  }
}

describe('assertDeviceProfile rejects anything that is not a plain object', () => {
  it.each([
    ['null', null],
    ['a string', 'iPhone'],
    ['a number', 42],
  ])('%s is not a DeviceProfile', (_description, value) => {
    expectRejects(value, undefined, 'deviceProfile')
  })

  it('an empty object is missing every required field, starting with os', () => {
    expectRejects({}, undefined, 'deviceProfile.os')
  })
})

describe('assertDeviceProfile checks os is one of the three supported platforms', () => {
  it('a missing os is rejected', () => {
    const { os: _os, ...withoutOs } = VALID
    expectRejects(withoutOs, undefined, 'deviceProfile.os')
  })

  it('an os outside ios/android/harmony is rejected', () => {
    expectRejects({ ...VALID, os: 'windows' }, undefined, 'deviceProfile.os')
  })
})

describe('assertDeviceProfile requires a finite, positive screen', () => {
  it('a missing screen is rejected', () => {
    expectRejects({ ...VALID, screen: null }, undefined, 'deviceProfile.screen')
  })

  it('a negative width is rejected and the bad value is named', () => {
    expectRejects({ ...VALID, screen: { width: -1, height: 812 } }, undefined, 'deviceProfile.screen.width', 'got -1')
  })

  it('a zero height is rejected', () => {
    expectRejects({ ...VALID, screen: { width: 375, height: 0 } }, undefined, 'deviceProfile.screen.height')
  })

  it('NaN width is rejected', () => {
    expectRejects({ ...VALID, screen: { width: NaN, height: 812 } }, undefined, 'deviceProfile.screen.width')
  })

  it('Infinity height is rejected — not just "not a number"', () => {
    expectRejects({ ...VALID, screen: { width: 375, height: Infinity } }, undefined, 'deviceProfile.screen.height')
  })
})

describe('assertDeviceProfile only checks the optional numeric fields when they are present', () => {
  it('pixelRatio of 0 is rejected (must be > 0, not just >= 0)', () => {
    expectRejects({ ...VALID, pixelRatio: 0 }, undefined, 'deviceProfile.pixelRatio')
  })

  it.each([
    'statusBarHeight',
    'statusBarHeightLandscape',
    'navigationBarHeight',
    'navigationBarHeightLandscape',
  ] as const)('a negative %s is rejected', (field) => {
    expectRejects({ ...VALID, [field]: -5 }, undefined, `deviceProfile.${field}`)
  })

  it.each([
    'statusBarHeight',
    'statusBarHeightLandscape',
    'navigationBarHeight',
    'navigationBarHeightLandscape',
  ] as const)('zero is a valid %s (only negative is rejected)', (field) => {
    expect(() => assertDeviceProfile({ ...VALID, [field]: 0 })).not.toThrow()
  })

  it.each(['safeAreaInsets', 'safeAreaInsetsLandscape'] as const)(
    'a negative top inset is rejected and the edge is named in %s',
    (field) => {
      expectRejects({ ...VALID, [field]: { top: -1 } }, undefined, `deviceProfile.${field}.top`)
    },
  )

  it.each(['name', 'system', 'userAgent'] as const)('a numeric %s is rejected', (field) => {
    expectRejects({ ...VALID, [field]: 42 }, undefined, `deviceProfile.${field}`)
  })
})

describe('the label argument replaces the "deviceProfile" prefix in every message', () => {
  it('a custom label shows up in place of the default one', () => {
    expectRejects({}, 'device', 'device.os')
  })
})

describe('resolveDevice() rejects an invalid profile the same way assertDeviceProfile does', () => {
  it('a non-object profile throws TypeError, not a downstream TypeError from reading a field', () => {
    expect(() => resolveDevice(null as unknown as DeviceProfile)).toThrow(TypeError)
  })

  it('a negative screen dimension throws before any resolution happens', () => {
    expect(() => resolveDevice({ ...VALID, screen: { width: -1, height: 812 } })).toThrow(TypeError)
  })
})

describe('every preset in the shared table satisfies its own validation rules', () => {
  it.each(DEVICES.map((device) => [device.name, device] as const))(
    '%s',
    (_name, device) => {
      expect(() => assertDeviceProfile(device)).not.toThrow()
    },
  )
})

describe('resolveWindowSize() rejects options that would otherwise inflate the window past the screen', () => {
  it('a negative navigationBar height throws RangeError naming the option and the value', () => {
    expect(() => resolveWindowSize(VALID, { navigationBar: -5 })).toThrow(RangeError)
    try {
      resolveWindowSize(VALID, { navigationBar: -5 })
    } catch (err) {
      expect((err as Error).message).toContain('navigationBar')
      expect((err as Error).message).toContain('-5')
    }
  })

  it('a NaN navigationBar height throws RangeError', () => {
    expect(() => resolveWindowSize(VALID, { navigationBar: NaN })).toThrow(RangeError)
  })

  it('a negative tabBarHeight throws RangeError naming the option and the value', () => {
    expect(() => resolveWindowSize(VALID, { tabBarHeight: -10 })).toThrow(RangeError)
    try {
      resolveWindowSize(VALID, { tabBarHeight: -10 })
    } catch (err) {
      expect((err as Error).message).toContain('tabBarHeight')
      expect((err as Error).message).toContain('-10')
    }
  })

  it('an infinite tabBarHeight throws RangeError', () => {
    expect(() => resolveWindowSize(VALID, { tabBarHeight: Infinity })).toThrow(RangeError)
  })

  it.each([true, false, 0, 44])('navigationBar: %j is accepted', (navigationBar) => {
    expect(() => resolveWindowSize(VALID, { navigationBar })).not.toThrow()
  })

  it('tabBarHeight: 0 is accepted', () => {
    expect(() => resolveWindowSize(VALID, { tabBarHeight: 0 })).not.toThrow()
  })

  it('with no chrome removed, the window height never exceeds the screen — a negative navigationBar/tabBarHeight used to subtract a negative and grow past it', () => {
    const device: DeviceProfile = {
      name: 'Window Size Fixture',
      os: 'ios',
      screen: { width: 100, height: 200 },
      pixelRatio: 1,
      statusBarHeight: 0,
    }
    const size = resolveWindowSize(device, { navigationBar: 0, tabBarHeight: 0 })
    expect(size.height).toBeLessThanOrEqual(200)
    expect(size.height).toBe(200)
  })
})

describe('assertDeviceProfile requires name', () => {
  it('a missing name is rejected', () => {
    const { name: _name, ...withoutName } = VALID
    expectRejects(withoutName, undefined, 'deviceProfile.name')
  })

  it('a non-string name is rejected', () => {
    expectRejects({ ...VALID, name: 42 }, undefined, 'deviceProfile.name')
  })
})

describe('assertDeviceProfile requires pixelRatio', () => {
  it('a missing pixelRatio is rejected', () => {
    const { pixelRatio: _pixelRatio, ...withoutPixelRatio } = VALID
    expectRejects(withoutPixelRatio, undefined, 'deviceProfile.pixelRatio')
  })

  it('a non-finite pixelRatio (NaN) is rejected', () => {
    expectRejects({ ...VALID, pixelRatio: NaN }, undefined, 'deviceProfile.pixelRatio')
  })

  it('a non-finite pixelRatio (Infinity) is rejected', () => {
    expectRejects({ ...VALID, pixelRatio: Infinity }, undefined, 'deviceProfile.pixelRatio')
  })

  it('a zero pixelRatio is rejected', () => {
    expectRejects({ ...VALID, pixelRatio: 0 }, undefined, 'deviceProfile.pixelRatio')
  })

  it('a negative pixelRatio is rejected', () => {
    expectRejects({ ...VALID, pixelRatio: -1 }, undefined, 'deviceProfile.pixelRatio')
  })
})

/** A cutout that satisfies every rule, so each cutout case below can break exactly one field. */
const VALID_CUTOUT = { shape: 'notch' as const, width: 100, height: 30, top: 0 }
/** A shell that satisfies every rule, so each shell case below can break exactly one field. */
const VALID_SHELL = { screenRadius: 40, bezel: 4, bodyRadius: 44 }

describe('assertDeviceProfile checks cutout when present', () => {
  it('cutout: null is rejected — must be a non-null object', () => {
    expectRejects({ ...VALID, cutout: null }, undefined, 'deviceProfile.cutout')
  })

  it.each(['notch', 'pill', 'circle'] as const)('shape %s is accepted', (shape) => {
    expect(() => assertDeviceProfile({ ...VALID, cutout: { ...VALID_CUTOUT, shape } })).not.toThrow()
  })

  it('a shape outside notch/pill/circle is rejected', () => {
    expectRejects(
      { ...VALID, cutout: { ...VALID_CUTOUT, shape: 'bogus' } },
      undefined,
      'deviceProfile.cutout.shape',
    )
  })

  it('a missing cutout.width is rejected', () => {
    const { width: _width, ...withoutWidth } = VALID_CUTOUT
    expectRejects({ ...VALID, cutout: withoutWidth }, undefined, 'deviceProfile.cutout.width')
  })

  it('a negative cutout.width is rejected', () => {
    expectRejects({ ...VALID, cutout: { ...VALID_CUTOUT, width: -1 } }, undefined, 'deviceProfile.cutout.width')
  })

  it('a missing cutout.height is rejected', () => {
    const { height: _height, ...withoutHeight } = VALID_CUTOUT
    expectRejects({ ...VALID, cutout: withoutHeight }, undefined, 'deviceProfile.cutout.height')
  })

  it('a negative cutout.height is rejected', () => {
    expectRejects({ ...VALID, cutout: { ...VALID_CUTOUT, height: -1 } }, undefined, 'deviceProfile.cutout.height')
  })

  it('a missing cutout.top is rejected', () => {
    const { top: _top, ...withoutTop } = VALID_CUTOUT
    expectRejects({ ...VALID, cutout: withoutTop }, undefined, 'deviceProfile.cutout.top')
  })

  it('a negative cutout.top is rejected', () => {
    expectRejects({ ...VALID, cutout: { ...VALID_CUTOUT, top: -1 } }, undefined, 'deviceProfile.cutout.top')
  })

  it('cutout.centerX is optional — omitting it is accepted', () => {
    expect(() => assertDeviceProfile({ ...VALID, cutout: VALID_CUTOUT })).not.toThrow()
  })

  it.each([0, 1])('cutout.centerX of %s (a range boundary) is accepted', (centerX) => {
    expect(() => assertDeviceProfile({ ...VALID, cutout: { ...VALID_CUTOUT, centerX } })).not.toThrow()
  })

  it('a cutout.centerX above 1 is rejected', () => {
    expectRejects(
      { ...VALID, cutout: { ...VALID_CUTOUT, centerX: 1.5 } },
      undefined,
      'deviceProfile.cutout.centerX',
    )
  })

  it('a cutout.centerX below 0 is rejected', () => {
    expectRejects(
      { ...VALID, cutout: { ...VALID_CUTOUT, centerX: -0.1 } },
      undefined,
      'deviceProfile.cutout.centerX',
    )
  })
})

describe('assertDeviceProfile checks shell when present', () => {
  it('shell: null is rejected — must be a non-null object', () => {
    expectRejects({ ...VALID, shell: null }, undefined, 'deviceProfile.shell')
  })

  it('an empty shell object is accepted — every field is optional', () => {
    expect(() => assertDeviceProfile({ ...VALID, shell: {} })).not.toThrow()
  })

  it.each(['screenRadius', 'bezel', 'bodyRadius'] as const)('a valid %s is accepted', (field) => {
    expect(() => assertDeviceProfile({ ...VALID, shell: { [field]: VALID_SHELL[field] } })).not.toThrow()
  })

  it.each(['screenRadius', 'bezel', 'bodyRadius'] as const)('a negative %s is rejected', (field) => {
    expectRejects({ ...VALID, shell: { [field]: -1 } }, undefined, `deviceProfile.shell.${field}`)
  })
})

describe('a profile with a full cutout and shell passes and resolves cleanly', () => {
  const FULL_VALID: DeviceProfile = { ...VALID, cutout: VALID_CUTOUT, shell: VALID_SHELL }

  it('assertDeviceProfile accepts it', () => {
    expect(() => assertDeviceProfile(FULL_VALID)).not.toThrow()
  })

  it('resolveDevice() produces a finite pixelRatio and a non-empty name', () => {
    const resolved = resolveDevice(FULL_VALID)
    expect(Number.isFinite(resolved.pixelRatio)).toBe(true)
    expect(typeof resolved.name).toBe('string')
    expect(resolved.name.length).toBeGreaterThan(0)
  })
})
