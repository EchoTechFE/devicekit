English | [简体中文](./README.zh-CN.md)

# devicekit

A device table, and a custom element that draws the phone around it.

[![CI](https://github.com/EchoTechFE/devicekit/actions/workflows/ci.yml/badge.svg)](https://github.com/EchoTechFE/devicekit/actions/workflows/ci.yml)
[![npm @devicekit/devices](https://img.shields.io/npm/v/@devicekit/devices)](https://www.npmjs.com/package/@devicekit/devices)
[![npm @devicekit/frame](https://img.shields.io/npm/v/@devicekit/frame)](https://www.npmjs.com/package/@devicekit/frame)

## Live demo

[echotechfe.github.io/devicekit](https://echotechfe.github.io/devicekit/) is `packages/frame/demo`, redeployed automatically whenever `packages/` changes on main. Pick a device, flip the orientation, toggle the bars, and watch the resolved metrics update next to the rendered phone.

## Packages

| Package | What it is |
| --- | --- |
| [`@devicekit/devices`](packages/devices) | A table of phones and tablets — screen size, pixel ratio, status bar, safe-area insets, cutout geometry, user agent — plus the functions that turn a device into the window size a page actually gets. No DOM. |
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
import { findDevice, resolveWindowSize } from '@devicekit/devices'

const device = findDevice('iPhone 16 Pro')
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

React hosts can import `<DeviceFrame device="iPhone 16 Pro">` from `@devicekit/frame/react` instead; it renders the same element.

## Device coverage

The table holds 171 devices across iOS, Android and HarmonyOS, including both screens of each folding model. `CLASSIC_DEVICES` is a hand-picked subset of fewer than 20, for places that need a short list rather than the full table — a device picker in a toolbar, for instance. `DEFAULT_DEVICE` is what renders when nothing asked for a particular device.

Every number is sourced, and the fields nobody could verify are left at platform defaults rather than guessed. [`packages/devices`](packages/devices) says which is which, field by field.

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

One-time repository setup:

- Settings → Secrets and variables → Actions: add `NPM_TOKEN`, an npm granular access token with publish rights on the `@devicekit` scope. (Not needed if npm trusted publishing is enabled for this repository.)
- Settings → Pages: set Source to "GitHub Actions".

## Contributing

Issues and pull requests are welcome. [CONTRIBUTING.md](./CONTRIBUTING.md) covers the local setup, the checks a change has to pass, and what adding a device to the table involves. Participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Security

Please do not report security issues in public issues. [SECURITY.md](./SECURITY.md) explains how to reach the maintainers privately.

## License

MIT
