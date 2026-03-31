import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(), // Add the Tailwind Vite plugin here
  ],
  // Server configuration for development
  server: {
    host: '0.0.0.0', // Allow access from all devices
    port: 5173,
    // Proxy API requests to backend server
    proxy: {
      '/school-info': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/question_banks': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/upload': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/mistake-notebook': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/practice': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/feedback': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/blogs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})