// Polyfills for Node.js modules - must be imported first
import { Buffer } from 'buffer';
import process from 'process';

// Make Buffer available globally before any other modules load
(globalThis as any).Buffer = Buffer;
(globalThis as any).process = process;

if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).process = process;
}

export { Buffer, process };





