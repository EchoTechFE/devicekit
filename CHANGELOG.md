# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] - 2026-09-04

### Fixed

- `@devicekit/devices`: the 13 Home-button iPhones (iPhone 4 through iPhone 8 Plus, both SE models) had no `shell`, so they took the iOS default 38px screen radius and the rounded corner clipped the status-bar icons. Their flat LCD panels have square corners; they now resolve to `screenRadius: 0` with a 38px body radius.

## [0.2.1] - 2026-09-04

### Fixed

- The screen now paints its own background (`--device-screen-background`, default `#ffffff`). Without a `navigation-bar` slot the transparent status bar used to show the near-black frame body through, hiding black status-bar text.

## [0.2.0] - 2026-09-04

### Added

- `@devicekit/devices`: `DEVICE_NAMES` — every device name as a constant, so `DEVICE_NAMES.iPhone_16_Pro` replaces the hand-typed `'iPhone 16 Pro'` and the editor can autocomplete and check it. Keys are derived from the name by `deviceNameKey` (runs of characters outside `[A-Za-z0-9]` become one `_`, so `'iPhone 12/13 (Pro)'` is `iPhone_12_13_Pro`); the table lives in a generated file kept in sync by `pnpm --filter @devicekit/devices generate:device-names` and guarded by a test.
- `@devicekit/devices`: `DeviceName`, the union of every name in the table.
- `@devicekit/frame/react`: the `device` prop accepts `DeviceName` for autocomplete while still taking any string.

### Changed

- `@devicekit/frame` now depends on `@devicekit/devices` with a caret range instead of an exact version.

## [0.1.0] - 2026-09-04

### Added

- `@devicekit/devices`: device presets for iOS, Android and HarmonyOS phones and tablets, with screen, pixel ratio, status bar, safe area and user agent data.
- `@devicekit/frame`: a framework-agnostic `<device-frame>` custom element (plus a React wrapper) that draws a bezel, status bar and home indicator around any previewed page.
- `@devicekit/frame`: the default slot is laid out by the element itself — below the status and navigation bars, above the tab bar, the whole screen under `immersive` — so a host no longer pads its own content.
- `@devicekit/frame`: `refreshContentRect()`, for re-measuring after a change a `ResizeObserver` cannot see, such as a CSS `transform: scale()` on an ancestor.
- `@devicekit/frame`: `DeviceFrameElementEventMap`, so `addEventListener('contentrectchange', ...)` gives `event.detail` its `ContentRect` type.
- `@devicekit/frame/react`: `os`, `cutout`, `width`, `height`, `pixelRatio`, `userAgent`, `statusBarHeight` and `safeAreaTop` / `-Right` / `-Bottom` / `-Left` props; `statusBar` now takes `boolean | 'live' | string`.
- `@devicekit/frame/react`: JSX types for the raw `<device-frame>` tag under both React 18 and React 19.
- `@devicekit/frame`: importing the package under Node or during SSR no longer throws — `defineDeviceFrame()` is a no-op where `customElements` does not exist.
- `@devicekit/frame`: `device`, `orientation`, `embedded` and `immersive` are writable properties that reflect to the same-named attributes, so `el.device = 'iPhone 15'` works like setting the attribute.
- `pnpm run verify:pack`: packs every workspace package, unpacks the tarball and imports `dist/index.js` from plain Node, so a broken `publishConfig` cannot reach npm. The publish workflow runs it before publishing.

### Fixed

