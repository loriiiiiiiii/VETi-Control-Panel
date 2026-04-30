import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      // CivetWeb often omits CORS on JSON routes; same-origin avoids browser blocks in dev.
      "/api": { target: "http://localhost:8888", changeOrigin: true },
      "/mjpg": { target: "http://localhost:8888", changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      "/api": { target: "http://localhost:8888", changeOrigin: true },
      "/mjpg": { target: "http://localhost:8888", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
