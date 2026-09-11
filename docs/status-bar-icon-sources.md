# 状态栏图标来源

这个清单记录状态栏图标可以从哪里来。只有“可导入”的来源可以直接进入本仓库；其他链接只用来核对外观，不能复制图标文件。

## 可导入

### HarmonyOS：OpenHarmony SystemUI

- 仓库：[openharmony/applications_systemui](https://github.com/openharmony/applications_systemui)
- 许可证：Apache-2.0
- 信号图标：`features/signalcomponent/src/main/resources/phone/media/ic_statusbar_signal_{1,2,3,4,full,no}.svg`
- Wi-Fi 图标：`features/wificomponent/src/main/resources/phone/media/ic_statusbar_wifi_{1,2,3,full,no}.svg`

这些文件是 OpenHarmony SystemUI 实际使用的状态栏资源。导入时保留 Apache-2.0 许可证和来源说明，并记录使用的 commit SHA。

## 只作外观参考

### 原生 Android：AOSP framework

- 仓库：[aosp-mirror/platform_frameworks_base](https://github.com/aosp-mirror/platform_frameworks_base)
- 候选资源：`core/res/res/drawable-*/stat_sys_battery_*.png` 与 `stat_sys_signal_*.png`

GitHub API 没有为该镜像声明 SPDX 许可证。AOSP 源码通常带 Apache-2.0 文件头，但在确认具体文件和对应上游提交前，不复制进本仓库。

### iOS：Framework7 Icons

- 仓库：[framework7io/framework7-icons](https://github.com/framework7io/framework7-icons)
- 许可证：MIT

它可用于比较通用 iOS 风格，但不是 iOS System UI 的状态栏资源，不能当作 Apple 状态栏的还原基线。

## 禁止导入

### iOS：SF Symbols 导出物

- 工具：[yapstudios/sfsym](https://github.com/yapstudios/sfsym)（工具代码为 MIT）

导出的图形仍受 Apple SF Symbols 许可限制，不能放进面向多平台的通用 Web/npm 包。

### MIUI / HyperOS：MIUINativeNotifyIcon

- 仓库：[fankes/MIUINativeNotifyIcon](https://github.com/fankes/MIUINativeNotifyIcon)
- 许可证：AGPL-3.0

它是理解 MIUI 与 HyperOS 通知栏行为的好参考，但不能把其资源或代码带入 MIT 项目。

### One UI 与 HyperOS 系统图标

三星和小米没有提供可再分发的开源 System UI 图标库。它们必须以官方截图为基线，由项目自行绘制，再用视觉对比验证；不能从未标明来源的 GitHub 主题包拷贝。
