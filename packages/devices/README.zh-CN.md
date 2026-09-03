[English](./README.md) | 简体中文

# @devicekit/devices

一张机型表，和几个把机型换算成可用尺寸的函数。手机和平板，每台带屏幕尺寸、像素比、状态栏高度、安全区、挖孔几何和 UA。

**这个包里没有 DOM。** `tsconfig` 的 `lib` 只有 `ES2022`，所以谁往这儿写 `document` 就是编译错误，而不是评审时才被人看见。Node 脚本、构建期、测试、服务端都能直接用。要画出这台手机的，是 [@devicekit/frame](../frame)。

## 安装

```sh
pnpm add @devicekit/devices
```

## 机型表

```ts
import { DEVICES, DEFAULT_DEVICE, findDevice } from '@devicekit/devices'

const device = findDevice('iPhone 16 Pro') ?? DEFAULT_DEVICE
```

`DEVICES` 是整张表：iPhone、iPad、安卓和鸿蒙，折叠机的内外两块屏各算一台。它是 `IOS_DEVICES`、`ANDROID_DEVICES`、`HARMONY_DEVICES` 三份拼起来的，按平台分成三个文件，一台一行——只要某个平台的，直接引对应那份。`findDevice(name)` 按 `name` 精确查一台，表里没有就返回 `undefined`。`DEFAULT_DEVICE`（一台 iPhone X）是没有指定机型时该画的那台。

`CLASSIC_DEVICES` 是从同一批对象里手选出的精简子集——不超过 20 台，按 iOS → Android → HarmonyOS 分组——给放不下 171 行的机型下拉框用。需要完整机型表的宿主仍然读 `DEVICES`。

## 一条机型长什么样

表里的一行就是一个 `DeviceProfile`：

```ts
{
  name: 'iPhone 16 Pro',
  os: 'ios',
  screen: { width: 402, height: 874 },   // 物理屏，竖屏方向
  pixelRatio: 3,
  system: 'iOS 18.5',
  statusBarHeight: 54,                    // 画出来的那条状态栏
  safeAreaInsets: { top: 62, bottom: 34 },              // 竖屏，实测值
  safeAreaInsetsLandscape: { left: 62, right: 62, bottom: 21 },  // 横屏，也是实测值
  cutout: { shape: 'pill', width: 125, height: 37, top: 14 },
  shell: { screenRadius: 62 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) ...',
}
```

这个形状里有五个决定，也是它跟“随手写个宽高”的区别。

**屏幕尺寸不是可用尺寸。** 状态栏和应用自己的导航栏一扣，两者差出将近一百像素；只存一个数就等于让预览撒谎。这里只存屏幕，可用尺寸交给 `resolveWindowSize()` 算，因为它取决于页面要了什么样的导航栏。

**只有屏幕尺寸靠横竖互换，其余全部存两份。** 因为其余那些根本推不出来：底部安全区从 34 缩到 21，导航栏从 44 缩到 32，而 iOS 26 又给横屏顶部塞进去一个 20——没有哪条规则能从竖屏值算出这三件事。

**状态栏高度和顶部安全区是两个数。** 灵动岛机型上状态栏还是 54，顶部安全区却是 59 或 62：一个是时间和图标画进去的那条，另一个是灵动岛连同它周围一圈让出来的。一个字段伺候不了两个用途。

**`cutout` 自带形状和几何。** 挖孔机型不用等着枚举加一个分支。它只管长什么样，屏幕为它让出多少写在安全区里，两者不互相推导。

**`shell` 是机身**：屏幕圆角和边框厚度。2016 年的手机和 2025 年的手机没有相同的圆角。

必填的只有 `name`、`os`、`screen`、`pixelRatio`，其余全是可选的，省略掉的字段落到平台默认值上。

## 补齐省略的字段

```ts
import { resolveDevice, PLATFORM_DEFAULTS, statusBarHeightFor, navigationBarHeightFor, safeAreaInsetsFor } from '@devicekit/devices'

const resolved = resolveDevice(device)
```

`resolveDevice(profile)` 把省略的字段按平台默认补齐，返回一条字段齐全的 `ResolvedDevice`，省得每个调用方各写一遍兜底。省略安全区就是“顶上一条状态栏，别处什么都没有”——没有挖孔也没有手势条的手机报的正是这个。

`PLATFORM_DEFAULTS` 就是这些兜底值的来源，按 `DeviceOS` 分：`ios`、`android`、`harmony` 各有一套 `statusBarHeight`、`statusBarHeightLandscape`、`navigationBarHeight`、`navigationBarHeightLandscape` 和 `shell`。它被导出，是为了让宿主能像展示实测值一样展示默认值，不必自己再实现一遍。

`statusBarHeightFor(device, orientation)`、`navigationBarHeightFor(device, orientation)`、`safeAreaInsetsFor(device, orientation)` 接一条 `ResolvedDevice`，取该方向存着的那份值。它们不做任何推导，只是在两套存好的值之间做选择。

