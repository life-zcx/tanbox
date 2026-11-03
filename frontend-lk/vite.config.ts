import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'lucide-react', 'react-router-dom', 'clsx', 'tailwind-merge'],
    alias: {
      '@shared': path.resolve(import.meta.dirname, '../shared'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3001,
    allowedHosts: ['.tanbox.local', '.tanbox.kz'],
    hmr: {
      clientPort: 3001,
      overlay: false,
    },
    watch: {
      usePolling: true,
      interval: 300,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://backend:5050',
        changeOrigin: true,
      },
    },
  },
});
