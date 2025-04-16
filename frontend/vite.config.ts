import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    devSourcemap: true,
  },
  server: {
    // Handle SPA routing during development
    proxy: {
      // Fallback for client-side routing
      '*': {
        target: '/',
        bypass: (req) => {
          // Return req.url so the request continues as-is
          if (req.headers.accept?.includes('text/html')) {
            return '/index.html'
          }
        }
      }
    }
  },
  build: {
    // Ensure consistent output for Netlify deployments
    outDir: 'dist',
    assetsDir: 'assets',
    
    // Increase the warning limit for chunk sizes
    chunkSizeWarningLimit: 800,
    
    // Bundle optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Split chunks for better caching and performance
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        manualChunks: {
          // Split vendor packages
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-chakra': ['@chakra-ui/react', '@chakra-ui/icons', '@emotion/react', '@emotion/styled', 'framer-motion'],
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector', 'i18next-http-backend'],
          'vendor-utils': ['date-fns', 'dayjs', 'axios', 'clsx'],
          'vendor-auth': ['@supabase/supabase-js', '@supabase/auth-helpers-react'],
        },
      },
    },
  },
})
