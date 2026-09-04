English | [简体中文](./README.zh-CN.md)

# @devicekit/frame

The phone a preview pretends to be: a `<device-frame>` custom element that draws the body, the status bar (clock, glyphs, notch / Dynamic Island / punch-hole) and the home indicator. The device data and the size arithmetic live in [@devicekit/devices](../devices), which this package depends on.

When every host writes its own preview shell, the shells drift apart: hard-coded sizes, a missing status bar, an island nobody knows about. This package makes it one standalone custom element, so the logic and the styles have a single authoritative implementation.

It is a custom element rather than a component in one framework because the hosts that need it do not share a framework — a React panel inside Electron, a plain-DOM web page, a CSS-only preview stage all use the same tag.

## Install

```sh
pnpm add @devicekit/frame
```

The device table comes along with it. If you only want the data and not the shell, `@devicekit/devices` alone is enough.

Referenced from a workspace or through `npm link`, the package resolves to its TypeScript source — `exports` points at `src/index.ts`, so an edit to the source is live with no build step, and the host needs a bundler or test runner that reads TypeScript (Vite, Vitest, tsx, ts-loader). The published package does not: `publishConfig` swaps `exports` over to the compiled `dist/`, so an install off npm gets plain JavaScript and `.d.ts` files.

## Quick start

Register once, then use it as an ordinary tag:

```ts
import { defineDeviceFrame } from '@devicekit/frame'

defineDeviceFrame()
```

```html
<device-frame device="iPhone 16 Pro">
  <iframe src="/preview"></iframe>
</device-frame>
```

`defineDeviceFrame(tag?)` is safe to call more than once — a host that bundles the package twice, or hot-reloads, must not crash on the duplicate definition, and a repeat call for the same implementation does nothing. It registers under `DEVICE_FRAME_TAG` (`'device-frame'`) unless you pass another name. A tag some unrelated element already owns is the one case it throws on, naming the tag: registering quietly would leave your markup drawing someone else's element under a name you take for this one. Pass your own name to `defineDeviceFrame(tag)` when that happens. Calling it for a second tag registers a subclass of the element — one constructor cannot answer to two custom-element names — but every tag behaves identically, `instanceof DeviceFrameElement` included. That includes a consumer who registers the bare `DeviceFrameElement` class itself under a name of their own choosing via `customElements.define`: a later `defineDeviceFrame()` for another tag still gets a working subclass instead of throwing.

The same tag works in JSX, with string attributes. The types for it live in the `@devicekit/frame/react` subpath — import that once anywhere in the project and the tag typechecks, under React 18 (global `JSX` namespace) and React 19 (`JSX` inside the `react` module) alike:

```tsx
import '@devicekit/frame/react'

<device-frame device={deviceName} orientation={orientation}>
  <MiniAppFrame ... />
</device-frame>
```

`embedded` and `immersive` are boolean attributes on the raw tag, so their type only accepts `true`. Toggling one from a variable is what the `<DeviceFrame>` component below is for — it turns `false` into "no attribute at all".

The previewed content goes in the default slot, and it stays in the light DOM rather than moving into the shadow root — so the host's own stylesheets, `document.querySelector`, and any extension point that appends nodes into it all keep working. The element draws the shell and never reaches into the content.

**The element positions that slot itself**: below the status bar and the navigation bar, above the tab bar, filling what is left. Under `immersive` it covers the whole screen instead. A host does not pad its content to clear the bars — sizing it `100%` is enough.

A host with no device table (a single hard-coded screen, say) can skip `device` and give sizes directly:

```html
<device-frame width="375" height="812" cutout="none"></device-frame>
```

### Previewing a page in an iframe

The common case, and it needs nothing but a full-size iframe:

```html
<device-frame device="iPhone 15">
  <iframe src="/preview" style="width: 100%; height: 100%; border: 0"></iframe>
</device-frame>
```

If the host shrinks the whole phone to fit a panel — `transform: scale(0.6)` on a wrapper, typically — call `refreshContentRect()` after changing the transform. A transform changes no box the element's `ResizeObserver` watches, so it is the one case the element cannot notice by itself:

```ts
wrapper.style.transform = `scale(${zoom})`
frame.refreshContentRect()
```

