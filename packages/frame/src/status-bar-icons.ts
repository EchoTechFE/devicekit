import type { StatusBarStyle } from '@devicekit/devices'

export interface StatusBarIconMetric {
  width: number
  height: number
  inkWidth: number
  inkHeight: number
  inkOffsetY: number
}

export interface StatusBarIconMetrics {
  signal: StatusBarIconMetric
  wifi: StatusBarIconMetric
  battery: StatusBarIconMetric
}

/**
 * Family-level visual approximations in CSS px. The ink fields describe the
 * visible path box within each host box, so all three glyphs can share one
 * flex-row centerline without making the battery visually taller.
 */
export const STATUS_BAR_ICON_METRICS: Record<StatusBarStyle, StatusBarIconMetrics> = {
  ios: {
    signal: { width: 17, height: 10.7, inkWidth: 17, inkHeight: 10.7, inkOffsetY: 0 },
    // The fallback path's viewBox has more lower-side ink; raise its mask so
    // the final raster center stays within one CSS px of signal/battery.
    wifi: { width: 15.3, height: 11, inkWidth: 15.3, inkHeight: 8.5, inkOffsetY: -0.25 },
    battery: { width: 24.5, height: 11.5, inkWidth: 24.5, inkHeight: 11.5, inkOffsetY: 0 },
  },
  'android-stock': {
    signal: { width: 13, height: 12.6, inkWidth: 11.5, inkHeight: 11, inkOffsetY: 0 },
    wifi: { width: 13, height: 12.6, inkWidth: 12, inkHeight: 8.5, inkOffsetY: -0.25 },
    battery: { width: 8, height: 12.6, inkWidth: 8, inkHeight: 10.5, inkOffsetY: 0.25 },
  },
  'android-samsung': {
    signal: { width: 14, height: 12, inkWidth: 13, inkHeight: 11, inkOffsetY: 0 },
    wifi: { width: 14, height: 12, inkWidth: 13, inkHeight: 10, inkOffsetY: 0 },
    battery: { width: 20, height: 10, inkWidth: 20, inkHeight: 10, inkOffsetY: 0 },
  },
  harmony: {
    signal: { width: 12, height: 12, inkWidth: 11, inkHeight: 12, inkOffsetY: 0 },
    wifi: { width: 13, height: 11, inkWidth: 13, inkHeight: 10, inkOffsetY: -0.75 },
    battery: { width: 8, height: 12, inkWidth: 8, inkHeight: 12, inkOffsetY: -0.5 },
  },
}

export function setStatusBarIconMetrics(style: CSSStyleDeclaration, family: StatusBarStyle): void {
  const metrics = STATUS_BAR_ICON_METRICS[family]
  for (const [name, metric] of Object.entries(metrics)) {
    style.setProperty(`--sb-${name}-width`, `${metric.width}px`)
    style.setProperty(`--sb-${name}-height`, `${metric.height}px`)
    style.setProperty(`--sb-${name}-ink-width`, `${metric.inkWidth}px`)
    style.setProperty(`--sb-${name}-ink-height`, `${metric.inkHeight}px`)
    style.setProperty(`--sb-${name}-ink-offset-y`, `${metric.inkOffsetY}px`)
  }
}
