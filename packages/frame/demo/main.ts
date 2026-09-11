/**
 * The package's own preview page: every attribute and every slot of
 * <device-frame> wired to a control, with the numbers it resolves printed
 * alongside as they change.
 *
 * It imports the package by name, which the workspace resolves to ../src
 * rather than the build output, so an edit to the source shows up on the next
 * refresh — and the demo exercises the same entry point a consumer gets.
 */
import { DEVICES, type DeviceOS } from '@devicekit/devices'
import {
  CONTENT_RECT_CHANGE_EVENT,
  defineDeviceFrame,
  type ContentRect,
  type DeviceFrameElement,
} from '@devicekit/frame'
import { overflowsViewport, scaleFor, scaleLabel, scaledViewport, type DemoScaleMode } from '../src/demo-scale.js'
import { DEMO_DEFAULT_DEVICE_NAME, newestDevicesFirst } from '../src/demo-device-order.js'
import { demoPageMetadata } from '../src/demo-page-metadata.js'
import { devicePath } from '../src/demo-device-url.js'
import { applyDeviceTheme } from './device-theme.js'
import {
  applyDemoTheme,
  statusBarTextStyleForTheme,
  type DemoTheme,
} from './theme.js'
import {
  defineDemoComponents,
  H5_NAVIGATION_TAG,
  MINI_PROGRAM_NAVIGATION_TAG,
  TAB_BAR_TAG,
} from './components/index.js'

defineDeviceFrame()
defineDemoComponents()

const OS_LABEL: Record<DeviceOS, string> = { ios: 'iOS', android: 'Android', harmony: 'HarmonyOS' }
/** Blank space kept around the stage; the auto-fit scale has to leave this much. */
const STAGE_MARGIN = 48

function need<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (element === null) throw new Error(`the demo page has no #${id}`)
  return element as T
}

function templateChild(id: string): HTMLElement {
  const node = need<HTMLTemplateElement>(id).content.firstElementChild
  if (!(node instanceof HTMLElement)) throw new Error(`the demo template #${id} is empty`)
  return node
}

const frame = need<HTMLElement>('frame') as DeviceFrameElement
const stage = need('stage')
const viewport = need('viewport')
const scaler = need('scaler')
const deviceSelect = need<HTMLSelectElement>('device')
const orientationSelect = need<HTMLSelectElement>('orientation')
const navigationSelect = need<HTMLSelectElement>('navigation-bar')
const statusBarSelect = need<HTMLSelectElement>('status-bar')
const textStyleSelect = need<HTMLSelectElement>('status-bar-text-style')
const statusBarBackgroundInput = need<HTMLInputElement>('status-bar-background')
const tabBarInput = need<HTMLInputElement>('tab-bar')
const tabBarHeightInput = need<HTMLInputElement>('tab-bar-height')
const immersiveInput = need<HTMLInputElement>('immersive')
const embeddedInput = need<HTMLInputElement>('embedded')
const safeAreaInput = need<HTMLInputElement>('show-safe-area')
const themeToggle = need<HTMLButtonElement>('theme-toggle')
const zoomSelect = need<HTMLSelectElement>('zoom')
const zoomValue = need<HTMLOutputElement>('zoom-value')
const eventsValue = need<HTMLOutputElement>('events')
const contentRectPre = need('content-rect')
const metricsPre = need('metrics')
const pageSize = need('page-size')
const deviceThemeValue = need<HTMLOutputElement>('device-theme')
const demoTitle = need('demo-title')
const demoIntro = need('demo-intro')
const pageDescription = need<HTMLMetaElement>('page-description')
const canonicalUrl = need<HTMLLinkElement>('canonical-url')
const deviceJsonLd = need<HTMLScriptElement>('device-jsonld')

const bars = {
  mp: document.createElement(MINI_PROGRAM_NAVIGATION_TAG),
  h5: document.createElement(H5_NAVIGATION_TAG),
  tab: document.createElement(TAB_BAR_TAG),
}
bars.mp.setAttribute('title', 'Cart')
bars.h5.setAttribute('title', 'Campaign details')
bars.tab.setAttribute('active', 'home')

const safeAreaOverlay = templateChild('tpl-safe-area')
const safeAreaBands = {
  top: safeAreaOverlay.querySelector<HTMLElement>('.safe-area-overlay__band--top span'),
  right: safeAreaOverlay.querySelector<HTMLElement>('.safe-area-overlay__band--right span'),
  bottom: safeAreaOverlay.querySelector<HTMLElement>('.safe-area-overlay__band--bottom span'),
  left: safeAreaOverlay.querySelector<HTMLElement>('.safe-area-overlay__band--left span'),
} as const

