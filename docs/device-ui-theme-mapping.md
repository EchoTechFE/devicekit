# 设备内 UI 主题映射

demo 只保留设备表实际会用到的五个主题家族。它们是项目里的 CSS 颜色变量，不会加载厂商图标、字体、UI 包或整套设计系统。

| 设备系统 UI | `statusBarStyle` | 系统版本输入 | demo 主题标签 | 颜色来源标识 | 当前设备映射 |
| --- | --- | --- | --- | --- |
| iOS | `ios` | profile 的 `system`，例如 iOS 18.7 | iOS | UIKit semantic colors | 全部 iPhone、iPad 和 Duo |
| 原生 Android | `android-stock` | profile 的 `system`，例如 Android 14 | Android | Android system palette | Pixel 和没有厂商覆盖的 Android 设备 |
| One UI | `android-samsung` | profile 的 `system`，例如 Android 14 | One UI | Samsung One UI palette | Samsung、Galaxy |
| HyperOS | `android-hyperos` | profile 的 `system`，例如 Android 14 | HyperOS | Xiaomi HyperOS palette | Xiaomi 14 |
| HarmonyOS | `harmony` | profile 的 `system`，例如 HarmonyOS 5.0 | HarmonyOS | ArkUI system palette | HUAWEI HarmonyOS 设备 |

每个家族只有浅色和深色两组 token。主题解析同时接收设备的 UI 家族和 `system` 版本，面板会显示两者及颜色库；版本进入主题 ID，因此路由和设备切换不会丢失发布时的系统信息。没有可核实的厂商 UI 发布版本时，不虚构 One UI 或 HyperOS 版本，也不为同一家族的每个 Android 系统版本复制一套颜色。选择设备时，demo 只把当前家族的 token 写到 `device-frame`、顶部导航和 Tab bar；状态栏文字与 Home Indicator 同步使用黑色或白色。iOS 浅色使用浅灰底和蓝色强调色，深色使用黑色背景、深灰导航与亮蓝强调色。
