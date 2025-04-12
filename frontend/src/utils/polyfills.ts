// Polyfills for Node.js built-ins
import { Buffer as BufferImpl } from 'buffer';

// Make Buffer available as a global variable
// This is critical for Solana web3.js
window.Buffer = window.Buffer || BufferImpl;

// Add global process object if it doesn't exist
if (typeof window.process === 'undefined') {
  window.process = {
    env: {},
    browser: true,
    version: '',
    versions: { node: '' },
    nextTick: (fn: Function) => setTimeout(fn, 0),
    cwd: () => '/'
  };
}

// Export the globals so we know they've been initialized
export const globals = {
  Buffer: window.Buffer,
  process: window.process,
};

// Log initialization for debugging
console.info('[Polyfills] Initialized:', {
  Buffer: typeof window.Buffer !== 'undefined',
  process: typeof window.process !== 'undefined',
});
