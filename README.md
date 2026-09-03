# devicekit

一张机型表，加一个能画出假手机的自定义元素。

[![CI](https://github.com/EchoTechFE/devicekit/actions/workflows/ci.yml/badge.svg)](https://github.com/EchoTechFE/devicekit/actions/workflows/ci.yml)
[![npm @devicekit/devices](https://img.shields.io/npm/v/@devicekit/devices)](https://www.npmjs.com/package/@devicekit/devices)
[![npm @devicekit/frame](https://img.shields.io/npm/v/@devicekit/frame)](https://www.npmjs.com/package/@devicekit/frame)

## 在线预览

[echotechfe.github.io/devicekit](https://echotechfe.github.io/devicekit/) 就是 `packages/frame/demo`，main 分支下 `packages/` 一有改动就会自动重新部署。

## 包

| 包 | 是什么 |
| --- | --- |
| [`@devicekit/devices`](packages/devices) | 一张机型表（手机和平板，屏幕尺寸、像素比、状态栏、安全区、UA），和把机型换算成可用窗口尺寸的函数。不碰 DOM。 |
| [`@devicekit/frame`](packages/frame) | 一个框架无关的 `<dimina-device-frame>` 自定义元素，负责画机身、状态栏和底部手势条。 |

各包的完整 API 见它们自己的 README。

## 安装

```sh
pnpm add @devicekit/devices
pnpm add @devicekit/frame
```

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
<dimina-device-frame device="iPhone 16 Pro">
  <!-- 你的预览页面 -->
</dimina-device-frame>
```

React 项目用 `@devicekit/frame/react` 的 `<DeviceFrame device="iPhone 16 Pro">` 组件，效果一样。

## 机型覆盖

机型表共 171 台，覆盖 iOS、Android、HarmonyOS 三个平台，包含折叠机的内外屏。另有一份精选的 `CLASSIC_DEVICES`（不到 20 台），给下拉框这类只需要常见机型的场景用。

## 开发

```sh
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm check-types
```

本地预览 `@devicekit/frame` 的 demo 页：

```sh
pnpm --filter @devicekit/frame demo
```

构建预览页产物（Pages 部署走的也是这条命令，只是多带一个 `--base=/devicekit/`）：

```sh
pnpm --filter @devicekit/frame demo:build
```

## 发布

`pnpm publish -r` 只会发布 registry 上还没有的版本号，没改版本号的包会被自动跳过。所以发布流程是：改动对应包 `package.json` 里的 `version`，合并到 main，然后发一个 GitHub Release（或者手动跑 Publish 这个 workflow）。`@devicekit/frame` 对 `@devicekit/devices` 的 `workspace:` 依赖，会在打包时由 pnpm 自动换成真实版本号，不用手工处理。

仓库需要的一次性设置：

- Settings → Secrets and variables → Actions 里加 `NPM_TOKEN`：一个对 `@devicekit` 组织有发布权限的 npm granular access token（如果给这个仓库开了 npm 的 trusted publishing，可以省掉这个 token）。
- Settings → Pages，Source 选 "GitHub Actions"。

## 许可证

MIT
