import { type DeviceProfile, type Orientation, type ScreenSize, orientedScreen, resolveDevice } from '@devicekit/devices'
import { DEVICE_FRAME_BORDER_WIDTH } from './styles.js'

/**
 * The frame's outer footprint for a given profile and orientation — what a
 * host needs to size its own layout around `<device-frame>` without
 * waiting for a layout pass. Embedded mode draws no body, so it is exactly
 * the bare screen; otherwise the body's bezel padding plus its hairline
 * border (see `.body` in styles.ts) widen the screen on every side.
 */
export function frameOuterSize(
  profile: DeviceProfile,
  orientation: Orientation,
  options?: { embedded?: boolean },
): ScreenSize {
  const screen = orientedScreen(profile, orientation)
  if (options?.embedded) return screen

  const margin = 2 * (resolveDevice(profile).shell.bezel + DEVICE_FRAME_BORDER_WIDTH)
  return { width: screen.width + margin, height: screen.height + margin }
}
