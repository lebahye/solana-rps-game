import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from 'path';

export default defineConfig({
  base: '/solana-rps-game/',  // Updated to match your repository name
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

