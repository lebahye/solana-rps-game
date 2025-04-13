import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/solana-rps-game/',
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    fs: {
      strict: false,
      allow: ['..']
    },
    hmr: {
      overlay: false
    }
  },
  resolve: {
    alias: {
      'stream': 'stream-browserify',
      'buffer': 'buffer'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    },
    include: [
      '@solana/web3.js',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-phantom',
      '@solana/wallet-adapter-solflare'
    ]
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      external: ['@solana-mobile/mobile-wallet-adapter-protocol-web3js']
    }
  }
});