## `@devicekit/frame/react`

React 18 and React 19 both work. They take different routes to the element — React 18 writes every prop with `setAttribute`, React 19 assigns anything the element already exposes (`device`, `orientation`, `embedded`, `immersive`, `deviceProfile`) as a JS property — and the element accepts both, because a property write reflects onto the matching attribute.

For a props object, for `deviceProfile` (which has no attribute form), or for a component you can take a ref to, import `<DeviceFrame>` from this subpath instead of writing the tag by hand. It is a thin wrapper over the element: it calls `defineDeviceFrame()` on module load, turns boolean props into "attribute present or absent entirely" (`embedded={false}` does not land as the literal `embedded="false"` the way it would on a raw custom element), maps `className` to the `class` attribute, and assigns `deviceProfile` as a property — not an attribute string — in a `useLayoutEffect`:

```tsx
import { DeviceFrame } from '@devicekit/frame/react'
import { DEVICE_NAMES } from '@devicekit/devices'

<DeviceFrame device={DEVICE_NAMES.iPhone_16_Pro} orientation={orientation} ref={frameRef}>
  <MiniAppFrame ... />
</DeviceFrame>
```

`DeviceFrameProps` extends `React.HTMLAttributes<HTMLElement>` and adds, on top of `children`:

| Prop | Type | The attribute it sets |
| --- | --- | --- |
| `device` | `DeviceName \| (string & {})` | `device` — `DeviceName` is `@devicekit/devices`'s `DEVICE_NAMES` values, for autocomplete; any other string still works |
| `deviceProfile` | `DeviceProfile \| null` | none — assigned as a property |
| `os` | `DeviceOS` | `os` |
| `orientation` | `Orientation` | `orientation` |
| `width`, `height` | `number` | `width`, `height` |
| `pixelRatio` | `number` | `pixel-ratio` |
| `cutout` | `CutoutShape \| 'none'` | `cutout` |
| `userAgent` | `string` | `user-agent` |
| `statusBarHeight` | `number` | `status-bar-height` |
| `safeAreaTop`, `safeAreaRight`, `safeAreaBottom`, `safeAreaLeft` | `number` | `safe-area-top` and the rest |
| `navigationBarHeight`, `tabBarHeight` | `number` | `navigation-bar-height`, `tab-bar-height` |
| `statusBar` | `boolean \| 'live' \| string` | `status-bar` — `false` hides the strip, `true` or omitted keeps the default `9:41`, any string is passed through |
| `statusBarTextStyle` | `StatusBarTextStyle` | `status-bar-text-style` |
| `statusBarBackground` | `string` | `status-bar-background` |
| `embedded`, `immersive` | `boolean` | present or absent, never `="false"` |
| `onContentRectChange` | `(event: CustomEvent<ContentRect>) => void` | none — attached as a `contentrectchange` listener on the element; also called once, synchronously after mount, with the frame's starting rect. A handler passed later, or for the first time, gets caught up the same way — one synchronous call with the current rect, plus whatever changed while no handler was listening |

The ref is a `DeviceFrameElement`, so `metrics`, `contentRect` and `refreshContentRect()` are available on it.

For a host that wants the element under its own tag name — one that already owns `device-frame` for something else, or scopes every custom element behind a shared prefix — `createDeviceFrameComponent(tag?)` builds a component bound to that tag, the same way `defineDeviceFrame(tag?)` does for the raw element; `DeviceFrame` is just `createDeviceFrameComponent()` called with the package's own tag. Importing this subpath registers the default tag eagerly, swallowing a collision with an unrelated element rather than throwing on import — the throw instead happens when the default `<DeviceFrame>` actually mounts, which is where a per-tag failure belongs; a `createDeviceFrameComponent('my-tag')` caller that picked a different tag never sees it.

This subpath lists `react` as an optional peer dependency — React is only pulled in if you actually import it. The plain-tag usage above needs no React at all. A React 18 project using TypeScript also needs `@types/react` (also an optional peer) for the JSX typings above to resolve; React 19's own package ships its own types and needs nothing extra.

## Knowing the size before layout: `frameOuterSize`

