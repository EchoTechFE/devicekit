English | [简体中文](./README.zh-CN.md)

# @devicekit/devices

A table of phones and tablets, and the functions that turn one of them into usable sizes. Every device carries a name, an OS, a screen size and a pixel ratio; status bar height, safe-area insets, cutout geometry and an explicit user agent are there for the devices somebody could measure, and fall back to the platform's defaults for the rest. `resolveDevice()` is what hands back a device with no holes in it.

**There is no DOM in this package.** Its `tsconfig` sets `lib` to `ES2022` only, so writing `document` in here is a compile error rather than something a reviewer has to catch. Node scripts, build steps, tests and servers can all use it directly. Drawing the phone is [@devicekit/frame](../frame).

## Install

```sh
pnpm add @devicekit/devices
```

## The device table

```ts
import { DEVICES, DEFAULT_DEVICE, DEVICE_NAMES, findDevice } from '@devicekit/devices'

const device = findDevice(DEVICE_NAMES.iPhone_16_Pro) ?? DEFAULT_DEVICE
```

`DEVICES` is the whole table: iPhones, iPads, Android phones and HarmonyOS phones, with both screens of each folding model counted separately. It is the concatenation of `IOS_DEVICES`, `ANDROID_DEVICES` and `HARMONY_DEVICES`, one file per platform, one line per device — import a platform list directly if that is all you need. `findDevice(name)` looks a device up by its exact `name` and returns `undefined` for anything not in the table. `DEFAULT_DEVICE` (an iPhone X) is the fallback when nothing asked for a particular device. Hosts that consume it for its size only — [@devicekit/frame](../frame) is one — take its screen and nothing else, so a frame with no device named is not an iPhone X.

`DEVICE_NAMES` is every `name` in the table, keyed for autocomplete instead of hand-typed: `DEVICE_NAMES.iPhone_16_Pro` is the string `'iPhone 16 Pro'`. A key is the name with every run of characters outside `[A-Za-z0-9]` collapsed to one `_` and trimmed from the ends — `'iPhone 12/13 (Pro)'` becomes `iPhone_12_13_Pro`, `'iPad Pro 10.5-inch'` becomes `iPad_Pro_10_5_inch`. Writing `findDevice(DEVICE_NAMES.iPhone_16_Pro)` still just passes a string; the constant only exists so a typo turns into a missing property instead of a silent lookup miss. `DEVICE_NAMES` lives in a generated file — see the API reference below.

`CLASSIC_DEVICES` is a hand-picked subset of the same objects — 19 of them, grouped iOS → Android → HarmonyOS — for a device picker that cannot show 171 rows. The pick is a judgement call, not a ranking: iPhones and iPads, Pixel and Galaxy, one Xiaomi and four HUAWEI. Hosts that need the full table still read `DEVICES`.

## What a device looks like

A row of the table is a `DeviceProfile`:

```ts
{
  name: 'iPhone 16 Pro',
  os: 'ios',
  screen: { width: 402, height: 874 },   // physical screen, portrait
  pixelRatio: 3,
  system: 'iOS 18.5',
  statusBarHeight: 54,                    // the strip that gets drawn
  safeAreaInsets: { top: 62, bottom: 34 },              // portrait, measured
  safeAreaInsetsLandscape: { left: 62, right: 62, bottom: 21 },  // landscape, also measured
  cutout: { shape: 'pill', width: 125, height: 37, top: 14 },
  shell: { screenRadius: 62 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) ...',
}
```

Five decisions in that shape are what separate it from a hand-written pair of numbers.

**The screen size is not the usable size.** Take away the status bar and the app's own navigation bar and the two differ by close to a hundred pixels; storing one number would make every preview lie. Only the screen is stored here, and the usable size comes from `resolveWindowSize()`, because it depends on which bars the page asked for.

