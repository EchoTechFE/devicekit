/**
 * Continuous (Apple-like) screen-corner clip.
 *
 * Authoritative paint: inline CSS `clip-path: path("…")` built from Figma
 * corner-smoothing (ξ≈0.6 → iOS-like), via {@link figmaContinuousClipPath}.
 * Hard clip gives engine edge AA without PNG-mask alpha fringes (white bleed
 * against dark chrome — user Duo edge bug).
 *
 * What does NOT drive paint:
 * - Chromium `corner-shape: squircle` → wrong family / unreliable intercept
 * - PNG / SVG `mask-image` → semi-transparent fringe bleed
 * - `mask-image: var(--data-uri)` → Chromium no-op
 * - n=5 Lamé superellipse polyline (kept for diagnostics / tests only)
 *
 * Body: zero circular `border-radius`, continuous outer `clip-path` at
 * screenCorners + bezel + border (+ underlap), `overflow: hidden`. Outer chrome
 * follows the screen silhouette (aesthetics) while staying outside the screen
 * curve so dark bezel underlaps screen AA (no white page bleed). Round2 ate
 * free corners via circular body radius + overflow — avoided. No side buttons.
 *
 * Fallback: if path is empty/`none`, keep labeled circular CSS radii.
 */
import type { CornerRadii } from '@devicekit/devices'
import { figmaContinuousClipPath, figmaContinuousRoundedRectPath, FIGMA_IOS_CORNER_SMOOTHING } from './figma-continuous-path.js'
export { FIGMA_IOS_CORNER_SMOOTHING, figmaContinuousClipPath, figmaContinuousRoundedRectPath } from './figma-continuous-path.js'

/** Apple continuous screens match a superellipse near n=5 (approximation, not CoreAnimation). */
export const CONTINUOUS_SUPERELLIPSE_N = 5

/** Subsamples per axis for mask-edge coverage AA (16 probes per pixel). */
export const MASK_AA_SUBSAMPLES = 4

/** Samples per quarter-corner for deprecated path helpers / tests (not used for paint). */
const SAMPLES_PER_CORNER = 16

