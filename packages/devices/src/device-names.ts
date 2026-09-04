import type { DEVICE_NAMES } from './device-names.generated.js'

/**
 * Turning a device's `name` into something that can also be an object key
 * and a JS identifier, e.g. `'iPhone 12/13 (Pro)'` becomes `iPhone_12_13_Pro`
 * — that key is what {@link DEVICE_NAMES} exposes as `DEVICE_NAMES.iPhone_12_13_Pro`.
 *
 * Every run of characters outside `[A-Za-z0-9]` collapses to a single `_`,
 * leading and trailing `_` are stripped, and a result that would start with a
 * digit gets a `_` prefix instead (digits can't lead a JS identifier). Case is
 * left exactly as the source name has it.
 */
export function deviceNameKey(name: string): string {
  const collapsed = name.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return /^[0-9]/.test(collapsed) ? `_${collapsed}` : collapsed
}

/**
 * A `DeviceProfile.name` that has a {@link DEVICE_NAMES} constant — every
 * value the generated table holds, nothing else. Plain strings still work
 * anywhere a `name` is taken; this is only for the editor to autocomplete and
 * check against.
 */
export type DeviceName = (typeof DEVICE_NAMES)[keyof typeof DEVICE_NAMES]
