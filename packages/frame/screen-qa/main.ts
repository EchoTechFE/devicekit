/**
 * Renders device screens with content painted into every corner so a headless
 * Chrome (or browser) can screenshot continuous/circular clip fidelity.
 *
 * Uses `immersive` so the default slot covers the full screen (including under
 * the transparent status bar). Without that, top content starts below the
 * status strip and the continuous corner reads as a white horizontal "cap".
 *
 * URL modes:
 *   /                    — Classic P0 six (default, fast local check)
 *   /?all=1              — every preset in DEVICES
 *   /?device=<exact name> — single device (exact `DeviceProfile.name`)
 *
 * Serve: from repo root,
 *   pnpm --filter @devicekit/frame exec vite --config screen-qa/vite.config.ts
 * or see ./README.md.
 */
import { defineDeviceFrame, type DeviceFrameElement } from '@devicekit/frame'
import { DEVICES, findDevice, resolveDevice } from '@devicekit/devices'

defineDeviceFrame()

const CLASSIC_DEFAULT = [
  'iPhone 17 Pro',
  'iPhone Duo (outer)',
  'iPhone Duo (inner)',
  'Galaxy S24',
  'Galaxy S24 Ultra',
  'Pixel 9 Pro',
] as const

/** Corner pad must exceed the largest continuous screen radius (~62). */
const CORNER_PAD_PX = 140

function namesFromQuery(): string[] {
  const params = new URLSearchParams(location.search)
  const single = params.get('device')
  if (single !== null && single !== '') {
    return [single]
  }
  if (params.get('all') === '1' || params.get('all') === 'true') {
    return DEVICES.map((d) => d.name)
  }
  return [...CLASSIC_DEFAULT]
}

function buildCard(name: string): HTMLElement {
  const profile = findDevice(name)
  if (!profile) {
    const missing = document.createElement('div')
    missing.className = 'card card--missing'
    missing.dataset.device = name
    missing.dataset.error = 'missing'
    missing.textContent = `missing preset: ${name}`
    return missing
  }
  const resolved = resolveDevice(profile)

  const card = document.createElement('div')
  card.className = 'card'
  card.dataset.device = name
  card.dataset.os = resolved.os
  card.dataset.width = String(resolved.screen.width)
  card.dataset.height = String(resolved.screen.height)
  card.dataset.radius = String(resolved.shell.screenRadius)
  card.dataset.curve = resolved.shell.cornerCurve

  const label = document.createElement('div')
  label.className = 'card__label'
  const corners = resolved.shell.screenCorners
  label.textContent =
    `${name} · ${resolved.screen.width}×${resolved.screen.height}` +
    ` · r=${resolved.shell.screenRadius}` +
    (corners.topLeft !== corners.topRight ||
    corners.topRight !== corners.bottomRight ||
    corners.bottomRight !== corners.bottomLeft
      ? ` (${corners.topLeft}/${corners.topRight}/${corners.bottomRight}/${corners.bottomLeft})`
      : '') +
    ` · ${resolved.shell.cornerCurve}`

  const frame = document.createElement('device-frame') as DeviceFrameElement
  frame.setAttribute('device', name)
  frame.setAttribute('status-bar', '9:41')
  // Edge-to-edge: colored pads fill under the status bar into the squircle.
  frame.setAttribute('immersive', '')
  // Fallback if a pad fails to cover — mid stripe, not pure white.
  frame.style.setProperty('--device-screen-background', '#e9ecef')
  frame.style.setProperty('--qa-corner-pad', `${CORNER_PAD_PX}px`)

  const fill = document.createElement('div')
  fill.className = 'corner-fill'
  fill.style.position = 'relative'
  const meta = document.createElement('div')
  meta.className = 'corner-fill__meta'
  meta.textContent =
    `safe ${resolved.safeAreaInsets.top}/${resolved.safeAreaInsets.right}/` +
    `${resolved.safeAreaInsets.bottom}/${resolved.safeAreaInsets.left}` +
    (resolved.cutout
      ? ` · cutout ${resolved.cutout.shape} ${resolved.cutout.width}×${resolved.cutout.height}`
      : ' · no cutout') +
    ' · immersive'
  fill.append(meta)
  frame.append(fill)

  card.append(label, frame)
  return card
}

const gallery = document.getElementById('gallery')
if (!gallery) throw new Error('#gallery missing')

const names = namesFromQuery()
document.documentElement.dataset.mode =
  new URLSearchParams(location.search).get('device')
    ? 'single'
    : new URLSearchParams(location.search).get('all')
      ? 'all'
      : 'classic'

const headerMeta = document.querySelector('header p')
if (headerMeta && names.length) {
  headerMeta.append(
    document.createTextNode(` · rendering ${names.length} device${names.length === 1 ? '' : 's'}`),
  )
}

for (const name of names) gallery.append(buildCard(name))

// Signal for headless capture scripts once custom elements + layout settle.
void customElements.whenDefined('device-frame').then(async () => {
  await document.fonts.ready
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
  document.documentElement.dataset.qaReady = '1'
  document.documentElement.dataset.qaCount = String(
    gallery.querySelectorAll('.card[data-device]:not([data-error])').length,
  )
})
