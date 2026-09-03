[English](./README.md) | 简体中文

# @devicekit/frame

预览界面里那台假手机：一个 `<device-frame>` 自定义元素，负责画机身、状态栏（时间、信号图标、刘海 / 灵动岛 / 挖孔）和底部的手势条。机型数据和尺寸换算在 [@devicekit/devices](../devices)，这个包依赖它。

同一台手机的预览外壳，不同宿主各写一份很容易漂移：写死的宽高、缺状态栏、不认识灵动岛。这个包把它做成一个独立的自定义元素，逻辑和样式只有一份权威实现。

做成自定义元素而不是某个框架的组件，是因为预览这台手机的宿主不见得用同一个框架——Electron 里的 React 面板、纯 DOM 的 Web 页面、只有 CSS 的预览台，都能直接用同一个标签。

## 安装

```sh
pnpm add @devicekit/frame
```

机型表会跟着一起装上。只要数据不要外壳的，装 `@devicekit/devices` 就够。

## 快速上手

注册一次，之后当普通标签用：

```ts
import { defineDeviceFrame } from '@devicekit/frame'

defineDeviceFrame()
```

```html
<device-frame device="iPhone 16 Pro">
  <iframe src="/preview"></iframe>
</device-frame>
```

`defineDeviceFrame(tag?)` 可以重复调用——宿主把这个包打进去两份、或者热更新时，不能因为重复注册就崩。不传参数就注册成 `DEVICE_FRAME_TAG`（`'device-frame'`）。

JSX 里也是同一个标签，属性全是字符串，JSX 类型也认得它：

```tsx
<device-frame device={deviceName} orientation={orientation}>
  <MiniAppFrame ... />
</device-frame>
```

被预览的内容放在默认插槽里，它待在 light DOM，不进 shadow root——所以宿主自己的样式表、`document.querySelector`、往里挂节点的扩展点，全都跟以前一样能够到它。元素只画外壳，从不伸手进内容。

没有机型表的宿主（比如只有一块写死的屏）可以不给 `device`，直接给尺寸：

```html
<device-frame width="375" height="812" cutout="none"></device-frame>
```

## `@devicekit/frame/react`

想要属性对象、`deviceProfile` 这种没有属性形式的字段、或者一个能拿 ref 的组件，就从这个子入口拿 `<DeviceFrame>` 而不是直接写标签名。它是对元素的一层薄封装：模块加载时自动 `defineDeviceFrame()`，把布尔 prop 翻成“要么带属性要么整个不带”（`embedded={false}` 不会像原生自定义元素那样把 `embedded="false"` 糊到 DOM 上），把 `className` 映射成 `class` 属性，并在 `useLayoutEffect` 里把 `deviceProfile` 当 property（而不是属性字符串）赋给底层元素：

```tsx
import { DeviceFrame } from '@devicekit/frame/react'

<DeviceFrame device="iPhone 16 Pro" orientation={orientation} ref={frameRef}>
  <MiniAppFrame ... />
</DeviceFrame>
```

`DeviceFrameProps` 继承 `React.HTMLAttributes<HTMLElement>`，另加 `device`、`deviceProfile`、`orientation`、`embedded`、`immersive`、`statusBar`（`false` 藏起画出来的状态栏）、`statusBarTextStyle`、`statusBarBackground`、`navigationBarHeight`、`tabBarHeight` 和 `children`。ref 拿到的是一个 `DeviceFrameElement`，`metrics` 和 `contentRect` 都在上面。

这个子入口把 `react` 列为可选 peer dependency——只有真的 `import` 它才会拉进 React，普通标签用法（上面那段）完全不需要装 React。

## 布局前先知道尺寸：`frameOuterSize`

机身外框有多大（屏幕 + 机身 padding + 1px 描边）在元素挂载前就能算出来，宿主排自己的容器或者做自动缩放时不必等一次布局：

