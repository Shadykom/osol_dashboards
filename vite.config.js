/* eslint-env node */
/* global __dirname */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const xlsxPath = (() => {
  try { return require.resolve('xlsx'); } catch { return null; }
})();

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
        // Ensure jspdf resolves correctly
        "jspdf": path.resolve(__dirname, "./node_modules/jspdf/dist/jspdf.es.min.js"),
        // Ensure jspdf-autotable resolves correctly
        "jspdf-autotable": path.resolve(__dirname, "./node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.js"),
        // Ensure file-saver resolves correctly
        "file-saver": path.resolve(__dirname, "./node_modules/file-saver/dist/FileSaver.min.js"),
        // Ensure html2canvas resolves correctly
        "html2canvas": path.resolve(__dirname, "./node_modules/html2canvas/dist/html2canvas.esm.js"),
        ...(xlsxPath ? { "xlsx": xlsxPath } : {})
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
    publicDir: 'public',
    // Clear cache on start
    cacheDir: '.vite-cache',
    build: {
      target: 'esnext', // Support top-level await
      rollupOptions: {
        output: {
          manualChunks: {
            'lucide': ['lucide-react']
          }
        },
        external: []
      },
      // Ensure proper handling of external dependencies
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    optimizeDeps: {
      include: ['lucide-react', '@hello-pangea/dnd', 'pdfjs-dist', 'xlsx', 'jspdf', 'jspdf-autotable', 'file-saver', 'html2canvas'],
      // Force re-optimization in development
      force: true
    }
  }
})


