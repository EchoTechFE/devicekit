import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { normalizeSfSymbolPayload, SF_SYMBOLS_ENDPOINT, type SfSymbolPayload } from '../src/sf-symbols.js'

const execFileAsync = promisify(execFile)
const FALLBACK: SfSymbolPayload = { status: 'fallback', masks: null }

/** Parses the generator's tab-separated stdout without trusting its contents. */
export function parseNativeSfSymbolOutput(output: string): SfSymbolPayload {
  const masks: Record<string, string> = {}
  for (const line of output.split(/\r?\n/)) {
    const separator = line.indexOf('\t')
    if (separator < 1) continue
    masks[line.slice(0, separator)] = `data:image/png;base64,${line.slice(separator + 1)}`
  }
  return normalizeSfSymbolPayload({ status: 'native', masks })
}

async function generateNativeSfSymbols(): Promise<SfSymbolPayload> {
  if (process.platform !== 'darwin') return FALLBACK
  try {
    const script = fileURLToPath(new URL('./sf-symbols.swift', import.meta.url))
    const { stdout } = await execFileAsync('swift', [script], { timeout: 10_000, maxBuffer: 4 * 1024 * 1024 })
    return parseNativeSfSymbolOutput(stdout)
  } catch {
    // A Linux checkout, missing Swift toolchain, unavailable AppKit, or a
    // future symbol rename must leave the demo on its project-owned fallback.
    return FALLBACK
  }
}

/** Vite serve-only endpoint; no generated Apple bytes enter a production build. */
export function sfSymbolProviderPlugin(): Plugin {
  let result: Promise<SfSymbolPayload> | undefined
  return {
    name: 'devicekit-sf-symbols-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(SF_SYMBOLS_ENDPOINT, async (_request, response) => {
        result ??= generateNativeSfSymbols()
        const payload = await result
        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(JSON.stringify(payload))
      })
    },
  }
}
