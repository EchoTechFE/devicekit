import { type DeviceProfile, type Orientation, type ScreenSize, orientedScreen, resolveDevice } from '@devicekit/devices'
import { DEVICE_FRAME_BORDER_WIDTH } from './styles.js'

/**
 * The frame's outer footprint for a given profile and orientation — what a
 * host needs to size its own layout around `<device-frame>` without
 * waiting for a layout pass. The body's bezel padding plus its hairline
 * border (see `.body` in styles.ts) widen the screen on every side.
 *
 * Does not apply in embedded mode: there the element is 100% × 100%, drawing
 * no body of its own, so its size is whatever the host's container gives it
 * rather than something this function can predict.
 */
export function frameOuterSize(profile: DeviceProfile, orientation: Orientation): ScreenSize {
  const screen = orientedScreen(profile, orientation)
  const margin = 2 * (resolveDevice(profile).shell.bezel + DEVICE_FRAME_BORDER_WIDTH)
  return { width: screen.width + margin, height: screen.height + margin }
}
