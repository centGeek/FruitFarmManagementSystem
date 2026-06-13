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
})