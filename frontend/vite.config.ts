import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // W dev front (5173) i backend (8091) dzielą origin dzięki proxy: requesty na /api
  // są przekazywane do backendu. Front używa relatywnych ścieżek (BACKEND_URL=""),
  // więc nie ma CORS ani potrzeby podawania adresu backendu.
  server: {
    proxy: {
      '/api': 'http://localhost:8091',
    },
  },
  build: {
    // Route-level React.lazy (App.tsx) already splits each page into its own chunk, so heavy libs
    // (leaflet, recharts, the calendar) land in their route chunk instead of the initial bundle.
    // manualChunks additionally isolates the shared React runtime into one long-cached vendor chunk
    // that survives across deploys (its hash only changes when React itself does).
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    // Fail loud in CI if a chunk balloons again past ~500 kB — keeps the regression visible.
    chunkSizeWarningLimit: 500,
  },
})