```ts
import { frameOuterSize } from '@devicekit/frame'
import { findDevice } from '@devicekit/devices'

const size = frameOuterSize(findDevice('iPhone 16 Pro')!, 'portrait')
// { width, height } —— 传 { embedded: true } 时就是裸屏幕尺寸，不含机身
```

## 自带的预览页

包里带一个预览页，把这篇文档说的东西全摆成了控件：

```sh
pnpm --filter @devicekit/frame demo
```

左边一列是机型（171 台全在里面）、方向、两条栏、`immersive`、`embedded`、状态栏和缩放，往下是实时打出来的 `metrics` 和 `contentRect`，以及 `contentrectchange` 到目前为止发了多少次；右边是画出来的手机，标题栏和 tab 栏用的就是下面那两段可复制的示例。

它直接引 `src/`，不引构建产物——改完源码存盘，页面就是新的。这份预览只在仓库里，不进 npm 包。

## 属性

| 属性 | 取值 | 说明 |
| --- | --- | --- |
| `device` | 机型名，如 `iPhone 16 Pro` | 表里没有的名字会被忽略，退回默认尺寸 |
| `os` | `ios`（默认）、`android`、`harmony` | 没有机型也没写高度时，状态栏和导航栏走这个平台的默认值 |
| `orientation` | `portrait`（默认）、`landscape` | 横屏时宽高互换，其余的数字换成机型表里横屏那一套 |
| `width`、`height` | 数字，CSS px，**竖屏方向** | 给了就盖过机型表里的值 |
| `pixel-ratio` | 数字 | 同上 |
| `cutout` | `none`、`notch`、`pill`、`circle` | 按形状取一套通用几何。要精确的挖孔用 `deviceProfile` 传 |
| `status-bar-height` | 数字 | 状态栏那条的高度，画出来的那个；横竖屏都覆盖 |
| `safe-area-top` / `-right` / `-bottom` / `-left` | 数字 | 安全区四边，各自独立，写哪边覆盖哪边；横竖屏都覆盖 |
| `navigation-bar-height` | 数字 | 盖过机型表里的导航栏高度；横竖屏都覆盖 |
| `tab-bar-height` | 数字 | 盖过 tab 栏的默认高度 50 |
| `user-agent` | 字符串 | 盖过按平台生成的 UA |
| `status-bar` | 缺省、任意文本、`live`、`hidden` | 缺省显示 `9:41`；`live` 走真实时钟，每分钟走一次；`hidden` 整条藏起来 |
| `status-bar-text-style` | `black`（默认）、`white` | black = 深色文字/图标，配浅色背景用（对应 iOS 的 `darkContent`、Android 的 light status bar）；white = 浅色文字，配深色背景用（对应 iOS 的 `lightContent`）。真机的 home 指示条也是系统按内容明暗自适应，这里跟随同一个开关 |
| `status-bar-background` | CSS 颜色 | 显式给状态栏这条 strip 上底色；缺省透明。配了 `navigation-bar` 插槽的页面不需要它——插槽自己的背景已经盖住状态栏了，这个属性是给没有导航栏、或者要模拟 App 级涂色（Android 15 之前的 `statusBarColor`）的场景用的 |
| `immersive` | 布尔属性 | 见“页面自己画标题栏” |
| `embedded` | 布尔属性 | 见 `embedded` |

默认时间固定在 `9:41` 而不是当前时间，是为了截图和视觉 diff 每次都一样。真的想让它走起来就写 `status-bar="live"`。

## Property

| Property | 类型 | 是什么 |
| --- | --- | --- |
| `deviceProfile` | `DeviceProfile \| null` | 机型表以外的机型，优先于 `device` 属性。可读可写，没有对应的属性写法；写 `null` 就是清掉 |
| `device` | `DeviceProfile \| null` | 只读：`device` 属性点名的那条机型，没有就是 `null` |
| `orientation` | `Orientation` | 只读：当前方向 |
| `embedded` | `boolean` | 只读：是不是在 embedded 模式 |
| `immersive` | `boolean` | 只读：页面是不是跑在几条栏后面 |
| `profile` | `DeviceProfile` | 只读：真正生效的那条机型，属性覆盖已经折进去了 |
| `metrics` | `DeviceMetrics` | 只读：元素最后是按哪几个数画的 |
| `contentRect` | `ContentRect` | 只读：内容区在视口坐标系里的位置 |

