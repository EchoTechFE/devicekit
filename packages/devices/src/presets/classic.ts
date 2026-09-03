import type { DeviceProfile } from '../devices.js'
import { ANDROID_DEVICES } from './android.js'
import { HARMONY_DEVICES } from './harmony.js'
import { IOS_DEVICES } from './ios.js'

// Read straight from the per-platform tables rather than the re-exported
// DEVICES in ./index.js, so this module has no circular dependency on it.
const BY_NAME = new Map([...IOS_DEVICES, ...ANDROID_DEVICES, ...HARMONY_DEVICES].map((device) => [device.name, device]))

function pick(name: string): DeviceProfile {
  const device = BY_NAME.get(name)
  if (!device) throw new Error(`CLASSIC_DEVICES: no device named ${JSON.stringify(name)} in DEVICES`)
  return device
}

/**
 * A hand-picked subset of `DEVICES` for hosts whose picker can't show all
 * 171 rows — devtools' simulator toolbar is the first consumer. Entries are
 * the same objects as in the full table (never copies), grouped iOS →
 * Android → HarmonyOS so a grouped dropdown needs no sorting of its own.
 */
export const CLASSIC_DEVICES: readonly DeviceProfile[] = [
  pick('iPhone SE (3rd gen)'),
  pick('iPhone X'),
  pick('iPhone 12/13 (Pro)'),
  pick('iPhone 14 Pro'),
  pick('iPhone 15'),
  pick('iPhone 16 Pro Max'),
  pick('iPhone 17 Pro'),
  pick('iPad Mini'),
  pick('iPad Pro 11'),
  pick('Pixel 8'),
  pick('Pixel 9 Pro'),
  pick('Galaxy S24'),
  pick('Galaxy S24 Ultra'),
  pick('Xiaomi 14'),
  pick('Pixel Tablet'),
  pick('HUAWEI Mate 60 Pro'),
  pick('HUAWEI Mate 70'),
  pick('HUAWEI Pura 70'),
  pick('HUAWEI nova 13'),
]