### 数据从哪来，哪些没核实

这张表是四套设备模拟表取并集来的，每套能给到的东西不一样：

- **屏幕尺寸和像素比**是厂商公布的逻辑分辨率，四套之间逐条交叉核对。冲突时取更新、更具体的那一份——有一套存的是浏览器视口而不是屏幕（它给 iPhone 14 Pro 的高度是 659，真机是 852），这类值一律不要。
- **安全区和挖孔几何**只有一套按方向实测过，覆盖表里 37 台。iOS 各代的状态栏高度另有实测记录。
- **鸿蒙**的尺寸、状态栏、导航栏和 iOS 的底部安全区来自小程序工具链的机型表，它也是目前唯一结构化覆盖鸿蒙机型的来源，折叠机内外两块屏都有。

自己没有实测值的机型，向**同屏机型**借：同平台、同尺寸、同像素比，且它们对这一项的说法完全一致才借。组里只要有一处不一致，整组的这一项都不填——iPhone X 和 iPhone 12 mini 共用 375×812@3，状态栏一个 44 一个 50，所以谁也别想从对方那里拿到状态栏高度。最终 93 台带安全区，94 台带状态栏高度，46 台带挖孔几何，74 台带显式 UA（其余按机型和系统版本生成）。

表里的数值还经过一轮逐台核对（2026-09）：

- **iOS**：iPhone XR 到 iPhone 17 全系和 iPad 各代在 Xcode 模拟器（iOS 18.3 / 26.5）上用探针 app 读 UIKit 的状态栏高度和横竖屏安全区，逐字段对照后修正。留下的差异点：iPhone 12/13 mini 状态栏是 50 不是 47；iPhone XR/11 是 48；iPhone Air 状态栏 54、顶部安全区 68；iPhone 17 系横屏没有顶部安全区，底部是 20；全面屏 iPad 横竖屏状态栏都是 24、底部安全区 25，Home 键 iPad 是 20。iPhone X/8/8 Plus 和 Home 键的老 iPad 没有可用的模拟器 runtime，只按公开规格核对。刘海宽度模拟器不渲染，按同屏同代机型取值。
- **Android**：型号串、出厂系统版本和 UA 的一致性逐台核对；Pixel 7 / 7 Pro 的状态栏和挖孔几何来自模拟器实测。其余挖孔机型没有实测几何，不补。
- **鸿蒙**：只核对了分辨率（Mate 60 高度 862 改 827）；状态栏高度没有官方表，未核实。

明确**未核实**、因而留在默认值上没有猜的：

- 鸿蒙的手势条高度——来源里没有这一项，所以这些机型报的底部安全区是 0，手势条也不画。
- 安卓和鸿蒙横屏的一切——包括状态栏转屏后是不是还在。这两个平台的横屏值目前等于竖屏值。
- 挖孔几何一律是**外观近似**。它不参与任何尺寸计算，画错了也只是画错了；屏幕真正让出多少写在安全区里，不从它推。没有实测几何的机型（含全部鸿蒙机型）就不画挖孔。

表本身是普通源码，一台一行。要加机型直接往对应平台文件里加一行，`presets.test.ts` 会把重名、屏幕越界、UA 串平台、以及“同一台机器躺着又写了一遍”挡下来。

## 算尺寸

```ts
import { resolveWindowSize, resolveSafeArea, resolveSafeAreaInsets, orientedScreen } from '@devicekit/devices'
```

`resolveWindowSize(device, options)` 返回页面自己真正能用的宽高：屏幕减状态栏、减导航栏、减 tab 栏。`options` 是一个 `WindowSizeOptions`——`orientation`、`navigationBar`（布尔值决定留不留机型自己的导航栏，数字则直接覆盖它的高度）和 `tabBarHeight`。

```ts
resolveWindowSize(iPhoneX)                                // { width: 375, height: 724 }
resolveWindowSize(iPhoneX, { navigationBar: false })      // 724 + 44 = 768，页面自绘导航栏
resolveWindowSize(iPhoneX, { tabBarHeight: 50 })          // 674
resolveWindowSize(iPhoneX, { orientation: 'landscape' })  // { width: 812, height: 343 }，横屏状态栏是 0
```

**这个函数是给预览宿主用的。** 直接把 812 交给被预览的页面，页面里的 `100vh` 就比真机多出 88px：预览里看着刚好，装到手机上就溢出。

`resolveSafeAreaInsets(device, orientation)` 返回四条边距。`resolveSafeArea(device, orientation)` 把同样的信息给成 `{ top, left, right, bottom, width, height }`，也就是一个 `SafeAreaRect`，跟 `wx.getWindowInfo().safeArea` 是同一个形状（边是从屏幕左上角量的坐标，不是边距）。两个都是直接读机型表里那一方向存的值，不做推导。

