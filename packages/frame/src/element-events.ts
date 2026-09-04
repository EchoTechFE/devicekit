/**
 * The events `<device-frame>` fires, and the map that types them.
 *
 * Kept out of the element so a host can write a listener — or a typed
 * `addEventListener` overload of its own — without importing the element
 * class, and so the element file stays about drawing a phone.
 */
import type { ContentRect } from './content-rect.js'

/** Fired when the frame's content region moves or resizes. */
export const CONTENT_RECT_CHANGE_EVENT = 'contentrectchange'

/**
 * Every event the element fires, on top of the ones any HTML element does.
 * The element declares `addEventListener` overloads against this, so a
 * listener reads `detail` without casting past `Event`.
 */
export interface DeviceFrameElementEventMap extends HTMLElementEventMap {
  contentrectchange: CustomEvent<ContentRect>
}