机型表以外的机型用 property 传进去，它优先于 `device`：

```ts
el.deviceProfile = { name: 'Pixel 9', os: 'android', screen: { width: 412, height: 915 }, pixelRatio: 3 }
```

`el.metrics` 是一个 `DeviceMetrics`：`screen`、`orientation`、`pixelRatio`、`userAgent`、`statusBarHeight`、`navigationBarHeight`、`tabBarHeight`、`safeArea`、`safeAreaInsets`、`window`、`content`、`cutout`、`shell`。`navigationBarHeight` 和 `tabBarHeight` 在对应插槽空着的时候是 0；`window` 是被预览页面真正拿到的尺寸，`content` 是这块窗口在屏幕上的位置。

## 插槽

| 插槽 | 放什么 |
| --- | --- |
| 默认 | 被预览的内容 |
| `navigation-bar` | 宿主自己画的标题栏，从屏幕顶端开始、盖住状态栏 |
| `tab-bar` | 宿主自己画的 tab 栏，贴在屏幕底部 |
| `overlay` | 盖在整块屏幕之上的层（调试标注、扩展挂载点）；默认不收点击 |

`navigation-bar` 和 `tab-bar` 这两条**收点击**——插进来的是带按钮的真栏。它们各自占一段高度，`metrics.window` 会把这段扣掉。

`navigation-bar` 这个槽位从屏幕 y=0 起、盖住状态栏——微信小程序里导航栏视图本来就是从 y=0 起、高度等于状态栏加导航栏，`navigationBarBackgroundColor` 因此铺满状态栏，这里照这个模型来。插进来的元素默认会得到 `padding-top: var(--device-status-bar-height)`，让内容本身让开状态栏，而它的背景自然盖到了状态栏底下——和微信的效果一致。竖直方向的几何（`box-sizing`、`height: 100%`、`padding-top`）由 frame 用 `!important` 钉死，宿主的 `padding: 0 12px` 之类简写不会把顶部留白清零；左右内边距、颜色和内容仍归宿主。自定义导航（`immersive`）或者干脆没插导航栏的页面，则要自己把内容画到顶。

**插槽空着的时候这层不存在**：高度是 0，页面也不会被凭空缩短。导航栏的高度取机型表里当前方向的值（iOS 竖屏 44、横屏 32），tab 栏没有机型数据可依——tab 栏是应用的东西不是手机的——默认按 50 算，自己的栏不是这个高度就写 `tab-bar-height`。

这个包**不提供现成的标题栏组件**：标题栏长什么样是宿主的事，一个组件挡不住各家的按钮、字号和配色。下面两段是可以直接复制走的起点。

### 小程序标题栏

```html
<device-frame device="iPhone 16 Pro">
  <div slot="navigation-bar" class="mp-title-bar">
    <button class="mp-title-bar__back" aria-label="返回">‹</button>
    <span class="mp-title-bar__title">购物车</span>
  </div>
  <iframe src="/preview"></iframe>
</device-frame>
```

```css
.mp-title-bar {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 12px;
  background: #ededed;
  color: #000;
  font: 500 17px/1 -apple-system, BlinkMacSystemFont, sans-serif;
}

.mp-title-bar__back {
  border: 0;
  background: none;
  font-size: 26px;
  line-height: 1;
  padding: 0 8px;
  cursor: pointer;
}

/* 标题在整条栏里居中，而不是在返回键右边居中——微信就是这么排的 */
.mp-title-bar__title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
```

### App 内嵌 H5 的返回栏

