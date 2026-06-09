import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// GEMINI_API_KEY must NOT be read here — it lives only in server.ts.
// Vite proxies /api/* to the Express server in dev; in production the Express
// server itself serves the built dist/ alongside the API endpoints.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
});