function clampCorners(width: number, height: number, corners: CornerRadii): CornerRadii {
  let { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = corners
  tl = Math.max(0, tl)
  tr = Math.max(0, tr)
  br = Math.max(0, br)
  bl = Math.max(0, bl)

  const scale = (a: number, b: number, limit: number): [number, number] => {
    if (a + b <= limit || a + b === 0) return [a, b]
    const s = limit / (a + b)
    return [a * s, b * s]
  }
  ;[tl, tr] = scale(tl, tr, width)
  ;[bl, br] = scale(bl, br, width)
  ;[tl, bl] = scale(tl, bl, height)
  ;[tr, br] = scale(tr, br, height)
  return { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl }
}

function fmt(n: number): string {
  return String(Math.round(n * 1000) / 1000)
}

function sampleSuperellipseQuarter(radius: number, n: number, samples: number): Array<{ x: number, y: number }> {
  const pts: Array<{ x: number, y: number }> = []
  const exp = 2 / n
  for (let i = 0; i <= samples; i++) {
    const theta = (Math.PI / 2) * (1 - i / samples)
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    pts.push({
      x: radius * Math.pow(Math.abs(c), exp) * (c === 0 ? 0 : Math.sign(c)),
      y: radius * Math.pow(Math.abs(s), exp) * (s === 0 ? 0 : Math.sign(s)),
    })
  }
  return pts
}

function lineThrough(points: Array<{ x: number, y: number }>): string {
  if (points.length === 0) return ''
  return points.map(p => `L ${fmt(p.x)} ${fmt(p.y)}`).join(' ')
}

/**
 * SVG path for a continuous rounded rect (tests / diagnostics only). Prefer
 * {@link continuousScreenMaskDataURL} for actual painting.
 */
export function continuousRoundedRectPath(
  width: number,
  height: number,
  corners: CornerRadii,
  n = CONTINUOUS_SUPERELLIPSE_N,
): string {
  if (width <= 0 || height <= 0) return ''
  const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = clampCorners(width, height, corners)

  const parts: string[] = [`M ${fmt(tl)} 0`]
  parts.push(`L ${fmt(width - tr)} 0`)
  if (tr > 0.001) {
    const local = sampleSuperellipseQuarter(tr, n, SAMPLES_PER_CORNER)
    const mapped = local.slice(1).map(p => ({ x: width - tr + p.x, y: tr - p.y }))
    parts.push(lineThrough(mapped))
  }
  parts.push(`L ${fmt(width)} ${fmt(height - br)}`)
  if (br > 0.001) {
    const local = sampleSuperellipseQuarter(br, n, SAMPLES_PER_CORNER)
    const mapped = local.slice(1).map(p => ({ x: width - br + p.y, y: height - br + p.x }))
    parts.push(lineThrough(mapped))
  }
  parts.push(`L ${fmt(bl)} ${fmt(height)}`)
  if (bl > 0.001) {
    const local = sampleSuperellipseQuarter(bl, n, SAMPLES_PER_CORNER)
    const mapped = local.slice(1).map(p => ({ x: bl - p.x, y: height - bl + p.y }))
    parts.push(lineThrough(mapped))
  }
  parts.push(`L 0 ${fmt(tl)}`)
  if (tl > 0.001) {
    const local = sampleSuperellipseQuarter(tl, n, SAMPLES_PER_CORNER)
    const mapped = local.slice(1).map(p => ({ x: tl - p.y, y: tl - p.x }))
    parts.push(lineThrough(mapped))
  }
  parts.push('Z')
  return parts.join(' ')
}

export function continuousMidArcInsetRatio(n = CONTINUOUS_SUPERELLIPSE_N): number {
  const theta = Math.PI / 4
  const exp = 2 / n
  const lx = Math.pow(Math.cos(theta), exp)
  const ly = Math.pow(Math.sin(theta), exp)
  return Math.hypot(1 - lx, 1 - ly)
}

/**
 * True if (x,y) is inside a continuous rounded rect (analytical superellipse
 * corners). Integer pixel coords; used to paint the mask and by unit tests.
 */
export function isInsideContinuousScreen(
  x: number,
  y: number,
  width: number,
  height: number,
  corners: CornerRadii,
  n = CONTINUOUS_SUPERELLIPSE_N,
): boolean {
  const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = clampCorners(width, height, corners)
  if (x < 0 || y < 0 || x >= width || y >= height) return false

  const inCorner = (R: number, dx: number, dy: number): boolean => {
    if (R <= 0) return true
    if (dx < 0 || dy < 0 || dx > R || dy > R) return true
    return Math.pow(dx, n) + Math.pow(dy, n) <= Math.pow(R, n)
  }

  if (x < tl && y < tl && !inCorner(tl, tl - x, tl - y)) return false
  if (x > width - tr && y < tr && !inCorner(tr, x - (width - tr), tr - y)) return false
  if (x > width - br && y > height - br && !inCorner(br, x - (width - br), y - (height - br))) return false
  if (x < bl && y > height - bl && !inCorner(bl, bl - x, y - (height - bl))) return false
  return true
}

const maskCache = new Map<string, string>()

function maskCacheKey(width: number, height: number, corners: CornerRadii, n: number): string {
  const c = clampCorners(width, height, corners)
  return `${width}x${height}:${c.topLeft},${c.topRight},${c.bottomRight},${c.bottomLeft}:n${n}:aa${MASK_AA_SUBSAMPLES}`
}

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function u32be(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255])
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  let len = 0
  for (const part of parts) len += part.length
  const out = new Uint8Array(len)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new Uint8Array([
    type.charCodeAt(0),
    type.charCodeAt(1),
    type.charCodeAt(2),
    type.charCodeAt(3),
  ])
  const crcInput = concatBytes([typeBytes, data])
  return concatBytes([u32be(data.length), typeBytes, data, u32be(crc32(crcInput))])
}

function adler32(data: Uint8Array): number {
  let a = 1
  let b = 0
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]!) % 65521
    b = (b + a) % 65521
  }
  return ((b << 16) | a) >>> 0
}

