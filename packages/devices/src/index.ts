export {
  PLATFORM_DEFAULTS,
  cutoutFor,
  navigationBarHeightFor,
  resolveDevice,
  safeAreaInsetsFor,
  statusBarEdgeFor,
  statusBarHeightFor,
  type CutoutShape,
  type CutoutSpec,
  type DeviceFormFactor,
  type DeviceOS,
  type DeviceProfile,
  type PresetDeviceProfile,
  type DeviceShell,
  type EdgeInsets,
  type HomeButtonSpec,
  type Orientation,
  type ResolvedDevice,
  type ResolvedDeviceShell,
  type ScreenSize,
  type StatusBarEdge,
  type StatusBarStyle,
} from './devices.js'

export { assertDeviceProfile } from './validate.js'

export { deviceNameKey, type DeviceName } from './device-names.js'
export { DEVICE_NAMES } from './device-names.generated.js'

export {
  ANDROID_DEVICES,
  CLASSIC_DEVICES,
  DEVICES,
  DEFAULT_DEVICE,
  HARMONY_DEVICES,
  IOS_DEVICES,
  findDevice,
} from './presets/index.js'

export {
  deviceUserAgent,
  systemVersion,
} from './user-agent.js'

export {
  orientedScreen,
  resolveSafeArea,
  resolveSafeAreaInsets,
  resolveWindowSize,
  type SafeAreaRect,
  type WindowSizeOptions,
} from './safe-area.js'