How large the body ends up (screen + bezel padding + a 1px border) can be computed before the element is even mounted, so a host laying out its own container or auto-scaling does not have to wait for a layout pass:

```ts
import { frameOuterSize } from '@devicekit/frame'
import { DEVICE_NAMES, findDevice } from '@devicekit/devices'

const size = frameOuterSize(findDevice(DEVICE_NAMES.iPhone_16_Pro)!, 'portrait')
// { width, height }
```

This does not apply in embedded mode — there the element is 100% × 100% and draws no body, so its size comes from the host's container, not from this function.

These are **unscaled layout sizes**. A CSS `transform: scale()` on the frame or an ancestor does not change the layout box, so a host that scales has to multiply these numbers by its own scale to know how much room the phone takes on screen.

## The demo page

The repository carries a preview page with everything in this document wired up to a control:

```sh
pnpm --filter @devicekit/frame demo
```

The left column has the device (all 171 of them), the orientation, the two bars, `immersive`, `embedded`, the status bar and the zoom, and below that the live `metrics` and `contentRect` plus how many `contentrectchange` events have fired so far. On the right is the rendered phone, whose title bar and tab bar are the copyable examples below.

It imports the package by name, which the workspace resolves to `src/` rather than the build output, so saving a source file updates the page. The demo lives in the repository only and is not part of the npm package.

## Attributes

| Attribute | Values | What it does |
| --- | --- | --- |
| `device` | A device name, such as `iPhone 16 Pro` | A name not in the table, or no attribute at all, falls back to the default *size* — not to a default device (see below). From JS, use `@devicekit/devices`'s `DEVICE_NAMES` constant instead of typing the string |
| `os` | `ios` (default), `android`, `harmony` | With no device and no explicit heights, the status bar and navigation bar use this platform's defaults |
| `orientation` | `portrait` (default), `landscape` | Landscape swaps width and height and switches the other numbers to the device's landscape set |
| `width`, `height` | Numbers, CSS px, **portrait orientation** | Override the device table |
| `pixel-ratio` | Number | Same |
| `cutout` | `none`, `notch`, `pill`, `circle` | Stock geometry for that shape. Exact cutouts go through `deviceProfile` |
| `status-bar-height` | Number | The height of the drawn strip; overrides both orientations |
| `safe-area-top` / `-right` / `-bottom` / `-left` | Numbers | Each edge independently; whichever you set is overridden, in both orientations |
| `navigation-bar-height` | Number | Overrides the device table's navigation bar height, in both orientations |
| `tab-bar-height` | A positive number | Overrides the default tab bar height of 50. `0` and anything unparseable fall back to that default; to have no tab bar, slot nothing into `tab-bar` |
| `user-agent` | String | Overrides the generated user agent |
| `status-bar` | Absent, any text, `live`, `hidden` | Absent shows `9:41`; `live` runs a real clock, ticking once a minute for as long as the element is in the document; `hidden` removes the strip |
| `status-bar-text-style` | `black` (default), `white` | black = dark text and glyphs for a light background (iOS `darkContent`, Android light status bar); white = light text for a dark background (iOS `lightContent`). The home indicator reads the same switch. It is black until you set it: nothing infers it from the device, the platform or `status-bar-background` |
| `status-bar-background` | A CSS color | Paints the status bar strip; transparent by default. A page with a `navigation-bar` slot does not need it — the slot's own background already covers the status bar. This is for pages with no navigation bar, or for emulating an app-level tint (Android's pre-15 `statusBarColor`) |
| `immersive` | Boolean attribute | See "The page draws its own title bar" |
| `embedded` | Boolean attribute | See `embedded` |

The default clock is pinned to `9:41` rather than the current time so screenshots and visual diffs come out identical every run. Set `status-bar="live"` if you want it to move. The timer behind it runs only while the element is connected to the document — a frame built off-screen shows a fixed time until it is mounted, and removing it stops the clock.

**A `<device-frame>` with no `device` is not `DEFAULT_DEVICE`.** Attributes are folded onto a device profile by `profileFromAttributes`, and with no named device there is nothing to fold onto: what comes out is an anonymous iOS profile that borrows `DEFAULT_DEVICE`'s screen size and takes the rest from the platform defaults — pixel ratio 1, no cutout, no measured safe-area insets, an iOS status bar height. That is the right shape for "some phone", and the wrong shape for "an iPhone X". Name the device, or set `width` / `height` / `pixel-ratio` / `cutout` yourself.

