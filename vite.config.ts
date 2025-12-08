import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Polyfill Node.js modules for browser compatibility
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      "readable-stream": "readable-stream",
      buffer: "buffer",
      events: "events",
      util: "util",
      // process package automatically uses browser.js via package.json browser field
    },
  },
  define: {
    // Make Node.js globals available for browser
    global: 'globalThis',
    'process.env': '{}',
    'process.browser': 'true',
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'crypto-browserify', 'stream-browserify', 'readable-stream'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});
