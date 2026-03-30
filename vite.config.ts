import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(), // Add the Tailwind Vite plugin here
  ],
  server: {
    host: '0.0.0.0', // Allow access from all devices
    port: 5173,
  },
})