```html
<device-frame device="iPhone 16 Pro" status-bar-text-style="white">
  <div slot="navigation-bar" class="h5-bar">
    <button class="h5-bar__back" aria-label="返回">‹</button>
    <span class="h5-bar__title">活动详情</span>
    <button class="h5-bar__close" aria-label="关闭">✕</button>
  </div>
  <iframe src="/activity"></iframe>
</device-frame>
```

```css
.h5-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
  padding: 0 12px;
  background: #0f172a;
  color: #fff;
  font: 500 17px/1 -apple-system, BlinkMacSystemFont, sans-serif;
}

.h5-bar__title { flex: 1; text-align: center; }

.h5-bar__back,
.h5-bar__close {
  border: 0;
  background: none;
  color: inherit;
  font-size: 20px;
  padding: 0 4px;
  cursor: pointer;
}
```

深色的栏配 `status-bar-text-style="white"`，状态栏里的时间、图标和 home 指示条才跟着变白。

状态栏里时间和图标摆在哪，不是居中或按耳朵平分，而是按真机排：iPhone 刘海 / 灵动岛机型按屏宽、像素比和状态栏高度查一张模拟器实测表（时间左边缘、电池右边缘、行高中线、图标缩放），表外尺寸退回按耳朵推的公式；没有刘海的 iPhone 走老式排法（信号在左、时间居中、电池在右）；iPad 时间贴左 17pt（Home 键 iPad 7pt）、电池贴右；Android 和鸿蒙时间左起 31dp、图标右留 28dp、电池竖放。这套规则在 `computeStatusBarLayout` 里，`.status-bar` 上的 `data-layout` 和 `--sb-*` 变量就是它的输出。鸿蒙没有实测，沿用 Android 的排法。

## 页面自己画标题栏（`immersive`）

小程序的 `navigationStyle: "custom"`，以及自绘标题栏的内嵌 H5，是另一种排法：**栏还在屏幕上，但页面拿到的是整块屏，自己往下让开那几条栏。**

```html
<device-frame device="iPhone 16 Pro" immersive>
  <div class="page">...</div>
</device-frame>
```

```css
.page {
  height: var(--device-height);
  padding-top: calc(var(--device-status-bar-height) + var(--device-navigation-bar-height));
  padding-bottom: var(--device-tab-bar-height);
}
```

写上 `immersive` 之后 `metrics.window` 就是整块屏幕，`metrics.content` 从 `(0, 0)` 起算；各条栏照样画、照样报自己的高度，页面按这些高度自己留白。不写的时候是默认那种排法：页面从状态栏和导航栏下面开始，`metrics.content.y` 就是这两条之和。

## `embedded`

写上 `embedded` 就是“别装了”：不画状态栏、不画手势条、不锁死设备尺寸，安全区全部报 0，整块交给容器自己排。devtools 把模拟器嵌进面板里的时候走这条路——那时外面那圈机身是面板画的，元素再画一层就重了。

## 内容怎么知道自己有多少地方

元素把最后算出来的那些数写成宿主上的 CSS 变量，插槽里的内容直接拿来用，不需要宿主再通过别的通道把同样的数字告诉它一遍：

```css
.page {
  height: var(--device-window-height);
  padding-bottom: var(--device-safe-area-bottom);
}
```

| 变量 | 是什么 |
| --- | --- |
| `--device-width`、`--device-height` | 屏幕尺寸，当前方向 |
| `--device-window-width`、`--device-window-height` | 页面真正能用的尺寸：屏幕减状态栏、减导航栏、减 tab 栏（`immersive` 下就是整块屏） |
| `--device-pixel-ratio` | 无单位数字 |
| `--device-status-bar-height` | 状态栏那条的高度 |
| `--device-navigation-bar-height` | 插槽里那层导航栏的高度，没插内容时是 0 |
| `--device-tab-bar-height` | 插槽里那层 tab 栏的高度，没插内容时是 0 |
| `--device-safe-area-top` / `-right` / `-bottom` / `-left` | 安全区**边距**（离各边多远），跟 `env(safe-area-inset-*)` 报的是同一回事 |
| `--device-screen-radius`、`--device-bezel`、`--device-body-radius` | 机身几何 |

