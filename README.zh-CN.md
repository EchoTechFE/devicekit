[English](./README.md) | 简体中文

# devicekit

一张机型表，加一个把手机画在它外面的自定义元素。

[![CI](https://github.com/EchoTechFE/devicekit/actions/workflows/ci.yml/badge.svg)](https://github.com/EchoTechFE/devicekit/actions/workflows/ci.yml)
[![npm @devicekit/devices](https://img.shields.io/npm/v/@devicekit/devices)](https://www.npmjs.com/package/@devicekit/devices)
[![npm @devicekit/frame](https://img.shields.io/npm/v/@devicekit/frame)](https://www.npmjs.com/package/@devicekit/frame)

## 在线预览

[echotechfe.github.io/devicekit](https://echotechfe.github.io/devicekit/) 就是 `packages/frame/demo`，main 分支下 `packages/` 一有改动就自动重新部署。选机型、转方向、开关几条栏，右边画出来的手机旁边就是实时算出的 metrics。

## 包

| 包 | 是什么 |
| --- | --- |
| [`@devicekit/devices`](packages/devices) | 一张手机和平板的机型表——屏幕尺寸、像素比、状态栏、安全区、挖孔几何、UA——外加把机型换算成页面真正能用的窗口尺寸的函数。不碰 DOM。 |
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
import { findDevice, resolveWindowSize } from '@devicekit/devices'

const device = findDevice('iPhone 16 Pro')
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

React 项目从 `@devicekit/frame/react` 引 `<DeviceFrame device="iPhone 16 Pro">`，渲染的是同一个元素。

## 机型覆盖

机型表共 171 台，覆盖 iOS、Android、HarmonyOS 三个平台，折叠机的内外屏都算在里面。`CLASSIC_DEVICES` 是手选出来的不到 20 台，给放不下整张表的地方用，比如工具栏里的机型下拉框。`DEFAULT_DEVICE` 是没有指定机型时画出来的那台。

每个数值都有来源，谁也核实不了的字段一律留在平台默认值上，不猜。哪些是哪些，[`packages/devices`](packages/devices) 里逐字段写清楚了。

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

仓库需要的一次性设置：

- Settings → Secrets and variables → Actions 里加 `NPM_TOKEN`：一个对 `@devicekit` 组织有发布权限的 npm granular access token（如果给这个仓库开了 npm 的 trusted publishing，可以省掉这个 token）。
- Settings → Pages，Source 选 "GitHub Actions"。

## 参与贡献

欢迎提 issue 和 pull request。[CONTRIBUTING.md](./CONTRIBUTING.md) 写了本地怎么跑起来、一个改动要过哪些检查，以及往机型表里加一台机器要做什么。参与本项目请遵守[行为准则](./CODE_OF_CONDUCT.md)。

## 安全

安全问题请不要发公开 issue。私下联系维护者的方式见 [SECURITY.md](./SECURITY.md)。

## 许可证

MIT
