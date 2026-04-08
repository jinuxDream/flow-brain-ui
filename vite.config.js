import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: ['@antv/x6']
  },
  server: {
    port: 3000,
    proxy: {
      '/flow-brain': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
