import { defineConfig } from 'vite'
import { sfSymbolProviderPlugin } from './demo/sf-symbol-provider.js'

export default defineConfig({
  plugins: [sfSymbolProviderPlugin()],
})
