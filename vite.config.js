import { defineConfig } from 'vite'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@adminlte/headless': resolve(__dirname, '../../src/index.ts')
    }
  }
})
