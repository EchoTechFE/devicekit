import type { EdgeInsets, Orientation } from '@devicekit/devices'

/** Rotates the physical shell clockwise with the screen: portrait bottom becomes landscape left. */
export function orientedShellInsets(insets: EdgeInsets, orientation: Orientation): EdgeInsets {
  return orientation === 'portrait'
    ? insets
    : { top: insets.left, right: insets.top, bottom: insets.right, left: insets.bottom }
}