`embedded` 下屏幕尺寸那两个不再写出（元素自己宽高走 `100%`，尺寸归容器管），其余为 0。

外观也留了几个变量可以盖：`--device-frame-radius`（盖过机型自己的机身圆角）、`--device-frame-border`、`--device-frame-background`、`--device-frame-shadow`、`--device-cutout-color`（刘海/灵动岛/挖孔的颜色）。机身默认是近黑色（`#0b0b0c`）配一圈极淡的白色描边，`--device-bezel` 按平台取默认值（iOS 6、Android/HarmonyOS 4），单个机型可以在 `shell.bezel` 里覆盖。

**它只给数值，不改 `env(safe-area-inset-*)`。** 被预览的页面里那句 `env(safe-area-inset-top)` 拿到的仍然是 0，因为浏览器不让 JS 改这个值。要让页面里的 `env()` 真的返回 59，只有 Electron / Chromium 能做到，走 CDP 的 `Emulation.setSafeAreaInsetsOverride`——devtools 就是这么做的，把这里算出来的边距喂给它就行。纯 web 宿主没有对应能力，只能让被预览的页面改读上面那几个 CSS 变量。

## 用 webview 装内容

放得进 DOM 的东西（`<iframe>`、宿主自己的组件）扔默认插槽就行，元素已经把位置排好了。但 Electron 的 `WebContentsView` 根本不是 DOM 节点，插不进插槽，只能由宿主按坐标摆。

**这个包不管这块 webview，只报它该在哪。** 谁来创建这个 view、用哪个 partition、挂什么 preload、什么时候销毁，都是宿主的事；把这些塞进一个元素里，只会让每个宿主都得去绕开它。

```ts
import { CONTENT_RECT_CHANGE_EVENT } from '@devicekit/frame'

frame.addEventListener(CONTENT_RECT_CHANGE_EVENT, (event) => {
  const { x, y, width, height, scale } = event.detail
  // 在 renderer 里量，把数字发给 main 去摆 view
  ipcRenderer.send('preview:bounds', { x, y, width, height, scale })
})
```

`CONTENT_RECT_CHANGE_EVENT` 就是事件名 `'contentrectchange'`。它的 `event.detail` 和 `frame.contentRect` 是同一个东西：一个 `ContentRect`，内容区在**视口坐标系**里的位置，可以直接拿去 `setBounds()`。`scale` 是渲染出来的一个 px 顶几个屏幕逻辑 px——宿主把整台手机缩小塞进面板时它才不是 1，这时候 view 也得跟着缩（Electron 用 `setZoomFactor`），否则位置对了尺寸不对。

事件只在矩形真的动了才发：改方向、开关 `immersive`、插拔导航栏、宿主缩放，都会发；状态栏换个颜色、时钟走一分钟，不发。宿主大小变化靠 `ResizeObserver` 盯着，所以缩放面板也能收到。

`metrics.content` 是同一块区域在**屏幕坐标系**里的位置——一个 `ContentBox`，从屏幕左上角量起，不含机身那一圈。要往被预览页面里传“你在屏幕的哪个位置”用它，摆真实 view 用 `contentRect`。

## 元素内部件也导出了

元素是拿哪些零件搭起来的，这些零件本身也导出了，给需要自己画其中一部分、或者要拿自己的算法跟 frame 对一遍的宿主用。

`computeStatusBarLayout(device, orientation)` 返回上面说的那个 `StatusBarLayout`：`mode`（一个 `StatusBarLayoutMode`：`'ios-cutout'`、`'ios-classic'`、`'ipad'`、`'android'`）、`height`、`centerY`、`scale`、`timeLeft`、`trailing`、`leadingIcons`。这套几何只有它一个权威 owner——DOM 那边只把这些数写出去，样式表那边只读，所以某个实测值错了只有一处要改。

