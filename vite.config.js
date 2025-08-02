/* eslint-env node */
/* global __dirname */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      // Plugin to copy PDF.js worker during build
      {
        name: 'copy-pdf-worker',
        generateBundle() {
          const workerDir = 'dist/pdf-worker';
          if (!existsSync(workerDir)) {
            mkdirSync(workerDir, { recursive: true });
          }
          try {
            copyFileSync(
              'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
              'dist/pdf-worker/pdf.worker.min.js'
            );
            console.log('✓ PDF.js worker copied to dist/pdf-worker/');
          } catch (error) {
            console.warn('Failed to copy PDF.js worker:', error.message);
          }
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Explicitly define environment variables for build
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'https://bzlenegoilnswsbanxgb.supabase.co'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE'),
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: 'all',
      // Force reload on changes
      hmr: {
        overlay: true
      }
    },
    // Clear cache on start
    cacheDir: '.vite-cache',
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
      include: ['lucide-react', '@hello-pangea/dnd', 'pdfjs-dist'],
      // Force re-optimization in development
      force: true
    }
  }
})


