import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Use BASE_PATH env var for deployments under a subpath (keeps .com and localhost rendering identical when set)
export default defineConfig(() => {
  return {
    base: process.env.BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR can be toggled via DISABLE_HMR env var in AI Studio; keep behavior consistent across envs.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      host: '0.0.0.0',
    },
    build: {
      // Keep the client output in the default `dist` so the server can serve it from dist
      outDir: 'dist',
      emptyOutDir: false,
    },
  };
});
