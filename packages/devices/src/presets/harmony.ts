/**
 * HarmonyOS phones, including the two screens of each folding model.
 *
 * One line per device. Omitted fields fall back to the platform defaults in
 * devices.ts — see the README for what each source could and could not tell us.
 */
import type { DeviceProfile } from '../devices.js'

/** HarmonyOS phones, including both screens of each folding model. Part of DEVICES; listed here so a host can offer one platform alone. */
export const HARMONY_DEVICES: readonly DeviceProfile[] = [
  { name: 'HUAWEI Mate 80', os: 'harmony', screen: { width: 366, height: 809 }, pixelRatio: 3.5, system: 'HarmonyOS 5.0', statusBarHeight: 39, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 39 } },
  { name: 'HUAWEI Mate 70', os: 'harmony', screen: { width: 374, height: 827 }, pixelRatio: 3.25, system: 'HarmonyOS 5.0', statusBarHeight: 34, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 34 } },
  { name: 'HUAWEI Mate 70 Pro', os: 'harmony', screen: { width: 376, height: 809 }, pixelRatio: 3.5, system: 'HarmonyOS 5.0', statusBarHeight: 39, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 39 } },
  { name: 'HUAWEI Mate 60', os: 'harmony', screen: { width: 374, height: 827 }, pixelRatio: 3.25, system: 'HarmonyOS 5.0', statusBarHeight: 33, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 33 } },
  { name: 'HUAWEI Mate 60 Pro', os: 'harmony', screen: { width: 388, height: 837 }, pixelRatio: 3.25, system: 'HarmonyOS 5.0', statusBarHeight: 38, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 38 } },
  { name: 'HUAWEI Pura 80 Pro', os: 'harmony', screen: { width: 365, height: 814 }, pixelRatio: 3.5, system: 'HarmonyOS 5.0', statusBarHeight: 38, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 38 } },
  { name: 'HUAWEI nova 14 Ultra', os: 'harmony', screen: { width: 363, height: 817 }, pixelRatio: 3.5, system: 'HarmonyOS 5.0', statusBarHeight: 48, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 48 } },
  { name: 'HUAWEI Pura X (inner)', os: 'harmony', screen: { width: 440, height: 707 }, pixelRatio: 3, system: 'HarmonyOS 5.0', statusBarHeight: 39, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 39 } },
  { name: 'HUAWEI Pura X (outer)', os: 'harmony', screen: { width: 327, height: 327 }, pixelRatio: 3, system: 'HarmonyOS 5.0', statusBarHeight: 0, navigationBarHeight: 0, navigationBarHeightLandscape: 0 },
  { name: 'HUAWEI Mate X6 (inner)', os: 'harmony', screen: { width: 717, height: 781 }, pixelRatio: 3.125, system: 'HarmonyOS 5.0', statusBarHeight: 39, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 39 } },
  { name: 'HUAWEI Mate X6 (outer)', os: 'harmony', screen: { width: 346, height: 781 }, pixelRatio: 3.125, system: 'HarmonyOS 5.0', statusBarHeight: 39, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 39 } },
  { name: 'HUAWEI Pura 70', os: 'harmony', screen: { width: 372, height: 818 }, pixelRatio: 3.375, system: 'HarmonyOS 5.0', statusBarHeight: 36, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 36 } },
  { name: 'HUAWEI Pura 70 Pro', os: 'harmony', screen: { width: 373, height: 843 }, pixelRatio: 3.375, system: 'HarmonyOS 5.0', statusBarHeight: 38, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 38 } },
  { name: 'HUAWEI Mate X5 (inner)', os: 'harmony', screen: { width: 712, height: 799 }, pixelRatio: 3.125, system: 'HarmonyOS 5.0', statusBarHeight: 36, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 36 } },
  { name: 'HUAWEI Mate X5 (outer)', os: 'harmony', screen: { width: 346, height: 801 }, pixelRatio: 3.125, system: 'HarmonyOS 5.0', statusBarHeight: 36, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 36 } },
  { name: 'HUAWEI Pocket 2', os: 'harmony', screen: { width: 364, height: 861 }, pixelRatio: 3.125, system: 'HarmonyOS 5.0', statusBarHeight: 34, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 34 } },
  { name: 'HUAWEI nova 13', os: 'harmony', screen: { width: 361, height: 804 }, pixelRatio: 3, system: 'HarmonyOS 5.0', statusBarHeight: 35, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 35 } },
  { name: 'HUAWEI nova 13 Pro', os: 'harmony', screen: { width: 363, height: 823 }, pixelRatio: 3.375, system: 'HarmonyOS 5.0', statusBarHeight: 44, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 44 } },
  { name: 'HUAWEI nova 12', os: 'harmony', screen: { width: 361, height: 804 }, pixelRatio: 3, system: 'HarmonyOS 5.0', statusBarHeight: 35, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 35 } },
  { name: 'HUAWEI nova 12 Pro', os: 'harmony', screen: { width: 363, height: 823 }, pixelRatio: 3.375, system: 'HarmonyOS 5.0', statusBarHeight: 44, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 44 } },
  { name: 'HUAWEI Pura X Max (outer)', os: 'harmony', screen: { width: 460, height: 672 }, pixelRatio: 2.75, system: 'HarmonyOS 5.0', statusBarHeight: 66, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 66 } },
  // Table stores portrait; the unfolded (wider-than-tall) screen is what orientation=landscape reads out.
  { name: 'HUAWEI Pura X Max (inner)', os: 'harmony', screen: { width: 665, height: 940 }, pixelRatio: 2.75, system: 'HarmonyOS 5.0', statusBarHeight: 72, navigationBarHeight: 28, navigationBarHeightLandscape: 28, safeAreaInsets: { top: 72 } },
]
