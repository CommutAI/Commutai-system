import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@commutai/auth': path.resolve(import.meta.dirname, '../../packages/auth/src'),
      '@commutai/supabase': path.resolve(import.meta.dirname, '../../packages/supabase/src'),
      '@commutai/types': path.resolve(import.meta.dirname, '../../packages/types/src'),
      '@commutai/ui': path.resolve(import.meta.dirname, '../../packages/ui/src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@ionic/react') || id.includes('ionicons')) {
              return 'vendor-ionic';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'vendor-supabase';
            }
            if (id.includes('react-leaflet') || id.includes('leaflet')) {
              return 'vendor-map';
            }
            if (id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'vendor-ui';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            if (id.includes('recharts')) {
              return 'vendor-table';
            }
            if (id.includes('html5-qrcode')) {
              return 'vendor-qr';
            }
          }
        },
      },
    },
  },
})
