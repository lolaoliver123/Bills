import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

const srcPath = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url))
const testSupportPath = (path: string) =>
  fileURLToPath(new URL(`./tests/support/${path}`, import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      app: srcPath('app'),
      components: srcPath('components'),
      features: srcPath('features'),
      'test-support': testSupportPath(''),
    },
  },
})
