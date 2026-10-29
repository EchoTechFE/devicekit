import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const root = path.dirname(fileURLToPath(import.meta.url))
const frameSrc = path.resolve(root, '../src')
const devicesSrc = path.resolve(root, '../../devices/src')

export default defineConfig({
  root,
  server: { host: '127.0.0.1', port: 5179, strictPort: true },
  resolve: {
    alias: {
      '@devicekit/frame': frameSrc + '/index.ts',
      '@devicekit/devices': devicesSrc + '/index.ts',
    },
  },
})
