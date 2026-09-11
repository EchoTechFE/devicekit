import type { PresetDeviceProfile } from '@devicekit/devices'
import { devicePath } from './demo-device-url.js'

export const DEMO_SITE_URL = 'https://echotechfe.github.io/devicekit/'

const OS_LABEL = { ios: 'iOS', android: 'Android', harmony: 'HarmonyOS' } as const

export function devicePageTitle(device: PresetDeviceProfile): string {
  return `${device.name} device frame simulator | devicekit`
}

export function devicePageDescription(device: PresetDeviceProfile): string {
  return `${device.name} ${OS_LABEL[device.os]} device profile: ${device.screen.width} × ${device.screen.height} CSS pixels at ${device.pixelRatio}×. Preview it with devicekit's device-frame.`
}

export function deviceCanonicalUrl(device: PresetDeviceProfile): string {
  return new URL(devicePath(device.name), DEMO_SITE_URL).href
}

export function devicePageJsonLd(device: PresetDeviceProfile): Record<string, unknown> {
  const url = deviceCanonicalUrl(device)
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: devicePageTitle(device),
    description: devicePageDescription(device),
    url,
    isPartOf: {
      '@type': 'CollectionPage',
      name: 'devicekit device profiles',
      url: DEMO_SITE_URL,
    },
    mainEntity: {
      '@type': 'Thing',
      name: device.name,
      additionalType: 'Device profile',
    },
  }
}
