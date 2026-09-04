/**
 * Registration for `<device-frame>`, split out of device-frame.ts to keep
 * that file under this package's file-length limit.
 *
 * Imports DEVICE_FRAME_BRAND back from device-frame.ts, which re-exports
 * DEVICE_FRAME_TAG and defineDeviceFrame from here — a two-file cycle that is
 * safe under ESM (both modules' top-level bindings exist, live, before either
 * runs the function bodies that actually touch them) but would not survive
 * being turned into a real circular *value* dependency, so keep this file's
 * use of device-frame.ts to the class and the brand symbol.
 */
import { DeviceFrameElement, DEVICE_FRAME_BRAND } from './device-frame.js'

/** The tag name defineDeviceFrame() registers unless given another. */
export const DEVICE_FRAME_TAG = 'device-frame'

// customElements.define() throws NotSupportedError if the same constructor
// is registered under two names, so every tag past the first is served by a
// subclass instead — it inherits the brand (a static property) and passes
// `instanceof DeviceFrameElement`, but is its own constructor as far as the
// registry is concerned. Tracked here rather than by scanning the registry
// (customElements.getName() is not implemented in jsdom) because "has the
// bare element ever been registered" is exactly the fact this module decides
// on every call anyway. Also flipped when a consumer registers the bare
// class itself under some other tag before calling defineDeviceFrame() —
// that tag already used up the one name DeviceFrameElement can answer to, so
// this module's own registration still needs the subclass branch.
let elementTagClaimed = false

/**
 * Registers the element. Safe to call more than once — a host that bundles this
 * package twice, or hot-reloads, must not crash on the duplicate definition.
 * An unrelated element already holding the tag throws instead: returning
 * quietly would leave the host's markup drawing someone else's element under a
 * name it believes is this one.
 *
 * A second (third, …) distinct tag registers a subclass of the element, since
 * one constructor cannot answer to two custom-element names; every tag
 * behaves identically, `instanceof DeviceFrameElement` included.
 *
 * @param tag the custom element name, for a host that already owns
 *   `device-frame` or wants the element under its own prefix
 */
export function defineDeviceFrame(tag: string = DEVICE_FRAME_TAG): void {
  // No registry means no DOM at all — a server render importing this entry for
  // its geometry helpers must not be handed a ReferenceError.
  if (typeof customElements === 'undefined') return

  const existing = customElements.get(tag)
  if (!existing) {
    customElements.define(tag, elementTagClaimed ? class extends DeviceFrameElement {} : DeviceFrameElement)
    elementTagClaimed = true
    return
  }
  if (existing === DeviceFrameElement) elementTagClaimed = true
  if ((existing as unknown as Record<symbol, unknown>)[DEVICE_FRAME_BRAND] === true) return
  throw new Error(`<${tag}> is already defined by an unrelated element class; pick another tag via defineDeviceFrame(tag)`)
}