/** zlib wrapper around stored (uncompressed) DEFLATE blocks — no canvas / CompressionStream. */
function zlibStore(uncompressed: Uint8Array): Uint8Array {
  // 0x78 0x01: CM=8, CINFO=7, FCHECK so (CMF*256+FLG) % 31 === 0
  const parts: Uint8Array[] = [new Uint8Array([0x78, 0x01])]
  const max = 65535
  if (uncompressed.length === 0) {
    parts.push(new Uint8Array([0x01, 0x00, 0x00, 0xff, 0xff]))
  }
  else {
    let offset = 0
    while (offset < uncompressed.length) {
      const end = Math.min(offset + max, uncompressed.length)
      const slice = uncompressed.subarray(offset, end)
      const isFinal = end === uncompressed.length
      const header = new Uint8Array(5)
      header[0] = isFinal ? 0x01 : 0x00
      header[1] = slice.length & 255
      header[2] = (slice.length >>> 8) & 255
      const nlen = (~slice.length) & 0xffff
      header[3] = nlen & 255
      header[4] = (nlen >>> 8) & 255
      parts.push(header, slice)
      offset = end
    }
  }
  parts.push(u32be(adler32(uncompressed)))
  return concatBytes(parts)
}

function bytesToBase64(bytes: Uint8Array): string {
  const g = globalThis as {
    Buffer?: { from: (bytes: Uint8Array) => { toString: (enc: string) => string } }
    btoa?: (data: string) => string
  }
  if (typeof g.Buffer !== 'undefined') return g.Buffer.from(bytes).toString('base64')
  let binary = ''
  // Chunk to avoid call-stack / argument limits on large masks.
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, Math.min(i + chunk, bytes.length))
    binary += String.fromCharCode(...slice)
  }
  if (typeof g.btoa !== 'function') throw new Error('no base64 encoder available')
  return g.btoa(binary)
}

/** Prefer Node zlib when available (vitest / SSR); else stored DEFLATE. */
function compressZlib(data: Uint8Array): Uint8Array {
  try {
    // Avoid a static `node:zlib` import so browser bundles stay clean.
    const proc = (globalThis as { process?: { versions?: { node?: string }, getBuiltinModule?: (name: string) => unknown } }).process
    const getBuiltin = proc?.getBuiltinModule
    if (typeof getBuiltin === 'function') {
      const zlib = getBuiltin('node:zlib') as { deflateSync?: (data: Uint8Array) => Uint8Array }
      if (typeof zlib?.deflateSync === 'function') return zlib.deflateSync(data)
    }
  }
  catch {
    // fall through to store encoding
  }
  return zlibStore(data)
}

/** Encode white RGB + alpha mask as a PNG byte stream (no DOM canvas). */
export function encodeAlphaMaskPng(width: number, height: number, alpha: Uint8Array): Uint8Array {
  if (alpha.length < width * height) throw new Error('alpha buffer too short')
  const stride = width * 4 + 1
  const raw = new Uint8Array(stride * height)
  for (let y = 0; y < height; y++) {
    const row = y * stride
    raw[row] = 0
    for (let x = 0; x < width; x++) {
      const i = row + 1 + x * 4
      const a = alpha[y * width + x]!
      raw[i] = 255
      raw[i + 1] = 255
      raw[i + 2] = 255
      raw[i + 3] = a
    }
  }
  const ihdr = concatBytes([
    u32be(width),
    u32be(height),
    new Uint8Array([8, 6, 0, 0, 0]),
  ])
  return concatBytes([
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressZlib(raw)),
    pngChunk('IEND', new Uint8Array(0)),
  ])
}

/**
 * Analytical alpha mask as a CSS `mask-image` value (`url("data:image/png;...")`).
 * Built with a pure PNG encoder (no canvas). Returns `'none'` only for invalid sizes.
 */
/**
 * Coverage (0..1) of pixel square [x,x+1)×[y,y+1) under the continuous shape.
 * Axis intercept stays at labeled R: fully outside for x+1 ≤ R on the top edge
 * when sampling the corner tile, fully inside once the pixel lies past R.
 */