## Properties

| Property | Type | What it is |
| --- | --- | --- |
| `deviceProfile` | `DeviceProfile \| null` | A device that is not in the shared table; wins over the `device` attribute. Read/write, no attribute form. `null` clears it |
| `device` | reads `DeviceProfile \| null`, writes `string \| null \| undefined` | Whichever profile the `device` attribute named, or `null`; writing a preset's name sets the attribute, `null` or `undefined` removes it |
| `orientation` | reads `Orientation`, writes `string \| null \| undefined` | The current orientation; writing sets the `orientation` attribute, `null` or `undefined` removes it |
| `embedded` | `boolean` | Whether the element is in embedded mode; writing adds or removes the attribute |
| `immersive` | `boolean` | Whether the page runs behind the bars; writing adds or removes the attribute |
| `profile` | `DeviceProfile` | Read-only: the profile actually in effect, attribute overrides folded in |
| `metrics` | `DeviceMetrics` | Read-only: the numbers the element last drew with |
| `contentRect` | `ContentRect` | Read-only: where the content region sits in viewport coordinates |

Those four are the attributes under another name: a property write is reflected onto the attribute, and reading returns whatever the element resolved from it. Writing either one has the same effect, which is what lets React 19 — it assigns props it finds on the instance rather than calling `setAttribute` — drive the same element React 18 drives through attributes.

`embedded` and `immersive` are boolean **attributes** — presence is the whole signal, so `embedded=""` means true, same as `hidden`. As **properties**, though, the setter coerces with `Boolean(value)`, so `el.embedded = ''` sets it to false, not true — again matching `hidden`. That difference is exactly why React needs care: React 18 writes an unknown boolean prop on a hyphenated tag as a literal attribute (`embedded={true}` becomes `embedded="true"`, still truthy), while React 19 assigns it as a property on the instance (`embedded=""` would be falsy). Pass `embedded` / `immersive` as `embedded={true}` or the bare `embedded` shorthand, never `embedded=""`, and both React versions agree.

A device the table does not have is passed as a property, and it takes precedence over `device`:

```ts
el.deviceProfile = { name: 'Pixel 9', os: 'android', screen: { width: 412, height: 915 }, pixelRatio: 3 }
```

`el.refreshContentRect()` re-measures the screen box and fires `contentrectchange` if the rectangle changed. Everything the element can observe by itself already triggers this; the method is for what it cannot, a CSS `transform: scale()` on an ancestor above all. A no-op while the element is not connected to the document — there is no rectangle worth measuring yet.

`el.metrics` is a `DeviceMetrics`: `screen`, `orientation`, `pixelRatio`, `userAgent`, `statusBarHeight`, `navigationBarHeight`, `tabBarHeight`, `safeArea`, `safeAreaInsets`, `window`, `content`, `cutout` and `shell`. `navigationBarHeight` and `tabBarHeight` are zero unless the matching slot has content; `window` is what the previewed page actually gets, and `content` is where that window sits on the screen.

## Slots

| Slot | What goes in it |
| --- | --- |
| default | The content being previewed |
| `navigation-bar` | The host's own title bar, starting at the top of the screen and covering the status bar |
| `tab-bar` | The host's own tab bar, pinned to the bottom of the screen |
| `overlay` | A layer above the whole screen (debug annotations, extension mount points); does not take clicks by default |

`navigation-bar` and `tab-bar` **do take clicks** — what gets slotted in are real bars with real buttons. Each reserves its own height, and `metrics.window` has it subtracted.

The `navigation-bar` slot starts at screen y=0 and covers the status bar, because that is the model a mini program uses: the navigation bar view starts at y=0 with a height of status bar plus navigation bar, which is why `navigationBarBackgroundColor` fills the status bar too. A slotted element gets `padding-top: var(--device-status-bar-height)` by default, so its content clears the status bar while its background naturally extends underneath — matching what WeChat draws. The vertical geometry (`box-sizing`, `height: 100%`, `padding-top`) is pinned with `!important` so a host shorthand like `padding: 0 12px` cannot zero out the top inset; horizontal padding, colors and content remain the host's. A page with a custom navigation bar (`immersive`), or no slotted bar at all, draws to the top itself.

