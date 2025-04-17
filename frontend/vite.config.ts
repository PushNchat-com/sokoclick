import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'ensure-spa-routing',
      closeBundle() {
        // Make sure the dist directory exists
        if (!fs.existsSync('dist')) {
          fs.mkdirSync('dist')
        }
        
        // Create and write _redirects file to dist folder
        fs.writeFileSync('dist/_redirects', '/* /index.html 200\n')
        console.log('✅ _redirects file created for SPA routing')
        
        // Copy netlify.toml to dist
        if (fs.existsSync('netlify.toml')) {
          fs.copyFileSync('netlify.toml', 'dist/netlify.toml')
          console.log('✅ netlify.toml copied to dist directory')
        }
        
        // Create a verification file to debug deployment
        const verificationContent = `<!DOCTYPE html>
<html>
<head>
  <title>SPA Routing Test</title>
</head>
<body>
  <h1>SPA Routing Test</h1>
  <p>If you can see this page, static file serving works, but SPA routing might have issues.</p>
  <p>Current time: ${new Date().toISOString()}</p>
</body>
</html>`;
        fs.writeFileSync('dist/routing-test.html', verificationContent)
        console.log('✅ routing-test.html created for debugging')
      }
    }
  ],
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
