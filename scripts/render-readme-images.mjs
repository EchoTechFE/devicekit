#!/usr/bin/env node
/**
 * Renders the README's device illustrations: a row of portrait phones/tablet
 * and a row of two landscape phones, each showing a placeholder mini-program
 * screen inside <device-frame>. The page it screenshots lives at
 * packages/frame/readme-images/ (served with Vite, same resolution the
 * package's own demo uses — bare `@devicekit/*` specifiers hit workspace
 * `src/`, no build step needed).
 *
 * Playwright is not a repo dependency (it would otherwise drag a Chromium
 * download into every install). Point PLAYWRIGHT_DIR at a directory that has
 * it — this defaults to a local Playwright install used for other devicekit
 * preview tooling. To use your own: `pnpm add -D playwright` anywhere, run
 * `npx playwright install chromium`, then
 * `PLAYWRIGHT_DIR=/path/to/that/project node scripts/render-readme-images.mjs`.
 *
 * Usage: node scripts/render-readme-images.mjs
 */
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const pageRoot = path.join(repoRoot, 'packages/frame/readme-images')
const outDir = path.join(repoRoot, 'docs/images')

const PLAYWRIGHT_DIR = process.env.PLAYWRIGHT_DIR ?? '/Volumes/jdisk/code/qdmp/devicekit-preview'

/** Longest PNG edge a README image is allowed to render at. */
const MAX_PNG_WIDTH = 2400
const DEVICE_SCALE_FACTOR = 2

/** One row's screenshot target: the element id to capture and the output file. */
const SHOTS = [
  { id: 'portrait-row', file: 'devices-light.png' },
  { id: 'landscape-row', file: 'devices-landscape.png' },
]

async function loadPlaywright() {
  const require = createRequire(path.join(PLAYWRIGHT_DIR, 'package.json'))
  try {
    return require('playwright')
  } catch (error) {
    throw new Error(
      `could not load "playwright" from ${PLAYWRIGHT_DIR} — install it there (or set PLAYWRIGHT_DIR) ` +
        `and run \`npx playwright install chromium\`. Original error: ${error.message}`,
    )
  }
}

async function main() {
  const { chromium } = await loadPlaywright()
  const { createServer } = await import('vite')

  await fs.mkdir(outDir, { recursive: true })

  const server = await createServer({
    root: pageRoot,
    configFile: false,
    logLevel: 'error',
    server: { port: 0, strictPort: false },
  })
  await server.listen()
  const url = server.resolvedUrls?.local[0]
  if (!url) throw new Error('vite dev server did not report a local URL')

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({
      viewport: { width: 2200, height: 1600 },
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
    })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => customElements.get('device-frame') !== undefined)
    await page.evaluate(() => document.fonts.ready)
    // Let two frames settle so ResizeObserver-driven layout (the frame's
    // content-rect metrics) has resolved before anything gets measured.
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    )

    for (const { id, file } of SHOTS) {
      const locator = page.locator(`#${id}`)
      const naturalBox = await locator.boundingBox()
      if (!naturalBox) throw new Error(`#${id} has no box — did it render?`)

      const scale = Math.min(1, MAX_PNG_WIDTH / (naturalBox.width * DEVICE_SCALE_FACTOR))
      if (scale < 1) {
        await locator.evaluate((el, s) => {
          el.style.transformOrigin = 'top left'
          el.style.transform = `scale(${s})`
        }, scale)
        await page.evaluate(
          () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        )
      }

      const outPath = path.join(outDir, file)
      await locator.screenshot({ path: outPath, omitBackground: true })
      const { size } = await fs.stat(outPath)
      console.log(`${file}: scale=${scale.toFixed(3)} size=${(size / 1024).toFixed(0)}KB`)
    }
  } finally {
    await browser.close()
    await server.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
