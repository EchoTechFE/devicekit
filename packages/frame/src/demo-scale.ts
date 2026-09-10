export type DemoScaleMode = 'fit' | '100' | '75' | '50'

/** Resolves the demo's Chrome-style scale choice without reading the DOM. */
export function scaleFor(mode: DemoScaleMode, fit: number): number {
  if (mode === 'fit') return Math.min(1, Math.max(0, fit))
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