The frame pads that slot for the status bar only. **In landscape on a cutout phone it does not pad the left and right safe areas** — a title bar slotted there can run under the notch. Read `--device-safe-area-left` and `--device-safe-area-right` in the host's own horizontal padding if that matters to you. The cutout itself is only drawn in portrait: in landscape it would sit on the left or the right depending on which way the phone was turned, which `orientation="landscape"` does not say, so the frame leaves it out and only the landscape safe-area numbers stand in for it.

**An empty slot does not exist**: its height is zero and the page is not shortened for nothing. The navigation bar height comes from the device table for the current orientation (44 portrait, 32 landscape on iOS). The tab bar has no device data to go on — a tab bar belongs to the app, not the phone — so it defaults to 50; set `tab-bar-height` if yours is a different height.

This package **ships no ready-made title bar component**: what a title bar looks like is the host's business, and one component cannot survive everybody's buttons, type sizes and colors. The two snippets below are starting points to copy.

### A mini-program title bar

```html
<device-frame device="iPhone 16 Pro">
  <div slot="navigation-bar" class="mp-title-bar">
    <button class="mp-title-bar__back" aria-label="Back">‹</button>
    <span class="mp-title-bar__title">Cart</span>
  </div>
  <iframe src="/preview"></iframe>
</device-frame>
```

```css
.mp-title-bar {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 12px;
  background: #ededed;
  color: #000;
  font: 500 17px/1 -apple-system, BlinkMacSystemFont, sans-serif;
}

.mp-title-bar__back {
  border: 0;
  background: none;
  font-size: 26px;
  line-height: 1;
  padding: 0 8px;
  cursor: pointer;
}

/* The title is centered in the whole bar, not in the space right of the back
   button — that is how WeChat lays it out. */
.mp-title-bar__title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
```

### An in-app browser's back bar

```html
<device-frame device="iPhone 16 Pro" status-bar-text-style="white">
  <div slot="navigation-bar" class="h5-bar">
    <button class="h5-bar__back" aria-label="Back">‹</button>
    <span class="h5-bar__title">Campaign</span>
    <button class="h5-bar__close" aria-label="Close">✕</button>
  </div>
  <iframe src="/activity"></iframe>
</device-frame>
```

```css
.h5-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
  padding: 0 12px;
  background: #0f172a;
  color: #fff;
  font: 500 17px/1 -apple-system, BlinkMacSystemFont, sans-serif;
}

.h5-bar__title { flex: 1; text-align: center; }

.h5-bar__back,
.h5-bar__close {
  border: 0;
  background: none;
  color: inherit;
  font-size: 20px;
  padding: 0 4px;
  cursor: pointer;
}
```

A dark bar wants `status-bar-text-style="white"`, so the clock, the glyphs and the home indicator turn white with it.

Where the clock and the glyphs sit in the status bar is neither centered nor split evenly around the cutout, but laid out the way the device does it: iPhones with a notch or an island look up a measured table by screen width and status bar height (time's left edge, battery's right edge, the midline, glyph scale), and sizes outside that table fall back to a formula derived from the ears; iPhones without a notch use the classic arrangement (signal left, time centered, battery right); iPads put the clock 17pt from the left (7pt on Home-button iPads) and the battery against the right edge; Android and HarmonyOS start the clock 31dp in, leave 28dp on the right, and stand the battery upright. Those rules are `computeStatusBarLayout`, and the `data-layout` attribute and `--sb-*` variables on `.status-bar` are its output. HarmonyOS has no measurements, so it reuses the Android arrangement.

## The page draws its own title bar (`immersive`)

A mini program's `navigationStyle: "custom"`, and an in-app H5 page with its own title bar, are a different arrangement: **the bars are still on screen, but the page is handed the whole screen and keeps clear of them itself.**

```html
<device-frame device="iPhone 16 Pro" immersive>
  <div class="page">...</div>
</device-frame>
```

