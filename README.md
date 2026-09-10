English | [简体中文](./README.zh-CN.md)

# devicekit

Device profiles and a Web Component for rendering phone and tablet previews.

[![CI](https://github.com/EchoTechFE/devicekit/actions/workflows/ci.yml/badge.svg)](https://github.com/EchoTechFE/devicekit/actions/workflows/ci.yml)
[![npm @devicekit/devices](https://img.shields.io/npm/v/@devicekit/devices)](https://www.npmjs.com/package/@devicekit/devices)
[![npm @devicekit/frame](https://img.shields.io/npm/v/@devicekit/frame)](https://www.npmjs.com/package/@devicekit/frame)

![Rendered device frames](docs/images/devices-light.png)

[Open the live demo](https://echotechfe.github.io/devicekit/)

## Install

Install the frame package to render previews:

```sh
pnpm add @devicekit/frame
```

Install the data package by itself when you only need device profiles and size calculations:

```sh
pnpm add @devicekit/devices
```

## Quick start

Register the custom element once, then use it in HTML:

```ts
import { defineDeviceFrame } from '@devicekit/frame'

defineDeviceFrame()
```

```html
<device-frame device="iPhone 16 Pro">
  <iframe src="/preview" style="width: 100%; height: 100%; border: 0"></iframe>
</device-frame>
```

## Features

- Choose from 171 iOS, Android, and HarmonyOS device profiles, including separate entries for both screens of folding devices.
- Render the device body, cutout, status bar, safe areas, and home indicator with `<device-frame>`.
- Add application chrome through the `navigation-bar`, `tab-bar`, and `overlay` slots.
- Read resolved layout values through CSS custom properties, element properties, or the `contentrectchange` event.
- Use the custom element directly or import the React 18 and React 19 wrapper from `@devicekit/frame/react`.
- Rotate with the `orientation` attribute. Safe areas, the status bar, and the home indicator follow.

![Device frames in landscape](docs/images/devices-landscape.png)

## Packages

| Package | Description |
| --- | --- |
| [`@devicekit/devices`](packages/devices/README.md) ([npm](https://www.npmjs.com/package/@devicekit/devices)) | Device profiles, safe-area calculations, viewport sizes, and user-agent generation. This package has no DOM dependency. |
| [`@devicekit/frame`](packages/frame/README.md) ([npm](https://www.npmjs.com/package/@devicekit/frame)) | The `<device-frame>` custom element and its React wrapper. |

The package READMEs contain the full API references.

## Device coverage

171 profiles: 63 iOS, 86 Android, 22 HarmonyOS. Folding phones get one entry per screen.

| Manufacturer | Profiles | Representative models |
| --- | ---: | --- |
| Apple | 63 | iPhone 17 Pro, iPhone 16 Pro, iPhone X, iPad Pro M4 |
| Samsung | 42 | Galaxy S24 Ultra, Galaxy Z Fold 7, Galaxy Z Flip 7 |
| Google | 34 | Pixel 10 Pro, Pixel 9 Pro Fold, Pixel Tablet |
| Huawei | 22 | HUAWEI Mate 80, HUAWEI Pura 80 Pro, HUAWEI Mate X6 (inner), HUAWEI Mate X6 (outer) |
| Motorola | 3 | Motorola Razr+, Moto G4, Moto G Power |
| Microsoft | 2 | Surface Duo |
| OnePlus | 2 | OnePlus 12, OnePlus Open |
| LG | 1 | LG Optimus L70 |
| Nothing | 1 | Nothing Phone 2 |
| Xiaomi | 1 | Xiaomi 14 |

Every preset includes a `releaseYear`, so a picker can sort models chronologically. Manufacturer counts are derived from device names because profiles do not have a manufacturer field. `CLASSIC_DEVICES` contains 19 commonly used profiles for shorter selectors.

## Browser and framework support

`<device-frame>` requires Custom Elements and Shadow DOM. It can be used with plain HTML or frameworks that support custom elements. The optional React entry supports React 18 and 19.

The frame uses `ResizeObserver` to report automatic content rectangle updates. Call `refreshContentRect()` after changing a CSS transform or when `ResizeObserver` is unavailable. `@devicekit/devices` does not use DOM APIs and declares Node.js 20 or later.

## Development

```sh
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm check-types
```

Run the demo locally with `pnpm --filter @devicekit/frame demo`.

See [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a change. Report security issues using the process in [SECURITY.md](./SECURITY.md).

## License

MIT
