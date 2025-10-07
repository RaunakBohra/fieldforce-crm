import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'date-fns',
      'recharts', // Pre-bundle recharts to avoid runtime issues
    ],
    // Force pre-bundling of these packages
    force: false,
  },

  // Ensure React is deduplicated
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Field Force CRM',
        short_name: 'FieldForce',
        description: 'Medical Field Force CRM - Manage visits, orders, and payments offline',
        theme_color: '#3730a3',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.r2\.dev\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'r2-images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.workers\.dev\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true // Enable PWA in development
      }
    })
  ],
  build: {
    // Optimize chunk size threshold
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`,

        // Simplified chunk splitting - let Vite handle vendor splitting automatically
        manualChunks: {
          // Keep all vendor code together to avoid React duplication issues
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            'recharts',
            'lucide-react',
            'date-fns',
          ],
        }
      },
      // Prevent Recharts tree-shaking issues
      treeshake: {
        moduleSideEffects: (id) => {
          // Preserve side effects for recharts modules to prevent Activity export error
          return id.includes('recharts');
        }
      }
    },

    // Enable minification
    minify: 'esbuild',

    // Source maps for production debugging (can be disabled if not needed)
    sourcemap: false,

    // Target modern browsers for smaller bundle size
    target: 'es2020',

    // CSS code splitting
    cssCodeSplit: true,
  }
})
