import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // bind to all interfaces (IPv4 + IPv6)
    port: 5173,         // fixed port — no more surprise 5174
    strictPort: true,   // fail fast if port is taken, don't silently shift
    open: true,         // auto-open browser tab on start
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
