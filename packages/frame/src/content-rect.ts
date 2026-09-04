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
   * Rendered px per CSS px of device screen, horizontally: 1 unless the host
   * scaled the frame down to fit a panel. `x` and `width` are always exact
   * regardless of what stretched the screen box, but a CSS transform that
   * scales the two axes unevenly makes `y` and `height` use a different,
   * unreported ratio — a view positioned from this rect only has to be scaled
   * by `scale` if the transform is uniform.
   */
  scale: number
}

/** A zero box, which is what an embedded frame reports for content. */
export const EMPTY_BOX: ContentBox = { x: 0, y: 0, width: 0, height: 0 }

/**
 * Projects the content box onto the page using the screen's measured box.
 *
 * `screenWidth` and `screenHeight` are the device's logical screen size;
 * `screenBox` is that screen's rendered box. Horizontal and vertical ratios
 * are computed independently so a non-uniform CSS transform on an ancestor
 * (`scaleX` ≠ `scaleY`) still projects `y` and `height` correctly — only
 * `scale`, which callers use to size a single view, stays horizontal-only.
 *
 * An unmeasurable screen — jsdom, `display: none`, before first layout — reads
 * as unscaled rather than as a zero-size box, so the caller gets the logical
 * geometry instead of a rect that would collapse whatever it positions. That
 * fallback is keyed off `screenBox` being 0×0 on *both* axes at once: a host
 * that folds the frame flat on a single axis (`height: 0; overflow: hidden`)
 * still measured it, and the native view being positioned from this rect
 * needs that axis's real collapsed bounds — projecting it back to the logical
 * height would hand the host a view taller than the space actually has.
 */
export function toViewportRect(
  content: ContentBox,
  screenWidth: number,
  screenHeight: number,
  screenBox: DOMRect,
): ContentRect {
  const measurable = screenWidth > 0 && screenHeight > 0
    && !(screenBox.width === 0 && screenBox.height === 0)
  const scaleX = measurable ? screenBox.width / screenWidth : 1
  const scaleY = measurable ? screenBox.height / screenHeight : 1

  return {
    x: screenBox.left + content.x * scaleX,
    y: screenBox.top + content.y * scaleY,
    width: content.width * scaleX,
    height: content.height * scaleY,
    scale: scaleX,
  }
}

/**
 * Whether the region moved, within `CONTENT_RECT_EPSILON` — a `ResizeObserver`
 * can report the same layout a fraction of a px apart from one callback to the
 * next, and a host that repositions a native view on that noise pays for it on
 * every tick without ever seeing the view actually move.
 */
export const CONTENT_RECT_EPSILON = 1e-3

export function sameContentRect(previous: ContentRect | null, next: ContentRect): boolean {
  return previous !== null
    && Math.abs(previous.x - next.x) < CONTENT_RECT_EPSILON
    && Math.abs(previous.y - next.y) < CONTENT_RECT_EPSILON
    && Math.abs(previous.width - next.width) < CONTENT_RECT_EPSILON
    && Math.abs(previous.height - next.height) < CONTENT_RECT_EPSILON
    && Math.abs(previous.scale - next.scale) < CONTENT_RECT_EPSILON
}