`orientedScreen(device, orientation)` 是唯一真会翻的东西：横屏时把屏幕宽高互换。

## 生成 UA

```ts
import { deviceUserAgent, systemVersion } from '@devicekit/devices'
```

`deviceUserAgent(profile)` 按 `os` 和 `system` 现拼 UA，不逐台存，免得一台机的名字写着 iOS 18、UA 里却是 iOS 15。要精确到某个 build 的宿主，自己在机型上写 `userAgent`，生成这一步就会跳过。`systemVersion(profile)` 就是它从 `"iOS 18.0"`、`"HarmonyOS 5.0"` 这类标签里取出的版本号，取不到时退回一个当前版本，而不是在 UA 串里留个洞。

拼出来的是一个移动浏览器的 UA，不是小程序容器的——这个包知道是哪台手机，不知道是谁在嵌它。想要末尾那截 `MicroMessenger/...` 的宿主自己接。

## API 一览

### 数据

| 导出 | 类型 | 是什么 |
| --- | --- | --- |
| `DEVICES` | `readonly DeviceProfile[]` | 整张表，iOS、Android、HarmonyOS 顺序 |
| `IOS_DEVICES` | `readonly DeviceProfile[]` | iOS 那部分 |
| `ANDROID_DEVICES` | `readonly DeviceProfile[]` | Android 那部分 |
| `HARMONY_DEVICES` | `readonly DeviceProfile[]` | HarmonyOS 那部分 |
| `CLASSIC_DEVICES` | `readonly DeviceProfile[]` | 手选的不到 20 台，同一批对象，给短列表用 |
| `DEFAULT_DEVICE` | `DeviceProfile` | 没指定机型时画的那台（iPhone X） |
| `PLATFORM_DEFAULTS` | `Record<DeviceOS, {...}>` | 各平台的状态栏、导航栏和机身默认值 |

### 函数

| 导出 | 签名 | 做什么 |
| --- | --- | --- |
| `findDevice` | `(name: string \| null \| undefined) => DeviceProfile \| undefined` | 按名字精确查 |
| `resolveDevice` | `(profile: DeviceProfile) => ResolvedDevice` | 用平台默认值补齐省略的字段 |
| `statusBarHeightFor` | `(device: ResolvedDevice, orientation: Orientation) => number` | 该方向存着的状态栏高度 |
| `navigationBarHeightFor` | `(device: ResolvedDevice, orientation: Orientation) => number` | 该方向存着的导航栏高度 |
| `safeAreaInsetsFor` | `(device: ResolvedDevice, orientation: Orientation) => EdgeInsets` | 该方向存着的安全区边距 |
| `orientedScreen` | `(device: DeviceProfile, orientation?: Orientation) => ScreenSize` | 屏幕尺寸，横屏时宽高互换 |
| `resolveSafeAreaInsets` | `(device: DeviceProfile, orientation?: Orientation) => EdgeInsets` | 先补齐再取安全区边距 |
| `resolveSafeArea` | `(device: DeviceProfile, orientation?: Orientation) => SafeAreaRect` | 同样的信息，给成屏幕坐标系里的矩形 |
| `resolveWindowSize` | `(device: DeviceProfile, options?: WindowSizeOptions) => ScreenSize` | 页面自己能用的尺寸 |
| `deviceUserAgent` | `(profile: Pick<DeviceProfile, 'os' \| 'system' \| 'name' \| 'userAgent'>) => string` | 模拟这台机器的页面该报的 UA |
| `systemVersion` | `(profile: Pick<DeviceProfile, 'os' \| 'system'>) => string` | 从系统标签里取出的版本号 |

凡是 `orientation` 可选的地方，默认都是 `'portrait'`。

### 类型

| 类型 | 描述什么 |
| --- | --- |
| `DeviceProfile` | 表里的一行；只有 `name`、`os`、`screen`、`pixelRatio` 必填 |
| `ResolvedDevice` | 同一台机器，字段全部补齐后的样子 |
| `DeviceOS` | `'ios' \| 'android' \| 'harmony'` |
| `Orientation` | `'portrait' \| 'landscape'` |
| `ScreenSize` | `{ width, height }` |
| `EdgeInsets` | `{ top, right, bottom, left }`，离各边多远，跟 `env(safe-area-inset-*)` 一回事 |
| `SafeAreaRect` | `{ top, left, right, bottom, width, height }`，边是屏幕坐标，跟 `wx.getWindowInfo().safeArea` 一回事 |
| `CutoutShape` | `'notch' \| 'pill' \| 'circle'` |
| `CutoutSpec` | 挖孔的形状和几何：`shape`、`width`、`height`、`top`，可选 `centerX` |
| `DeviceShell` | 机身：`screenRadius`、`bezel`，可选 `bodyRadius` |
| `WindowSizeOptions` | `resolveWindowSize` 的选项：`orientation`、`navigationBar`、`tabBarHeight` |

## 许可证

MIT
