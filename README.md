# devicekit

- [`@devicekit/devices`](packages/devices) — a device table (phones and tablets, screens, pixel ratios, status bars, safe areas, user agents) and the arithmetic that turns one into a usable window size. No DOM.
- [`@devicekit/frame`](packages/frame) — a framework-agnostic `<dimina-device-frame>` custom element that draws the bezel, status bar and home indicator around any previewed page.

See each package's own README for API details.

## 安装

```sh
pnpm add @devicekit/devices
pnpm add @devicekit/frame
```

## 开发

```sh
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm check-types
```

`@devicekit/frame` 还带一个本地预览页：

```sh
pnpm --filter @devicekit/frame demo
```
