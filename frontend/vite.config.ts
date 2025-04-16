import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 4000,
      strictPort: true,
      open: true
    },
    define: {
      'process.env.VITE_PROGRAM_ID': JSON.stringify(env.VITE_PROGRAM_ID),
      'process.env.VITE_NETWORK_URL': JSON.stringify(env.VITE_NETWORK_URL),
      'process.env.VITE_FEE_COLLECTOR_ADDRESS': JSON.stringify(env.VITE_FEE_COLLECTOR_ADDRESS)
    }
  };
});

