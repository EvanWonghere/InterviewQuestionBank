import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const projectDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: '/quiz/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(projectDir, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@supabase')) return 'supabase'
          if (/react-markdown|remark-|rehype-|katex|highlight\.js/.test(id)) return 'markdown'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
    exclude: ['tests/e2e/**', 'tests/ai-e2e/**', 'supabase/functions/**/handler_test.js', 'dist-ai/**', 'node_modules/**', 'dist/**'],
  },
})
