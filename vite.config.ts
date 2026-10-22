import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/Karo-Frontend/',
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5274',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
