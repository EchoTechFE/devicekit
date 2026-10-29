/**
 * Android phones and tablets.
 *
 * One line per device. Omitted fields fall back to the platform defaults in
 * devices.ts — see the README for what each source could and could not tell us.
 */
import type { PresetDeviceProfile } from '../devices.js'

/** Android phones and tablets. Part of DEVICES; listed here so a host can offer one platform alone. */
export const ANDROID_DEVICES: readonly PresetDeviceProfile[] = [
  {
    name: 'Pixel 7',
    os: 'android',
    screen: { width: 412, height: 915 },
    pixelRatio: 2.625,
    system: 'Android 13',
    // windowinsets.info/pixel-7 (emulator, gesture nav): RoundedCorner topLeft 17.9dp (asymmetric BR 18.29); safe top≈52 bottom≈24.
    statusBarHeight: 52,
    safeAreaInsets: { top: 52, bottom: 24 },
    safeAreaInsetsLandscape: { right: 52 },
    shell: { screenRadius: 17.9 },
    cutout: { shape: 'circle', width: 26, height: 26, top: 13 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2022,
  },
  {
    name: 'Pixel 8',
    os: 'android',
    screen: { width: 412, height: 915 },
    pixelRatio: 2.625,
    system: 'Android 14',
    // windowinsets.info/pixel-8 (emulator, gesture nav): RoundedCorner topLeft 39.62dp (asymmetric BR 38.86); safe top≈50 bottom≈24.
    statusBarHeight: 50,
    safeAreaInsets: { top: 50, bottom: 24 },
    safeAreaInsetsLandscape: { right: 50 },
    shell: { screenRadius: 39.62 },
    cutout: { shape: 'circle', width: 28, height: 28, top: 11 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2023,
  },
  {
    name: 'Pixel 8 Pro',
    os: 'android',
    screen: { width: 448, height: 997 },
    pixelRatio: 3,
    system: 'Android 14',
    // windowinsets.info/pixel-8-pro (emulator, gesture nav): RoundedCorner 30.33dp; safe top≈50 bottom≈24.
    statusBarHeight: 50,
    safeAreaInsets: { top: 50, bottom: 24 },
    safeAreaInsetsLandscape: { right: 50 },
    shell: { screenRadius: 30.33 },
    cutout: { shape: 'circle', width: 28, height: 28, top: 11 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2023,
  },
  {
    name: 'Pixel 8a',
    os: 'android',
    screen: { width: 412, height: 915 },
    pixelRatio: 2.625,
    system: 'Android 14',
    // windowinsets.info/pixel-8a (emulator, gesture nav): RoundedCorner 48.76dp; safe top≈46 bottom≈24.
    statusBarHeight: 46,
    safeAreaInsets: { top: 46, bottom: 24 },
    safeAreaInsetsLandscape: { right: 46 },
    shell: { screenRadius: 48.76 },
    cutout: { shape: 'circle', width: 26, height: 26, top: 13 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    name: 'Pixel 9',
    os: 'android',
    screen: { width: 412, height: 924 },
    pixelRatio: 2.625,
    system: 'Android 14',
    // windowinsets.info/pixel-9 (emulator, gesture nav): RoundedCorner 50.29dp; safe top≈54 bottom≈24.
    statusBarHeight: 54,
    safeAreaInsets: { top: 54, bottom: 24 },
    safeAreaInsetsLandscape: { right: 54 },
    shell: { screenRadius: 50.29 },
    cutout: { shape: 'circle', width: 28, height: 28, top: 15 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    name: 'Pixel 9 Pro',
    os: 'android',
    screen: { width: 427, height: 952 },
    pixelRatio: 3,
    system: 'Android 14',
    // windowinsets.info/pixel-9-pro (emulator, gesture nav): RoundedCorner 52.33dp; safe top≈52 bottom≈24;
    // displayCutoutBounds 36.33×52@0 → circle Ø36 top8 (same derive as Pixel 10 Pro XL / 9a exclusion-width).
    statusBarHeight: 52,
    safeAreaInsets: { top: 52, bottom: 24 },
    safeAreaInsetsLandscape: { right: 52 },
    shell: { screenRadius: 52.33 },
    cutout: { shape: 'circle', width: 36, height: 36, top: 8 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    name: 'Pixel 9 Pro XL',
    os: 'android',
    screen: { width: 448, height: 997 },
    pixelRatio: 3,
    system: 'Android 14',
    // windowinsets.info/pixel-9-pro-xl (emulator, gesture nav): RoundedCorner 51dp; safe top≈53 bottom≈24;
    // displayCutoutBounds 38.33×53@0 (byte-identical to pixel-10-pro-xl) → circle Ø38 top8.
    statusBarHeight: 53,
    safeAreaInsets: { top: 53, bottom: 24 },
    safeAreaInsetsLandscape: { right: 53 },
    shell: { screenRadius: 51 },
    cutout: { shape: 'circle', width: 38, height: 38, top: 8 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 9 Pro XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    name: 'Pixel 10',
    os: 'android',
    screen: { width: 412, height: 924 },
    pixelRatio: 2.625,
    system: 'Android 16',
    // windowinsets.info/pixel-10 (emulator, gesture nav): RoundedCorner 50.29dp; safe top≈54 bottom≈24.
    statusBarHeight: 54,
    safeAreaInsets: { top: 54, bottom: 24 },
    safeAreaInsetsLandscape: { right: 54 },
    shell: { screenRadius: 50.29 },
    cutout: { shape: 'circle', width: 28, height: 28, top: 15 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2025,
  },
  {
    name: 'Samsung Galaxy S8+',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 740 },
    pixelRatio: 4,
    system: 'Android 7.0',
    userAgent:
      'Mozilla/5.0 (Linux; Android 7.0; SM-G955U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2017,
  },
  {
    name: 'Samsung Galaxy S20 Ultra',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 412, height: 915 },
    pixelRatio: 2.625,
    system: 'Android 13',
    // windowinsets.info/galaxy-s20-ultra (measured, gesture nav): RoundedCorner 24dp; safe top≈28 bottom≈15.
    // Published displayCutoutBounds=null (FHD window on QHD panel; left buggy). Raw InsetsProbe boundingRects
    // https://github.com/easyhooon/windowinsets.info/blob/main/measurements/galaxy-s/galaxy-s20-ultra/main-gesture.json
    // 22.1×28.19@0 → circle Ø22 top3; omit centerX (hardware centered; ignore left=263 / path x=720).
    statusBarHeight: 28,
    safeAreaInsets: { top: 28, bottom: 15 },
    safeAreaInsetsLandscape: { right: 28 },
    shell: { screenRadius: 24 },
    cutout: { shape: 'circle', width: 22, height: 22, top: 3 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
    releaseYear: 2020,
  },
  {
    name: 'Surface Duo',
    os: 'android',
    screen: { width: 540, height: 720 },
    pixelRatio: 2.5,
    system: 'Android 11.0',
    releaseYear: 2020,
  },
  // Table stores portrait; the unfolded (wider-than-tall) screen is what orientation=landscape reads out.
  {
    name: 'Surface Duo (inner)',
    os: 'android',
    screen: { width: 720, height: 1114 },
    pixelRatio: 2.5,
    system: 'Android 11.0',
    releaseYear: 2020,
  },
  {
    name: 'Samsung Galaxy A55',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 384, height: 832 },
    pixelRatio: 2.8125,
    system: 'Android 14',
    // windowinsets.info/galaxy-a55-5g (measured, gesture nav): RoundedCorner 41.96dp; safe top≈32 bottom≈15; cutout circle 23@8.
    statusBarHeight: 32,
    safeAreaInsets: { top: 32, bottom: 15 },
    safeAreaInsetsLandscape: { right: 32 },
    cutout: { shape: 'circle', width: 23, height: 23, top: 8 },
    shell: { screenRadius: 41.96 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-A556B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    name: 'Pixel 9 Pro Fold',
    os: 'android',
    screen: { width: 412, height: 922 },
    pixelRatio: 2.625,
    system: 'Android 14',
    // windowinsets.info/pixel-9-pro-fold (emulator, gesture nav): RoundedCorner 47.18dp; safe top≈62 bottom≈24; cutout circle 46@8.
    statusBarHeight: 62,
    safeAreaInsets: { top: 62, bottom: 24 },
    safeAreaInsetsLandscape: { right: 62 },
    cutout: { shape: 'circle', width: 46, height: 46, top: 8 },
    shell: { screenRadius: 47.18 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro Fold) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    name: 'Pixel 9 Pro Fold (inner)',
    os: 'android',
    screen: { width: 836, height: 842 },
    pixelRatio: 2.625,
    system: 'Android 14',
    // windowinsets.info/pixel-9-pro-fold main/inner (emulator, gesture nav): RoundedCorner 34.87dp; safe top≈56 bottom≈32;
    // displayCutoutBounds 55.8×55.8@0 left≈796 on ~852dp → circle Ø56 top0 centerX≈0.967 (right-edge hole; not centered).
    statusBarHeight: 56,
    safeAreaInsets: { top: 56, bottom: 32 },
    safeAreaInsetsLandscape: { right: 56 },
    cutout: { shape: 'circle', width: 56, height: 56, top: 0, centerX: 0.967 },
    shell: { screenRadius: 34.87 },
    releaseYear: 2024,
  },
  {
    name: 'Galaxy Z Fold 6',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 412, height: 968 },
    pixelRatio: 2.625,
    system: 'Android 14',
    // windowinsets.info/galaxy-z-fold6 (measured, gesture nav): RoundedCorner 6.1dp; safe top≈36 bottom≈15; cutout circle 24@6.
    // Window left legacy — kit 412×968 matches neither WI cover (~369×905) nor main (~707×823).
    statusBarHeight: 36,
    safeAreaInsets: { top: 36, bottom: 15 },
    safeAreaInsetsLandscape: { right: 36 },
    cutout: { shape: 'circle', width: 24, height: 24, top: 6 },
    shell: { screenRadius: 6.1 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  // 707 x 823 @ 2.625 reproduces the panel's 1856 x 2160 physical pixels (Samsung's spec sheet) within 1 px, the same density the Fold 5 inner row uses.
  {
    name: 'Galaxy Z Fold 6 (inner)',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 707, height: 823 },
    pixelRatio: 2.625,
    system: 'Android 14',
    // windowinsets.info/galaxy-z-fold6 (measured, gesture nav): RoundedCorner 4.95dp; safe top≈36 bottom≈15.
    statusBarHeight: 36,
    safeAreaInsets: { top: 36, bottom: 15 },
    safeAreaInsetsLandscape: { right: 36 },
    shell: { screenRadius: 4.95 },
    releaseYear: 2024,
  },
  {
    name: 'Galaxy Z Fold 5',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 344, height: 882 },
    pixelRatio: 2.625,
    system: 'Android 13',
    // windowinsets.info/galaxy-z-fold5 (measured, gesture nav): RoundedCorner 25.9dp; safe top≈32 bottom≈15; cutout circle 22@5.
    statusBarHeight: 32,
    safeAreaInsets: { top: 32, bottom: 15 },
    safeAreaInsetsLandscape: { right: 32 },
    cutout: { shape: 'circle', width: 22, height: 22, top: 5 },
    shell: { screenRadius: 25.9 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-F946B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.131 Mobile Safari/537.36',
    releaseYear: 2023,
  },
  {
    name: 'Galaxy Z Fold 5 (inner)',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 690, height: 829 },
    pixelRatio: 2.625,
    system: 'Android 13',
    // windowinsets.info/galaxy-z-fold5 (measured, gesture nav): RoundedCorner 25.9dp; safe top≈30 bottom≈15.
    statusBarHeight: 30,
    safeAreaInsets: { top: 30, bottom: 15 },
    safeAreaInsetsLandscape: { right: 30 },
    shell: { screenRadius: 25.9 },
    releaseYear: 2023,
  },
  {
    name: 'Samsung Galaxy A51/71',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 412, height: 914 },
    pixelRatio: 2.625,
    system: 'Android 10',
    // Infinity-O punch-hole on hardware. windowinsets.info/galaxy-a71 pending; a51 absent — cutout omitted.
    userAgent:
      'Mozilla/5.0 (Linux; Android 10; SM-A515F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Mobile Safari/537.36',
    releaseYear: 2019,
  },
  {
    name: 'Galaxy Tab S4',
    os: 'android',
    statusBarStyle: 'android-samsung',
    formFactor: 'tablet',
    screen: { width: 712, height: 1138 },
    pixelRatio: 2.25,
    system: 'Android 8.1',
    userAgent:
      'Mozilla/5.0 (Linux; Android 8.1.0; SM-T837A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Safari/537.36',
    releaseYear: 2018,
  },
  {
    name: 'Moto G4',
    os: 'android',
    screen: { width: 360, height: 640 },
    pixelRatio: 3,
    system: 'Android 6.0',
    // legacy flat panel radius 2; no WI capture — same honesty as Nexus 5/5X/6
    shell: { screenRadius: 2 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 7.0; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2016,
  },
  {
    name: 'Moto G Power',
    os: 'android',
    screen: { width: 412, height: 823 },
    pixelRatio: 1.75,
    system: 'Android 11',
    // 2021 punch-hole hardware; no windowinsets.info page — cutout omitted.
    releaseYear: 2021,
  },
  {
    name: 'Nexus 5',
    os: 'android',
    screen: { width: 360, height: 640 },
    pixelRatio: 3,
    system: 'Android 6.0',
    shell: { screenRadius: 2 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Mobile Safari/537.36',
    releaseYear: 2013,
  },
  {
    name: 'Nexus 5X',
    os: 'android',
    screen: { width: 411, height: 731 },
    pixelRatio: 2.625,
    system: 'Android 8.0',
    shell: { screenRadius: 2 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 8.0.0; Nexus 5X Build/OPR4.170623.006) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Mobile Safari/537.36',
    releaseYear: 2015,
  },
  {
    name: 'Nexus 6',
    os: 'android',
    screen: { width: 412, height: 732 },
    pixelRatio: 3.5,
    system: 'Android 7.1',
    shell: { screenRadius: 2 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 7.1.1; Nexus 6 Build/N6F26U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Mobile Safari/537.36',
    releaseYear: 2014,
  },
  {
    name: 'Galaxy Note 3',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 640 },
    pixelRatio: 3,
    system: 'Android 4.3',
    // legacy flat panel radius 2; no WI capture — same honesty as Nexus 5/5X/6
    shell: { screenRadius: 2 },
    userAgent:
      'Mozilla/5.0 (Linux; U; Android 4.3; en-us; SM-N900T Build/JSS15J) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
    releaseYear: 2013,
  },
  {
    name: 'Galaxy Note II',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 640 },
    pixelRatio: 2,
    system: 'Android 4.1',
    // legacy flat panel radius 2; no WI capture — same honesty as Nexus 5/5X/6
    shell: { screenRadius: 2 },
    userAgent:
      'Mozilla/5.0 (Linux; U; Android 4.1; en-us; GT-N7100 Build/JRO03C) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
    releaseYear: 2012,
  },
  {
    name: 'Galaxy S III',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 640 },
    pixelRatio: 2,
    system: 'Android 4.0',
    // legacy flat panel radius 2; no WI capture — same honesty as Nexus 5/5X/6
    shell: { screenRadius: 2 },
    userAgent:
      'Mozilla/5.0 (Linux; U; Android 4.0; en-us; GT-I9300 Build/IMM76D) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
    releaseYear: 2012,
  },
  {
    name: 'Galaxy S5',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 640 },
    pixelRatio: 3,
    system: 'Android 5.0',
    // legacy flat panel radius 2; no WI capture — same honesty as Nexus 5/5X/6
    shell: { screenRadius: 2 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2014,
  },
  {
    name: 'Galaxy S9+',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 320, height: 658 },
    pixelRatio: 4.5,
    system: 'Android 8.0',
    userAgent:
      'Mozilla/5.0 (Linux; Android 8.0.0; SM-G965U Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2018,
  },
  {
    name: 'Galaxy S24',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 780 },
    pixelRatio: 3,
    system: 'Android 14',
    // windowinsets.info/galaxy-s24 (measured, gesture nav): RoundedCorner 36dp; safe top≈34 bottom≈15.
    statusBarHeight: 34,
    safeAreaInsets: { top: 34, bottom: 15 },
    safeAreaInsetsLandscape: { right: 34 },
    shell: { screenRadius: 36 },
    cutout: { shape: 'circle', width: 20, height: 20, top: 7 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-S921U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    name: 'Galaxy Tab S9',
    os: 'android',
    statusBarStyle: 'android-samsung',
    formFactor: 'tablet',
    screen: { width: 640, height: 1024 },
    pixelRatio: 2.5,
    system: 'Android 14',
    // windowinsets.info/galaxy-tab-s9 (measured, gesture nav): RoundedCorner 9.88dp; safe top≈30 bottom≈15.
    // Window left legacy — kit 640×1024@2.5 ≠ WI main ~753×1205@2.125.
    statusBarHeight: 30,
    safeAreaInsets: { top: 30, bottom: 15 },
    safeAreaInsetsLandscape: { right: 30 },
    shell: { screenRadius: 9.88 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Safari/537.36',
    releaseYear: 2023,
  },
  {
    name: 'Galaxy Z Fold 6 Cover',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 484, height: 1188 },
    pixelRatio: 2,
    system: 'Android 14',
    // windowinsets.info/galaxy-z-fold6 cover (measured, gesture nav): RoundedCorner 6.1dp; safe top≈36 bottom≈15; cutout circle 24@6.
    // Window left legacy — kit 484×1188@2 ≠ WI cover ~369×905@2.625.
    statusBarHeight: 36,
    safeAreaInsets: { top: 36, bottom: 15 },
    safeAreaInsetsLandscape: { right: 36 },
    cutout: { shape: 'circle', width: 24, height: 24, top: 6 },
    shell: { screenRadius: 6.1 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    name: 'Galaxy Z Fold 7',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 984, height: 1092 },
    pixelRatio: 2,
    system: 'Android 16',
    // windowinsets.info/galaxy-z-fold7 main/inner (measured, gesture nav): RoundedCorner 4.95dp; safe top≈34 bottom≈15. Cover metrics live on Galaxy Z Fold 7 Cover.
    // Window left legacy — kit 984×1092@2 ≠ WI main ~750×832@2.625.
    statusBarHeight: 34,
    safeAreaInsets: { top: 34, bottom: 15 },
    safeAreaInsetsLandscape: { right: 34 },
    shell: { screenRadius: 4.95 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; SM-F966U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2025,
  },
  {
    name: 'Galaxy Z Fold 7 Cover',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 840 },
    pixelRatio: 3,
    system: 'Android 16',
    // windowinsets.info/galaxy-z-fold7 cover (measured, gesture nav): RoundedCorner 4.95dp; safe top≈42 bottom≈15; cutout circle 23@8.
    // Window left legacy — kit 360×840@3 ≠ WI cover ~411×960@2.625.
    statusBarHeight: 42,
    safeAreaInsets: { top: 42, bottom: 15 },
    safeAreaInsetsLandscape: { right: 42 },
    cutout: { shape: 'circle', width: 23, height: 23, top: 8 },
    shell: { screenRadius: 4.95 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; SM-F966U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2025,
  },
  {
    name: 'Galaxy Z Flip 6',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 880 },
    pixelRatio: 3,
    system: 'Android 14',
    // windowinsets.info/galaxy-z-flip6 (measured, gesture nav): RoundedCorner 38dp; safe top≈31 bottom≈15; cutout circle 24@4.
    statusBarHeight: 31,
    safeAreaInsets: { top: 31, bottom: 15 },
    safeAreaInsetsLandscape: { right: 31 },
    cutout: { shape: 'circle', width: 24, height: 24, top: 4 },
    shell: { screenRadius: 38 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-F741U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    name: 'Galaxy Z Flip 6 Cover',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 374 },
    pixelRatio: 2,
    system: 'Android 14',
    // STILL-GAP: Samsung cover has a lower cutout (same class as Flip5/7 Cover). WI Flip6 = main only — no cover
    // capture. Do not copy Flip7 Cover pill 198×84 (different geometry). Wait for WI/RTL cover dump.
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-F741U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    name: 'Galaxy Z Flip 7',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 840 },
    pixelRatio: 3,
    system: 'Android 16',
    // windowinsets.info/galaxy-z-flip7 (measured, gesture nav): RoundedCorner 22dp; safe top≈36 bottom≈15; cutout circle 24@6.
    statusBarHeight: 36,
    safeAreaInsets: { top: 36, bottom: 15 },
    safeAreaInsetsLandscape: { right: 36 },
    cutout: { shape: 'circle', width: 24, height: 24, top: 6 },
    shell: { screenRadius: 22 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; SM-F761U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2025,
  },
  {
    name: 'Galaxy Z Flip 7 Cover',
    os: 'android',
    statusBarStyle: 'android-samsung',
    // windowinsets.info/galaxy-z-flip7 cover (measured, gesture nav): logical 361.14×399.24@2.625
    // (same 948×1048 panel as prior kit 474×524@2; rewritten to WI dp). Asymmetric corners TL/TR 6.1 BR/BL 41.14;
    // safe top≈0 bottom≈84; displayCutoutBounds ~198×84 at top≈315 (bottom camera bar) → pill cutout.
    screen: { width: 361, height: 399 },
    pixelRatio: 2.625,
    system: 'Android 16',
    statusBarHeight: 0,
    safeAreaInsets: { top: 0, bottom: 84 },
    safeAreaInsetsLandscape: { right: 0 },
    cutout: { shape: 'pill', width: 198, height: 84, top: 315, centerX: 0.726 },
    shell: { screenRadius: 6.1, screenCorners: { topLeft: 6.1, topRight: 6.1, bottomRight: 41.14, bottomLeft: 41.14 } },
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; SM-F761U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2025,
  },
  {
    name: 'LG Optimus L70',
    os: 'android',
    screen: { width: 384, height: 640 },
    pixelRatio: 1.25,
    system: 'Android 4.4',
    // legacy flat panel radius 2; no WI capture — same honesty as Nexus 5/5X/6
    shell: { screenRadius: 2 },
    userAgent:
      'Mozilla/5.0 (Linux; U; Android 4.4.2; en-us; LGMS323 Build/KOT49I.MS32310c) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2014,
  },
  {
    name: 'Nexus 10',
    os: 'android',
    formFactor: 'tablet',
    screen: { width: 800, height: 1280 },
    pixelRatio: 2,
    system: 'Android 5.1',
    // legacy flat panel radius 2; no WI capture — same honesty as Nexus 5/5X/6
    shell: { screenRadius: 2 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 5.1; Nexus 10 Build/MOB31T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Safari/537.36',
    releaseYear: 2012,
  },
  {
    name: 'Nexus 4',
    os: 'android',
    screen: { width: 384, height: 640 },
    pixelRatio: 2,
    system: 'Android 4.4',
    // legacy flat panel radius 2; no WI capture — same honesty as Nexus 5/5X/6
    shell: { screenRadius: 2 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 4.4.2; Nexus 4 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2012,
  },
  {
    name: 'Nexus 6P',
    os: 'android',
    screen: { width: 412, height: 732 },
    pixelRatio: 3.5,
    system: 'Android 8.0',
    // legacy flat panel radius 2; no WI capture — same honesty as Nexus 5/5X/6
    shell: { screenRadius: 2 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 8.0.0; Nexus 6P Build/OPP3.170518.006) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2015,
  },
  {
    name: 'Nexus 7',
    os: 'android',
    formFactor: 'tablet',
    screen: { width: 600, height: 960 },
    pixelRatio: 2,
    system: 'Android 6.0',
    // legacy flat panel radius 2; no WI capture — same honesty as Nexus 5/5X/6
    shell: { screenRadius: 2 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 7 Build/MOB30X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Safari/537.36',
    releaseYear: 2012,
  },
  {
    name: 'Pixel 2',
    os: 'android',
    screen: { width: 411, height: 731 },
    pixelRatio: 2.625,
    system: 'Android 8.0',
    // OEM SystemUI sysui_rounded_size default 0 (Pixel 2 / XDA+SystemUI RoundedCorners); no WI capture
    shell: { screenRadius: 0 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2017,
  },
  {
    name: 'Pixel 2 XL',
    os: 'android',
    screen: { width: 411, height: 823 },
    pixelRatio: 3.5,
    system: 'Android 8.0',
    // OEM SystemUI sysui_rounded_size default 26 (Pixel 2 XL / XDA+SystemUI RoundedCorners); no WI capture
    shell: { screenRadius: 26 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 8.0.0; Pixel 2 XL Build/OPD1.170816.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2017,
  },
  {
    name: 'Pixel 3',
    os: 'android',
    screen: { width: 393, height: 786 },
    pixelRatio: 2.75,
    system: 'Android 9',
    userAgent:
      'Mozilla/5.0 (Linux; Android 9; Pixel 3 Build/PQ1A.181105.017.A1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2018,
  },
  {
    name: 'Pixel 4',
    os: 'android',
    screen: { width: 353, height: 745 },
    pixelRatio: 3,
    system: 'Android 10',
    userAgent:
      'Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2019,
  },
  {
    name: 'Pixel 4a (5G)',
    os: 'android',
    screen: { width: 412, height: 892 },
    pixelRatio: 2.63,
    system: 'Android 11',
    // Hardware punch-hole (left-biased like Pixel 4a/5). WI has pixel-4a only, not 4a (5G) — cutout omitted until measured.
    userAgent:
      'Mozilla/5.0 (Linux; Android 11; Pixel 4a (5G)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2020,
  },
  {
    name: 'Pixel 5',
    os: 'android',
    screen: { width: 393, height: 851 },
    pixelRatio: 2.75,
    system: 'Android 11',
    // windowinsets.info/pixel-5 (emulator, gesture nav): safe top≈49 bottom≈24 (no RoundedCorner in capture);
    // displayCutoutBounds 49.5×49.5@0 left=0 on ~393dp → circle Ø49 top0 centerX≈0.063 (left-edge hole; not centered).
    statusBarHeight: 49,
    safeAreaInsets: { top: 49, bottom: 24 },
    safeAreaInsetsLandscape: { right: 49 },
    cutout: { shape: 'circle', width: 49, height: 49, top: 0, centerX: 0.063 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2020,
  },
  {
    name: 'Pixel 6',
    os: 'android',
    screen: { width: 412, height: 915 },
    pixelRatio: 2.625,
    system: 'Android 12',
    // windowinsets.info/pixel-6 (emulator, gesture nav): RoundedCorner 10.67dp; safe top≈49 bottom≈24; cutout circle 45@2.
    statusBarHeight: 49,
    safeAreaInsets: { top: 49, bottom: 24 },
    safeAreaInsetsLandscape: { right: 49 },
    cutout: { shape: 'circle', width: 45, height: 45, top: 2 },
    shell: { screenRadius: 10.67 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2021,
  },
  {
    name: 'Pixel 6 Pro',
    os: 'android',
    screen: { width: 412, height: 892 },
    pixelRatio: 3.5,
    system: 'Android 12',
    // windowinsets.info/pixel-6-pro (emulator, gesture nav): RoundedCorner 14.29dp; safe top≈41 bottom≈0; cutout circle 37@2.
    statusBarHeight: 41,
    safeAreaInsets: { top: 41, bottom: 0 },
    safeAreaInsetsLandscape: { right: 41 },
    cutout: { shape: 'circle', width: 37, height: 37, top: 2 },
    shell: { screenRadius: 14.29 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 12; Pixel 6 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2021,
  },
  {
    name: 'Pixel 6a',
    os: 'android',
    screen: { width: 412, height: 915 },
    pixelRatio: 2.625,
    system: 'Android 12',
    // windowinsets.info/pixel-6a (emulator, gesture nav): RoundedCorner topLeft 17.9dp (asymmetric BR 18.29); safe top≈50 bottom≈24;
    // cutout circle 55@0 uses excl width (bounds 55.24×50.29 — not square; Ø may exceed excl H). WEAK-CITE; no AVD re-measure to shrink.
    statusBarHeight: 50,
    safeAreaInsets: { top: 50, bottom: 24 },
    safeAreaInsetsLandscape: { right: 50 },
    cutout: { shape: 'circle', width: 55, height: 55, top: 0 },
    shell: { screenRadius: 17.9 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 12; Pixel 6a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2022,
  },
  {
    name: 'Pixel 7 Pro',
    os: 'android',
    screen: { width: 412, height: 892 },
    pixelRatio: 3.5,
    system: 'Android 13',
    // windowinsets.info/pixel-7-pro (emulator, gesture nav): RoundedCorner 14.14dp; safe top≈41 bottom≈24.
    statusBarHeight: 41,
    safeAreaInsets: { top: 41, bottom: 24 },
    safeAreaInsetsLandscape: { right: 41 },
    shell: { screenRadius: 14.14 },
    cutout: { shape: 'circle', width: 25, height: 25, top: 8 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2022,
  },
  {
    name: 'Pixel 7a',
    os: 'android',
    screen: { width: 412, height: 915 },
    pixelRatio: 2.625,
    system: 'Android 13',
    // windowinsets.info/pixel-7a (emulator, gesture nav): RoundedCorner topLeft 17.9dp (asymmetric BR 18.29); safe top≈45 bottom≈24;
    // cutout circle 55@0 uses excl width (bounds 55.24×44.95 — not square; Ø exceeds excl H). WEAK-CITE; no AVD re-measure to shrink.
    statusBarHeight: 45,
    safeAreaInsets: { top: 45, bottom: 24 },
    safeAreaInsetsLandscape: { right: 45 },
    cutout: { shape: 'circle', width: 55, height: 55, top: 0 },
    shell: { screenRadius: 17.9 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2023,
  },
  {
    name: 'Pixel 10 Pro',
    os: 'android',
    screen: { width: 427, height: 952 },
    pixelRatio: 3,
    system: 'Android 16',
    // windowinsets.info/pixel-10-pro (emulator, gesture nav): RoundedCorner 52.33dp; safe top≈52 bottom≈24;
    // displayCutoutBounds 36.33×52@0 (identical to pixel-9-pro) → circle Ø36 top8.
    statusBarHeight: 52,
    safeAreaInsets: { top: 52, bottom: 24 },
    safeAreaInsetsLandscape: { right: 52 },
    shell: { screenRadius: 52.33 },
    cutout: { shape: 'circle', width: 36, height: 36, top: 8 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2025,
  },
  {
    name: 'Pixel 10 Pro XL',
    os: 'android',
    screen: { width: 448, height: 997 },
    pixelRatio: 3,
    system: 'Android 16',
    // windowinsets.info/pixel-10-pro-xl (emulator, gesture nav): RoundedCorner 51dp; safe top≈53 bottom≈24; cutout circle 38@8.
    statusBarHeight: 53,
    safeAreaInsets: { top: 53, bottom: 24 },
    safeAreaInsetsLandscape: { right: 53 },
    cutout: { shape: 'circle', width: 38, height: 38, top: 8 },
    shell: { screenRadius: 51 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Mobile Safari/537.36',
    releaseYear: 2025,
  },
  {
    name: 'Pixel 3 XL',
    os: 'android',
    screen: { width: 393, height: 786 },
    pixelRatio: 2.75,
    system: 'Android 11',
    // DisplayCutout Rect(442,0–998,171) px on 1440-wide panel (SO):
    // https://stackoverflow.com/questions/60541124/displaycutout-position
    // Scale 1440→1080 for kit FHD 393×786@2.75 → notch ≈152×47 @ top 0 (centered). No WI page.
    // Prefer later: native ~411×846@3.5 + notch ≈159×49 when window is fixed.
    statusBarHeight: 47,
    safeAreaInsets: { top: 47, bottom: 0 },
    safeAreaInsetsLandscape: { right: 47 },
    cutout: { shape: 'notch', width: 152, height: 47, top: 0 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 11; Pixel 3 XL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.181 Mobile Safari/537.36',
    releaseYear: 2018,
  },
  {
    name: 'Pixel Fold',
    os: 'android',
    screen: { width: 734, height: 1014 },
    pixelRatio: 2.8,
    system: 'Android 13',
    // windowinsets.info/pixel-fold cover: safe top≈42 bottom≈24; cutout circle 42@0 centered (HOLD Ø).
    // MUST-FIX window: kit 734×1014@2.8 matches neither WI cover (~411×797) nor main (~841×701, bounds null / UDC).
    // Painting cover Ø42 on this legacy window mis-sizes the hole. Fix = cover-only window or split Cover/Main rows
    // (structural; not applied in cutout ADV merge — keep Ø from cover capture).
    statusBarHeight: 42,
    safeAreaInsets: { top: 42, bottom: 24 },
    safeAreaInsetsLandscape: { right: 42 },
    cutout: { shape: 'circle', width: 42, height: 42, top: 0 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel Fold) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Mobile Safari/537.36',
    releaseYear: 2023,
  },
  {
    name: 'Pixel Tablet',
    os: 'android',
    formFactor: 'tablet',
    screen: { width: 800, height: 1280 },
    pixelRatio: 2,
    system: 'Android 13',
    // windowinsets.info/pixel-tablet (emulator, gesture nav): WI capture is landscape 1280×800@2; kit stores portrait 800×1280 (swap-equal).
    // safe top≈24 bottom≈32 (no RoundedCorner in capture).
    statusBarHeight: 24,
    safeAreaInsets: { top: 24, bottom: 32 },
    safeAreaInsetsLandscape: { right: 24 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    releaseYear: 2023,
  },
  {
    name: 'Pixel 9a',
    os: 'android',
    screen: { width: 412, height: 915 },
    pixelRatio: 2.625,
    system: 'Android 15',
    // windowinsets.info/pixel-9a (emulator, gesture nav): RoundedCorner 50.29dp; safe top≈54 bottom≈24; cutout circle 42@6.
    statusBarHeight: 54,
    safeAreaInsets: { top: 54, bottom: 24 },
    safeAreaInsetsLandscape: { right: 54 },
    cutout: { shape: 'circle', width: 42, height: 42, top: 6 },
    shell: { screenRadius: 50.29 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 15; Pixel 9a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
    releaseYear: 2025,
  },
  {
    name: 'Galaxy Fold',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 280, height: 653 },
    pixelRatio: 3,
    system: 'Android 9.0',
    releaseYear: 2019,
  },
  {
    name: 'Galaxy S21',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 800 },
    pixelRatio: 3,
    system: 'Android 11',
    // windowinsets.info/galaxy-s21 (measured, gesture nav): RoundedCorner 30dp; safe top≈27 bottom≈15; cutout circle 20@3.
    statusBarHeight: 27,
    safeAreaInsets: { top: 27, bottom: 15 },
    safeAreaInsetsLandscape: { right: 27 },
    cutout: { shape: 'circle', width: 20, height: 20, top: 3 },
    shell: { screenRadius: 30 },
    releaseYear: 2021,
  },
  {
    name: 'Galaxy S21 Plus',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 384, height: 854 },
    pixelRatio: 2.8125,
    system: 'Android 11',
    // windowinsets.info/galaxy-s21-plus (measured, gesture nav): RoundedCorner 35.91dp; safe top≈27 bottom≈15; cutout circle 20@3.
    statusBarHeight: 27,
    safeAreaInsets: { top: 27, bottom: 15 },
    safeAreaInsetsLandscape: { right: 27 },
    cutout: { shape: 'circle', width: 20, height: 20, top: 3 },
    shell: { screenRadius: 35.91 },
    releaseYear: 2021,
  },
  {
    name: 'Galaxy S21 Ultra',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 384, height: 853 },
    pixelRatio: 2.8125,
    system: 'Android 11',
    // windowinsets.info/galaxy-s21-ultra (measured, gesture nav): safe top≈27 bottom≈15 (no RoundedCorner in capture).
    statusBarHeight: 27,
    safeAreaInsets: { top: 27, bottom: 15 },
    safeAreaInsetsLandscape: { right: 27 },
    cutout: { shape: 'circle', width: 21, height: 21, top: 3 },
    releaseYear: 2021,
  },
  {
    name: 'Galaxy S20',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 800 },
    pixelRatio: 3,
    system: 'Android 10',
    // windowinsets.info/galaxy-s20: capture pending. Hardware has centered punch-hole — cutout omitted until measured.
    releaseYear: 2020,
  },
  {
    name: 'Galaxy S20 Plus',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 384, height: 854 },
    pixelRatio: 2.8125,
    system: 'Android 10',
    // windowinsets.info/galaxy-s20-plus (measured, gesture nav): RoundedCorner 24.18dp; safe top≈26 bottom≈15.
    // Published bounds=null (FHD/QHD left bug). Raw InsetsProbe boundingRects
    // https://github.com/easyhooon/windowinsets.info/blob/main/measurements/galaxy-s/galaxy-s20-plus/rtl-2026-09-30/main-gesture.json
    // 19.91×25.96@0 → circle Ø20 top3; omit centerX (hardware centered; ignore left=246).
    statusBarHeight: 26,
    safeAreaInsets: { top: 26, bottom: 15 },
    safeAreaInsetsLandscape: { right: 26 },
    shell: { screenRadius: 24.18 },
    cutout: { shape: 'circle', width: 20, height: 20, top: 3 },
    releaseYear: 2020,
  },
  {
    name: 'Samsung S21 FE',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 780 },
    pixelRatio: 3,
    system: 'Android 13',
    // windowinsets.info/galaxy-s21-fe (measured, gesture nav): RoundedCorner 40.33dp; safe top≈33 bottom≈15; cutout circle 23@5.
    statusBarHeight: 33,
    safeAreaInsets: { top: 33, bottom: 15 },
    safeAreaInsetsLandscape: { right: 33 },
    cutout: { shape: 'circle', width: 23, height: 23, top: 5 },
    shell: { screenRadius: 40.33 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-G990B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/20.0 Chrome/106.0.5249.126 Mobile Safari/537.36',
    releaseYear: 2021,
  },
  {
    name: 'Galaxy Fold3 (Folded)',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 320, height: 872 },
    pixelRatio: 3,
    system: 'Android 13',
    // windowinsets.info/galaxy-z-fold3 (measured, gesture nav): safe top≈31 bottom≈15 (no RoundedCorner in capture).
    statusBarHeight: 31,
    safeAreaInsets: { top: 31, bottom: 15 },
    safeAreaInsetsLandscape: { right: 31 },
    cutout: { shape: 'circle', width: 24, height: 24, top: 4 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-F926U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.131 Mobile Safari/537.36',
    releaseYear: 2021,
  },
  {
    // Window left legacy vs WI Fold3 main ~674×841@2.625 — radius/safe only.
    name: 'Galaxy Fold3 (Unfolded)',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 590, height: 736 },
    pixelRatio: 3,
    system: 'Android 13',
    // windowinsets.info/galaxy-z-fold3 (measured, gesture nav): RoundedCorner 20.19dp; safe top≈34 bottom≈64.
    statusBarHeight: 34,
    safeAreaInsets: { top: 34, bottom: 64 },
    safeAreaInsetsLandscape: { right: 34 },
    shell: { screenRadius: 20.19 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-F926U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.131 Mobile Safari/537.36',
    releaseYear: 2021,
  },
  {
    name: 'Galaxy S22',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 780 },
    pixelRatio: 3,
    system: 'Android 13',
    // windowinsets.info/galaxy-s22 (measured, gesture nav): RoundedCorner 34dp; safe top≈27 bottom≈15; cutout circle 19@4.
    statusBarHeight: 27,
    safeAreaInsets: { top: 27, bottom: 15 },
    safeAreaInsetsLandscape: { right: 27 },
    cutout: { shape: 'circle', width: 19, height: 19, top: 4 },
    shell: { screenRadius: 34 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    releaseYear: 2022,
  },
  {
    name: 'Galaxy S22 Plus',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 384, height: 832 },
    pixelRatio: 2.8125,
    system: 'Android 13',
    // windowinsets.info/galaxy-s22-plus (measured, gesture nav): RoundedCorner 35.91dp; safe top≈26 bottom≈15; cutout circle 18@4.
    statusBarHeight: 26,
    safeAreaInsets: { top: 26, bottom: 15 },
    safeAreaInsetsLandscape: { right: 26 },
    cutout: { shape: 'circle', width: 18, height: 18, top: 4 },
    shell: { screenRadius: 35.91 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-S906B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    releaseYear: 2022,
  },
  {
    name: 'Galaxy S22 Ultra',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 384, height: 823 },
    pixelRatio: 2.8125,
    system: 'Android 13',
    // windowinsets.info/galaxy-s22-ultra (measured, gesture nav): RoundedCorner 35.91dp; safe top≈27 bottom≈15; cutout circle 20@3.
    statusBarHeight: 27,
    safeAreaInsets: { top: 27, bottom: 15 },
    safeAreaInsetsLandscape: { right: 27 },
    cutout: { shape: 'circle', width: 20, height: 20, top: 3 },
    shell: { screenRadius: 35.91 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    releaseYear: 2022,
  },
  {
    name: 'Galaxy S23',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 360, height: 780 },
    pixelRatio: 3,
    system: 'Android 14',
    // windowinsets.info/galaxy-s23 (measured, gesture nav): RoundedCorner 36dp; safe top≈27 bottom≈15; cutout circle 19@4.
    statusBarHeight: 27,
    safeAreaInsets: { top: 27, bottom: 15 },
    safeAreaInsetsLandscape: { right: 27 },
    cutout: { shape: 'circle', width: 19, height: 19, top: 4 },
    shell: { screenRadius: 36 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    releaseYear: 2023,
  },
  {
    name: 'Galaxy S23 Plus',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 384, height: 832 },
    pixelRatio: 2.8125,
    system: 'Android 14',
    // windowinsets.info/galaxy-s23-plus (measured, gesture nav): RoundedCorner 35.91dp; safe top≈26 bottom≈15; cutout circle 18@4.
    statusBarHeight: 26,
    safeAreaInsets: { top: 26, bottom: 15 },
    safeAreaInsetsLandscape: { right: 26 },
    cutout: { shape: 'circle', width: 18, height: 18, top: 4 },
    shell: { screenRadius: 35.91 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-S916B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    releaseYear: 2023,
  },
  {
    name: 'Galaxy S23 Ultra',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 384, height: 823 },
    pixelRatio: 2.8125,
    system: 'Android 14',
    // windowinsets.info/galaxy-s23-ultra (measured, gesture nav): RoundedCorner 3.91dp; safe top≈33 bottom≈15; cutout circle 19@7.
    statusBarHeight: 33,
    safeAreaInsets: { top: 33, bottom: 15 },
    safeAreaInsetsLandscape: { right: 33 },
    cutout: { shape: 'circle', width: 19, height: 19, top: 7 },
    shell: { screenRadius: 3.91 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    releaseYear: 2023,
  },
  {
    name: 'Galaxy S24 Plus',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 384, height: 832 },
    pixelRatio: 2.8125,
    system: 'Android 14',
    // windowinsets.info/galaxy-s24-plus (measured, gesture nav): RoundedCorner 35.91dp; safe top≈34 bottom≈15; cutout circle 18@8.
    statusBarHeight: 34,
    safeAreaInsets: { top: 34, bottom: 15 },
    safeAreaInsetsLandscape: { right: 34 },
    cutout: { shape: 'circle', width: 18, height: 18, top: 8 },
    shell: { screenRadius: 35.91 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-S926B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    // Default FHD+ window (384×832 @2.8125 / densityDpi 450), not the panel's
    // full WQHD+ logical size. Matches windowinsets.info / Android default zoom.
    // Documented in packages/devices README (EN+ZH); WQHD+ via deviceProfile override.
    // screenRadius 2.13 is near-sharp under FHD+ — screenshot QA should expect that.
    name: 'Galaxy S24 Ultra',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 384, height: 832 },
    pixelRatio: 2.8125,
    system: 'Android 14',
    // windowinsets.info/galaxy-s24-ultra (measured, gesture nav): RoundedCorner 2.13dp; safe top≈34 bottom≈15.
    statusBarHeight: 34,
    safeAreaInsets: { top: 34, bottom: 15 },
    safeAreaInsetsLandscape: { right: 34 },
    shell: { screenRadius: 2.13 },
    cutout: { shape: 'circle', width: 18, height: 18, top: 8 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    name: 'Galaxy Z Flip 5',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 264, height: 844 },
    pixelRatio: 2.8,
    system: 'Android 13',
    // windowinsets.info/galaxy-z-flip5 (measured, gesture nav): RoundedCorner 36dp; safe top≈31 bottom≈15; cutout circle 24@4.
    // Window left legacy — kit 264×844@2.8 ≠ WI main 360×880@3.
    statusBarHeight: 31,
    safeAreaInsets: { top: 31, bottom: 15 },
    safeAreaInsetsLandscape: { right: 31 },
    cutout: { shape: 'circle', width: 24, height: 24, top: 4 },
    shell: { screenRadius: 36 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-F731B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.131 Mobile Safari/537.36',
    releaseYear: 2023,
  },
  {
    name: 'Galaxy Z Fold 4',
    os: 'android',
    statusBarStyle: 'android-samsung',
    screen: { width: 344, height: 882 },
    pixelRatio: 2.8,
    system: 'Android 13',
    // windowinsets.info/galaxy-z-fold4 (measured, gesture nav): safe top≈33 bottom≈15 (no RoundedCorner in capture).
    statusBarHeight: 33,
    safeAreaInsets: { top: 33, bottom: 15 },
    safeAreaInsetsLandscape: { right: 33 },
    cutout: { shape: 'circle', width: 26, height: 26, top: 4 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; SM-F936B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.131 Mobile Safari/537.36',
    releaseYear: 2022,
  },
  {
    name: 'OnePlus 12',
    os: 'android',
    screen: { width: 412, height: 915 },
    pixelRatio: 2.625,
    system: 'Android 14',
    // Centered punch-hole on hardware; not in windowinsets.info (Samsung/Pixel only) — cutout omitted.
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; CPH2581) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    name: 'Nothing Phone 2',
    os: 'android',
    screen: { width: 412, height: 915 },
    pixelRatio: 2.625,
    system: 'Android 13',
    // Centered punch-hole on hardware; not in windowinsets.info — cutout omitted.
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; A065) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
    releaseYear: 2023,
  },
  {
    name: 'Xiaomi 14',
    os: 'android',
    statusBarStyle: 'android-hyperos',
    screen: { width: 412, height: 915 },
    pixelRatio: 2.625,
    system: 'Android 14',
    // Centered punch-hole on hardware; not in windowinsets.info — cutout omitted.
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; 23127PN0CC) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    releaseYear: 2024,
  },
  {
    name: 'Motorola Razr+',
    os: 'android',
    screen: { width: 264, height: 844 },
    pixelRatio: 2.8,
    system: 'Android 13',
    // Main/inner punch-hole on hardware (preset size matches flip-main class). No WI page — cutout omitted.
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; XT2321-1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.131 Mobile Safari/537.36',
    releaseYear: 2023,
  },
  {
    name: 'OnePlus Open',
    os: 'android',
    screen: { width: 734, height: 1014 },
    pixelRatio: 2.8,
    system: 'Android 13',
    // STILL-GAP: hardware has punch-hole on BOTH cover and main (not UDC; Find N3 twin). Kit single row uses
    // legacy 734×1014 (matches neither official cover nor main). No WI/OEM DisplayCutout dp — cutout omitted
    // until Cover+main rows exist with citeable bounds. Do not invent Ø.
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; CPH2551) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.131 Mobile Safari/537.36',
    releaseYear: 2023,
  },
]
