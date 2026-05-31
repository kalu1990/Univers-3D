import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Proiectul stă pe /mnt/c (disc Windows montat în WSL2), unde
      // detectarea schimbărilor prin inotify NU funcționează. „usePolling"
      // face Vite să scaneze fișierele periodic → hot-reload automat.
      usePolling: true,
      interval: 300, // verifică la fiecare 300 ms
    },
  },
})
