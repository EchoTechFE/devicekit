/**
 * Rejects a malformed DeviceProfile at the door instead of letting a bad
 * field ride silently into resolveDevice()/resolveWindowSize(), which read
 * every optional field with `??` and would otherwise turn a negative or
 * non-finite value into a window size or safe area that lies.
 *
 * `name` and `pixelRatio` are checked unconditionally — DeviceProfile requires
 * both. `cutout` and `shell`, when present, are walked into: a malformed
 * nested field (a bogus `cutout.shape`, a negative `shell.bezel`) is rejected
 * here rather than surfacing later as a NaN in computed CSS.
 */
import type { CutoutShape, DeviceFormFactor, DeviceOS, DeviceProfile } from './devices.js'

type UnknownRecord = Record<string, unknown>

function isPlainObject(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** A finite number, optionally required to be strictly greater than `min` rather than merely `>= min`. */
function expectFiniteAtLeast(path: string, value: unknown, min: number, exclusive: boolean): void {
  const ok = typeof value === 'number' && Number.isFinite(value) && (exclusive ? value > min : value >= min)
  if (!ok) {
    const comparison = exclusive ? `greater than ${min}` : `>= ${min}`
    throw new TypeError(`${path} must be a finite number ${comparison}, got ${value}`)
  }
}

/** A finite number within `[min, max]` — for fractions like `cutout.centerX`. */
function expectFiniteBetween(path: string, value: unknown, min: number, max: number): void {
  const ok = typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
  if (!ok) {
    throw new TypeError(`${path} must be a finite number between ${min} and ${max}, got ${value}`)
  }
}

function expectString(path: string, value: unknown): void {
  if (typeof value !== 'string') {
    throw new TypeError(`${path} must be a string, got ${JSON.stringify(value)}`)
  }
}

const EDGES = ['top', 'right', 'bottom', 'left'] as const
const NONNEGATIVE_HEIGHT_FIELDS = [
  'statusBarHeight',
  'statusBarHeightLandscape',
  'navigationBarHeight',
  'navigationBarHeightLandscape',
] as const
const STRING_FIELDS = ['system', 'userAgent'] as const
const INSET_FIELDS = ['safeAreaInsets', 'safeAreaInsetsLandscape'] as const
const SHELL_FIELDS = ['screenRadius', 'bezel', 'bodyRadius'] as const
const CUTOUT_SHAPES: readonly CutoutShape[] = ['notch', 'pill', 'circle']

/**
 * Throws `TypeError` if `value` is not a usable DeviceProfile. `label` names
 * the value in the message (`"device"`, `"deviceProfile"`, ...) so a caller
 * embedding this in a larger check can point at the right field path.
 *
 * Cheap by design — resolveDevice() runs it on every render, so it checks
 * shape and range only, never deep-clones or normalizes the input.
 */
export function assertDeviceProfile(value: unknown, label = 'deviceProfile'): asserts value is DeviceProfile {
  if (!isPlainObject(value)) {
    throw new TypeError(`${label} must be an object, got ${value === null ? 'null' : typeof value}`)
  }

  const os = value.os as DeviceOS | undefined
  if (os !== 'ios' && os !== 'android' && os !== 'harmony') {
    throw new TypeError(`${label}.os must be one of "ios", "android", "harmony", got ${JSON.stringify(os)}`)
  }

  if (value.formFactor !== undefined) {
    const formFactor = value.formFactor as DeviceFormFactor
    if (formFactor !== 'phone' && formFactor !== 'tablet') {
      throw new TypeError(`${label}.formFactor must be one of "phone", "tablet", got ${JSON.stringify(formFactor)}`)
    }
  }

  const screen = value.screen
  if (!isPlainObject(screen)) {
    throw new TypeError(`${label}.screen must be an object, got ${screen === null ? 'null' : typeof screen}`)
  }
  expectFiniteAtLeast(`${label}.screen.width`, screen.width, 0, true)
  expectFiniteAtLeast(`${label}.screen.height`, screen.height, 0, true)

  expectString(`${label}.name`, value.name)
  expectFiniteAtLeast(`${label}.pixelRatio`, value.pixelRatio, 0, true)

  for (const field of NONNEGATIVE_HEIGHT_FIELDS) {
    if (value[field] !== undefined) {
      expectFiniteAtLeast(`${label}.${field}`, value[field], 0, false)
    }
  }

  for (const field of INSET_FIELDS) {
    const insets = value[field]
    if (insets === undefined) continue
    if (!isPlainObject(insets)) {
      throw new TypeError(`${label}.${field} must be an object, got ${insets === null ? 'null' : typeof insets}`)
    }
    for (const edge of EDGES) {
      if (insets[edge] !== undefined) {
        expectFiniteAtLeast(`${label}.${field}.${edge}`, insets[edge], 0, false)
      }
    }
  }

  for (const field of STRING_FIELDS) {
    if (value[field] !== undefined) {
      expectString(`${label}.${field}`, value[field])
    }
  }

  if (value.cutout !== undefined) {
    const cutout = value.cutout
    if (!isPlainObject(cutout)) {
      throw new TypeError(`${label}.cutout must be an object, got ${cutout === null ? 'null' : typeof cutout}`)
    }
    const shape = cutout.shape as CutoutShape | undefined
    if (!CUTOUT_SHAPES.includes(shape as CutoutShape)) {
      throw new TypeError(
        `${label}.cutout.shape must be one of "notch", "pill", "circle", got ${JSON.stringify(shape)}`,
      )
    }
    expectFiniteAtLeast(`${label}.cutout.width`, cutout.width, 0, false)
    expectFiniteAtLeast(`${label}.cutout.height`, cutout.height, 0, false)
    expectFiniteAtLeast(`${label}.cutout.top`, cutout.top, 0, false)
    if (cutout.centerX !== undefined) {
      expectFiniteBetween(`${label}.cutout.centerX`, cutout.centerX, 0, 1)
    }
  }

  if (value.shell !== undefined) {
    const shell = value.shell
    if (!isPlainObject(shell)) {
      throw new TypeError(`${label}.shell must be an object, got ${shell === null ? 'null' : typeof shell}`)
    }
    for (const field of SHELL_FIELDS) {
      if (shell[field] !== undefined) {
        expectFiniteAtLeast(`${label}.shell.${field}`, shell[field], 0, false)
      }
    }
  }
}
