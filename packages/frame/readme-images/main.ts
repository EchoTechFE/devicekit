/**
 * Fills #portrait-row and #landscape-row with <device-frame> elements
 * around a placeholder mini-program screen, cloned from the templates in
 * index.html. scripts/render-readme-images.mjs loads this page and
 * screenshots each row.
 */
import { DEVICE_NAMES } from '@devicekit/devices'
import { defineDeviceFrame, type DeviceFrameElement } from '@devicekit/frame'

defineDeviceFrame()

function need<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)
  if (element === null) throw new Error(`the page has no #${id}`)
  return element as T
}

function cloneTemplate(id: string): DocumentFragment {
  return need<HTMLTemplateElement>(id).content.cloneNode(true) as DocumentFragment
}

function buildDeviceFrame(device: string, orientation: 'portrait' | 'landscape'): DeviceFrameElement {
  const frame = document.createElement('device-frame') as DeviceFrameElement
  frame.setAttribute('device', device)
  frame.setAttribute('orientation', orientation)
  frame.append(cloneTemplate('tpl-nav'), cloneTemplate('tpl-cards'), cloneTemplate('tpl-tab-bar'))
  return frame
}

const portraitRow = need('portrait-row')
for (const device of [
  DEVICE_NAMES.iPhone_16_Pro,
  DEVICE_NAMES.Galaxy_S24_Ultra,
  DEVICE_NAMES.Pixel_9_Pro,
  DEVICE_NAMES.HUAWEI_Mate_60_Pro,
  DEVICE_NAMES.iPhone_SE_3rd_gen,
] as const) {
  portraitRow.append(buildDeviceFrame(device, 'portrait'))
}

const landscapeRow = need('landscape-row')
for (const device of [DEVICE_NAMES.iPhone_16_Pro, DEVICE_NAMES.Pixel_9_Pro] as const) {
  landscapeRow.append(buildDeviceFrame(device, 'landscape'))
}
