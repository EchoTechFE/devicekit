export {
  PLATFORM_DEFAULTS,
  navigationBarHeightFor,
  resolveDevice,
  safeAreaInsetsFor,
  statusBarHeightFor,
  type CutoutShape,
  type CutoutSpec,
  type DeviceFormFactor,
  type DeviceOS,
  type DeviceProfile,
  type DeviceShell,
  type EdgeInsets,
  type Orientation,
  type ResolvedDevice,
  type ScreenSize,
} from './devices.js'

export { assertDeviceProfile } from './validate.js'

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
