/* eslint-env node */
/* global __dirname */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: 'all'
  },
  build: {
    target: 'esnext', // Support top-level await
    rollupOptions: {
      output: {
        manualChunks: {
          'lucide': ['lucide-react']
        }
      }
    },
    // Ensure proper handling of external dependencies
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    include: ['lucide-react', '@hello-pangea/dnd']
  }
})