function continuousPixelCoverage(
  x: number,
  y: number,
  width: number,
  height: number,
  corners: CornerRadii,
  n: number,
): number {
  const subs = MASK_AA_SUBSAMPLES
  let inside = 0
  const denom = subs * subs
  for (let sy = 0; sy < subs; sy++) {
    for (let sx = 0; sx < subs; sx++) {
      const px = x + (sx + 0.5) / subs
      const py = y + (sy + 0.5) / subs
      if (isInsideContinuousScreen(px, py, width, height, corners, n)) inside++
    }
  }
  return inside / denom
}

function buildContinuousAlphaMask(
  w: number,
  h: number,
  corners: CornerRadii,
  n: number,
): Uint8Array {
  const clamped = clampCorners(w, h, corners)
  const alpha = new Uint8Array(w * h)
  alpha.fill(255)
  // Soft-AA only the four corner tiles; the center rect stays fully opaque.
  // Expand the punch by 1px so AA fringes at the tile boundary are covered.
  const punch = (x0: number, y0: number, x1: number, y1: number): void => {
    const left = Math.max(0, Math.floor(x0) - 1)
    const top = Math.max(0, Math.floor(y0) - 1)
    const right = Math.min(w, Math.ceil(x1) + 1)
    const bottom = Math.min(h, Math.ceil(y1) + 1)
    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        const cover = continuousPixelCoverage(x, y, w, h, clamped, n)
        alpha[y * w + x] = cover >= 1 ? 255 : cover <= 0 ? 0 : Math.round(255 * cover)
      }
    }
  }
  const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = clamped
  punch(0, 0, tl, tl)
  punch(w - tr, 0, w, tr)
  punch(w - br, h - br, w, h)
  punch(0, h - bl, bl, h)
  return alpha
}

export function continuousScreenMaskDataURL(
  width: number,
  height: number,
  corners: CornerRadii,
  n = CONTINUOUS_SUPERELLIPSE_N,
): string {
  const w = Math.round(width)
  const h = Math.round(height)
  if (w <= 0 || h <= 0) return 'none'

  const key = maskCacheKey(w, h, corners, n)
  const cached = maskCache.get(key)
  if (cached) return cached

  const alpha = buildContinuousAlphaMask(w, h, corners, n)
  const png = encodeAlphaMaskPng(w, h, alpha)
  const url = `url("data:image/png;base64,${bytesToBase64(png)}")`
  maskCache.set(key, url)
  return url
}

export type ContinuousPaintMode = 'continuous-clip' | 'circular-fallback'

function clearElementClipAndMask(el: HTMLElement | null): void {
  if (!el) return
  el.style.removeProperty('clip-path')
  el.style.removeProperty('-webkit-clip-path')
  el.style.removeProperty('mask-image')
  el.style.removeProperty('-webkit-mask-image')
  el.style.removeProperty('mask-size')
  el.style.removeProperty('-webkit-mask-size')
  el.style.removeProperty('mask-mode')
  el.style.removeProperty('-webkit-mask-source-type')
  el.style.removeProperty('overflow')
  el.style.removeProperty('isolation')
  el.style.removeProperty('box-shadow')
}

/**
 * Apply continuous hard clip (Figma path), or fall back to circular CSS radii.
 *
 * Gate: only zero CSS radii when `clip` is a real `path(...)`.
 * `bodyClip` is the outer continuous silhouette (screenCorners + bezel + border
 * + underlap) so black chrome stays rounded and underlaps screen AA.
 */
