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
  },
  build: {
    sourcemap: 'hidden',
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
  },
})