let showingDeviceMetadata = document.body.dataset.initialDevice !== undefined || deviceForLocation() !== undefined

function fillDevices(): void {
  for (const os of ['ios', 'android', 'harmony'] as const) {
    const group = document.createElement('optgroup')
    group.label = OS_LABEL[os]
    for (const device of newestDevicesFirst(DEVICES.filter((candidate) => candidate.os === os))) {
      const option = document.createElement('option')
      option.value = device.name
      option.textContent = `${device.name} · ${device.screen.width}×${device.screen.height}@${device.pixelRatio}`
      group.append(option)
    }
    deviceSelect.append(group)
  }
}

function devicePathname(name: string): string {
  const marker = '/devices/'
  const deviceIndex = window.location.pathname.indexOf(marker)
  const basePath = deviceIndex === -1
    ? window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`
    : window.location.pathname.slice(0, deviceIndex + 1)
  return new URL(devicePath(name), new URL(basePath, window.location.origin)).pathname
}

function deviceForLocation() {
  return DEVICES.find((device) => devicePathname(device.name) === window.location.pathname)
}

function syncPageMetadata(device?: (typeof DEVICES)[number]): void {
  const metadata = demoPageMetadata(device)
  demoTitle.textContent = metadata.heading
  demoIntro.textContent = metadata.intro
  document.title = metadata.title
  pageDescription.content = metadata.description
  canonicalUrl.href = metadata.canonical
  deviceJsonLd.textContent = JSON.stringify(metadata.jsonLd)
}

function pushDeviceUrl(): void {
  const pathname = devicePathname(deviceSelect.value)
  if (window.location.pathname !== pathname) history.pushState({ device: deviceSelect.value }, '', pathname)
}

function setOrRemove(name: string, value: string): void {
  if (value === '') frame.removeAttribute(name)
  else frame.setAttribute(name, value)
}

/**
 * A slot counts as filled or empty, so turning a bar off means taking its node
 * out of the DOM. Merely hiding it still leaves it assigned to the slot, and
 * the frame goes on charging the page for its height.
 */
function syncSlot(active: HTMLElement | null, candidates: HTMLElement[]): void {
  for (const node of candidates) {
    if (node !== active) node.remove()
  }
  if (active !== null && active.parentElement !== frame) frame.append(active)
}

function report(rect: ContentRect = frame.contentRect): void {
  const metrics = frame.metrics
  contentRectPre.textContent = JSON.stringify(rect, null, 2)
  metricsPre.textContent = JSON.stringify(metrics, null, 2)
  pageSize.textContent = `metrics.window ${metrics.window.width} × ${metrics.window.height}`

  const insets = metrics.safeAreaInsets
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const label = safeAreaBands[side]
    if (!label) continue
    label.textContent = `${insets[side]}px`
    // A zero-size band has no room for its label, and the text would spill past
    // the screen edge; a side with no inset shows nothing.
    const band = label.parentElement
    if (band) band.hidden = insets[side] === 0
  }
}

/** Fit is one mode; explicit percentages use host CSS pixels directly. */
function layout(): void {
  scaler.style.transform = 'none'
  const fit = Math.min(
    1,
    (stage.clientWidth - STAGE_MARGIN) / scaler.offsetWidth,
    (stage.clientHeight - STAGE_MARGIN) / scaler.offsetHeight,
  )
  const mode = zoomSelect.value as DemoScaleMode
  const scale = scaleFor(mode, fit > 0 ? fit : 1)
  const footprint = scaledViewport({ width: scaler.offsetWidth, height: scaler.offsetHeight }, scale)
  const overflow = overflowsViewport(footprint, { width: stage.clientWidth, height: stage.clientHeight })
  zoomValue.value = scaleLabel(mode, fit > 0 ? fit : 1)
  stage.classList.toggle('stage--overflow', overflow)
  viewport.style.width = `${footprint.width}px`
  viewport.style.height = `${footprint.height}px`
  scaler.style.transform = `scale(${scale})`
  if (!overflow) {
    stage.scrollLeft = 0
    stage.scrollTop = 0
  }

  // Zooming is a transform the host applies on its own side: the element's box
  // is not resized, so its ResizeObserver stays quiet. The rect did move, so
  // read it once here.
  report()
}

function apply(): void {
  frame.setAttribute('device', deviceSelect.value)
  frame.setAttribute('orientation', orientationSelect.value)
  const device = DEVICES.find((candidate) => candidate.name === deviceSelect.value)
  if (device === undefined) throw new Error(`unknown demo device ${deviceSelect.value}`)
  const deviceTheme = applyDeviceTheme([frame, bars.mp, bars.h5, bars.tab], device, selectedTheme())
  deviceThemeValue.value = `${deviceTheme.label} · ${deviceTheme.system} · ${deviceTheme.library} · ${deviceTheme.appearance}`
  for (const navigation of [bars.mp, bars.h5]) navigation.setAttribute('device-os', device?.os ?? 'ios')
  frame.toggleAttribute('immersive', immersiveInput.checked)
  frame.toggleAttribute('embedded', embeddedInput.checked)
  setOrRemove('status-bar', statusBarSelect.value)
  setOrRemove('status-bar-text-style', textStyleSelect.value)
  setOrRemove('status-bar-background', statusBarBackgroundInput.value)

  // A real tab bar absorbs the gesture-bar inset itself, so an empty input
  // means "size it the way a real one would" rather than "no bar at all" —
  // recomputed here so it tracks orientation and immersive changes too.
  const explicitTabBarHeight = tabBarHeightInput.value
  frame.setAttribute(
    'tab-bar-height',
    explicitTabBarHeight !== '' ? explicitTabBarHeight : String(50 + frame.metrics.safeAreaInsets.bottom),
  )

  const navigationBar = navigationSelect.value === 'none' ? null : bars[navigationSelect.value as 'mp' | 'h5']
  syncSlot(navigationBar, [bars.mp, bars.h5])
  syncSlot(tabBarInput.checked ? bars.tab : null, [bars.tab])
  syncSlot(safeAreaInput.checked ? safeAreaOverlay : null, [safeAreaOverlay])

  scaler.classList.toggle('stage__scaler--embedded', embeddedInput.checked)
  syncPageMetadata(showingDeviceMetadata ? device : undefined)
  layout()
}

function selectedTheme(): DemoTheme {
  return (document.documentElement.dataset.theme ?? 'light') as DemoTheme
}

function syncThemeToggle(theme: DemoTheme): void {
  const nextTheme = theme === 'light' ? 'dark' : 'light'
  themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`)
  themeToggle.dataset.theme = theme
}

