/**
 * Face ID notch silhouette path (ears + body + bottom fillets).
 *
 * Radii from PaintCode / Apple Bezel are **circular equivalents**.
 * Paint is circular quarter-circles.
 *
 * Ear geometry matches the legacy CSS radial ears:
 *   ::before { left:-ear; radial-gradient(circle at bottom left, transparent ear, color) }
 * Black fill is OUTSIDE the ear circle (center at the inner-bottom of each ear
 * square), so the filled notch gets **outward** top fillets — not concave bites.
 *
 * Do **not** apply Figma screen-corner ξ≈0.6 here (budget collision → melt).
 * Do **not** use `M 0,0 A … bodyLeft,ear` with sweep 1 — that scoops INTO the
 * fill (凹进去).
 *
 * Coordinate system: (0,0) = top-left of the OUTER box including ears.
 * Outer size = (bodyWidth + 2·topRadius) × height.
 */

function fmt(n: number): string {
  return n.toFixed(4)
}

/**
 * Circular silhouette — CSS radial / PaintCode faithful.
 *
 * Outline (nonzero fill):
 *   top edge across full outer width
 *   → right ear arc, center (W, ear), (W,0) → (W−ear, ear), sweep 0
 *   → body right wall → bottom fillets (sweep 1)
 *   → body left wall
 *   → left ear arc, center (0, ear), (ear,ear) → (0,0), sweep 0
 */
function circularNotchPathD(
  bodyWidth: number,
  height: number,
  ear: number,
  bot: number,
): string {
  const W = bodyWidth + 2 * ear
  const H = height
  const bodyLeft = ear
  const bodyRight = ear + bodyWidth
  const parts: string[] = [`M ${fmt(0)} ${fmt(0)}`]

  // Full top edge of outer box (includes both ear tips).
  parts.push(`L ${fmt(W)} ${fmt(0)}`)

  if (ear > 0) {
    // Right outward ear: center (W, ear), sweep 0 through the ear square.
    parts.push(`A ${fmt(ear)} ${fmt(ear)} 0 0 0 ${fmt(bodyRight)} ${fmt(ear)}`)
  }

  if (bot > 0) {
    const botStartY = H - bot
    if (botStartY > ear + 1e-6) {
      parts.push(`L ${fmt(bodyRight)} ${fmt(botStartY)}`)
    }
    parts.push(
      `A ${fmt(bot)} ${fmt(bot)} 0 0 1 ${fmt(bodyRight - bot)} ${fmt(H)}`,
      `L ${fmt(bodyLeft + bot)} ${fmt(H)}`,
      `A ${fmt(bot)} ${fmt(bot)} 0 0 1 ${fmt(bodyLeft)} ${fmt(botStartY)}`,
    )
    if (botStartY > ear + 1e-6) {
      parts.push(`L ${fmt(bodyLeft)} ${fmt(ear)}`)
    }
  } else {
    parts.push(`L ${fmt(bodyRight)} ${fmt(H)}`, `L ${fmt(bodyLeft)} ${fmt(H)}`)
    if (ear > 0) {
      parts.push(`L ${fmt(bodyLeft)} ${fmt(ear)}`)
    }
  }

  if (ear > 0) {
    // Left outward ear: center (0, ear), sweep 0 through the ear square back to tip.
    parts.push(`A ${fmt(ear)} ${fmt(ear)} 0 0 0 ${fmt(0)} ${fmt(0)}`)
  }

  parts.push('Z')
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * SVG path `d` for the filled notch (includes outward ears).
 * Empty string when the box is degenerate.
 *
 * `cornerSmoothing` is accepted for API stability but **ignored**: notch paint
 * is circular. Passing screen ξ here previously caused MUST-FIX kinks.
 */
export function notchContinuousPathD(
  bodyWidth: number,
  height: number,
  topRadius: number,
  bottomRadius: number,
  _cornerSmoothing = 0,
): string {
  void _cornerSmoothing
  const ear = Math.max(0, topRadius)
  let bot = Math.max(0, bottomRadius)
  const W = bodyWidth + 2 * ear
  const H = height
  if (bodyWidth <= 0 || W <= 0 || H <= 0) return ''

  // Keep a non-negative mid wall: bottom fillet cannot eat the ear's vertical budget.
  if (ear + bot > H) {
    bot = Math.max(0, H - ear)
  }

  return circularNotchPathD(bodyWidth, H, ear, bot)
}

/** Outer box width including both ears. */
export function notchContinuousOuterWidth(bodyWidth: number, topRadius: number): number {
  return bodyWidth + 2 * Math.max(0, topRadius)
}

/** CSS `clip-path: path("…")` value, or `none` when empty. */
export function notchContinuousClipPath(
  bodyWidth: number,
  height: number,
  topRadius: number,
  bottomRadius: number,
  cornerSmoothing = 0,
): string {
  const d = notchContinuousPathD(bodyWidth, height, topRadius, bottomRadius, cornerSmoothing)
  if (!d) return 'none'
  return `path("${d}")`
}

/** Curve token written on the cutout element when path paint is active. */
export const NOTCH_CURVE_TOKEN = 'circular' as const

/** Default smoothing for notch path paint (circular — not screen ξ). */
export const NOTCH_PATH_DEFAULT_SMOOTHING = 0
