/**
 * 这个包自带的预览页：把 <dimina-device-frame> 的每个属性、每个插槽都摆出来点一遍，
 * 顺便把它算出来的数字实时打在旁边。
 *
 * 它直接引 ../src，不引构建产物——改了源码刷新就能看见。
 */
import { DEFAULT_DEVICE, DEVICES, type DeviceOS } from '@devicekit/devices'
import {
  CONTENT_RECT_CHANGE_EVENT,
  defineDeviceFrame,
  type ContentRect,
  type DiminaDeviceFrame,
} from '../src/index.js'

defineDeviceFrame()

const OS_LABEL: Record<DeviceOS, string> = { ios: 'iOS', android: 'Android', harmony: 'HarmonyOS' }
/** 舞台四周留出的空白，自动缩放时按这个算装不装得下。 */
const STAGE_MARGIN = 48

function need<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (element === null) throw new Error(`预览页缺少 #${id}`)
  return element as T
}

function templateChild(id: string): HTMLElement {
  const node = need<HTMLTemplateElement>(id).content.firstElementChild
  if (!(node instanceof HTMLElement)) throw new Error(`预览页模板 #${id} 是空的`)
  return node
}

const frame = need<HTMLElement>('frame') as DiminaDeviceFrame
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
 * 插槽是「有没有内容」说了算的，所以关掉一条栏得把节点从 DOM 里拿走。
 * 光把它 hidden 起来，它仍然算插槽里的内容，那段高度照样被扣。
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

/** 先按舞台大小缩到装得下，再乘滑杆上的倍数。 */
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

  // 缩放是宿主在自己这边做的变形，元素自己的盒子没变大小，ResizeObserver 不会响；
  // 位置确实动了，所以这里主动读一次。
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
