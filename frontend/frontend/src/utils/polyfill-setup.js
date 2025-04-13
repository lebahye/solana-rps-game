// Global Buffer polyfill for Solana web3.js
// This file needs to be loaded before any Solana-related code

// Create process global
window.process = window.process || {
  env: {},
  browser: true,
  version: '',
  versions: { node: '' },
  nextTick: function(fn) { setTimeout(fn, 0); },
  cwd: function() { return '/'; }
};

// When imported by Vite, these will be properly bundled
// Because buffer has a .js extension, it will be properly resolved
import buffer from 'buffer';

// Set Buffer as a global
window.Buffer = buffer.Buffer;

// Set global object for compatibility
window.global = window;

console.log('[Polyfills] Initialized successfully');
