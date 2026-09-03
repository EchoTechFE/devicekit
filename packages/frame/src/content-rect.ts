/**
 * Where the previewed page sits, and what it takes to put something there that
 * the frame cannot lay out itself.
 *
 * Anything in the DOM goes in the default slot and needs none of this — the
 * frame has already placed it. This is for the other case: an Electron
 * `WebContentsView`, which is not a DOM node at all, or an `<iframe>` the host
 * insists on owning. Those get positioned in viewport coordinates by the host,
 * from the numbers here.
 */

/**
 * The content region in screen coordinates — measured from the screen's own
 * top-left, not the host element's, so the bezel is not in it.
 */
export interface ContentBox {
  /** CSS px from the screen's left edge. */
  x: number
  /** CSS px from the screen's top edge, below the status and navigation bars. */
  y: number
  /** CSS px of device screen. */
  width: number
  /** CSS px of device screen. */
  height: number
}

/**
 * The same region in viewport coordinates, which is what positioning needs.
 * `x`, `y`, `width` and `height` are rendered CSS px of the host page here, not
 * of the device screen — they already have `scale` in them.
 */
export interface ContentRect extends ContentBox {
  /**
   * Rendered px per CSS px of device screen: 1 unless the host scaled the frame
   * down to fit a panel. A view positioned from this rect has to be scaled by
   * it too, or it renders at the wrong size inside the right box.
   */
  scale: number
}

/** A zero box, which is what an embedded frame reports for content. */
export const EMPTY_BOX: ContentBox = { x: 0, y: 0, width: 0, height: 0 }

/**
 * Projects the content box onto the page using the screen's measured box.
 *
 * An unmeasurable screen — jsdom, `display: none`, before first layout — reads
 * as unscaled rather than as a zero-size box, so the caller gets the logical
 * geometry instead of a rect that would collapse whatever it positions.
 */
export function toViewportRect(content: ContentBox, screenWidth: number, screenBox: DOMRect): ContentRect {
  const scale = screenWidth > 0 && screenBox.width > 0 ? screenBox.width / screenWidth : 1

  return {
    x: screenBox.left + content.x * scale,
    y: screenBox.top + content.y * scale,
    width: content.width * scale,
    height: content.height * scale,
    scale,
  }
}

/**
 * Whether the region moved. The frame re-renders on every attribute change,
 * most of which — the clock, the status bar text style — leave the region
 * exactly where it was, and a host that repositions a native view on each of
 * those pays for it.
 */
export function sameContentRect(previous: ContentRect | null, next: ContentRect): boolean {
  return previous !== null
    && previous.x === next.x
    && previous.y === next.y
    && previous.width === next.width
    && previous.height === next.height
    && previous.scale === next.scale
}
