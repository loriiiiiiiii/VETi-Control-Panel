import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api/stream": {
        target: "https://localhost:8443",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/api": { target: "http://localhost:8888", changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      "/api/stream": {
        target: "https://localhost:8443",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/api": { target: "http://localhost:8888", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
