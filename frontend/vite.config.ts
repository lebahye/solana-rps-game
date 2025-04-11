import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  base: '/solana-rps-site/',  // Change this to match your GitHub Pages URL
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'buffer': 'buffer/',
    },
  },
  define: {
    'global': 'window',
    'process.env': {}
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
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
  server: {
    port: 5173,
    host: true
  }
});


