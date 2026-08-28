import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve(import.meta.dirname),
  publicDir: 'public',
  server: {
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: resolve(import.meta.dirname, '../dist/site'),
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'privacy/index.html'),
        terms: resolve(import.meta.dirname, 'terms/index.html'),
      },
    },
  },
})
