import type { DeviceOS } from '@devicekit/devices'

export const SF_SYMBOLS_ENDPOINT = '/__devicekit/sf-symbols'

export interface SfSymbolMasks {
  signal: string
  wifi: string
  battery: string
}

export interface SfSymbolPayload {
  status: 'native' | 'fallback'
  masks: SfSymbolMasks | null
}

const MASK_NAMES = ['signal', 'wifi', 'battery'] as const

function toCssImage(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (value.startsWith('url("') && value.endsWith('")')) {
    const raw = value.slice(5, -2)
    // Provider JSON may already contain the CSS form. Normalize it without
    // accepting nested quotes or any other CSS function as an image source.
    return toCssImage(raw) === value ? value : null
  }
  // Keep the production demo bundle free of an Apple-generated data URL
  // literal. The serve-only provider guarantees PNG; this client boundary
  // verifies the MIME shape and base64 alphabet before quoting it for CSS.
  if (!value.startsWith('data:image/')) return null
  const marker = ';base64,'
  const payloadStart = value.indexOf(marker)
  if (payloadStart < 'data:image/'.length || payloadStart + marker.length >= value.length) return null
  const bytes = value.slice(payloadStart + marker.length)
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(bytes)) return null
  // The provider's data URL is safe to quote because this whitelist excludes
  // quotes, backslashes, whitespace, and CSS delimiters.
  return `url("${value}")`
}

function isSafeCssImage(value: unknown): value is string {
  if (typeof value !== 'string' || !value.startsWith('url("') || !value.endsWith('")')) return false
  return toCssImage(value.slice(5, -2)) === value
}

/** Converts an untrusted dev-server response into a safe fallback-or-native value. */
export function normalizeSfSymbolPayload(value: unknown): SfSymbolPayload {
  if (!value || typeof value !== 'object') return { status: 'fallback', masks: null }
  const candidate = value as { status?: unknown, masks?: unknown }
  if (candidate.status !== 'native' || !candidate.masks || typeof candidate.masks !== 'object') {
    return { status: 'fallback', masks: null }
  }
  const masks = candidate.masks as Record<string, unknown>
  const cssMasks = Object.fromEntries(MASK_NAMES.map((name) => [name, toCssImage(masks[name])])) as Record<string, string | null>
  if (!MASK_NAMES.every((name) => cssMasks[name] !== null)) return { status: 'fallback', masks: null }
  return {
    status: 'native',
    masks: {
      signal: cssMasks.signal as string,
      wifi: cssMasks.wifi as string,
      battery: cssMasks.battery as string,
    },
  }
}

/**
 * Publishes only a native iOS provider result. Removing all three properties is
 * important when a demo user changes to Android/Harmony or when the provider
 * fails: the shadow DOM then returns to its project-owned masks.
 */
export function applySfSymbolMasks(
  frame: HTMLElement,
  os: DeviceOS,
  layout: string | undefined,
  payload: SfSymbolPayload,
): 'native' | 'fallback' {
  const useNative = os === 'ios'
    && layout !== 'ios-duo'
    && payload.status === 'native'
    && payload.masks !== null
    && MASK_NAMES.every((name) => isSafeCssImage(payload.masks![name]))
  let injected = useNative
  for (const name of MASK_NAMES) {
    const property = `--device-status-bar-${name}-image`
    if (useNative) {
      frame.style.setProperty(property, payload.masks![name])
      if (frame.style.getPropertyValue(property) !== payload.masks![name]) injected = false
    }
    else frame.style.removeProperty(property)
  }
  if (!injected) {
    for (const name of MASK_NAMES) frame.style.removeProperty(`--device-status-bar-${name}-image`)
  }
  return injected ? 'native' : 'fallback'
}
