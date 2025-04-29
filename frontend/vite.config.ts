import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envPrefix: 'VITE_',
  envDir: './',
  css: {
    postcss: './postcss.config.js',
    modules: {
      localsConvention: 'camelCase',
      scopeBehaviour: 'local',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    hmr: {
      timeout: 5000
    },
    sourcemapIgnoreList: (sourcePath) => {
      return sourcePath.includes('node_modules');
    },
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com/@babel/ https://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss: https://*.supabase.co wss://*.supabase.co https://vitejs.dev https://api.supabase.io https://identitytoolkit.googleapis.com; worker-src 'self' blob:; font-src 'self'; frame-src 'self';"
    }
  },
  build: {
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : 'hidden',
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        passes: 2,
        ecma: 2020,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          styles: ['@/styles/variables.css', '@/index.css'],
        },
      },
    },
    target: 'es2015',
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-dom/client',
      'intersection-observer', 
      'resize-observer-polyfill'
    ],
    force: true,
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      target: 'es2015',
      supported: {
        'dynamic-import': true,
        'import-meta': true
      }
    }
  }
})
