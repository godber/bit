import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  root: '.',
  base: command === 'serve' ? '/' : '/bit/',
  plugins: [react()],
  server: {
    open: true
  },
  build: {
    chunkSizeWarningLimit: 2000
  }
}));
