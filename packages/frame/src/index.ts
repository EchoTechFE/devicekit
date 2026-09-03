export {
  CONTENT_RECT_CHANGE_EVENT,
  DiminaDeviceFrame,
  DEVICE_FRAME_TAG,
  defineDeviceFrame,
  type DeviceMetrics,
  type StatusBarTextStyle,
} from './device-frame.js'

export type { ContentBox, ContentRect } from './content-rect.js'

export {
  CUTOUT_PRESETS,
  cutoutBorderRadius,
  cutoutLeft,
  statusBarEars,
} from './cutout.js'

export {
  computeStatusBarLayout,
  type StatusBarLayout,
  type StatusBarLayoutMode,
} from './status-bar-layout.js'

export {
  profileFromAttributes,
} from './attributes.js'

export { DEVICE_FRAME_STYLES } from './styles.js'

export { frameOuterSize } from './frame-size.js'

/**
 * The types this element's own API is written in. The device table, and the
 * arithmetic behind these numbers, are @devicekit/devices — import DEVICES,
 * findDevice, resolveDevice or resolveWindowSize from there. They are
 * deliberately not re-exported here: two import paths for one table means two
 * things to keep in step.
 */
export type {
  CutoutShape,
  CutoutSpec,
  DeviceOS,
  DeviceProfile,
  DeviceShell,
  EdgeInsets,
  Orientation,
  ResolvedDevice,
  SafeAreaRect,
  ScreenSize,
} from '@devicekit/devices'