export function applyContinuousScreenPaint(options: {
  screen: HTMLElement
  body: HTMLElement | null
  hostStyle: CSSStyleDeclaration
  /** @deprecated PNG mask ignored for paint — use `clip`. */
  mask?: string
  clip?: string
  /** Outer continuous clip for `.body` (bezel aesthetics). */
  bodyClip?: string
  /** @deprecated use bodyClip */
  bodyMask?: string
}): ContinuousPaintMode {
  const { screen, body, hostStyle } = options
  const clip = options.clip
    ?? (options.mask && options.mask.startsWith('path(') ? options.mask : undefined)
  const bodyClip = options.bodyClip
    ?? (options.bodyMask && options.bodyMask.startsWith('path(') ? options.bodyMask : undefined)
  const ok = typeof clip === 'string' && clip !== 'none' && clip.startsWith('path(')

  if (!ok) {
    clearElementClipAndMask(screen)
    clearElementClipAndMask(body)
    hostStyle.removeProperty('--device-screen-css-border-radius')
    hostStyle.removeProperty('--device-body-css-border-radius')
    hostStyle.removeProperty('--device-body-overflow')
    hostStyle.setProperty('--device-screen-clip-path', 'none')
    hostStyle.setProperty('--device-screen-continuous-mask', 'none')
    return 'circular-fallback'
  }

  // Hard clip — clear any mask so alpha fringes cannot reappear.
  screen.style.setProperty('mask-image', 'none')
  screen.style.setProperty('-webkit-mask-image', 'none')
  screen.style.clipPath = clip
  screen.style.setProperty('-webkit-clip-path', clip)
  screen.style.setProperty('isolation', 'isolate')
  hostStyle.setProperty('--device-screen-css-border-radius', '0')
  hostStyle.setProperty('--device-body-css-border-radius', '0')
  hostStyle.setProperty('--device-body-overflow', 'hidden')
  hostStyle.setProperty('--device-screen-clip-path', 'none')
  hostStyle.setProperty('--device-screen-continuous-mask', 'none')

  const bodyOk = typeof bodyClip === 'string' && bodyClip !== 'none' && bodyClip.startsWith('path(')
  if (body && bodyOk) {
    body.style.setProperty('mask-image', 'none')
    body.style.setProperty('-webkit-mask-image', 'none')
    body.style.clipPath = bodyClip
    body.style.setProperty('-webkit-clip-path', bodyClip)
    body.style.overflow = 'hidden'
  }
  else if (body) {
    clearElementClipAndMask(body)
    body.style.overflow = 'hidden'
  }
  return 'continuous-clip'
}

/** Clear continuous paint (Android / embedded / non-continuous). */
export function clearContinuousScreenPaint(options: {
  screen: HTMLElement
  body: HTMLElement | null
  hostStyle: CSSStyleDeclaration
}): void {
  const { screen, body, hostStyle } = options
  clearElementClipAndMask(screen)
  clearElementClipAndMask(body)
  hostStyle.removeProperty('--device-screen-css-border-radius')
  hostStyle.removeProperty('--device-body-css-border-radius')
  hostStyle.removeProperty('--device-body-overflow')
}

/**
 * Outer continuous corners for `.body` (screen corners + bezel + hairline).
 * Uses max(adjacent insets) so dark chrome fully underlaps the screen curve.
 */
export function continuousBodyCorners(
  screenCorners: CornerRadii,
  bezelInsets: { top: number, right: number, bottom: number, left: number },
  borderWidth: number,
  /** Extra CSS-px so dark chrome underlaps screen clip AA against the page. */
  underlap = 2,
): CornerRadii {
  const b = Math.max(0, borderWidth) + Math.max(0, underlap)
  return {
    topLeft: screenCorners.topLeft + Math.max(bezelInsets.left, bezelInsets.top) + b,
    topRight: screenCorners.topRight + Math.max(bezelInsets.right, bezelInsets.top) + b,
    bottomRight: screenCorners.bottomRight + Math.max(bezelInsets.right, bezelInsets.bottom) + b,
    bottomLeft: screenCorners.bottomLeft + Math.max(bezelInsets.left, bezelInsets.bottom) + b,
  }
}

/** @deprecated SVG path mask — kept for tests; do not use for painting. */
export function continuousScreenMaskImage(
  width: number,
  height: number,
  corners: CornerRadii,
): string {
  if (width <= 0 || height <= 0) return 'none'
  const d = continuousRoundedRectPath(width, height, corners)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<path fill="#fff" d="${d}"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/**
 * Authoritative continuous clip-path value (Figma ξ≈0.6).
 * Prefer this over PNG mask for paint.
 */
export function continuousScreenClipPath(
  width: number,
  height: number,
  corners: CornerRadii,
): string {
  return figmaContinuousClipPath(width, height, corners)
}
