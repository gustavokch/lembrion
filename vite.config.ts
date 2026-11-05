import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { version } from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Single runtime source of the app version: package.json.
    __APP_VERSION__: JSON.stringify(version),
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom', 'react-router-dom']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          icons: ['lucide-react']
        }
      }
    },
    sourcemap: false, // Disable sourcemaps in production to reduce bundle size
    minify: 'esbuild',
    target: 'esnext'
  },
  server: {
    fs: {
      strict: false
    }
  },
  preview: {
    host: true,
    port: 4173
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.js'],
    restoreMocks: true,
  }
});