function syncStatusBarTextStyle(): void {
  textStyleSelect.value = statusBarTextStyleForTheme(selectedTheme())
}

let bootstrapped = false

/** Installs the demo controls once after Astro has parsed the page. */
export function bootstrapDemo(): void {
  if (bootstrapped) return
  bootstrapped = true

  let events = 0
  frame.addEventListener(CONTENT_RECT_CHANGE_EVENT, (event) => {
    events += 1
    eventsValue.value = String(events)
    report((event as CustomEvent<ContentRect>).detail)
  })

  for (const control of [
    orientationSelect,
    statusBarSelect,
    textStyleSelect,
    tabBarInput,
    tabBarHeightInput,
    immersiveInput,
    embeddedInput,
    safeAreaInput,
  ]) {
    control.addEventListener('change', apply)
  }
  deviceSelect.addEventListener('change', () => {
    showingDeviceMetadata = true
    pushDeviceUrl()
    apply()
  })
  themeToggle.addEventListener('click', () => {
    const theme = selectedTheme() === 'light' ? 'dark' : 'light'
    applyDemoTheme(theme)
    syncThemeToggle(theme)
    syncStatusBarTextStyle()
    apply()
  })
  navigationSelect.addEventListener('change', apply)
  statusBarBackgroundInput.addEventListener('input', apply)
  tabBarHeightInput.addEventListener('input', apply)
  zoomSelect.addEventListener('change', layout)
  window.addEventListener('resize', layout)
  window.addEventListener('popstate', () => {
    const device = deviceForLocation()
    showingDeviceMetadata = device !== undefined
    deviceSelect.value = device?.name ?? DEMO_DEFAULT_DEVICE_NAME
    apply()
  })

  fillDevices()
  deviceSelect.value = document.body.dataset.initialDevice ?? deviceForLocation()?.name ?? DEMO_DEFAULT_DEVICE_NAME
  navigationSelect.value = 'mp'
  tabBarInput.checked = true
  applyDemoTheme('light')
  syncThemeToggle('light')
  syncStatusBarTextStyle()
  apply()
}