```css
.page {
  height: var(--device-height);
  padding-top: calc(var(--device-status-bar-height) + var(--device-navigation-bar-height));
  padding-bottom: var(--device-tab-bar-height);
}
```

With `immersive`, `metrics.window` is the whole screen and `metrics.content` starts at `(0, 0)`. The bars are still drawn and still report their heights; the page uses those heights to leave room itself. Without it, the default arrangement applies: the page starts below the status bar and the navigation bar, and `metrics.content.y` is the sum of the two.

## `embedded`

`embedded` means "stop pretending": no status bar, no home indicator, no locked device size, all safe-area insets reported as zero, and the whole thing left to the container to lay out. It is for a host that already draws a shell of its own — a preview panel with its own chrome, say — where a second body from the element would be one too many.

## How content learns how much room it has

The element reflects the resolved numbers onto the host as CSS custom properties, so slotted content can read them directly instead of the host having to hand the same numbers over through some other channel:

```css
.page {
  height: var(--device-window-height);
  padding-bottom: var(--device-safe-area-bottom);
}
```

| Variable | What it is |
| --- | --- |
| `--device-width`, `--device-height` | The screen size in the current orientation |
| `--device-window-width`, `--device-window-height` | What the page actually gets: the screen minus the status bar, the navigation bar and the tab bar (the whole screen under `immersive`) |
| `--device-pixel-ratio` | A unitless number |
| `--device-status-bar-height` | The height of the drawn status bar |
| `--device-navigation-bar-height` | The height of the slotted navigation bar; zero when the slot is empty |
| `--device-tab-bar-height` | The height of the slotted tab bar; zero when the slot is empty |
| `--device-safe-area-top` / `-right` / `-bottom` / `-left` | Safe-area **insets** (distance from each edge), the same thing `env(safe-area-inset-*)` reports |
| `--device-screen-radius`, `--device-bezel`, `--device-body-radius` | Body geometry |
| `--device-frame-border-width` | Width of the `.body` hairline border, in device-logical px |

Under `embedded` the two screen-size variables are not written at all — the element sizes itself at `100%` and the container owns the size. What goes to zero is what the phone chrome would have cost: the window size, all three bar heights and the four safe-area insets. `--device-pixel-ratio`, `--device-screen-radius`, `--device-bezel` and `--device-body-radius` still carry the device's own values, so a host drawing its own shell can still read them.

