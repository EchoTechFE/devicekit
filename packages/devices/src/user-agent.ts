/**
 * The user agent a page emulating one of these devices should report.
 *
 * Generated from `os` and `system` rather than stored per device, so a preset
 * cannot drift into claiming iOS 18 in its label and iOS 15 in its UA. A
 * profile that needs an exact string — a host pretending to be one specific
 * container, down to its build — sets `userAgent` and skips all of this.
 *
 * The strings name a mobile browser, not a mini-program container: this package
 * knows what phone it is drawing, not what app is embedding it. A host that
 * wants `MicroMessenger/...` on the end appends it itself.
 */
import type { DeviceProfile } from './devices.js'

/**
 * Pinned because a user agent has to name a specific build, and a floating
 * "current Chrome" would make every preview's UA depend on when it ran. Bump
 * these together with the presets.
 */
export const CHROME_BUILD = '149.0.7827.55'
// HuaweiBrowser/... is a token the Huawei Browser app itself appends; a
// generic ArkWeb container (what most HarmonyOS apps embed) doesn't carry it.
// A preset that needs it sets an explicit `userAgent`.
const ARKWEB_BUILD = 'ArkWeb/4.1.6.1 Mobile'
const WEBKIT_BUILD = 'AppleWebKit/605.1.15 (KHTML, like Gecko)'
const BLINK_BUILD = 'AppleWebKit/537.36 (KHTML, like Gecko)'

// Pinned fallback versions, not "the current version" — they don't track
// what Apple/Google/Huawei ship today, only what a profile without an
// explicit `system` reports. Bump these together with the presets.
const FALLBACK_VERSIONS: Record<string, string> = {
  ios: '18.0',
  android: '13',
  harmony: '5.0',
}

/**
 * The version out of a label like "iOS 18.0" or "HarmonyOS 5.0". Falls back to
 * a pinned version rather than leaving a hole in the string, because a UA with
 * a missing version is worse than one naming a plausible release.
 */
export function systemVersion(profile: Pick<DeviceProfile, 'os' | 'system'>): string {
  const match = /(\d[\d.]*)/.exec(profile.system ?? '')
  return match?.[1] ?? FALLBACK_VERSIONS[profile.os] ?? ''
}

/**
 * The `navigator.userAgent` string a page emulating this device should report.
 *
 * @param profile needs `os` and `name`; `system` picks the version, and an
 *   explicit `userAgent` is returned unchanged
 * @returns a mobile browser UA — Safari on iOS, Chrome on Android, ArkWeb on
 *   HarmonyOS
 */
export function deviceUserAgent(
  profile: Pick<DeviceProfile, 'os' | 'system' | 'name' | 'userAgent' | 'formFactor'>,
): string {
  if (profile.userAgent) return profile.userAgent
  const version = systemVersion(profile)
  const tablet = profile.formFactor === 'tablet'

  switch (profile.os) {
    case 'ios': {
      const major = Number.parseInt(version, 10)
      // Starting with Safari 26, iOS/iPadOS freeze the platform's OS token at
      // 18_6 and only advance the Safari Version/ token — see WebKit's "Safari
      // 26 Release Notes" blog post.
      const osToken = major >= 26 ? '18_6' : version.replace(/\./g, '_')
      if (tablet) {
        // iPadOS 13+ requests the desktop site by default, so Safari's UA
        // claims a Mac. A narrow split-screen/Slide Over width or "Request
        // Mobile Website" flips this back to a mobile UA; not modeled here.
        return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ${WEBKIT_BUILD} Version/${version} Safari/605.1.15`
      }
      return `Mozilla/5.0 (iPhone; CPU iPhone OS ${osToken} like Mac OS X) ${WEBKIT_BUILD} Version/${version} Mobile/15E148 Safari/604.1`
    }
    case 'harmony':
      return `Mozilla/5.0 (${tablet ? 'Tablet' : 'Phone'}; OpenHarmony ${version}) ${BLINK_BUILD} Chrome/114.0.0.0 Safari/537.36 ${ARKWEB_BUILD}`
    case 'android':
    default:
      return tablet
        ? `Mozilla/5.0 (Linux; Android ${version}; ${profile.name}) ${BLINK_BUILD} Chrome/${CHROME_BUILD} Safari/537.36`
        : `Mozilla/5.0 (Linux; Android ${version}; ${profile.name}) ${BLINK_BUILD} Chrome/${CHROME_BUILD} Mobile Safari/537.36`
  }
}
