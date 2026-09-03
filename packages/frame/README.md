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

`defineDeviceFrame(tag?)` is safe to call more than once — a host that bundles the package twice, or hot-reloads, must not crash on the duplicate definition. It registers under `DEVICE_FRAME_TAG` (`'device-frame'`) unless you pass another name.

The same tag works in JSX, with string attributes, and the JSX types know about it:

```tsx
<device-frame device={deviceName} orientation={orientation}>
  <MiniAppFrame ... />
</device-frame>
```

The previewed content goes in the default slot, and it stays in the light DOM rather than moving into the shadow root — so the host's own stylesheets, `document.querySelector`, and any extension point that appends nodes into it all keep working. The element draws the shell and never reaches into the content.

A host with no device table (a single hard-coded screen, say) can skip `device` and give sizes directly:

```html
<device-frame width="375" height="812" cutout="none"></device-frame>
```

## `@devicekit/frame/react`

For a props object, for `deviceProfile` (which has no attribute form), or for a component you can take a ref to, import `<DeviceFrame>` from this subpath instead of writing the tag by hand. It is a thin wrapper over the element: it calls `defineDeviceFrame()` on module load, turns boolean props into "attribute present or absent entirely" (`embedded={false}` does not land as the literal `embedded="false"` the way it would on a raw custom element), maps `className` to the `class` attribute, and assigns `deviceProfile` as a property — not an attribute string — in a `useLayoutEffect`:

```tsx
import { DeviceFrame } from '@devicekit/frame/react'

<DeviceFrame device="iPhone 16 Pro" orientation={orientation} ref={frameRef}>
  <MiniAppFrame ... />
</DeviceFrame>
```

`DeviceFrameProps` extends `React.HTMLAttributes<HTMLElement>` and adds `device`, `deviceProfile`, `orientation`, `embedded`, `immersive`, `statusBar` (`false` hides the drawn status bar), `statusBarTextStyle`, `statusBarBackground`, `navigationBarHeight`, `tabBarHeight` and `children`. The ref is a `DeviceFrameElement`, so `metrics` and `contentRect` are available on it.

This subpath lists `react` as an optional peer dependency — React is only pulled in if you actually import it. The plain-tag usage above needs no React at all.

## Knowing the size before layout: `frameOuterSize`

How large the body ends up (screen + bezel padding + a 1px border) can be computed before the element is even mounted, so a host laying out its own container or auto-scaling does not have to wait for a layout pass:

```ts
import { frameOuterSize } from '@devicekit/frame'
import { findDevice } from '@devicekit/devices'

const size = frameOuterSize(findDevice('iPhone 16 Pro')!, 'portrait')
// { width, height } — with { embedded: true } it is the bare screen, no body
```

## The bundled demo page

The package ships a preview page with everything in this document wired up to a control:

```sh
pnpm --filter @devicekit/frame demo
```

The left column has the device (all 171 of them), the orientation, the two bars, `immersive`, `embedded`, the status bar and the zoom, and below that the live `metrics` and `contentRect` plus how many `contentrectchange` events have fired so far. On the right is the rendered phone, whose title bar and tab bar are the copyable examples below.

It imports `src/` directly rather than the build output, so saving a source file updates the page. The demo lives in the repository only and is not part of the npm package.

## Attributes

| Attribute | Values | What it does |
| --- | --- | --- |
| `device` | A device name, such as `iPhone 16 Pro` | A name not in the table is ignored, falling back to the default size |
| `os` | `ios` (default), `android`, `harmony` | With no device and no explicit heights, the status bar and navigation bar use this platform's defaults |
| `orientation` | `portrait` (default), `landscape` | Landscape swaps width and height and switches the other numbers to the device's landscape set |
| `width`, `height` | Numbers, CSS px, **portrait orientation** | Override the device table |
| `pixel-ratio` | Number | Same |
| `cutout` | `none`, `notch`, `pill`, `circle` | Stock geometry for that shape. Exact cutouts go through `deviceProfile` |
| `status-bar-height` | Number | The height of the drawn strip; overrides both orientations |
| `safe-area-top` / `-right` / `-bottom` / `-left` | Numbers | Each edge independently; whichever you set is overridden, in both orientations |
| `navigation-bar-height` | Number | Overrides the device table's navigation bar height, in both orientations |
| `tab-bar-height` | Number | Overrides the default tab bar height of 50 |
| `user-agent` | String | Overrides the generated user agent |
| `status-bar` | Absent, any text, `live`, `hidden` | Absent shows `9:41`; `live` runs a real clock, ticking once a minute; `hidden` removes the strip |
| `status-bar-text-style` | `black` (default), `white` | black = dark text and glyphs for a light background (iOS `darkContent`, Android light status bar); white = light text for a dark background (iOS `lightContent`). On a real phone the home indicator adapts to the content the same way, so it follows this switch too |
| `status-bar-background` | A CSS color | Paints the status bar strip; transparent by default. A page with a `navigation-bar` slot does not need it — the slot's own background already covers the status bar. This is for pages with no navigation bar, or for emulating an app-level tint (Android's pre-15 `statusBarColor`) |
| `immersive` | Boolean attribute | See "The page draws its own title bar" |
| `embedded` | Boolean attribute | See `embedded` |

