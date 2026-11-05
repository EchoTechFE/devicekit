English | [简体中文](./README.zh-CN.md)

# @devicekit/devices

Device profiles and utilities for screen, safe-area, viewport, and user-agent calculations.

[View on npm](https://www.npmjs.com/package/@devicekit/devices) | [Open the demo](https://echotechfe.github.io/devicekit/)

## Install

```sh
pnpm add @devicekit/devices
```

## Quick start

```ts
import {
  DEVICE_NAMES,
  findDevice,
  resolveDevice,
  resolveWindowSize,
} from '@devicekit/devices'

const profile = findDevice(DEVICE_NAMES.iPhone_16_Pro)

if (!profile) {
  throw new Error('Device not found')
}

const device = resolveDevice(profile)
const windowSize = resolveWindowSize(profile, {
  orientation: 'portrait',
  navigationBar: true,
  tabBarHeight: 50,
})
```

`findDevice()` performs an exact name lookup. `resolveDevice()` applies platform defaults to optional fields. `resolveWindowSize()` returns the size available to page content after subtracting the selected bars.

## Device coverage

| Platform | Profiles |
| --- | ---: |
| iOS | 63 |
| Android | 86 |
| HarmonyOS | 22 |
| Total | 171 |

`DEVICES` contains the complete table. `IOS_DEVICES`, `ANDROID_DEVICES`, and `HARMONY_DEVICES` expose the platform lists. Folding devices use separate profiles for their inner and outer screens.

`CLASSIC_DEVICES` is a 17-profile subset for compact device selectors (Pixel 8 and Xiaomi 14 are kept in `DEVICES` but omitted from Classic until screen radius / cutout / safe are measured). `DEFAULT_DEVICE` is the iPhone X profile. `DEVICE_NAMES` provides typed names such as `DEVICE_NAMES.iPhone_16_Pro`.

## Device profiles

A stored profile has four required fields:

```ts
const profile = {
  name: 'iPhone 16 Pro',
  os: 'ios',
  screen: { width: 402, height: 874 },
  pixelRatio: 3,
  releaseYear: 2024,
  system: 'iOS 18.5',
  statusBarHeight: 54,
  safeAreaInsets: { top: 62, bottom: 34 },
  safeAreaInsetsLandscape: { left: 62, right: 62, bottom: 21 },
  cutout: { shape: 'pill', width: 125, height: 37, top: 14 },
  shell: { screenRadius: 62 },
}
```

Only `name`, `os`, `screen`, and `pixelRatio` are required. Presets also include `releaseYear`, which is the model's release year and can be used to sort a picker. `screen` uses CSS pixels and is stored in portrait orientation. `orientedScreen()` swaps its dimensions for landscape.

Orientation-specific status bars, navigation bars, and safe-area insets are stored separately. The status bar height and the top safe-area inset are separate fields because they can differ on devices with a cutout. `cutout` describes the rendered shape; safe-area fields describe the space available to content.

Optional fields use `PLATFORM_DEFAULTS` when passed through `resolveDevice()`. The returned `ResolvedDevice` includes `formFactor`, `system`, `userAgent`, bar heights, safe-area insets, cutout data, and shell geometry.

Use `assertDeviceProfile(value)` to validate profiles supplied by an application. Invalid dimensions, insets, and enum values throw a `TypeError` that identifies the field.

## Size and safe-area utilities

```ts
import {
  orientedScreen,
  resolveSafeArea,
  resolveSafeAreaInsets,
  resolveWindowSize,
} from '@devicekit/devices'

const screen = orientedScreen(profile, 'landscape')
const insets = resolveSafeAreaInsets(profile, 'landscape')
const safeArea = resolveSafeArea(profile, 'landscape')
const windowSize = resolveWindowSize(profile, {
  orientation: 'landscape',
  navigationBar: false,
})
```

`resolveSafeAreaInsets()` returns distances from the four screen edges. `resolveSafeArea()` returns `{ top, left, right, bottom, width, height }` in screen coordinates. `resolveWindowSize()` subtracts the status bar, the requested navigation bar, and `tabBarHeight` from the oriented screen.

iPhone Duo layout points, safe-area insets, and free-edge screen radius (59, continuous) follow Xcode 27.1 DeviceHub / safearea.info. Outer idle cutout remains Ø37 circle; hinge-side corners are **8**. Crease / pose APIs are not modeled yet.

`navigationBar` accepts `true`, `false`, or a non-negative number. `tabBarHeight` accepts a non-negative number. Invalid numeric options throw a `RangeError`.


## Galaxy S24 Ultra window mode (FHD+ default)

Classic / default `Galaxy S24 Ultra` uses the **FHD+ gesture window** reported by windowinsets.info at densityDpi 450:

| Field | Value |
| --- | --- |
| Logical window | **384×832** @ **2.8125** |
| Screen radius | **2.13** (WindowInsets.RoundedCorner — near-sharp content clip under FHD+; screenshot QA should expect a near-square content corner, not S24's 36) |
| Safe area | top ≈34 / bottom ≈15 |

This is **not** the panel's full WQHD+ logical size (previously shipped as 412×915 @2.625). Hosts that need the old WQHD+-ish window should pass an explicit `deviceProfile` override:

```ts
const ultra = findDevice('Galaxy S24 Ultra')!
const wqhd = {
  ...ultra,
  screen: { width: 412, height: 915 },
  pixelRatio: 2.625,
}
```

A named dual-field / `screenMode` API is tracked as P1. Until then, Classic consumers should treat 384×832 as the breaking default.

## Classic screen-fidelity notes

- Modern Classic phones (non-tablet, non-Harmony) lock an explicit measured `shell.screenRadius` in CI.
- Harmony Classic rows stay in the picker but **skip** the radius lock until RoundedCorner + bottom inset are measured — no invented cutouts.
- Pixel 8 and Xiaomi 14 remain in `ANDROID_DEVICES` / `DEVICES` but are **not** Classic.

## User agents

```ts
import { deviceUserAgent, systemVersion } from '@devicekit/devices'

const userAgent = deviceUserAgent(profile)
const version = systemVersion(profile)
```

`deviceUserAgent()` returns an explicit `userAgent` from the profile when present. Otherwise it builds a Safari, Chrome, or ArkWeb string from `os`, `system`, and `formFactor`. Generated strings describe a browser; hosts that emulate an application container must add its tokens themselves.

`systemVersion()` extracts a numeric version from the system label and uses the package's pinned fallback when the label has no version.

## API reference

### Data

| Export | Type | Description |
| --- | --- | --- |
| `DEVICES` | `readonly PresetDeviceProfile[]` | Complete table in iOS, Android, HarmonyOS order |
| `IOS_DEVICES` | `readonly PresetDeviceProfile[]` | iOS profiles |
| `ANDROID_DEVICES` | `readonly PresetDeviceProfile[]` | Android profiles |
| `HARMONY_DEVICES` | `readonly PresetDeviceProfile[]` | HarmonyOS profiles |
| `CLASSIC_DEVICES` | `readonly PresetDeviceProfile[]` | 17 profiles for short selectors |
| `DEFAULT_DEVICE` | `PresetDeviceProfile` | iPhone X profile |
| `PLATFORM_DEFAULTS` | `Record<DeviceOS, ...>` | Default bar and shell values by platform |
| `DEVICE_NAMES` | `const object` | Typed name constants generated from `DEVICES` |

### Functions

| Export | Signature | Description |
| --- | --- | --- |
| `findDevice` | `(name: string \| null \| undefined) => DeviceProfile \| undefined` | Finds an exact device name |
| `deviceNameKey` | `(name: string) => string` | Converts a device name to its `DEVICE_NAMES` key |
| `resolveDevice` | `(profile: DeviceProfile) => ResolvedDevice` | Validates a profile and applies platform defaults |
| `assertDeviceProfile` | `(value: unknown, label?: string) => asserts value is DeviceProfile` | Validates a profile |
| `statusBarHeightFor` | `(device: ResolvedDevice, orientation: Orientation) => number` | Selects the status bar height for an orientation |
| `navigationBarHeightFor` | `(device: ResolvedDevice, orientation: Orientation) => number` | Selects the navigation bar height for an orientation |
| `safeAreaInsetsFor` | `(device: ResolvedDevice, orientation: Orientation) => EdgeInsets` | Selects the safe-area insets for an orientation |
| `orientedScreen` | `(device: DeviceProfile, orientation?: Orientation) => ScreenSize` | Returns the screen dimensions for an orientation |
| `resolveSafeAreaInsets` | `(device: DeviceProfile, orientation?: Orientation) => EdgeInsets` | Resolves safe-area insets |
| `resolveSafeArea` | `(device: DeviceProfile, orientation?: Orientation) => SafeAreaRect` | Resolves the safe-area rectangle |
| `resolveWindowSize` | `(device: DeviceProfile, options?: WindowSizeOptions) => ScreenSize` | Calculates the page viewport |
| `deviceUserAgent` | `(profile) => string` | Returns or generates a browser user agent |
| `systemVersion` | `(profile) => string` | Extracts the system version |

`orientation` defaults to `'portrait'` where optional.

### Types

| Type | Description |
| --- | --- |
| `DeviceProfile` | A stored profile with optional device-specific fields |
| `PresetDeviceProfile` | A bundled profile with a required `releaseYear` |
| `ResolvedDevice` | A profile with defaults applied |
| `DeviceOS` | `'ios' \| 'android' \| 'harmony'` |
| `DeviceFormFactor` | `'phone' \| 'tablet'` |
| `Orientation` | `'portrait' \| 'landscape'` |
| `ScreenSize` | `{ width, height }` |
| `EdgeInsets` | `{ top, right, bottom, left }` |
| `SafeAreaRect` | `{ top, left, right, bottom, width, height }` |
| `CutoutShape` | `'notch' \| 'pill' \| 'circle'` |
| `CutoutSpec` | Cutout shape and geometry |
| `DeviceShell` | Screen radius and uniform `bezel`; `bezelInsets` can override individual edges, `homeButton` describes physical hardware, and per-edge profiles should set `bodyRadius` explicitly |
| `CornerRadii` | `{ topLeft, topRight, bottomRight, bottomLeft }`, ordered the way CSS `border-radius` orders them |
| `screenCorners` (on `DeviceShell`) | Per-corner override of `screenRadius`, for shells whose screen corners are not all the same — a folding phone's hinge side, say. Omitted corners keep the uniform `screenRadius` value |
| `cornerCurve` (on `DeviceShell`) | `'circular'` or `'continuous'`; applied only to `.screen` (iOS defaults to continuous / squircle; Android and HarmonyOS stay circular) |
| `HomeButtonSpec` | `{ diameter }`, the physical Home button centered in the body bezel |
| `ResolvedDeviceShell` | A shell with every edge resolved and `homeButton` set to a spec or `null` |
| `WindowSizeOptions` | Options for `resolveWindowSize()` |
| `DeviceName` | Union of the values in `DEVICE_NAMES` |

Run `pnpm --filter @devicekit/devices generate:device-names` after adding, renaming, or removing a profile.

## Runtime support

The package targets ES2022, does not use DOM APIs, and declares Node.js 20 or later.

## License

MIT
