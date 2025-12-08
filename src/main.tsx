// Import polyfills FIRST - before any other imports
import './polyfills';

import crypto from 'crypto-browserify';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Make Node.js crypto available globally for otplib
// Note: window.crypto is read-only, so we can't overwrite it
// Store browser crypto separately to preserve it
const browserCrypto = typeof window !== 'undefined' ? (window as any).crypto : undefined;

// Set Node.js crypto on globalThis (not window.crypto which is read-only)
(globalThis as any).nodeCrypto = crypto;
try {
  (globalThis as any).crypto = crypto;
} catch (e) {
  // If setting fails, that's okay - we'll use nodeCrypto
  console.warn('Could not set globalThis.crypto');
}

if (typeof window !== 'undefined') {
  // Store browser crypto as webCrypto to preserve it
  if (browserCrypto) {
    (window as any).webCrypto = browserCrypto;
  }
  // Note: We cannot set window.crypto as it's read-only
  // Modules should use globalThis.crypto or globalThis.nodeCrypto
}

createRoot(document.getElementById("root")!).render(<App />);
