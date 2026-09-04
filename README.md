English | [简体中文](./README.zh-CN.md)

# devicekit

A device table, and a custom element that draws the phone around it.

[![CI](https://github.com/EchoTechFE/devicekit/actions/workflows/ci.yml/badge.svg)](https://github.com/EchoTechFE/devicekit/actions/workflows/ci.yml)
[![npm @devicekit/devices](https://img.shields.io/npm/v/@devicekit/devices)](https://www.npmjs.com/package/@devicekit/devices)
[![npm @devicekit/frame](https://img.shields.io/npm/v/@devicekit/frame)](https://www.npmjs.com/package/@devicekit/frame)

## Highlights

- **171 devices, measured, not guessed.** 63 iPhones and iPads, 86 Android phones and tablets, and 22 Huawei HarmonyOS devices — both screens of every folding phone included. `CLASSIC_DEVICES` is a hand-picked shortlist of 19 for a picker that cannot show the whole table.
- **Every device carries real geometry.** Status bar height, safe-area insets, corner radius, bezel and cutout shape — notch, Dynamic Island or punch-hole — stored separately for portrait and landscape wherever they were measured. `resolveDevice()` fills in whatever a profile leaves out from that platform's defaults, so nothing comes back empty.
- **`<device-frame>` draws the phone**: body, status bar (static `9:41`, a live ticking clock, or hidden; black or white text; any CSS background color) and home indicator, as a Web Component with no dependencies of its own.
- **Three slots, real layout.** `navigation-bar` and `tab-bar` let a host drop in its own title bar and tab bar; the frame places them under the status bar and works out exactly how much room is left for the default slot's content.
- **`immersive` and `embedded` modes** cover a page that draws its own title bar behind the system bars, and a frame that has to fit inside a container that already supplies its own chrome.
- **The numbers reach the content, too.** `contentrectchange` events and `--device-*` CSS custom properties expose the safe-area insets, status bar height and content rect the frame just drew with, so a preview can react without polling.
- **`@devicekit/frame/react`** wraps the element for React 18 and 19 — same element, same output, just props.
- **`DEVICE_NAMES`** turns every device name into a typed constant, so a host never hand-types, or mistypes, a device string.
- **Zero dependencies.** `@devicekit/devices` depends on nothing; `@devicekit/frame` depends only on it. Works with any framework, or none.
- MIT licensed.

## Contents

- [Highlights](#highlights)
- [Live demo](#live-demo)
- [Packages](#packages)
- [Install](#install)
- [Quick start](#quick-start)
- [Device coverage](#device-coverage)
- [Development](#development)
- [Releasing](#releasing)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## Live demo

[echotechfe.github.io/devicekit](https://echotechfe.github.io/devicekit/) is `packages/frame/demo`, redeployed automatically whenever `packages/` changes on main. Pick a device, flip the orientation, toggle the bars, and watch the resolved metrics update next to the rendered phone.

## Packages

| Package | What it is |
| --- | --- |
| [`@devicekit/devices`](packages/devices) | A table of phones and tablets — screen size and pixel ratio for every one of them, plus status bar height, safe-area insets, cutout geometry and user agent wherever those were measured — and the functions that fill in the rest and turn a device into the window size a page actually gets. No DOM. |
| [`@devicekit/frame`](packages/frame) | A framework-agnostic `<device-frame>` custom element that draws the body, the status bar and the home indicator around whatever you are previewing. |

Each package documents its full API in its own README.

## Install

```sh
pnpm add @devicekit/devices
pnpm add @devicekit/frame
```

If you only need the data and the arithmetic, `@devicekit/devices` is enough. `@devicekit/frame` depends on it, so installing the frame brings the table along.

## Quick start

Device data and size arithmetic only:

```ts
import { DEVICE_NAMES, findDevice, resolveWindowSize } from '@devicekit/devices'

const device = findDevice(DEVICE_NAMES.iPhone_16_Pro)
const size = device && resolveWindowSize(device)
```

Draw the phone:

```ts
import { defineDeviceFrame } from '@devicekit/frame'

defineDeviceFrame()
```

```html
<device-frame device="iPhone 16 Pro">
  <!-- your preview goes here -->
</device-frame>
```

React hosts can import `<DeviceFrame device={DEVICE_NAMES.iPhone_16_Pro}>` from `@devicekit/frame/react` instead; it renders the same element and takes the device as props. That subpath is also where the JSX types for the raw `<device-frame>` tag live — import it once (React 18 or 19) if you would rather write the tag by hand in TSX.

## Device coverage

The table holds 171 devices across iOS, Android and HarmonyOS, including both screens of each folding model. `CLASSIC_DEVICES` is a hand-picked subset of 19, for places that need a short list rather than the full table — a device picker in a toolbar, for instance.

| Platform | Devices |
| --- | --- |
| iOS | 63 |
| Android | 86 |
| HarmonyOS | 22 |
| **Total** | **171** |

No profile carries a brand field, so the counts below come from each device's name: `Galaxy` / `Samsung` is Samsung, `Pixel` / `Nexus` is Google, `Surface Duo` is Microsoft, `Moto` / `Motorola` is Motorola, and every iOS device is Apple, every HarmonyOS device is Huawei.

| Brand | Devices |
| --- | --- |
| Apple | 63 |
| Samsung | 42 |
| Google | 34 |
| Huawei | 22 |
| Motorola | 3 |
| Microsoft | 2 |
| OnePlus | 2 |
| LG | 1 |
| Nothing | 1 |
| Xiaomi | 1 |

Only the name, the OS, the screen size and the pixel ratio are stored for every device. Status bar height, safe-area insets, cutout geometry and an explicit user agent are stored where somebody could measure them, and everything else falls through to that platform's defaults — `resolveDevice()` is what hands back a device with no holes in it. [`packages/devices`](packages/devices) says which is which, field by field, and what is explicitly unverified.

`DEFAULT_DEVICE` (an iPhone X) is a fallback screen size rather than a fallback device: a `<device-frame>` with no `device` attribute borrows its width and height and nothing else — pixel ratio 1, no cutout, no measured safe area. Name a device if you want a real one.

## Development

```sh
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm check-types
```

Run the `@devicekit/frame` demo page locally:

```sh
pnpm --filter @devicekit/frame demo
```

Build it (Pages deploys this same command, with `--base=/devicekit/` added):

```sh
pnpm --filter @devicekit/frame demo:build
```

## Releasing

`pnpm publish -r --provenance` publishes only versions that are not on the registry yet, so a package whose version did not change is skipped automatically. The release flow is therefore: bump `version` in the package's `package.json`, merge to main, then publish a GitHub Release (or run the Publish workflow by hand). The `workspace:` dependency from `@devicekit/frame` on `@devicekit/devices` is rewritten to a real version range by pnpm at pack time — nothing to do by hand.

A Release marked as a pre-release publishes under the `next` dist-tag, so it does not become what a plain `npm install` picks; a normal Release publishes under `latest`. Running the workflow by hand lets you choose either.

One-time repository setup:

- Settings → Secrets and variables → Actions: add `NPM_TOKEN`, an npm granular access token with publish rights on the `@devicekit` scope. (Not needed if npm trusted publishing is enabled for this repository.)
- Settings → Pages: set Source to "GitHub Actions".

## Contributing

Issues and pull requests are welcome. [CONTRIBUTING.md](./CONTRIBUTING.md) covers the local setup, the checks a change has to pass, and what adding a device to the table involves. Participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Security

Please do not report security issues in public issues. [SECURITY.md](./SECURITY.md) explains how to reach the maintainers privately.

## License

MIT