`CUTOUT_PRESETS` 是按形状给的一套通用几何（`Record<CutoutShape, CutoutSpec>`），给“知道自己这台有刘海、但手上没有实测值”的宿主用；机型表里逐台的几何会盖过它。`cutoutBorderRadius(cutout)` 给出这个形状该有的 CSS `border-radius`——刘海是挂在屏幕上边缘的，只有下面两个角是圆的，灵动岛和挖孔悬空，一圈都圆。`cutoutLeft(cutout, screenWidth)` 是它的左偏移，会照顾 `centerX`。`statusBarEars(cutout, screenWidth)` 返回它两边留出的两条空白，`{ left, right }`，没有挖孔要躲时返回 `null`。

`profileFromAttributes(element, named, fallbackScreen)` 是把属性折回机型上的那一步——“有属性就盖过预设，没属性就落到预设上”这条规则在这里对每个字段说一遍，而不是散在渲染路径里每个字段各说一遍。

`DEVICE_FRAME_STYLES` 是 shadow DOM 那份样式表，以字符串形式给出。做成字符串而不是 `.css` 文件，是为了这个包用一句 `tsc` 就能构建，也不把打包器的要求传染给使用它的项目。

## API 一览

| 导出 | 类型 | 是什么 |
| --- | --- | --- |
| `defineDeviceFrame` | `(tag?: string) => void` | 注册元素，可重复调用 |
| `DEVICE_FRAME_TAG` | `string` | `'device-frame'` |
| `DeviceFrameElement` | `class extends HTMLElement` | 元素类，给 `instanceof` 和 ref 类型用 |
| `CONTENT_RECT_CHANGE_EVENT` | `string` | `'contentrectchange'` |
| `frameOuterSize` | `(profile: DeviceProfile, orientation: Orientation, options?: { embedded?: boolean }) => ScreenSize` | 机身外框尺寸，布局之前就能算 |
| `computeStatusBarLayout` | `(device: ResolvedDevice, orientation: Orientation) => StatusBarLayout` | 状态栏几何 |
| `CUTOUT_PRESETS` | `Record<CutoutShape, CutoutSpec>` | 按挖孔形状给的通用几何 |
| `cutoutBorderRadius` | `(cutout: CutoutSpec) => string` | 该形状对应的 `border-radius` |
| `cutoutLeft` | `(cutout: CutoutSpec, screenWidth: number) => number` | 挖孔的左偏移 |
| `statusBarEars` | `(cutout: CutoutSpec \| null, screenWidth: number) => { left: number, right: number } \| null` | 挖孔两侧留出的空白 |
| `profileFromAttributes` | `(element: Element, named: DeviceProfile \| null, fallbackScreen: { width: number, height: number }) => DeviceProfile` | 把属性折回机型上 |
| `DEVICE_FRAME_STYLES` | `string` | shadow DOM 的样式表 |
| `DeviceFrame` | React 组件（`@devicekit/frame/react`） | React 封装 |

类型：`DeviceMetrics`、`StatusBarTextStyle`（`'black' | 'white'`）、`ContentBox`、`ContentRect`、`StatusBarLayout`、`StatusBarLayoutMode`，以及 React 入口的 `DeviceFrameProps`。

这个元素的 API 是拿哪些类型写的——`CutoutShape`、`CutoutSpec`、`DeviceOS`、`DeviceProfile`、`DeviceShell`、`EdgeInsets`、`Orientation`、`ResolvedDevice`、`SafeAreaRect`、`ScreenSize`——都在这里以类型形式重新导出，省得你为它们再加一条 import。值不重新导出：`DEVICES`、`findDevice`、`resolveDevice`、`resolveWindowSize` 一律从 `@devicekit/devices` 引，因为同一张机型表有两条 import 路径，就等于有两处要保持同步。

## 许可证

MIT
