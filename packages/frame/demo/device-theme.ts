import type { DeviceOS, StatusBarStyle } from '@devicekit/devices'
import type { DemoTheme } from './theme.js'

type DeviceThemeProperty =
  | '--device-screen-background'
  | '--demo-page-background'
  | '--demo-page-color'
  | '--demo-page-muted-color'
  | '--demo-page-size-color'
  | '--demo-navigation-background'
  | '--demo-navigation-color'
  | '--demo-tab-background'
  | '--demo-tab-border'
  | '--demo-tab-color'
  | '--demo-tab-active'

export interface DeviceTheme {
  id: string
  label: string
  system: string
  library: string
  appearance: DemoTheme
  statusBarTextStyle: 'black' | 'white'
  tokens: Record<DeviceThemeProperty, string>
}

interface DeviceThemeFamily {
  label: string
  library: string
  light: Record<DeviceThemeProperty, string>
  dark: Record<DeviceThemeProperty, string>
}

export interface DeviceThemeProfile {
  os: DeviceOS
  system?: string
  statusBarStyle?: StatusBarStyle
}

function palette(
  screen: string,
  page: string,
  text: string,
  muted: string,
  accent: string,
  navigation: string,
  tab: string,
  border: string,
): Record<DeviceThemeProperty, string> {
  return {
    '--device-screen-background': screen,
    '--demo-page-background': page,
    '--demo-page-color': text,
    '--demo-page-muted-color': muted,
    '--demo-page-size-color': accent,
    '--demo-navigation-background': navigation,
    '--demo-navigation-color': text,
    '--demo-tab-background': tab,
    '--demo-tab-border': border,
    '--demo-tab-color': muted,
    '--demo-tab-active': accent,
  }
}

/** The five families in the device table, expressed as CSS values only. */
export const DEVICE_THEME_MAP: Record<StatusBarStyle, DeviceThemeFamily> = {
  ios: {
    label: 'iOS',
    library: 'UIKit semantic colors',
    light: palette('#f2f2f7', '#f2f2f7', '#000000', '#8e8e93', '#007aff', '#f2f2f7', '#f2f2f7', 'rgba(60, 60, 67, 0.29)'),
    dark: palette('#000000', '#000000', '#ffffff', '#8e8e93', '#0a84ff', '#1c1c1e', '#1c1c1e', 'rgba(84, 84, 88, 0.65)'),
  },
  'android-stock': {
    label: 'Android',
    library: 'Android system palette',
    light: palette('#fef7ff', '#fef7ff', '#1d1b20', '#79747e', '#6750a4', '#fef7ff', '#fef7ff', '#cac4d0'),
    dark: palette('#141218', '#141218', '#e6e0e9', '#cac4d0', '#d0bcff', '#211f26', '#211f26', '#49454f'),
  },
  'android-samsung': {
    label: 'One UI',
    library: 'Samsung One UI palette',
    light: palette('#f7f7f7', '#f7f7f7', '#1c1b1f', '#747378', '#007aff', '#ffffff', '#ffffff', '#e5e5e5'),
    dark: palette('#000000', '#000000', '#f5f5f5', '#a8a8ad', '#4d9cff', '#1c1b1f', '#1c1b1f', '#38383d'),
  },
  'android-hyperos': {
    label: 'HyperOS',
    library: 'Xiaomi HyperOS palette',
    light: palette('#f7f7f8', '#f7f7f8', '#191919', '#7c7c80', '#3482ff', '#ffffff', '#ffffff', '#e9e9ec'),
    dark: palette('#101011', '#101011', '#f5f5f5', '#a3a3a8', '#5b9cff', '#1a1a1c', '#1a1a1c', '#333337'),
  },
  harmony: {
    label: 'HarmonyOS',
    library: 'ArkUI system palette',
    light: palette('#f7f8fa', '#f7f8fa', '#182431', '#6f7a86', '#0a59f7', '#ffffff', '#ffffff', '#dfe3e8'),
    dark: palette('#101820', '#101820', '#e8edf3', '#aeb8c3', '#5b8fff', '#18222c', '#18222c', '#35414c'),
  },
}

function styleFor(profile: DeviceThemeProfile): StatusBarStyle {
  if (profile.statusBarStyle !== undefined) return profile.statusBarStyle
  if (profile.os === 'ios') return 'ios'
  if (profile.os === 'harmony') return 'harmony'
  return 'android-stock'
}

function systemFor(profile: DeviceThemeProfile): string {
  return profile.system?.trim() || `${profile.os === 'ios' ? 'iOS' : profile.os === 'harmony' ? 'HarmonyOS' : 'Android'} version unavailable`
}

function themeId(style: StatusBarStyle, system: string, appearance: DemoTheme): string {
  return `${style}-${system.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${appearance}`
}

export function deviceThemeFor(profile: DeviceThemeProfile, appearance: DemoTheme): DeviceTheme {
  const style = styleFor(profile)
  const family = DEVICE_THEME_MAP[style]
  const system = systemFor(profile)
  return {
    id: themeId(style, system, appearance),
    label: family.label,
    system,
    library: family.library,
    appearance,
    statusBarTextStyle: appearance === 'dark' ? 'white' : 'black',
    tokens: family[appearance],
  }
}

/** Applies exactly one selected family palette to the frame and its app chrome. */
export function applyDeviceTheme(targets: HTMLElement[], profile: DeviceThemeProfile, appearance: DemoTheme): DeviceTheme {
  const theme = deviceThemeFor(profile, appearance)
  for (const target of targets) {
    target.dataset.uiTheme = theme.id
    for (const [property, value] of Object.entries(theme.tokens)) target.style.setProperty(property, value)
  }
  return theme
}
