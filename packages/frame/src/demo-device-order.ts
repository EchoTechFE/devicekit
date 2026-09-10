import { DEVICE_NAMES, type PresetDeviceProfile } from '@devicekit/devices'

export const DEMO_DEFAULT_DEVICE_NAME = DEVICE_NAMES.iPhone_18_Pro

export function newestDevicesFirst(devices: readonly PresetDeviceProfile[]): PresetDeviceProfile[] {
  return [...devices].sort((left, right) => right.releaseYear - left.releaseYear)
}
