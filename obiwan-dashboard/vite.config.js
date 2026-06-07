import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Estimating-Biomass-Change-with-GEDI-and-the-OBIWAN-API/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://obiwan-alabama-api-5026633953.us-west1.run.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  }
})
