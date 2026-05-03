import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const srcPath = path.resolve(__dirname, 'src')

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  resolve: {
    alias: {
      '@': srcPath,
      '@shared': path.resolve(srcPath, 'shared'),
    },
  },
  build: {
    outDir: '../../dist',
  },
  server: {
    port: 5173,
  },
})
