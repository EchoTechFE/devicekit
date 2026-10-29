#!/usr/bin/env node
/**
 * Full non-iOS home-indicator audit via headless Chrome (puppeteer-core).
 * For every android+harmony device: open screen-qa, assert .home-indicator is
 * hidden in shadow DOM, and record bottomSafe / statusBarStyle / cornerCurve.
 * Also probes iOS Duo outer+inner for expected visible pill.
 *
 * Writes:
 *   /workspace/devicekit-qa-shots/all-devices/NON-IOS-HOME-INDICATOR.json
 *   /workspace/devicekit-qa-shots/all-devices/NON-IOS-CHROME-AUDIT.md  (partial; research appended later)
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire('/tmp/shot-tools/package.json')
const puppeteer = require('puppeteer-core')

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5179'
const OUT_DIR = process.env.OUT_DIR ?? '/workspace/devicekit-qa-shots/all-devices'
const CHROME = process.env.CHROME ?? '/usr/bin/google-chrome'
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 4)

async function loadDeviceNames() {
  const genPath = path.join(repoRoot, 'packages/devices/src/device-names.generated.ts')
  const text = await fs.readFile(genPath, 'utf8')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  const body = text.slice(start, end + 1)
  return [...body.matchAll(/:\s*'((?:\\'|[^'])*)'/g)].map((m) => m[1].replace(/\\'/g, "'"))
}

async function loadOsMap() {
  // Parse presets lightly: name + os from android/harmony/ios.ts
  const map = new Map()
  for (const file of ['android.ts', 'harmony.ts', 'ios.ts']) {
    const text = await fs.readFile(path.join(repoRoot, 'packages/devices/src/presets', file), 'utf8')
    const osDefault = file.startsWith('android') ? 'android' : file.startsWith('harmony') ? 'harmony' : 'ios'
    // Each device block has name: '...' and os: '...'
    const blocks = text.split(/\n  \{\n/)
    for (const block of blocks) {
      const nameM = block.match(/name:\s*'((?:\\'|[^'])*)'/)
      if (!nameM) continue
      const osM = block.match(/os:\s*'(\w+)'/)
      map.set(nameM[1].replace(/\\'/g, "'"), osM?.[1] ?? osDefault)
    }
  }
  return map
}

async function waitQaReady(page, timeout = 45000) {
  await page.waitForFunction(
    () => document.documentElement.dataset.qaReady === '1',
    { timeout },
  )
}

async function probeOne(browser, name, expectedOs) {
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 900, height: 1600, deviceScaleFactor: 1 })
    const url = `${BASE_URL}/?device=${encodeURIComponent(name)}`
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await waitQaReady(page)
    const missing = await page.$('.card--missing')
    if (missing) {
      return { name, os: expectedOs, pass: false, error: 'missing preset' }
    }
    const info = await page.evaluate(() => {
      const host = document.querySelector('device-frame')
      if (!host?.shadowRoot) return { error: 'no device-frame shadow' }
      const hi = host.shadowRoot.querySelector('.home-indicator')
      const sb = host.shadowRoot.querySelector('.status-bar')
      const screen = host.shadowRoot.querySelector('.screen')
      const bottomSafe = host.style.getPropertyValue('--device-safe-area-bottom')
      const curve = host.dataset?.curve
        ?? host.style.getPropertyValue('--device-corner-curve')
        ?? ''
      // computed visibility of ::before is not directly available; use hidden + getComputedStyle
      const hiHidden = Boolean(!hi || hi.hidden || hi.hasAttribute('hidden'))
      let beforeDisplay = null
      let beforeContent = null
      if (hi && !hi.hidden) {
        const cs = getComputedStyle(hi, '::before')
        beforeDisplay = cs.display
        beforeContent = cs.content
      }
      const statusStyle = sb?.dataset?.style ?? null
      const notch = host.shadowRoot.querySelector('.status-bar__notch')
      const notchHidden = !notch || notch.hidden
      return {
        hiHidden,
        beforeDisplay,
        beforeContent,
        bottomSafe,
        statusStyle,
        notchHidden,
        osAttr: host.getAttribute('os') || host.dataset?.os || null,
        cardOs: document.querySelector('.card[data-device]')?.dataset?.os ?? null,
        cardCurve: document.querySelector('.card[data-device]')?.dataset?.curve ?? null,
        screenMask: screen?.style?.webkitMaskImage || screen?.style?.maskImage || '',
      }
    })
    if (info.error) return { name, os: expectedOs, pass: false, error: info.error }

    const bottomPx = Number.parseFloat(String(info.bottomSafe || '0')) || 0
    const isIos = expectedOs === 'ios'
    // Non-iOS must hide; iOS with bottom>0 must show
    let pass
    let expectHidden
    if (!isIos) {
      expectHidden = true
      pass = info.hiHidden === true
    } else {
      expectHidden = bottomPx <= 0
      pass = info.hiHidden === expectHidden
    }

    // Chrome bleed flags for non-iOS
    const bleed = []
    if (!isIos) {
      if (info.cardCurve === 'continuous') bleed.push('cornerCurve=continuous')
      if (info.statusStyle === 'ios') bleed.push('statusBarStyle=ios')
      if (!info.hiHidden) bleed.push('home-indicator-visible')
    }

    return {
      name,
      os: expectedOs,
      bottomSafe: bottomPx,
      hiHidden: info.hiHidden,
      expectHidden,
      pass,
      statusBarStyle: info.statusStyle,
      cornerCurve: info.cardCurve,
      notchHidden: info.notchHidden,
      bleed,
    }
  } catch (err) {
    return { name, os: expectedOs, pass: false, error: String(err?.message ?? err) }
  } finally {
    await page.close().catch(() => {})
  }
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return results
}

async function main() {
  const names = await loadDeviceNames()
  const osMap = await loadOsMap()
  await fs.mkdir(OUT_DIR, { recursive: true })

  const nonIos = names.filter((n) => (osMap.get(n) ?? 'ios') !== 'ios')
  const duo = names.filter((n) => n.startsWith('iPhone Duo'))
  const targets = [...nonIos, ...duo]

  console.log(`nonIos=${nonIos.length} duo=${duo.length} base=${BASE_URL}`)

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  })

  let results
  try {
    results = await mapPool(targets, CONCURRENCY, async (name) => {
      const os = osMap.get(name) ?? 'unknown'
      const r = await probeOne(browser, name, os)
      const mark = r.pass ? 'PASS' : 'FAIL'
      console.log(`${mark} ${name} hiHidden=${r.hiHidden} bottom=${r.bottomSafe} ${r.bleed?.length ? 'bleed=' + r.bleed.join(',') : ''}${r.error ? ' err=' + r.error : ''}`)
      return r
    })
  } finally {
    await browser.close()
  }

  const nonIosResults = results.filter((r) => r.os !== 'ios')
  const duoResults = results.filter((r) => r.os === 'ios')
  const pass = nonIosResults.filter((r) => r.pass)
  const fail = nonIosResults.filter((r) => !r.pass)
  const bleedHits = nonIosResults.filter((r) => (r.bleed?.length ?? 0) > 0)

  const json = {
    generated: new Date().toISOString(),
    baseUrl: BASE_URL,
    nonIosTotal: nonIosResults.length,
    nonIosPass: pass.length,
    nonIosFail: fail.length,
    bleedHits: bleedHits.length,
    duo: duoResults,
    devices: nonIosResults,
  }
  await fs.writeFile(path.join(OUT_DIR, 'NON-IOS-HOME-INDICATOR.json'), JSON.stringify(json, null, 2))
  console.log(`\nnon-iOS home-indicator: ${pass.length}/${nonIosResults.length} pass, bleed=${bleedHits.length}`)
  console.log('Duo:', duoResults.map((r) => `${r.name}: hiHidden=${r.hiHidden} pass=${r.pass}`).join('; '))
  if (fail.length) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
