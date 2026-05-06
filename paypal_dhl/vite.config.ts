import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/dhl': {
        target: 'https://api-eu.dhl.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/dhl/, ''),
      },
    },
  },
})
