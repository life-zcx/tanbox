import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3002,
    allowedHosts: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api/labels': {
        target: process.env.VITE_LABEL_SERVICE_URL || 'http://label-generator:5060',
        changeOrigin: true,
      },
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://backend:5050',
        changeOrigin: true,
      },
    },
  },
});
