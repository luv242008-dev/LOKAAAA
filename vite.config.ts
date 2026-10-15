import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['lokaaaa-4.onrender.com'],
  },
});
