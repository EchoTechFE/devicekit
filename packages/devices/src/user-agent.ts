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
const ARKWEB_BUILD = 'ArkWeb/4.1.6.1 Mobile HuaweiBrowser/5.0.4.303'
const WEBKIT_BUILD = 'AppleWebKit/605.1.15 (KHTML, like Gecko)'
const BLINK_BUILD = 'AppleWebKit/537.36 (KHTML, like Gecko)'

const DEFAULT_VERSIONS: Record<string, string> = {
  ios: '18.0',
  android: '13',
  harmony: '5.0',
}

/**
 * The version out of a label like "iOS 18.0" or "HarmonyOS 5.0". Falls back to
 * a current version rather than leaving a hole in the string, because a UA with
 * a missing version is worse than one naming a plausible release.
 */
export function systemVersion(profile: Pick<DeviceProfile, 'os' | 'system'>): string {
  const match = /(\d[\d.]*)/.exec(profile.system ?? '')
  return match?.[1] ?? DEFAULT_VERSIONS[profile.os] ?? ''
}

/**
 * The `navigator.userAgent` string a page emulating this device should report.
 *
 * @param profile needs `os` and `name`; `system` picks the version, and an
 *   explicit `userAgent` is returned unchanged
 * @returns a mobile browser UA — Safari on iOS, Chrome on Android, ArkWeb on
 *   HarmonyOS
 */
export function deviceUserAgent(profile: Pick<DeviceProfile, 'os' | 'system' | 'name' | 'userAgent'>): string {
  if (profile.userAgent) return profile.userAgent
  const version = systemVersion(profile)

  switch (profile.os) {
    case 'ios': {
      // iOS reports its version with underscores inside the platform token and
      // with dots in the Safari `Version/` token. An iPad's platform token
      // drops the device name and says "CPU OS", not "CPU iPhone OS".
      const underscored = version.replace(/\./g, '_')
      const platform = profile.name.startsWith('iPad')
        ? `(iPad; CPU OS ${underscored} like Mac OS X)`
        : `(iPhone; CPU iPhone OS ${underscored} like Mac OS X)`
      return `Mozilla/5.0 ${platform} ${WEBKIT_BUILD} Version/${version} Mobile/15E148 Safari/604.1`
    }
    case 'harmony':
      return `Mozilla/5.0 (Phone; OpenHarmony ${version}) ${BLINK_BUILD} Chrome/114.0.0.0 Safari/537.36 ${ARKWEB_BUILD}`
    case 'android':
    default:
      return `Mozilla/5.0 (Linux; Android ${version}; ${profile.name}) ${BLINK_BUILD} Chrome/${CHROME_BUILD} Mobile Safari/537.36`
  }
}
