English | [简体中文](./README.zh-CN.md)

# @devicekit/frame

A `<device-frame>` custom element for rendering device previews.

[View on npm](https://www.npmjs.com/package/@devicekit/frame) | [Open the demo](https://echotechfe.github.io/devicekit/)

Device profiles and size utilities come from [`@devicekit/devices`](../devices/README.md), which is installed as a dependency.

## Install

```sh
pnpm add @devicekit/frame
```

## Quick start

Register the element, then place preview content in its default slot:

```ts
import { defineDeviceFrame } from '@devicekit/frame'

defineDeviceFrame()
```

```html
<device-frame device="iPhone 16 Pro">
  <iframe src="/preview" style="width: 100%; height: 100%; border: 0"></iframe>
</device-frame>
```

`defineDeviceFrame(tag?)` registers `device-frame` by default. Repeated calls for the same element are safe. It throws when another custom element already owns the requested tag.

The default slot remains in the light DOM. The frame positions it between the active top and bottom bars.

A frame without a `device` attribute uses `DEFAULT_DEVICE.screen` as its size and applies the iOS platform defaults. It does not use the rest of the iPhone X profile. Set a device name or provide `width`, `height`, `pixel-ratio`, and `cutout` when those values matter.

## React

The React entry supports React 18 and 19:

```tsx
import { DEVICE_NAMES } from '@devicekit/devices'
import { DeviceFrame } from '@devicekit/frame/react'

<DeviceFrame device={DEVICE_NAMES.iPhone_16_Pro} orientation="portrait">
  <MiniAppPreview />
</DeviceFrame>
```

`DeviceFrame` renders the same custom element. It accepts standard HTML attributes and the frame props below.

| Prop | Type | Mapping |
| --- | --- | --- |
| `device` | `DeviceName \| string` | `device` |
| `deviceProfile` | `DeviceProfile \| null` | Element property |
| `os` | `DeviceOS` | `os` |
| `orientation` | `Orientation` | `orientation` |
| `width`, `height` | `number` | `width`, `height` |
| `pixelRatio` | `number` | `pixel-ratio` |
| `cutout` | `CutoutShape \| 'none'` | `cutout` |
| `userAgent` | `string` | `user-agent` |
| `statusBarHeight` | `number` | `status-bar-height` |
| `safeAreaTop`, `safeAreaRight`, `safeAreaBottom`, `safeAreaLeft` | `number` | Matching `safe-area-*` attribute |
| `navigationBarHeight`, `tabBarHeight` | `number` | Matching bar-height attribute |
| `statusBar` | `boolean \| 'live' \| string` | `status-bar`; `false` hides it |
| `statusBarTextStyle` | `'black' \| 'white'` | `status-bar-text-style` |
| `statusBarBackground` | `string` | `status-bar-background` |
| `embedded`, `immersive` | `boolean` | Boolean attributes |
| `onContentRectChange` | `(event: CustomEvent<ContentRect>) => void` | `contentrectchange` listener |

`className` maps to `class`, and refs resolve to `DeviceFrameElement`. Use `createDeviceFrameComponent(tag?)` when an application needs a different custom-element name.

To write the raw tag in TSX, import the React entry once for its JSX declarations:

```tsx
import '@devicekit/frame/react'

<device-frame device="iPhone 16 Pro" immersive />
```

## Attributes

| Attribute | Values | Description |
| --- | --- | --- |
| `device` | Device name | Selects a profile from `@devicekit/devices` |
| `os` | `ios`, `android`, `harmony` | Selects platform defaults when no profile supplies them |
| `orientation` | `portrait`, `landscape` | Defaults to `portrait` |
| `width`, `height` | Positive numbers | Overrides the portrait screen size in CSS pixels |
| `pixel-ratio` | Positive number | Overrides the profile pixel ratio |
| `cutout` | `none`, `notch`, `pill`, `circle` | Uses the stock geometry for that shape |
| `status-bar-height` | Non-negative number | Overrides the status bar height in both orientations |
| `safe-area-top`, `safe-area-right`, `safe-area-bottom`, `safe-area-left` | Non-negative numbers | Override individual insets in both orientations |
| `navigation-bar-height` | Non-negative number | Overrides the profile navigation bar height |
| `tab-bar-height` | Positive number | Overrides the default height of 50; an empty `tab-bar` slot still uses zero |
| `user-agent` | String | Overrides the profile or generated user agent |
| `status-bar` | Text, `live`, `hidden` | Defaults to `9:41`; `live` updates once per minute |
| `status-bar-text-style` | `black`, `white` | Controls the status glyphs and home indicator |
| `status-bar-background` | CSS color | Sets the status bar background; the default is transparent |
| `immersive` | Boolean attribute | Gives the default slot the full screen |
| `embedded` | Boolean attribute | Fits the element to its container and hides device chrome |

Boolean attributes are enabled by their presence. In JavaScript or React, pass booleans rather than strings such as `embedded="false"`.

## Properties and methods

| Member | Type | Description |
| --- | --- | --- |
| `deviceProfile` | `DeviceProfile \| null` | Custom profile; takes precedence over `device` |
| `device` | `DeviceProfile \| null` when read | Resolved profile named by the `device` attribute |
| `orientation` | `Orientation` | Reflects the `orientation` attribute |
| `embedded` | `boolean` | Reflects the `embedded` attribute |
| `immersive` | `boolean` | Reflects the `immersive` attribute |
| `profile` | `DeviceProfile` | Effective profile after attribute overrides |
| `metrics` | `DeviceMetrics` | Current screen, bar, safe-area, window, cutout, and shell values |
| `contentRect` | `ContentRect` | Content bounds in viewport coordinates |
| `refreshContentRect()` | `() => void` | Recomputes `contentRect` and emits an event when it changed |

Assign custom profiles as a property:

```ts
frame.deviceProfile = {
  name: 'Custom phone',
  os: 'android',
  screen: { width: 412, height: 915 },
  pixelRatio: 3,
}
```

`frameOuterSize(profile, orientation)` returns the unscaled outer size of the device body before layout. Embedded frames take their size from the container and do not use this calculation.

## Slots

| Slot | Content |
| --- | --- |
| default | Previewed page or component |
| `navigation-bar` | Application title bar at the top of the screen |
| `tab-bar` | Application tab bar at the bottom of the screen |
| `overlay` | Layer above the screen for annotations or extension UI |

The `navigation-bar` and `tab-bar` slots reserve space only when they have content. The navigation slot begins at the top of the screen and receives `padding-top: var(--device-status-bar-height)`. In landscape, use `--device-safe-area-left` and `--device-safe-area-right` for horizontal cutout clearance.

```html
<device-frame device="iPhone 16 Pro">
  <header slot="navigation-bar">Preview</header>
  <main>Page content</main>
  <nav slot="tab-bar">Tabs</nav>
</device-frame>
```

## Layout modes

`immersive` lets the default slot cover the complete screen. The frame continues to draw and report bar heights, so content can add its own padding:

```css
.page {
  height: var(--device-height);
  padding-top: calc(var(--device-status-bar-height) + var(--device-navigation-bar-height));
  padding-bottom: var(--device-tab-bar-height);
}
```

`embedded` fills the host container, removes the body, status bar, and home indicator, and reports bar heights and safe-area insets as zero. Use it when the host already draws the surrounding preview UI.

## CSS custom properties

Resolved layout values are published on the element:

| Variable | Value |
| --- | --- |
| `--device-width`, `--device-height` | Oriented screen size |
| `--device-window-width`, `--device-window-height` | Space available to the default slot |
| `--device-pixel-ratio` | Device pixel ratio |
| `--device-status-bar-height` | Status bar height |
| `--device-navigation-bar-height` | Navigation slot height, or zero |
| `--device-tab-bar-height` | Tab slot height, or zero |
| `--device-safe-area-top`, `--device-safe-area-right`, `--device-safe-area-bottom`, `--device-safe-area-left` | Safe-area insets |
| `--device-screen-radius`, `--device-bezel`, `--device-body-radius` | Shell geometry |
| `--device-frame-border-width` | Body border width in device CSS pixels |

Use these variables to change the frame appearance:

| Variable | Purpose |
| --- | --- |
| `--device-frame-radius` | Overrides the body radius with a CSS length |
| `--device-frame-border` | Body border |
| `--device-frame-background` | Body background |
| `--device-frame-shadow` | Body shadow |
| `--device-cutout-color` | Cutout color |
| `--device-screen-background` | Empty screen and transparent status bar background |

If `--device-frame-border` changes the border width, set `--device-frame-border-width` to the same width so the radius calculation remains aligned.

These variables do not change browser values such as `env(safe-area-inset-top)`. A page in the default slot must read the `--device-safe-area-*` variables or receive the values from its host.

## Content rectangle events

The `contentrectchange` event reports the default slot in viewport coordinates. It is useful when the preview is hosted in a native view that cannot be placed in a DOM slot.

```ts
frame.addEventListener('contentrectchange', (event) => {
  const { x, y, width, height, scale } = event.detail
  positionPreview({ x, y, width, height, scale })
})
```

`event.detail` and `frame.contentRect` are `ContentRect` values. The `x`, `y`, `width`, and `height` fields include the rendered scale. `scale` is the horizontal number of rendered pixels per device CSS pixel.

The element watches layout changes with `ResizeObserver`. CSS transforms do not trigger that observer, so call `refreshContentRect()` after changing a transform. Call it after layout changes on runtimes without `ResizeObserver` as well. Events are emitted only while the element is connected and only when a field changes by at least `CONTENT_RECT_EPSILON`.

## API reference

### Main entry

| Export | Description |
| --- | --- |
| `defineDeviceFrame`, `DEVICE_FRAME_TAG`, `DeviceFrameElement` | Custom-element registration and class |
| `CONTENT_RECT_CHANGE_EVENT`, `CONTENT_RECT_EPSILON` | Content rectangle event constants |
| `frameOuterSize` | Calculates the unscaled body size |
| `computeStatusBarLayout` | Calculates status bar geometry |
| `CUTOUT_PRESETS`, `cutoutBorderRadius`, `cutoutLeft`, `statusBarEars` | Cutout geometry helpers |
| `profileFromAttributes` | Applies element attributes to a profile |
| `DEVICE_FRAME_STYLES` | Shadow DOM stylesheet string |

The main entry also exports `DeviceMetrics`, `StatusBarTextStyle`, `ContentBox`, `ContentRect`, `DeviceFrameElementEventMap`, `StatusBarLayout`, and `StatusBarLayoutMode`. Device-related types used by the element are re-exported from `@devicekit/devices`.

### React entry

| Export | Description |
| --- | --- |
| `DeviceFrame` | Default React wrapper |
| `createDeviceFrameComponent` | Creates a wrapper for a custom tag |
| `DeviceFrameProps` | Component props |
| `DeviceFrameIntrinsicAttributes` | JSX attributes for the raw custom element |

## Runtime support

The element requires Custom Elements and Shadow DOM. The React entry supports React 18 and 19.

The stylesheet uses `adoptedStyleSheets` when available and falls back to a `<style>` element. A strict Content Security Policy must permit that fallback with `style-src 'unsafe-inline'` or a hash of `DEVICE_FRAME_STYLES`. A nonce cannot be attached to the generated fallback element.

The package declares Node.js 20 or later for tooling and server-side imports.

## License

MIT
