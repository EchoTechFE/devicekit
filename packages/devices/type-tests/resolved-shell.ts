import { resolveDevice, type DeviceProfile } from '../src/index.js'

const profile: DeviceProfile = { name: 'type fixture', os: 'ios', screen: { width: 100, height: 200 }, pixelRatio: 1 }
const resolved = resolveDevice(profile)

// A caller can feed a resolved shell back into a profile without stripping its
// explicit `homeButton: null` representation.
const _roundTrip: DeviceProfile = { ...profile, shell: resolved.shell }
