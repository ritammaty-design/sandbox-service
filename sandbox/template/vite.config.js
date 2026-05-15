import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // This tells the browser: "I am in a subfolder, look for my files here!"
  base: './', 
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true, 
    hmr: {
        protocol: 'wss', // Required for GitHub Codespaces
        clientPort: 443 
    }
  }
})