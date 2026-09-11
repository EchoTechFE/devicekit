/**
 * Before `customElements.define()` runs, a `<device-frame>` is a plain
 * `HTMLElement`, so assigning one of the element's reflected properties then
 * creates an own field that `upgradeProperties()` later replays through the
 * class accessor. That only works when the name is not already a native
 * `HTMLElement` property: a native accessor (`inputMode`, `hidden`, `title`,
 * ...) swallows the pre-upgrade write, no own field appears, and the value is
 * lost after upgrade. This file fails `tsc --noEmit` when any reflected key
 * collides with `keyof HTMLElement`.
 */
type ReflectedKeys = 'device' | 'deviceProfile' | 'orientation' | 'interactionMode' | 'embedded' | 'immersive'

type NoNativeCollision = Extract<ReflectedKeys, keyof HTMLElement> extends never ? true : never

const _guard: NoNativeCollision = true
