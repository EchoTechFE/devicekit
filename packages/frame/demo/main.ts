/**
 * The package's own preview page: every attribute and every slot of
 * <device-frame> wired to a control, with the numbers it resolves printed
 * alongside as they change.
 *
 * It imports ../src rather than the build output, so an edit to the source
 * shows up on the next refresh.
 */
import { DEFAULT_DEVICE, DEVICES, type DeviceOS } from '@devicekit/devices'
import {
  CONTENT_RECT_CHANGE_EVENT,
  defineDeviceFrame,
  type ContentRect,
  type DeviceFrameElement,
} from '../src/index.js'

defineDeviceFrame()

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
const darkPageInput = need<HTMLInputElement>('dark-page')
const zoomInput = need<HTMLInputElement>('zoom')
const zoomValue = need<HTMLOutputElement>('zoom-value')
const eventsValue = need<HTMLOutputElement>('events')
const contentRectPre = need('content-rect')
const metricsPre = need('metrics')
const pageSize = need('page-size')

const bars = {
  mp: templateChild('tpl-mp'),
  h5: templateChild('tpl-h5'),
  tab: templateChild('tpl-tab'),
}

const safeAreaOverlay = templateChild('tpl-safe-area')
const safeAreaBands = {
  top: safeAreaOverlay.querySelector<HTMLElement>('.safe-area-overlay__band--top span'),
  right: safeAreaOverlay.querySelector<HTMLElement>('.safe-area-overlay__band--right span'),
  bottom: safeAreaOverlay.querySelector<HTMLElement>('.safe-area-overlay__band--bottom span'),
  left: safeAreaOverlay.querySelector<HTMLElement>('.safe-area-overlay__band--left span'),
} as const

function fillDevices(): void {
  for (const os of ['ios', 'android', 'harmony'] as const) {
    const group = document.createElement('optgroup')
    group.label = OS_LABEL[os]
    for (const device of DEVICES.filter((candidate) => candidate.os === os)) {
      const option = document.createElement('option')
      option.value = device.name
      option.textContent = `${device.name} · ${device.screen.width}×${device.screen.height}@${device.pixelRatio}`
      group.append(option)
    }
    deviceSelect.append(group)
  }
  deviceSelect.value = DEFAULT_DEVICE.name
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

/** Scale down to fit the stage first, then multiply by the slider. */
function layout(): void {
  const zoom = Number(zoomInput.value)
  zoomValue.value = `${Math.round(zoom * 100)}%`

  scaler.style.transform = 'none'
  const fit = Math.min(
    1,
    (stage.clientWidth - STAGE_MARGIN) / scaler.offsetWidth,
    (stage.clientHeight - STAGE_MARGIN) / scaler.offsetHeight,
  )
  scaler.style.transform = `scale(${(fit > 0 ? fit : 1) * zoom})`

  // Zooming is a transform the host applies on its own side: the element's box
  // is not resized, so its ResizeObserver stays quiet. The rect did move, so
  // read it once here.
  report()
}

function apply(): void {
  frame.setAttribute('device', deviceSelect.value)
  frame.setAttribute('orientation', orientationSelect.value)
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

  document.body.classList.toggle('demo-dark-page', darkPageInput.checked)

  scaler.classList.toggle('stage__scaler--embedded', embeddedInput.checked)
  layout()
}

// The checkbox drives the dropdown, not the other way round: it only writes
// status-bar-text-style at the moment it is toggled, so a user who changes the
// dropdown by hand afterwards keeps that choice through unrelated re-renders.
darkPageInput.addEventListener('change', () => {
  textStyleSelect.value = darkPageInput.checked ? 'white' : 'black'
})

let events = 0
frame.addEventListener(CONTENT_RECT_CHANGE_EVENT, (event) => {
  events += 1
  eventsValue.value = String(events)
  report((event as CustomEvent<ContentRect>).detail)
})

for (const control of [
  deviceSelect,
  orientationSelect,
  navigationSelect,
  statusBarSelect,
  textStyleSelect,
  tabBarInput,
  tabBarHeightInput,
  immersiveInput,
  embeddedInput,
  safeAreaInput,
  darkPageInput,
]) {
  control.addEventListener('change', apply)
}
statusBarBackgroundInput.addEventListener('input', apply)
tabBarHeightInput.addEventListener('input', apply)
zoomInput.addEventListener('input', layout)
window.addEventListener('resize', layout)

fillDevices()
navigationSelect.value = 'mp'
tabBarInput.checked = true
apply()