A few more variables exist to override the appearance: `--device-frame-radius` (overrides the device's own body radius, and now drives both the body's and the screen's corner radius — the screen's own radius is derived from it, narrowed back down by the border and bezel; it only accepts a CSS `<length>` — a percentage is resolved against each box separately by the browser, so the body and the screen would stop sharing a center and this variable would no longer mean one concentric radius), `--device-frame-border`, `--device-frame-background`, `--device-frame-shadow`, `--device-cutout-color` (the color of the notch, island or punch-hole) and `--device-screen-background` (what the screen shows where nothing is slotted — the status bar is transparent by default, so without a `navigation-bar` slot this is the strip behind the clock; it defaults to white, so set it to your page's background on a dark page or the white status-bar text has nothing to stand on). The body defaults to near-black (`#0b0b0c`) with a very faint white hairline border, and `--device-bezel` takes its default from the platform (6 on iOS, 4 on Android and HarmonyOS); an individual device can override it in `shell.bezel`. Changing `--device-frame-border`'s width also requires setting `--device-frame-border-width` to match, or the radius math above stays sized for the default 1px border.

**It publishes numbers and does not change `env(safe-area-inset-*)`.** An `env(safe-area-inset-top)` inside the previewed page still returns 0, because browsers do not let JavaScript set that value. Making `env()` actually return 59 is possible only in Electron or Chromium, through CDP's `Emulation.setSafeAreaInsetsOverride`: a host with a debugger attached to the previewed page can feed it the insets computed here. A plain web host has no equivalent and has to let the previewed page read the CSS variables above instead.

## Hosting content in a webview

Anything that goes in the DOM — an `<iframe>`, a component of the host's own — goes in the default slot, already positioned. But Electron's `WebContentsView` is not a DOM node at all, cannot be slotted, and has to be placed by the host at coordinates.

**This package does not own that webview; it only reports where it belongs.** Who creates the view, which partition it uses, what preload it gets and when it is destroyed are the host's business, and folding those into an element would only make every host work around it.

```ts
frame.addEventListener('contentrectchange', (event) => {
  const { x, y, width, height, scale } = event.detail
  // measured in the renderer; the numbers go to main, which positions the view
  ipcRenderer.send('preview:bounds', { x, y, width, height, scale })
})
```

`event.detail` is typed as a `ContentRect` without a cast: `DeviceFrameElement` declares a `DeviceFrameElementEventMap`, which is what `addEventListener` resolves the literal event name against. `CONTENT_RECT_CHANGE_EVENT` is exported for the places that need the name as a value.

`event.detail` and `frame.contentRect` are the same thing: a `ContentRect`, the content region in **viewport coordinates**, ready to hand to `setBounds()`. `scale` is how many rendered pixels one CSS pixel of device screen covers, horizontally — 1 at full size, `0.5` when the host has shrunk the phone to half — so the view has to shrink by the same factor (Electron's `setZoomFactor`), or the position will be right and the size wrong. `x`, `y`, `width` and `height` already have it applied. Under a uniform scale (the common case, including `setBounds()`-driven zoom) that single number is enough; a non-uniform transform on an ancestor still projects `x`/`y`/`width`/`height` correctly, but `scale` alone can no longer describe the vertical axis.

A screen box measured 0×0 on both axes at once — not yet laid out, `display: none`, or jsdom — falls back to the device's logical geometry instead of collapsing the rect: `scale` reads 1 and `x`/`y`/`width`/`height` come straight from the unscaled numbers. Only one axis reading 0 is trusted, though: a host that folds the frame flat on a single axis (`height: 0; overflow: hidden`) still measured it, and `contentRect` projects that axis to 0 too, so a view positioned from it gets the real collapsed bounds rather than a height taller than the space actually has.

The event fires only when the rectangle actually moved by at least `CONTENT_RECT_EPSILON` (0.001px) on some field: changing orientation, toggling `immersive`, slotting a bar in or out, and host zoom all fire it; recoloring the status bar, ticking the clock, or a `ResizeObserver` callback that reports the same layout to sub-pixel noise do not. It also does not fire while the element is not connected to the document — there is nowhere on screen for the rectangle to be — so a frame built ahead of mounting only starts publishing once it is appended, and stops again if removed. Host size changes are watched with a `ResizeObserver`, so a resizable panel gets events too. A CSS `transform: scale()` is invisible to that observer — call `frame.refreshContentRect()` after changing one, and the element re-measures and fires if the rectangle moved.

Where `ResizeObserver` itself is missing — an older WebView, or jsdom by default — the element cannot notice a host resize at all; it does not throw, it just stays quiet. Call `refreshContentRect()` yourself after a layout change on a platform like that.

`metrics.content` is the same region in **screen coordinates** — a `ContentBox`, measured from the screen's top-left and excluding the body. Use it to tell the previewed page where on the screen it sits; use `contentRect` to position a real view.

## Building on the internals

The pieces the element is built from are exported too, for a host that needs to draw part of this itself or to check its own arithmetic against the frame's.

`computeStatusBarLayout(device, orientation)` returns the `StatusBarLayout` described above: `mode` (a `StatusBarLayoutMode`: `'ios-cutout'`, `'ios-classic'`, `'ipad'` or `'android'`), `height`, `centerY`, `scale`, `timeLeft`, `trailing` and `leadingIcons`. It is the single owner of that geometry — the DOM only writes these numbers out, and the stylesheet only reads them, so there is one place to fix when a measurement turns out to be wrong.

`CUTOUT_PRESETS` is the stock geometry per shape (`Record<CutoutShape, CutoutSpec>`), for a host that knows its phone has a notch but carries no measurements of its own; per-device presets in the table override it. `cutoutBorderRadius(cutout)` gives the CSS `border-radius` that follows from the shape — a notch hangs off the top edge and rounds only its bottom corners, while a pill and a punch-hole float free and round the whole way. `cutoutLeft(cutout, screenWidth)` is its left offset, honoring `centerX`. `statusBarEars(cutout, screenWidth)` returns the two clear strips either side of it, `{ left, right }`, or `null` when there is no cutout to dodge.

`profileFromAttributes(element, named, fallbackScreen)` is how attributes get folded back onto a device profile — the rule that an attribute overrides the preset and a missing attribute falls through to it, stated once for every field instead of once per field inside a render path.

`DEVICE_FRAME_STYLES` is the shadow-DOM stylesheet as a string. It is a string rather than a `.css` file so the package builds with plain `tsc` and carries no bundler requirement into its consumers.

**Content Security Policy:** the element puts this stylesheet into its shadow root via `adoptedStyleSheets` on a platform that supports constructed stylesheets, which needs no `style-src` allowance at all — it is not an inline style as CSP sees it. On a platform without that support (older WebViews, and jsdom in most configurations) it falls back to an inline `<style>` element in the shadow root, and a host with a strict CSP needs `style-src` to permit that: `'unsafe-inline'`, or a hash of `DEVICE_FRAME_STYLES`. A nonce cannot be used, because the element creates that `<style>` itself and carries no nonce.

## API reference

| Export | Type | What it is |
| --- | --- | --- |
| `defineDeviceFrame` | `(tag?: string) => void` | Registers the element; safe to call repeatedly, throws if an unrelated element owns the tag |
| `DEVICE_FRAME_TAG` | `string` | `'device-frame'` |
| `DeviceFrameElement` | `class extends HTMLElement` | The element class, for `instanceof` and for typing a ref |
| `CONTENT_RECT_CHANGE_EVENT` | `string` | `'contentrectchange'` |
| `CONTENT_RECT_EPSILON` | `number` | `0.001` — two rects whose five fields (`scale` included) all differ by less than this are treated as the same, so `contentrectchange` does not fire for them |
| `frameOuterSize` | `(profile: DeviceProfile, orientation: Orientation) => ScreenSize` | The frame's outer footprint, before layout (not embedded mode — the container decides there) |
| `computeStatusBarLayout` | `(device: ResolvedDevice, orientation: Orientation) => StatusBarLayout` | Status bar geometry |
| `CUTOUT_PRESETS` | `Record<CutoutShape, CutoutSpec>` | Stock geometry per cutout shape |
| `cutoutBorderRadius` | `(cutout: CutoutSpec) => string` | The `border-radius` for that shape |
| `cutoutLeft` | `(cutout: CutoutSpec, screenWidth: number) => number` | The cutout's left offset |
| `statusBarEars` | `(cutout: CutoutSpec \| null, screenWidth: number) => { left: number, right: number } \| null` | The clear strips either side of the cutout |
| `profileFromAttributes` | `(element: Element, named: DeviceProfile \| null, fallbackScreen: { width: number, height: number }) => DeviceProfile` | Attributes folded back onto a profile |
| `DEVICE_FRAME_STYLES` | `string` | The shadow-DOM stylesheet |
| `DeviceFrame` | React component (`@devicekit/frame/react`) | The React wrapper |
| `DeviceFrameIntrinsicAttributes` | TS interface (`@devicekit/frame/react`) | Attribute types for writing `<device-frame>` as a raw JSX tag under its real kebab-case names, for a host that skips `DeviceFrame` |

Types: `DeviceMetrics`, `StatusBarTextStyle` (`'black' | 'white'`), `ContentBox`, `ContentRect`, `StatusBarLayout`, `StatusBarLayoutMode`, `DeviceFrameElementEventMap` (`{ contentrectchange: CustomEvent<ContentRect> }`), and `DeviceFrameProps` from the React entry.

The types this element's own API is written in — `CutoutShape`, `CutoutSpec`, `DeviceFormFactor`, `DeviceOS`, `DeviceProfile`, `DeviceShell`, `EdgeInsets`, `Orientation`, `ResolvedDevice`, `SafeAreaRect`, `ScreenSize` — are re-exported here as types so you do not have to add a second import for them. The values behind them are not: `DEVICES`, `findDevice`, `resolveDevice` and `resolveWindowSize` are imported from `@devicekit/devices`, because two import paths for one device table would be two things to keep in step.

## License

MIT
