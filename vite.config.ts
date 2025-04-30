import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react'],
  },
  build: {
    commonjsOptions: {
      include: [/lucide-react/, /node_modules/],
    },
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('react-router-dom')) {
              return 'vendor-router';
            }
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'vendor-ui';
            }
            if (id.includes('artplayer')) {
              return 'player-core';
            }
            if (id.includes('hls.js')) {
              return 'player-hls';
            }
            if (id.includes('axios') || id.includes('tanstack/react-query')) {
              return 'vendor-utils';
            }
            return 'vendor-others';
          }
        }
      }
    }
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'lucide-react'],
  }
})