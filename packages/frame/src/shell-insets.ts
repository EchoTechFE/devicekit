import type { CornerRadii, EdgeInsets, Orientation } from '@devicekit/devices'

/** Rotates the physical shell clockwise with the screen: portrait bottom becomes landscape left. */
export function orientedShellInsets(insets: EdgeInsets, orientation: Orientation): EdgeInsets {
  return orientation === 'portrait'
    ? insets
    : { top: insets.left, right: insets.top, bottom: insets.right, left: insets.bottom }
}

/** Rotates the shell's screen corners with the same 90° clockwise physical turn: each corner moves TL→TR→BR→BL. */
export function orientedShellCorners(corners: CornerRadii, orientation: Orientation): CornerRadii {
  return orientation === 'portrait'
    ? corners
    : { topLeft: corners.bottomLeft, topRight: corners.topLeft, bottomRight: corners.topRight, bottomLeft: corners.bottomRight }
}