The default clock is pinned to `9:41` rather than the current time so screenshots and visual diffs come out identical every run. Set `status-bar="live"` if you want it to move.

## Properties

| Property | Type | What it is |
| --- | --- | --- |
| `deviceProfile` | `DeviceProfile \| null` | A device that is not in the shared table; wins over the `device` attribute. Read/write, no attribute form. `null` clears it |
| `device` | `DeviceProfile \| null` | Read-only: whichever profile the `device` attribute named, or `null` |
| `orientation` | `Orientation` | Read-only: the current orientation |
| `embedded` | `boolean` | Read-only: whether the element is in embedded mode |
| `immersive` | `boolean` | Read-only: whether the page runs behind the bars |
| `profile` | `DeviceProfile` | Read-only: the profile actually in effect, attribute overrides folded in |
| `metrics` | `DeviceMetrics` | Read-only: the numbers the element last drew with |
| `contentRect` | `ContentRect` | Read-only: where the content region sits in viewport coordinates |

A device the table does not have is passed as a property, and it takes precedence over `device`:

```ts
el.deviceProfile = { name: 'Pixel 9', os: 'android', screen: { width: 412, height: 915 }, pixelRatio: 3 }
```

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

Where the clock and the glyphs sit in the status bar is neither centered nor split evenly around the cutout, but laid out the way the device does it: iPhones with a notch or an island look up a measured table by screen width, pixel ratio and status bar height (time's left edge, battery's right edge, the midline, glyph scale), and sizes outside that table fall back to a formula derived from the ears; iPhones without a notch use the classic arrangement (signal left, time centered, battery right); iPads put the clock 17pt from the left (7pt on Home-button iPads) and the battery against the right edge; Android and HarmonyOS start the clock 31dp in, leave 28dp on the right, and stand the battery upright. Those rules are `computeStatusBarLayout`, and the `data-layout` attribute and `--sb-*` variables on `.status-bar` are its output. HarmonyOS has no measurements, so it reuses the Android arrangement.

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

`embedded` means "stop pretending": no status bar, no home indicator, no locked device size, all safe-area insets reported as zero, and the whole thing left to the container to lay out. This is how devtools embeds the simulator in a panel — the body around it is drawn by the panel there, and a second one from the element would be one too many.

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

Under `embedded` the two screen-size variables are not written at all (the element sizes itself at `100%` and the container owns the size); the rest are zero.

