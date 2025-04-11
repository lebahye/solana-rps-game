import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Resolve path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'buffer': 'buffer/',
    },
  },

  // Define global variables
  define: {
    'global': 'window',
    'process.env': {}
  },

  // Polyfill Node.js globals (Buffer, process)
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },

  // Configure build options
  build: {
    target: 'es2020',
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
          ],
          buffer: [
            'buffer'
          ],
          solana: [
            '@solana/web3.js',
            '@solana/wallet-adapter-base',
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
          ],
        },
      }
    },
  },

  // Server configuration
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    watch: {
      usePolling: true
    }
  },
});
