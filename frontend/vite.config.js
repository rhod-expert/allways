import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'icons/apple-touch-icon.png',
        'icons/favicon-32.png'
      ],
      manifest: {
        name: 'Allways Show de Premios',
        short_name: 'Allways',
        description: 'Area del cliente — cargá facturas, mira tus cupones y los premios del mes.',
        lang: 'es',
        scope: '/allways/',
        start_url: '/allways/cliente/login',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#D4A843',
        background_color: '#0A1628',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallbackDenylist: [/^\/allways\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/allways\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'allways-api',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 5 }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'allways-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      },
      devOptions: { enabled: false }
    })
  ],
  base: '/allways/',
  server: {
    proxy: {
      '/allways/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/allways/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