A few more variables exist to override the appearance: `--device-frame-radius` (overrides the device's own body radius), `--device-frame-border`, `--device-frame-background`, `--device-frame-shadow` and `--device-cutout-color` (the color of the notch, island or punch-hole). The body defaults to near-black (`#0b0b0c`) with a very faint white hairline border, and `--device-bezel` takes its default from the platform (6 on iOS, 4 on Android and HarmonyOS); an individual device can override it in `shell.bezel`.

**It publishes numbers and does not change `env(safe-area-inset-*)`.** An `env(safe-area-inset-top)` inside the previewed page still returns 0, because browsers do not let JavaScript set that value. Making `env()` actually return 59 is possible only in Electron or Chromium, through CDP's `Emulation.setSafeAreaInsetsOverride` — which is what devtools does, feeding it the insets computed here. A plain web host has no equivalent and has to let the previewed page read the CSS variables above instead.

## Hosting content in a webview

Anything that goes in the DOM — an `<iframe>`, a component of the host's own — goes in the default slot, already positioned. But Electron's `WebContentsView` is not a DOM node at all, cannot be slotted, and has to be placed by the host at coordinates.

**This package does not own that webview; it only reports where it belongs.** Who creates the view, which partition it uses, what preload it gets and when it is destroyed are the host's business, and folding those into an element would only make every host work around it.

```ts
import { CONTENT_RECT_CHANGE_EVENT } from '@devicekit/frame'

frame.addEventListener(CONTENT_RECT_CHANGE_EVENT, (event) => {
  const { x, y, width, height, scale } = event.detail
  // measured in the renderer; the numbers go to main, which positions the view
  ipcRenderer.send('preview:bounds', { x, y, width, height, scale })
})
```

`CONTENT_RECT_CHANGE_EVENT` is the event name, `'contentrectchange'`. Its `event.detail` and `frame.contentRect` are the same thing: a `ContentRect`, the content region in **viewport coordinates**, ready to hand to `setBounds()`. `scale` is how many screen-logical pixels one rendered pixel covers — it is 1 until the host shrinks the whole phone to fit a panel, and then the view has to shrink with it (Electron's `setZoomFactor`), or the position will be right and the size wrong.

The event fires only when the rectangle actually moved: changing orientation, toggling `immersive`, slotting a bar in or out, and host zoom all fire it; recoloring the status bar or ticking the clock do not. Host size changes are watched with a `ResizeObserver`, so a resizable panel gets events too.

`metrics.content` is the same region in **screen coordinates** — a `ContentBox`, measured from the screen's top-left and excluding the body. Use it to tell the previewed page where on the screen it sits; use `contentRect` to position a real view.

## Building on the internals

The pieces the element is built from are exported too, for a host that needs to draw part of this itself or to check its own arithmetic against the frame's.

`computeStatusBarLayout(device, orientation)` returns the `StatusBarLayout` described above: `mode` (a `StatusBarLayoutMode`: `'ios-cutout'`, `'ios-classic'`, `'ipad'` or `'android'`), `height`, `centerY`, `scale`, `timeLeft`, `trailing` and `leadingIcons`. It is the single owner of that geometry — the DOM only writes these numbers out, and the stylesheet only reads them, so there is one place to fix when a measurement turns out to be wrong.

`CUTOUT_PRESETS` is the stock geometry per shape (`Record<CutoutShape, CutoutSpec>`), for a host that knows its phone has a notch but carries no measurements of its own; per-device presets in the table override it. `cutoutBorderRadius(cutout)` gives the CSS `border-radius` that follows from the shape — a notch hangs off the top edge and rounds only its bottom corners, while a pill and a punch-hole float free and round the whole way. `cutoutLeft(cutout, screenWidth)` is its left offset, honoring `centerX`. `statusBarEars(cutout, screenWidth)` returns the two clear strips either side of it, `{ left, right }`, or `null` when there is no cutout to dodge.

`profileFromAttributes(element, named, fallbackScreen)` is how attributes get folded back onto a device profile — the rule that an attribute overrides the preset and a missing attribute falls through to it, stated once for every field instead of once per field inside a render path.

`DEVICE_FRAME_STYLES` is the shadow-DOM stylesheet as a string. It is a string rather than a `.css` file so the package builds with plain `tsc` and carries no bundler requirement into its consumers.

## API reference

| Export | Type | What it is |
| --- | --- | --- |
| `defineDeviceFrame` | `(tag?: string) => void` | Registers the element; safe to call repeatedly |
| `DEVICE_FRAME_TAG` | `string` | `'device-frame'` |
| `DeviceFrameElement` | `class extends HTMLElement` | The element class, for `instanceof` and for typing a ref |
| `CONTENT_RECT_CHANGE_EVENT` | `string` | `'contentrectchange'` |
| `frameOuterSize` | `(profile: DeviceProfile, orientation: Orientation, options?: { embedded?: boolean }) => ScreenSize` | The frame's outer footprint, before layout |
| `computeStatusBarLayout` | `(device: ResolvedDevice, orientation: Orientation) => StatusBarLayout` | Status bar geometry |
| `CUTOUT_PRESETS` | `Record<CutoutShape, CutoutSpec>` | Stock geometry per cutout shape |
| `cutoutBorderRadius` | `(cutout: CutoutSpec) => string` | The `border-radius` for that shape |
| `cutoutLeft` | `(cutout: CutoutSpec, screenWidth: number) => number` | The cutout's left offset |
| `statusBarEars` | `(cutout: CutoutSpec \| null, screenWidth: number) => { left: number, right: number } \| null` | The clear strips either side of the cutout |
| `profileFromAttributes` | `(element: Element, named: DeviceProfile \| null, fallbackScreen: { width: number, height: number }) => DeviceProfile` | Attributes folded back onto a profile |
| `DEVICE_FRAME_STYLES` | `string` | The shadow-DOM stylesheet |
| `DeviceFrame` | React component (`@devicekit/frame/react`) | The React wrapper |

Types: `DeviceMetrics`, `StatusBarTextStyle` (`'black' | 'white'`), `ContentBox`, `ContentRect`, `StatusBarLayout`, `StatusBarLayoutMode`, and `DeviceFrameProps` from the React entry.

The types this element's own API is written in — `CutoutShape`, `CutoutSpec`, `DeviceOS`, `DeviceProfile`, `DeviceShell`, `EdgeInsets`, `Orientation`, `ResolvedDevice`, `SafeAreaRect`, `ScreenSize` — are re-exported here as types so you do not have to add a second import for them. The values behind them are not: `DEVICES`, `findDevice`, `resolveDevice` and `resolveWindowSize` are imported from `@devicekit/devices`, because two import paths for one device table would be two things to keep in step.

## License

MIT