**Only the screen size flips with orientation — everything else is stored twice.** The rest cannot be derived: the bottom inset shrinks from 34 to 21, the navigation bar from 44 to 32, and the iPhone 17 line's landscape bottom inset moved from 21 to 20 — the top inset stays 0 in landscape on every iOS device. No rule computes those from their portrait values. `screen` is always the portrait size, including for the `(inner)` rows of a folding phone — the unfolded screen is usually wider than it is tall in real life, but the table stores it as if turned upright, and `orientation: 'landscape'` is what gets its actual, wider-than-tall shape back.

**Status bar height and top inset are two different numbers.** On a Dynamic Island device the status bar is still 54 while the top safe-area inset is 59 or 62: one is the strip the clock and glyphs are drawn into, the other is what the island and the ring of space around it claim. One field cannot serve both.

**`cutout` carries its own shape and geometry.** A new cutout device needs no new branch in an enum. It only says what to draw; how much screen it costs is in the safe-area insets, and neither is derived from the other.

**`shell` is the body**: screen corner radius and bezel thickness. A 2016 phone and a 2025 phone do not have the same corners.

Only `name`, `os`, `screen` and `pixelRatio` are required. Everything else is optional, and omitted fields fall through to the platform defaults. `formFactor` (`'phone' | 'tablet'`, default `'phone'`) is one such optional field — it only steers the generated user agent, since screen size and everything else the table stores is measured per device regardless of what shape it is.

## Filling in the gaps

```ts
import { resolveDevice, PLATFORM_DEFAULTS, statusBarHeightFor, navigationBarHeightFor, safeAreaInsetsFor } from '@devicekit/devices'

const resolved = resolveDevice(device)
```

`resolveDevice(profile)` fills every omitted field from the platform defaults and returns a `ResolvedDevice`, in which nothing is optional — so callers do not each write their own fallbacks. Omitting the safe-area insets means "a status bar on top and nothing anywhere else", which is exactly what a phone with no cutout and no gesture bar reports.

A malformed profile — a missing `os`, a negative or `NaN` screen size, a negative safe-area inset — throws a `TypeError` naming the offending field (`deviceProfile.screen.width must be a finite number greater than 0, got -1`) instead of turning into a resolved device with a lying size. `resolveDevice()` checks this on every call, so a bad profile never gets as far as `PLATFORM_DEFAULTS` lookups.

`PLATFORM_DEFAULTS` is the table those fallbacks come from, keyed by `DeviceOS`: `statusBarHeight`, `statusBarHeightLandscape`, `navigationBarHeight`, `navigationBarHeightLandscape` and `shell` for each of `ios`, `android` and `harmony`. It is exported so a host can show a default the same way it shows a measured value, rather than reimplementing it.

`statusBarHeightFor(device, orientation)`, `navigationBarHeightFor(device, orientation)` and `safeAreaInsetsFor(device, orientation)` take a `ResolvedDevice` and pick the value stored for that orientation. They derive nothing; they choose between the two stored sets.

### Where the numbers come from, and what is not verified

The table was assembled by hand from vendors' published specifications and from the device-emulation tables that ship with mainstream browser developer tools and mini-program toolchains — four of them, each able to supply different things. The originals are not vendored here and are not named individually, because no single one of them is the authority for any field: every number below was taken only where it survived a cross-check. Corrections through a PR are welcome, and the PR is the place to say where your number came from.

- **Screen sizes and pixel ratios** are the vendors' published logical resolutions, cross-checked row by row across all four. Where they disagree, the more recent and more specific one wins — one source stores the browser viewport rather than the screen (it gives iPhone 14 Pro a height of 659; the device is 852), and those values are dropped.
- **Safe-area insets and cutout geometry** come from the one source that measured them per orientation, covering 37 of the devices here. Status bar heights per iOS generation have their own measured record.
- **HarmonyOS** sizes, status bars, navigation bars and the iOS bottom insets come from a mini-program toolchain table, which is also the only structured source that covers HarmonyOS devices at all, both screens of each folding model included.

