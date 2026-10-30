#!/usr/bin/env node
/**
 * Headless Chrome capture of every DEVICES preset via screen-qa.
 * Uses a separate google-chrome process (puppeteer-core), not the desktop browser.
 *
 * Usage:
 *   node scripts/shot-all-devices.mjs
 *   BASE_URL=http://127.0.0.1:5179 OUT_DIR=/workspace/devicekit-qa-shots/all-devices \
 *     node scripts/shot-all-devices.mjs
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
const INVENTORY =
  process.env.INVENTORY ?? '/workspace/devicekit-qa-shots/full-device-audit/INVENTORY.json'
const CHROME = process.env.CHROME ?? '/usr/bin/google-chrome'
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 4)

function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[^\w.\-+]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .toLowerCase()
}

async function loadDeviceNames() {
  // Prefer generated names (always in sync with DEVICES) without a TS loader.
  // device-names.generated.ts exports `DEVICE_NAMES = { Key: 'Display Name', ... }`.
  const genPath = path.join(repoRoot, 'packages/devices/src/device-names.generated.ts')
  const text = await fs.readFile(genPath, 'utf8')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  const body = text.slice(start, end + 1)
  // Values only: lines like `  iPhone_SE: 'iPhone SE',`
  return [...body.matchAll(/:\s*'((?:\\'|[^'])*)'/g)].map((m) => m[1].replace(/\\'/g, "'"))
}

async function loadInventory() {
  try {
    const raw = JSON.parse(await fs.readFile(INVENTORY, 'utf8'))
    return new Map(raw.map((row) => [row.name, row]))
  } catch {
    return new Map()
  }
}

async function waitQaReady(page, timeout = 45000) {
  await page.waitForFunction(
    () => document.documentElement.dataset.qaReady === '1',
    { timeout },
  )
}

async function shotOne(browser, name, outPath) {
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 900, height: 1600, deviceScaleFactor: 2 })
    const url = `${BASE_URL}/?device=${encodeURIComponent(name)}`
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await waitQaReady(page)
    const card = await page.$('.card[data-device]:not([data-error])')
    if (!card) {
      const missing = await page.$('.card--missing')
      if (missing) {
        return { name, ok: false, error: 'missing preset', path: null }
      }
      return { name, ok: false, error: 'card not found', path: null }
    }
    // Pad viewport if the device (tablet / fold inner) is taller than default.
    const box = await card.boundingBox()
    if (box) {
      const needW = Math.ceil(box.x + box.width + 32)
      const needH = Math.ceil(box.y + box.height + 32)
      const vp = page.viewport()
      if (needW > vp.width || needH > vp.height) {
        await page.setViewport({
          width: Math.max(vp.width, needW),
          height: Math.max(vp.height, needH),
          deviceScaleFactor: 2,
        })
        await waitQaReady(page)
      }
    }
    await card.screenshot({ path: outPath, type: 'png' })
    const st = await fs.stat(outPath)
    if (st.size < 500) {
      return { name, ok: false, error: `png too small (${st.size} B)`, path: outPath }
    }
    const meta = await page.$eval('.card[data-device]:not([data-error])', (el) => ({
      width: el.dataset.width,
      height: el.dataset.height,
      radius: el.dataset.radius,
      curve: el.dataset.curve,
      os: el.dataset.os,
    }))
    return { name, ok: true, path: outPath, ...meta, bytes: st.size }
  } catch (err) {
    return { name, ok: false, error: String(err?.message ?? err), path: null }
  } finally {
    await page.close().catch(() => {})
  }
}

async function mapPool(items, limit, fn) {
  const results = Array.from({ length: items.length })
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
  const inventory = await loadInventory()
  await fs.mkdir(OUT_DIR, { recursive: true })

  // Clear prior PNGs only when FORCE=1
  if (process.env.FORCE === '1') {
    for (const ent of await fs.readdir(OUT_DIR)) {
      if (ent.endsWith('.png')) await fs.unlink(path.join(OUT_DIR, ent))
    }
  }

  console.log(`devices=${names.length} base=${BASE_URL} out=${OUT_DIR} chrome=${CHROME}`)

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
  })

  let results
  try {
    results = await mapPool(names, CONCURRENCY, async (name) => {
      const slug = slugify(name)
      const outPath = path.join(OUT_DIR, `${slug}.png`)
      try {
        const st = await fs.stat(outPath)
        if (st.size >= 500 && process.env.FORCE !== '1') {
          console.log(`SKIP ${name} → ${path.basename(outPath)}`)
          // Probe meta from inventory later; mark ok with existing file
          return { name, ok: true, path: outPath, slug, skipped: true, bytes: st.size }
        }
      } catch { /* missing */ }
      const r = await shotOne(browser, name, outPath)
      const mark = r.ok ? 'OK' : 'FAIL'
      console.log(`${mark} ${name} → ${r.ok ? path.basename(outPath) : r.error}`)
      return { ...r, slug }
    })
  } finally {
    await browser.close()
  }

  const ok = results.filter((r) => r.ok)
  const fail = results.filter((r) => !r.ok)

  const lines = [
    '# All-device screen-qa screenshots',
    '',
    `Generated: ${new Date().toISOString()} (box local Asia/Shanghai)`,
    `Source: \`${BASE_URL}/?device=<name>\` (immersive + corner pads)`,
    `Count: **${ok.length}** OK / **${fail.length}** failed / **${names.length}** DEVICES`,
    '',
    '| Device | PNG | Screen | Radius | Curve | Verification |',
    '| --- | --- | ---: | ---: | --- | --- |',
  ]

  for (const r of results) {
    const inv = inventory.get(r.name)
    const ver = inv?.verification ?? '—'
    const screen =
      r.width && r.height ? `${r.width}×${r.height}` : inv ? `${inv.width}×${inv.height}` : '—'
    const radius = r.radius ?? inv?.screenRadius ?? '—'
    const curve = r.curve ?? inv?.cornerCurve ?? '—'
    const png = r.ok ? `\`${r.slug}.png\`` : `FAIL: ${r.error}`
    lines.push(`| ${r.name} | ${png} | ${screen} | ${radius} | ${curve} | ${ver} |`)
  }

  if (fail.length) {
    lines.push('', '## Failures', '')
    for (const f of fail) lines.push(`- **${f.name}**: ${f.error}`)
  }

  await fs.writeFile(path.join(OUT_DIR, 'INDEX.md'), lines.join('\n') + '\n')
  await fs.writeFile(
    path.join(OUT_DIR, 'results.json'),
    JSON.stringify({ count: names.length, ok: ok.length, fail: fail.length, results }, null, 2),
  )

  console.log(`\nDone: ${ok.length}/${names.length} PNGs in ${OUT_DIR}`)
  if (fail.length) {
    console.error('Failures:', fail.map((f) => f.name).join(', '))
    process.exitCode = 1
  }
  if (ok.length !== names.length) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