- `@devicekit/frame`: default-slot content was drawn under the status and navigation bars instead of below them.
- `@devicekit/frame/react`: under React 19 the wrapper threw `TypeError: Cannot set property device ... which has only a getter`, because React 19 assigns props that exist as element properties instead of setting attributes. Verified against the packed tarball with react-dom 19.2.
- `@devicekit/devices`: in landscape, Android and HarmonyOS devices without an explicit `safeAreaInsetsLandscape` reported a safe-area top of `0` while the landscape status bar was 24 / 36 px, so immersive content was drawn under the status bar. The landscape default now mirrors portrait: top equals the landscape status bar height.
- `@devicekit/devices`: `Surface Duo (inner)` and `HUAWEI Pura X Max (inner)` were stored wider than tall; the table stores portrait sizes, so `orientation="landscape"` now yields the unfolded shape.
- `@devicekit/frame`: a `contentrectchange` listener that changed an attribute (flipping `immersive`, say) made listeners registered after it receive the new rect first and the stale one second, so a host positioning a native view from the event ended one step behind. Nested changes are now queued and re-dispatched after the outer event, in the order they happened.
- `@devicekit/frame`: the home indicator was drawn under the tab bar; it now sits above the tab bar and below the overlay, as on a real device.
- `@devicekit/frame`: `status-bar="live"` started a clock timer even when the element was not in the document (attribute set before connect, or after disconnect); the clock now only runs while connected.
- `@devicekit/frame`: `defineDeviceFrame(tag)` silently did nothing when the tag was already taken by an unrelated element class; it now throws a clear error, while re-registering the same implementation (hot reload, duplicate bundles) stays a no-op.
- Publish workflow: the npm dist-tag is now decided from the package versions themselves — any pre-release version publishes to `next`, and asking for `latest` with a pre-release version fails the job instead of publishing.
- Publish workflow: a manual run from any branch could publish that branch to npm; the job now only runs for a GitHub Release or a dispatch on `main`.
- Workflows: every `uses:` was a movable major tag (`actions/checkout@v6`); all are pinned to commit SHAs, with Dependabot moving the pins.
- Pages workflow: the `build` job held `pages: write` and `id-token: write` it never used; only the `deploy` job has them now.
- `@devicekit/devices`: the README and the source comment claimed iOS 26 added a 20 px top inset in landscape. No iPhone has a landscape top inset; the iPhone 17 line moved the landscape bottom inset from 21 to 20. The README also said Android and HarmonyOS landscape values equal their portrait values; unset landscape fields fall back to the platform defaults (24 / 36 px status bar) instead.
- `@devicekit/frame/react`: the `statusBarTextStyle` JSDoc claimed the default ink color "follows the device"; `statusBarTextColor` only ever branches on `'white'` and otherwise returns black, with no device, platform or background input.
- `@devicekit/frame`: the READMEs were missing `DeviceFrameIntrinsicAttributes` from the API reference, and listed the `device` / `orientation` property setters as taking `string | null` when the d.ts is `string | null | undefined`.
- `@devicekit/frame`: two `contentrectchange` listeners that each flipped a different attribute in response to the other could keep the element re-measuring forever and freeze the tab. The element now remembers every rect it published during one synchronous batch, stops as soon as the same rect would go out a third time, and logs one `console.error` naming the `contentrectchange` listeners as the cause; `refreshContentRect()` re-syncs afterwards.
- `@devicekit/frame`: `package.json` declared `sideEffects: false`, but `@devicekit/frame/react` registers `<device-frame>` at import time; a bundler could drop that registration. The field now lists the React entry as the only file with side effects.
- `@devicekit/frame`: styles were injected as an inline `<style>` in the shadow root, which a strict `style-src` Content Security Policy blocks. Where the browser supports constructable stylesheets the styles are now attached through `adoptedStyleSheets` (one shared sheet for every instance); the `<style>` fallback remains for older engines.
- `@devicekit/frame`: assigning a malformed `deviceProfile` (`{}`, `{ screen: null }`, a negative width) crashed later inside layout with `Cannot read properties of undefined (reading 'width')`. The setter and `resolveDevice()` now throw a `TypeError` naming the bad field, such as `deviceProfile.screen.width must be a finite number greater than 0, got -1`.
- `@devicekit/devices`: `resolveWindowSize()` accepted a negative or non-finite `navigationBar` / `tabBarHeight` and returned a window taller than the screen; it now throws a `RangeError` naming the option.
- `@devicekit/frame/react`: every optional prop of `DeviceFrameProps` and `DeviceFrameIntrinsicAttributes` now allows `undefined` explicitly, so a consumer compiling with `exactOptionalPropertyTypes: true` can pass `orientation={maybeOrientation}` without TS2375. A type-test fixture compiled with that option is part of `check-types`.
- Publish workflow: a GitHub Release created from a tag that is not on `main` could still publish; the job now refuses any commit that is not an ancestor of `origin/main`.
- `@devicekit/devices`: `assertDeviceProfile()` let a profile through without `name` or `pixelRatio`, accepted `cutout: null` and `shell: null`, and never looked inside `cutout` or `shell`; a profile with `cutout: { shape: 'bogus' }` then reached the status bar as a broken shape. Every required field is now required, and nested cutout / shell fields are checked for type and range.
- `@devicekit/devices`: `Galaxy Z Fold 6 (inner)` was stored as 744 x 860 @ 2.625, about 5 % larger than the panel's 1856 x 2160 physical pixels; it is now 707 x 823 @ 2.625.
- `@devicekit/frame`: the shared constructed stylesheet was built with the page's global `CSSStyleSheet` and reused for every shadow root, so a `<device-frame>` created in, or moved into, another document (an iframe, a window opened by the host) either threw `NotAllowedError` or silently lost its styles. Sheets are now built per document with that document's own `CSSStyleSheet`, and the element re-checks its sheet every time it connects.
- `@devicekit/frame`: the iOS status-bar layout table was keyed by `pixelRatio` as well as screen width and status bar height, so changing only the pixel ratio of a profile moved the clock and battery by tens of pixels. The lookup now uses width and status bar height alone, which already identify every row.
- `@devicekit/frame/react`: `<DeviceFrame onContentRectChange={...}>` was neither typed nor wired, so the handler never ran. It is now a declared prop, registered once on the element and always calling the latest handler, and removed when the prop is dropped.
- `@devicekit/frame`: a property assigned before the element was defined (`el.device = 'iPhone 15'` and then `customElements.define(...)`) shadowed the class setter, so `device` stayed a string, `deviceProfile` was silently lost, and the first render threw `Cannot read properties of undefined (reading 'width')`. On connect the element now moves every such own property through its setter.
- `@devicekit/devices`: the generated iOS user agent said `iPhone OS 26_0` for iOS 26 devices; Safari 26 froze that token at `18_6` and only bumps `Version/26.0`. iPads reported the mobile `(iPad; CPU OS ...)` form, while Safari on iPadOS 13 and later sends the desktop `Macintosh` user agent by default; iPads now generate that.
- `@devicekit/devices`: every generated HarmonyOS user agent ended in `HuaweiBrowser/5.0.4.303`, which is the Huawei Browser app's own token and not part of the plain ArkWeb container's user agent. It is gone; a profile that needs it sets `userAgent`.
- `@devicekit/devices`: the Android user agent always carried `Mobile`, so a custom tablet profile without its own `userAgent` looked like a phone. Profiles now take an optional `formFactor` (`'phone'` or `'tablet'`, default phone); tablets get no `Mobile` token, and HarmonyOS tablets say `Tablet` instead of `Phone`. Every iPad and Android tablet preset carries `formFactor: 'tablet'`.
- `@devicekit/devices`: the version used when a profile has no `system` label was described as "current"; it is a pinned fallback (iOS 18.0, Android 13, HarmonyOS 5.0), bumped together with the presets, and the code and READMEs now say so.
- `@devicekit/frame`: `frameOuterSize(profile, orientation, { embedded: true })` returned the bare screen size, but an embedded frame is `100% x 100%` of its container, so the number was never the frame's real footprint. The `embedded` option is gone; under `embedded` the size is the container's.
- `@devicekit/frame`: the body's corners were not concentric with the screen's: the screen sits `bezel + 1px border` inside the body edge, but the default body radius only added the bezel, and overriding `--device-frame-radius` left the screen radius untouched. The body radius now includes the border width (exposed as `--device-frame-border-width`), and a `--device-frame-radius` override derives the screen radius from it.
- Root `engines.node` said `>=20`, but ESLint 10 and Vite 8 need Node 20.19 or later; it now says `>=20.19.0`, and CI runs on both the oldest supported Node and the current one.
- Build: `dist/*.js` shipped without `.js.map`, so a consumer's stack trace stopped at the compiled output. Source maps are now emitted, and `verify:pack` fails if any `dist/**/*.js` lacks one.
- `@devicekit/frame`: the element dropped `formFactor` when folding attributes over a preset, so through `<device-frame>` every iPad generated the iPhone user agent, Android tablets carried `Mobile` and HarmonyOS tablets said `Phone`, although `@devicekit/devices` got them right. The field now passes through, and `DeviceFormFactor` is re-exported.
- `@devicekit/frame`: an element already in the document when `customElements.define()` upgraded it ran `attributeChangedCallback()` before the property replay, so a `deviceProfile` or `orientation` assigned before the upgrade published one wrong `contentrectchange` (the default iPhone) before the right one, and a `device` assigned before the upgrade threw `Cannot read properties of undefined (reading 'width')`. Nothing renders or publishes now until the element has connected and replayed those properties.
- `@devicekit/frame`: setting `deviceProfile`, an attribute, or calling `refreshContentRect()` on an element that is not in the document published a `contentrectchange` measured off-DOM (all zeros), which also made the first real rect after connecting look like a repeat. A disconnected element publishes nothing; connecting publishes the first real rect.
- `@devicekit/frame/react`: `onContentRectChange` missed every event of the first commit, because the element publishes on connect and the wrapper only listened from a passive effect. The listener is attached in a layout effect, and the handler is called once right after mount with the element's current rect.
- `@devicekit/frame/react`: the wrapper always rendered `<device-frame>` and registered that tag on import, so a page whose `device-frame` belonged to another element could not use the React entry at all. `createDeviceFrameComponent(tag)` builds the wrapper for any tag; `DeviceFrame` is the default-tag one. `defineDeviceFrame(tag)` for a second tag registers a subclass, since one constructor can only hold one name.
- `@devicekit/frame`: the live status-bar clock ticked on a plain 60 s interval from whenever it was mounted, so the minute could change up to 59 s late, and a page returning from the background showed the old minute until the next tick. The clock now aligns to the minute boundary and refreshes on `visibilitychange`.
- `@devicekit/frame`: the READMEs let `--device-frame-radius` be any value; a percentage resolves against each box separately and the body and screen stop being concentric. The variable is documented as a `<length>`.
- `@devicekit/devices`: the `resolveSafeAreaInsets()` comment still claimed iOS 26 gave landscape a top inset.
- `@devicekit/devices` / `@devicekit/frame`: the READMEs did not show `formFactor` in the profile example, did not say `ResolvedDevice` always carries it, and did not mention the HarmonyOS `Tablet` token.
- `@devicekit/frame/react`: the type entry imports `react`, whose 18.x package has no types of its own; `@types/react` is now an optional peer dependency and the README says a TypeScript project on React 18 needs it.
- `@devicekit/frame`: an element upgraded by `customElements.upgrade()` while out of the document kept a pre-upgrade `device` string as an own property until it connected, so reading `device`, `profile`, `metrics` or `contentRect` in between threw `Cannot read properties of undefined (reading 'width')`. The property replay now runs in the constructor, so an upgraded element is usable before it is appended.
- `@devicekit/frame`: a host that registered `DeviceFrameElement` itself under one tag and then asked `defineDeviceFrame()` for a second tag got `NotSupportedError`, because the registry ledger only counted tags it had registered. It now counts the bare class wherever it was registered.
- `@devicekit/frame/react`: under `StrictMode` the initial `onContentRectChange` replay fired twice, once per simulated mount. The replay is now tied to the element instance and happens once.
- `@devicekit/frame`: `contentRect` derived the vertical scale from the horizontal one, so an ancestor `scaleX()`/`scaleY()` with different factors put `y` and `height` in the wrong place. Each axis is projected with its own measured ratio; `scale` remains the horizontal factor.
- `@devicekit/frame`: `contentrectchange` compared rects with exact float equality, so a sub-pixel layout jitter published on every `ResizeObserver` callback. Differences under `CONTENT_RECT_EPSILON` (0.001 px) are ignored.
- `@devicekit/frame`: the oscillation breaker logged its `console.error` on every outer refresh while the runaway listeners stayed attached. It logs once, and again only after the rect has settled and oscillates anew.
- `@devicekit/frame`: `contentRect` fell back to logical geometry whenever either measured axis was `0`, so a host collapsed to `height: 0; overflow: hidden` still reported the full logical height and native views got non-zero bounds. Only a `0 × 0` screen box (not laid out, `display: none`, jsdom) falls back; a single collapsed axis projects to `0` along that axis.
- `@devicekit/frame`: the React `DeviceFrame` replayed the initial `contentrectchange` only for a new element, so a frame hidden by `Suspense` whose rect changed while hidden never delivered the new rect on resume. The replay now also fires when the last rect delivered to `onContentRectChange` differs from the current one.
- `@devicekit/frame`: `CONTENT_RECT_EPSILON` was documented but not exported from the package entry.
- `@devicekit/frame`: the status bar hidden by landscape or `embedded` kept the previous state's time text, inline `height`/`color` and cutout geometry in the shadow DOM. Hidden states now leave the same DOM as creating the element in that state directly.
- `@devicekit/frame/react`: an `onContentRectChange` handler passed only after mount, or restored after being removed, never received the current rect; the mount replay had already been consumed with no handler attached. Enabling a handler now delivers the current rect once, and changes that happened while no handler was attached are delivered on restore.
- `@devicekit/frame`: `@devicekit/frame/react` types did not resolve under `moduleResolution: node10`, which ignores `exports`. The published `package.json` now carries a `typesVersions` mapping, and `verify:pack` type-checks the packed tarball under `node16`, `bundler` and `node10`.

### Documentation

- Corrected the direction of `ContentRect.scale`, what `embedded` zeroes, what a `<device-frame>` with no `device` renders, what `tab-bar-height="0"` does, and which device fields every device actually carries.
- Spelled out that `embedded` and `immersive` behave like `hidden`: presence is truth as an attribute, but a JS-truthy check as a property, so `embedded=""` reads as false through the property setter — pass `embedded={true}` (or the bare `embedded` shorthand) in React, not `embedded=""`, since React 18 and React 19 disagree on what an empty string means there.
- Documented that without a `ResizeObserver` (old WebViews, jsdom by default) the element does not re-measure on its own; call `refreshContentRect()` after layout changes.
- Documented what a strict Content Security Policy needs: nothing when `adoptedStyleSheets` is available, otherwise `style-src` must allow the inline `<style>` fallback.
- Documented that the cutout is drawn in portrait only: `orientation="landscape"` cannot say which side the notch ended up on, so landscape relies on the safe-area insets alone.