A device with no measurement of its own borrows from **devices with the same screen**: same platform, same size, same pixel ratio, and only when every one of them states the same value. One disagreement inside such a group and none of its members gets that field — iPhone X and iPhone 12 mini are both 375×812@3 with status bars of 44 and 50, so neither lends one. The result, out of 171 devices: 93 with safe-area insets, 94 with a status bar height, 46 with cutout geometry, and 74 with an explicit user agent (the rest generate one from the model and system version). The remaining devices are not broken — an omitted field means "this platform's default", which `resolveDevice()` fills in, and `PLATFORM_DEFAULTS` is where those values are.

The values then went through a device-by-device review (2026-09):

- **iOS**: every iPhone from XR through 17 and every iPad generation was checked against UIKit's own status bar height and portrait/landscape safe-area insets, read by a probe app on the Xcode simulator (iOS 18.3 and 26.5), and corrected field by field. The differences worth naming: iPhone 12/13 mini report a 50-pixel status bar, not 47; iPhone XR and 11 report 48; iPhone Air has a 54-pixel status bar and a 68-pixel top inset; the iPhone 17 line has no top inset in landscape and a bottom inset of 20; full-screen iPads report a 24-pixel status bar in both orientations with a 25-pixel bottom inset, and Home-button iPads report 20. iPhone X, 8 and 8 Plus and the Home-button iPads have no usable simulator runtime and were checked against published specifications only. Notch widths are not rendered by the simulator and are taken from same-screen, same-generation devices.
- **Android**: model strings, shipped system versions and user agents were checked for consistency device by device. Pixel 7 and 7 Pro status bars and cutout geometry are simulator measurements. The other cutout devices have no measured geometry and were left without.
- **HarmonyOS**: only the resolutions were checked (Mate 60's height was corrected from 862 to 827). There is no official status bar table, so those heights are unverified.

Explicitly **unverified**, and therefore left at the default rather than guessed:

- HarmonyOS gesture bar heights. No source states them, so these devices report a bottom inset of 0 and draw no gesture bar.
- Everything about Android and HarmonyOS in landscape, including whether the status bar survives the rotation. A device that leaves its landscape fields unset does not inherit its own portrait values — it falls back to `PLATFORM_DEFAULTS`, which is a flat 24px status bar for Android and 36px for HarmonyOS regardless of what that device reports in portrait (Pixel 7, for instance, has a 52px portrait status bar but falls back to 24 in landscape). A profile that leaves `safeAreaInsetsLandscape` unset still gets a top inset equal to its landscape status bar height, not an empty one — on Android and HarmonyOS the status bar stays visible in landscape, so a 0 top inset there would be wrong in the same way an unmeasured portrait inset would be. Only iOS, whose landscape status bar is 0, can use the empty fallback safely.
- All cutout geometry is **appearance only**. It takes part in no size calculation, so a wrong one is only drawn wrong; what the screen actually gives up is in the safe-area insets, never derived from the cutout. A device with no measured geometry — which is every HarmonyOS device here — simply draws no cutout.

Brand coverage follows the sources rather than the market: Android is mostly Pixel and Galaxy, with one Xiaomi, and vivo, OPPO and HONOR are not in the table at all. HarmonyOS covers HUAWEI. Adding a missing phone is a one-line PR.

The table is ordinary source code from there on, one device per line. Adding a device means adding a line, and `presets.test.ts` rejects duplicate names, screens out of range, user agents that name the wrong platform, and a device that has already been entered lying down.

## Computing sizes

```ts
import { resolveWindowSize, resolveSafeArea, resolveSafeAreaInsets, orientedScreen } from '@devicekit/devices'
```

`resolveWindowSize(device, options)` returns the width and height the page itself actually gets: the screen minus the status bar, minus the navigation bar, minus the tab bar. `options` is a `WindowSizeOptions` — `orientation`, `navigationBar` (a boolean to keep or drop the device's own bar, or a number to override its height) and `tabBarHeight`.

```ts
resolveWindowSize(iPhoneX)                                // { width: 375, height: 724 }
resolveWindowSize(iPhoneX, { navigationBar: false })      // 724 + 44 = 768, the page draws its own bar
resolveWindowSize(iPhoneX, { tabBarHeight: 50 })          // 674
resolveWindowSize(iPhoneX, { orientation: 'landscape' })  // { width: 812, height: 343 }, no status bar in landscape
```

A negative or non-finite `navigationBar` or `tabBarHeight` throws a `RangeError` naming the option and the value it got, rather than subtracting a negative number and returning a window taller than the screen.

**This function is for the host doing the previewing.** Hand 812 straight to the previewed page and every `100vh` in it is 88 pixels taller than the phone allows: it looks right in the preview and overflows on the device.

`resolveSafeAreaInsets(device, orientation)` returns the four insets. `resolveSafeArea(device, orientation)` returns the same information as `{ top, left, right, bottom, width, height }` — a `SafeAreaRect`, the shape `wx.getWindowInfo().safeArea` uses, where the edges are coordinates measured from the screen's top-left rather than distances from each edge. Both read the values stored for that orientation and derive nothing.

`orientedScreen(device, orientation)` is the one thing that does flip: the screen size with width and height swapped in landscape.

## User agents

```ts
import { deviceUserAgent, systemVersion } from '@devicekit/devices'
```

`deviceUserAgent(profile)` builds the user agent from `os`, `system` and `formFactor` instead of storing one per device, so a preset cannot drift into claiming iOS 18 in its label and iOS 15 in its UA. A profile that needs an exact string — a host pretending to be one specific container, down to its build — sets `userAgent`, and generation is skipped. `systemVersion(profile)` is the version it pulls out of a label like `"iOS 18.0"` or `"HarmonyOS 5.0"`, falling back to a pinned version — not the current one — rather than leaving a hole in the string.

`formFactor: 'tablet'` changes more than the label:

- On iOS, an iPad reports the desktop UA Safari sends by default from iPadOS 13 on — `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...`, not an `(iPad; ...)` platform token. Narrow split-screen/Slide Over widths and "Request Mobile Website" flip real Safari back to a mobile UA; that is not modeled here. Whether iPad mini defaults to the desktop or the mobile UA is unverified.
- From Safari 26, iOS and iPadOS freeze the platform's OS token at `18_6` regardless of the actual system version — only the `Version/` token keeps climbing. A profile with `system: 'iOS 26.0'` gets `CPU iPhone OS 18_6 like Mac OS X ... Version/26.0`.
- HarmonyOS's generic `ArkWeb/...` container token does not carry `HuaweiBrowser/...` — that is a token the Huawei Browser app itself appends. A profile emulating that specific app sets an explicit `userAgent`.
- An Android tablet's UA drops the `Mobile` token that a phone's carries.
- A HarmonyOS tablet's UA opens with `(Tablet; OpenHarmony ...)` instead of `(Phone; OpenHarmony ...)`.

What comes out names a mobile browser, not a mini-program container: this package knows which phone it is describing, not which app is embedding it. A host that wants `MicroMessenger/...` on the end appends it itself.

## API reference

### Data

| Export | Type | What it is |
| --- | --- | --- |
| `DEVICES` | `readonly DeviceProfile[]` | The whole table, iOS then Android then HarmonyOS |
| `IOS_DEVICES` | `readonly DeviceProfile[]` | The iOS rows |
| `ANDROID_DEVICES` | `readonly DeviceProfile[]` | The Android rows |
| `HARMONY_DEVICES` | `readonly DeviceProfile[]` | The HarmonyOS rows |
| `CLASSIC_DEVICES` | `readonly DeviceProfile[]` | Fewer than 20 hand-picked devices, same objects, for short pickers |
| `DEFAULT_DEVICE` | `DeviceProfile` | What renders when nothing asked for a device (iPhone X) |
| `PLATFORM_DEFAULTS` | `Record<DeviceOS, {...}>` | Per-platform status bar, navigation bar and shell defaults |
| `DEVICE_NAMES` | `{ [key: string]: string }` (as const) | Every `DEVICES[number].name`, keyed by `deviceNameKey(name)` — generated, see below |

### Functions

| Export | Signature | What it does |
| --- | --- | --- |
| `findDevice` | `(name: string \| null \| undefined) => DeviceProfile \| undefined` | Exact lookup by name |
| `deviceNameKey` | `(name: string) => string` | Derives a `DEVICE_NAMES` key from a device name: non-`[A-Za-z0-9]` runs become one `_`, trimmed from the ends, a leading digit gets a `_` prefix |
| `resolveDevice` | `(profile: DeviceProfile) => ResolvedDevice` | Fills omitted fields from the platform defaults |
| `assertDeviceProfile` | `(value: unknown, label?: string) => asserts value is DeviceProfile` | Throws `TypeError` naming the field if `value` is not a usable `DeviceProfile` |
| `statusBarHeightFor` | `(device: ResolvedDevice, orientation: Orientation) => number` | The status bar height stored for that orientation |
| `navigationBarHeightFor` | `(device: ResolvedDevice, orientation: Orientation) => number` | The navigation bar height stored for that orientation |
| `safeAreaInsetsFor` | `(device: ResolvedDevice, orientation: Orientation) => EdgeInsets` | The insets stored for that orientation |
| `orientedScreen` | `(device: DeviceProfile, orientation?: Orientation) => ScreenSize` | The screen, with width and height swapped in landscape |
| `resolveSafeAreaInsets` | `(device: DeviceProfile, orientation?: Orientation) => EdgeInsets` | Insets, resolving the profile first |
| `resolveSafeArea` | `(device: DeviceProfile, orientation?: Orientation) => SafeAreaRect` | The same as a rectangle in screen coordinates |
| `resolveWindowSize` | `(device: DeviceProfile, options?: WindowSizeOptions) => ScreenSize` | The size the page itself gets |
| `deviceUserAgent` | `(profile: Pick<DeviceProfile, 'os' \| 'system' \| 'name' \| 'userAgent' \| 'formFactor'>) => string` | The user agent a page emulating this device should report |
| `systemVersion` | `(profile: Pick<DeviceProfile, 'os' \| 'system'>) => string` | The version out of a system label |

`orientation` defaults to `'portrait'` everywhere it is optional.

### Types

| Type | What it describes |
| --- | --- |
| `DeviceProfile` | A row of the table; only `name`, `os`, `screen` and `pixelRatio` are required |
| `ResolvedDevice` | The same device with every field filled in — `formFactor` included, defaulting to `'phone'` |
| `DeviceOS` | `'ios' \| 'android' \| 'harmony'` |
| `DeviceFormFactor` | `'phone' \| 'tablet'` |
| `Orientation` | `'portrait' \| 'landscape'` |
| `ScreenSize` | `{ width, height }` |
| `EdgeInsets` | `{ top, right, bottom, left }`, distances from each edge, like `env(safe-area-inset-*)` |
| `SafeAreaRect` | `{ top, left, right, bottom, width, height }`, edges as screen coordinates, like `wx.getWindowInfo().safeArea` |
| `CutoutShape` | `'notch' \| 'pill' \| 'circle'` |
| `CutoutSpec` | A cutout's shape and geometry: `shape`, `width`, `height`, `top`, optional `centerX` |
| `DeviceShell` | The body: `screenRadius`, `bezel`, optional `bodyRadius` |
| `WindowSizeOptions` | `resolveWindowSize` options: `orientation`, `navigationBar`, `tabBarHeight` |
| `DeviceName` | The union of every `DEVICE_NAMES` value — every real `DeviceProfile.name` |

`src/device-names.generated.ts` — the file `DEVICE_NAMES` comes from — is built from `DEVICES` by `scripts/generate-device-names.mjs`, not hand-edited. Adding, renaming or removing a device regenerates it: `pnpm --filter @devicekit/devices generate:device-names`.

## License

MIT
