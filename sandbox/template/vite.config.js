import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  base: './',
  server: {
    host: '0.0.0.0', // 👈 Crucial: Allows Kubernetes to route traffic to Vite
    port: 5173,      // 👈 Keeps it on the port you exposed
  }
})