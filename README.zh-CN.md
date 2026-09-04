[English](./README.md) | 简体中文

# devicekit

一张机型表，加一个把手机画在它外面的自定义元素。

[![CI](https://github.com/EchoTechFE/devicekit/actions/workflows/ci.yml/badge.svg)](https://github.com/EchoTechFE/devicekit/actions/workflows/ci.yml)
[![npm @devicekit/devices](https://img.shields.io/npm/v/@devicekit/devices)](https://www.npmjs.com/package/@devicekit/devices)
[![npm @devicekit/frame](https://img.shields.io/npm/v/@devicekit/frame)](https://www.npmjs.com/package/@devicekit/frame)

## 特点

- **171 台机型，数字都是实测的，不是拍脑袋估的。** 63 台 iPhone/iPad、86 台 Android 手机和平板、22 台华为 HarmonyOS 机型，折叠机的内外屏都各算一条。`CLASSIC_DEVICES` 是手选出来的 19 台精简列表，给放不下整张表的地方用。
- **每台机型都带真实几何数据。** 状态栏高度、安全区、圆角、边框，以及刘海/灵动岛/挖孔这三种挖孔形状，竖屏横屏分开存，量到哪台记哪台；没量到的字段由 `resolveDevice()` 按平台默认值补齐，拿到手的数据永远是完整的。
- **`<device-frame>` 直接把手机画出来**：机身、状态栏（固定 `9:41`、真走的实时时钟、或者干脆隐藏；文字黑白色可切；背景色随便传）、底部 Home 指示条——本身零依赖的 Web Component。
- **三个插槽，真实布局。** `navigation-bar` 和 `tab-bar` 让宿主放进自己的标题栏和 tab 栏，frame 会把它们摆在状态栏下面，并算出默认插槽里的内容还剩多少空间。
- **`immersive` 和 `embedded` 两种模式**，分别对应“页面自己画标题栏、内容顶到系统栏下面”和“frame 要塞进一个已经有自己外壳的容器里”这两种场景。
- **算出来的数字也会传给内容。** `contentrectchange` 事件和 `--device-*` 这组 CSS 变量，把 frame 刚画完时用的安全区、状态栏高度和内容区位置暴露出来，宿主不用轮询就能拿到。
- **`@devicekit/frame/react`** 把这个元素包成 React 组件，支持 React 18 和 19——渲染出来还是同一个元素，只是换成 props 传参。
- **`DEVICE_NAMES`** 把每台机型的名字都变成一个带类型的常量，宿主不用手写（也就不会手滑写错）机型字符串。
- **零依赖。** `@devicekit/devices` 不依赖任何包；`@devicekit/frame` 只依赖它。用什么框架都行，不用框架也行。
- MIT 许可证。

## 目录

- [特点](#特点)
- [在线预览](#在线预览)
- [包](#包)
- [安装](#安装)
- [最短上手](#最短上手)
- [机型覆盖](#机型覆盖)
- [开发](#开发)
- [发布](#发布)
- [参与贡献](#参与贡献)
- [安全](#安全)
- [许可证](#许可证)

## 在线预览

[echotechfe.github.io/devicekit](https://echotechfe.github.io/devicekit/) 就是 `packages/frame/demo`，main 分支下 `packages/` 一有改动就自动重新部署。选机型、转方向、开关几条栏，右边画出来的手机旁边就是实时算出的 metrics。

## 包

| 包 | 是什么 |
| --- | --- |
| [`@devicekit/devices`](packages/devices) | 一张手机和平板的机型表——每台都有屏幕尺寸和像素比，状态栏高度、安全区、挖孔几何和 UA 则是量到哪台记哪台——外加把缺的字段补齐、把机型换算成页面真正能用的窗口尺寸的函数。不碰 DOM。 |
| [`@devicekit/frame`](packages/frame) | 一个框架无关的 `<device-frame>` 自定义元素，围着你要预览的内容画机身、状态栏和底部手势条。 |

各包的完整 API 见它们自己的 README。

## 安装

```sh
pnpm add @devicekit/devices
pnpm add @devicekit/frame
```

只要数据和换算，装 `@devicekit/devices` 就够。`@devicekit/frame` 依赖它，装外壳会把机型表一起带上。

## 最短上手

只要机型数据和尺寸换算：

```ts
import { DEVICE_NAMES, findDevice, resolveWindowSize } from '@devicekit/devices'

const device = findDevice(DEVICE_NAMES.iPhone_16_Pro)
const size = device && resolveWindowSize(device)
```

要画出这台手机：

```ts
import { defineDeviceFrame } from '@devicekit/frame'

defineDeviceFrame()
```

```html
<device-frame device="iPhone 16 Pro">
  <!-- 你的预览页面 -->
</device-frame>
```

React 项目从 `@devicekit/frame/react` 引 `<DeviceFrame device={DEVICE_NAMES.iPhone_16_Pro}>`，渲染的是同一个元素，机型用 props 传。原生 `<device-frame>` 标签的 JSX 类型也在这个子入口里——想在 TSX 里直接写标签，先 `import '@devicekit/frame/react'` 一次就有类型（React 18 和 19 都支持）。

## 机型覆盖

机型表共 171 台，覆盖 iOS、Android、HarmonyOS 三个平台，折叠机的内外屏都算在里面。`CLASSIC_DEVICES` 是手选出来的 19 台，给放不下整张表的地方用，比如工具栏里的机型下拉框。

| 平台 | 数量 |
| --- | --- |
| iOS | 63 |
| Android | 86 |
| HarmonyOS | 22 |
| **合计** | **171** |

表里没有专门的厂商字段，下面这张表是按机型名字归类出来的：名字带 `Galaxy`/`Samsung` 算三星，带 `Pixel`/`Nexus` 算 Google，`Surface Duo` 算微软，`Moto`/`Motorola` 算摩托罗拉；iOS 机型全部算苹果，HarmonyOS 机型全部算华为。

| 厂商 | 数量 |
| --- | --- |
| 苹果 | 63 |
| 三星 | 42 |
| Google | 34 |
| 华为 | 22 |
| 摩托罗拉 | 3 |
| 微软 | 2 |
| OnePlus | 2 |
| LG | 1 |
| Nothing | 1 |
| 小米 | 1 |

每台一定有的只有名字、系统、屏幕尺寸和像素比。状态栏高度、安全区、挖孔几何和写死的 UA 是量到哪台记哪台，没记的按平台默认值补——`resolveDevice()` 返回的就是补完、没有空洞的那份数据。哪些字段是实测、哪些明确没核实过，[`packages/devices`](packages/devices) 里逐字段写清楚了。

`DEFAULT_DEVICE`（iPhone X）是一个兜底的屏幕尺寸，不是一台兜底机型：`<device-frame>` 不写 `device` 时，只借它的宽高，其余都不借——像素比按 1 算，没有挖孔，也没有实测安全区。要一台真机型就把 `device` 写出来。

## 开发

```sh
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm check-types
```

本地跑 `@devicekit/frame` 的预览页：

```sh
pnpm --filter @devicekit/frame demo
```

构建预览页产物（Pages 部署走的也是这条命令，只是多带一个 `--base=/devicekit/`）：

```sh
pnpm --filter @devicekit/frame demo:build
```

## 发布

`pnpm publish -r --provenance` 只发布 registry 上还没有的版本号，没改版本号的包会被自动跳过。所以发布流程是：改动对应包 `package.json` 里的 `version`，合并到 main，然后发一个 GitHub Release（或者手动跑 Publish workflow）。`@devicekit/frame` 对 `@devicekit/devices` 的 `workspace:` 依赖，打包时由 pnpm 换成真实版本号，不用手工处理。

Release 勾了 pre-release 的，发到 `next` 这个 dist-tag 上，不会变成 `npm install` 默认装到的版本；普通 Release 发到 `latest`。手动跑 workflow 时两个都能选。

仓库需要的一次性设置：

- Settings → Secrets and variables → Actions 里加 `NPM_TOKEN`：一个对 `@devicekit` 组织有发布权限的 npm granular access token（如果给这个仓库开了 npm 的 trusted publishing，可以省掉这个 token）。
- Settings → Pages，Source 选 "GitHub Actions"。

## 参与贡献

欢迎提 issue 和 pull request。[CONTRIBUTING.md](./CONTRIBUTING.md) 写了本地怎么跑起来、一个改动要过哪些检查，以及往机型表里加一台机器要做什么。参与本项目请遵守[行为准则](./CODE_OF_CONDUCT.md)。

## 安全

安全问题请不要发公开 issue。私下联系维护者的方式见 [SECURITY.md](./SECURITY.md)。

## 许可证

MIT
