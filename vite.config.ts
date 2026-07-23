import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@electron': path.resolve(__dirname, './electron'),
    },
  },
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: (id: string) => {
                if (id === 'electron' || id.startsWith('node:')) return true;
                if (id.endsWith('.node') || id.includes('lancedb-win32') || id.includes('lancedb-darwin') || id.includes('lancedb-linux')) return true;
                if (id === 'jsdom' || id === 'cheerio' || id === 'adm-zip' || id === 'puppeteer-core') return true;
                return false;
              },
              output: {
                banner: `import { fileURLToPath as __fileURLToPath } from 'node:url'; import { dirname as __dirnameFunc } from 'node:path'; var __filename = __fileURLToPath(import.meta.url); var __dirname = __dirnameFunc(__filename);`,
              },
            },
            rolldownOptions: {
              external: (id: string) => {
                if (id === 'electron' || id.startsWith('node:')) return true;
                if (id.endsWith('.node') || id.includes('lancedb-win32') || id.includes('lancedb-darwin') || id.includes('lancedb-linux')) return true;
                if (id === 'jsdom' || id === 'cheerio' || id === 'adm-zip' || id === 'puppeteer-core') return true;
                return false;
              },
              output: {
                banner: `import { fileURLToPath as __fileURLToPath } from 'node:url'; import { dirname as __dirnameFunc } from 'node:path'; var __filename = __fileURLToPath(import.meta.url); var __dirname = __dirnameFunc(__filename);`,
              },
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: (id: string) => {
                if (id === 'electron' || id.startsWith('node:')) return true;
                return false;
              },
              output: {
                banner: `import { fileURLToPath as __fileURLToPath } from 'node:url'; import { dirname as __dirnameFunc } from 'node:path'; var __filename = __fileURLToPath(import.meta.url); var __dirname = __dirnameFunc(__filename);`,
              },
            },
            rolldownOptions: {
              external: (id: string) => {
                if (id === 'electron' || id.startsWith('node:')) return true;
                return false;
              },
              output: {
                banner: `import { fileURLToPath as __fileURLToPath } from 'node:url'; import { dirname as __dirnameFunc } from 'node:path'; var __filename = __fileURLToPath(import.meta.url); var __dirname = __dirnameFunc(__filename);`,
              },
            },
          },
        },
      },
    ]),
    renderer(),
  ],
})
