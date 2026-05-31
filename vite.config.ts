import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180.png'],
      manifest: {
        name: 'Univers 3D',
        short_name: 'Univers',
        description: 'Explorator interactiv de univers 3D — Soarele și cele 8 planete.',
        lang: 'ro',
        theme_color: '#05070d',
        background_color: '#05070d',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // precache DOAR scheletul (JS/CSS/HTML/iconițe) — instalare ușoară.
        globPatterns: ['**/*.{js,css,html,svg,ico,webmanifest}'],
        // texturile mari (jpg/png din /public) se cachează la prima afișare → offline.
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'univers-imagini',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
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
