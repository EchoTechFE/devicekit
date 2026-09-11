import type { PresetDeviceProfile } from '@devicekit/devices'
import {
  DEMO_SITE_URL,
  deviceCanonicalUrl,
  devicePageDescription,
  devicePageJsonLd,
  devicePageTitle,
} from './demo-device-seo.js'

export interface DemoPageMetadata {
  title: string
  description: string
  canonical: string
  heading: string
  intro: string
  jsonLd: Record<string, unknown>
}

const HOME_PAGE_TITLE = 'Device frame simulator for iOS, Android & HarmonyOS | devicekit'
const HOME_PAGE_DESCRIPTION = 'Preview iOS, Android and HarmonyOS devices with the devicekit device-frame custom element.'

export function demoPageMetadata(device?: PresetDeviceProfile): DemoPageMetadata {
  if (device === undefined) {
    return {
      title: HOME_PAGE_TITLE,
      description: HOME_PAGE_DESCRIPTION,
      canonical: DEMO_SITE_URL,
      heading: 'Device frame simulator',
      intro: 'Inspect device frames, safe areas and viewport metrics with a production-ready custom element.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'devicekit device frame simulator',
        description: HOME_PAGE_DESCRIPTION,
        url: DEMO_SITE_URL,
        codeRepository: 'https://github.com/EchoTechFE/devicekit',
      },
    }
  }

  return {
    title: devicePageTitle(device),
    description: devicePageDescription(device),
    canonical: deviceCanonicalUrl(device),
    heading: `${device.name} device frame simulator`,
    intro: `Inspect the ${device.name} profile, including its ${device.screen.width} × ${device.screen.height} CSS-pixel screen and ${device.pixelRatio}× pixel ratio.`,
    jsonLd: devicePageJsonLd(device),
  }
}
