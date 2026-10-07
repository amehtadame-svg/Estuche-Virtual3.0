import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El proxy evita problemas de CORS en desarrollo: el navegador llama a rutas
// relativas (/api/...) y Vite las reenvía al backend.
//   - En local:            http://localhost:4000 (por defecto)
//   - En Docker Compose:   http://backend:4000 (VITE_PROXY_TARGET)
const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
})
