/**
 * Pure helpers for `#publishContentRect`'s loop breaker (device-frame.ts).
 *
 * Two or more `contentrectchange` listeners that keep mutating attributes in
 * response to the event they just received can cycle the content rect
 * through a small set of shapes forever, and the reentrancy loop that
 * ordering depends on (see content-rect-reentrancy.test.ts) has no exit for
 * that on its own. A rect reaching its third occurrence within one batch —
 * one outer, non-reentrant call — is that oscillation, not ordinary bounded
 * reentrancy, which is what {@link CONTENT_RECT_OSCILLATION_THRESHOLD} counts.
 * Kept apart from the element so the counting rule is readable and testable
 * without one.
 */
import { sameContentRect, type ContentRect } from './content-rect.js'

/** A rect's occurrence count in the current batch at which the loop breaker trips. */
export const CONTENT_RECT_OSCILLATION_THRESHOLD = 2

/** How many rects already published this batch have the same shape as `candidate`. */
export function countPublishedRepeats(published: readonly ContentRect[], candidate: ContentRect): number {
  return published.reduce((count, seen) => (sameContentRect(seen, candidate) ? count + 1 : count), 0)
}

/** Logged once when the breaker trips, so the runaway listener pair is diagnosable. */
export const CONTENT_RECT_OSCILLATION_MESSAGE =
  '<device-frame> stopped publishing contentrectchange: the content rect is oscillating between a small set of ' +
  'values, most likely because two or more listeners keep mutating attributes in response to the event they just ' +
  "received. The element has stopped re-measuring; call refreshContentRect() once the listeners settle to resync."
