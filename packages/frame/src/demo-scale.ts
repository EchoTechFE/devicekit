export type DemoScaleMode = 'fit' | '100' | '75' | '50'

/**
 * Universal default scale ceiling for Fit mode (75%).
 *
 * Real phone displays have ~150 CSS PPI (e.g. 460 physical PPI @ 3x DPR),
 * while desktop displays are 96-120 CSS PPI. At 100% CSS pixels, mobile frames
 * render ~40-60% larger than physical devices. Capping Fit at 75% delivers a
 * realistic physical size (~65mm width on Retina displays, ~78mm on 96 PPI)
 * and guarantees frames fit within standard 700-800px viewports without scrolling.
 */
export const DEMO_FIT_MAX_SCALE = 0.75

/** Resolves the demo's Chrome-style scale choice without reading the DOM. */
export function scaleFor(mode: DemoScaleMode, fit: number): number {
  if (mode === 'fit') return Math.min(DEMO_FIT_MAX_SCALE, Math.max(0, fit))
  return Number(mode) / 100
}

export function scaleLabel(mode: DemoScaleMode, fit: number): string {
  return mode === 'fit' ? `Fit (${Math.round(scaleFor(mode, fit) * 100)}%)` : `${mode}%`
}

export interface DemoSize { width: number, height: number }

/** The layout box that reserves exactly the scaled visual footprint. */
export function scaledViewport(natural: DemoSize, scale: number): DemoSize {
  return { width: natural.width * scale, height: natural.height * scale }
}

/** Whether the scaled footprint needs stage scrolling rather than centering. */
export function overflowsViewport(viewport: DemoSize, stage: DemoSize): boolean {
  return viewport.width > stage.width || viewport.height > stage.height
}
