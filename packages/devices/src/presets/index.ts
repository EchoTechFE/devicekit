/**
 * The device table: phones and tablets on iOS, Android and HarmonyOS, split
 * into one file per platform.
 *
 * Where the numbers come from, and how far each source could take us:
 *
 * - Screen sizes and pixel ratios are the vendors' published logical
 *   resolutions, taken from four independent device-emulation tables. Where two
 *   of them disagree the more recent and more specific one wins — one table
 *   states the device screen and the browser viewport separately, and only the
 *   screen belongs here.
 * - Safe-area insets and cutout geometry come from the one table that measures
 *   them per orientation. Roughly a third of the devices here are in it.
 * - Status bar, navigation bar and the bottom inset for iOS and HarmonyOS come
 *   from a mini-program tooling table, which is also the only structured source
 *   that covers HarmonyOS phones at all — including both screens of each
 *   folding model.
 * - A device with no measurement of its own borrows from devices with the same
 *   platform, screen and pixel ratio, and only where every one of them states
 *   the same value. One disagreement inside such a group and none of its
 *   members gets that field: iPhone X and iPhone 12 mini are both 375x812@3 and
 *   report status bars of 44 and 47, so neither lends one.
 *
 * Two things are deliberately left at platform defaults rather than guessed:
 * every non-iOS landscape inset, and the HarmonyOS gesture-bar height, which no
 * source states. Cutout geometry is appearance only — what the screen actually
 * gives up is the safe-area insets, which are measured, never derived from it —
 * so a device with no measured geometry, which is every HarmonyOS device here,
 * simply draws no cutout.
 *
 * These are ordinary source files from here on, one device per line. Adding a
 * device means adding a line; presets.test.ts holds the invariants that every
 * row has to satisfy.
 */
import type { DeviceProfile } from '../devices.js'
import { ANDROID_DEVICES } from './android.js'
import { HARMONY_DEVICES } from './harmony.js'
import { IOS_DEVICES } from './ios.js'

export { ANDROID_DEVICES, HARMONY_DEVICES, IOS_DEVICES }

export const DEVICES: readonly DeviceProfile[] = [...IOS_DEVICES, ...ANDROID_DEVICES, ...HARMONY_DEVICES]

const BY_NAME = new Map(DEVICES.map((device) => [device.name, device]))

/** What renders when nothing asked for a particular device. */
export const DEFAULT_DEVICE: DeviceProfile = BY_NAME.get('iPhone X')!

export function findDevice(name: string | null | undefined): DeviceProfile | undefined {
  if (!name) return undefined
  return BY_NAME.get(name)
}

export { CLASSIC_DEVICES } from './classic.js'
