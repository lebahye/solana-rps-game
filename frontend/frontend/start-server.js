// Simple script to start the Vite server with error handling
import { spawn } from 'child_process';

console.log('Starting Vite development server...');

const vite = spawn('npx', ['vite', '--port', '3000'], {
  stdio: 'inherit',
  shell: true
});

vite.on('error', (error) => {
  console.error('Failed to start Vite server:', error);
});

vite.on('close', (code) => {
  if (code !== 0) {
    console.error(`Vite server exited with code ${code}`);
  }
});
