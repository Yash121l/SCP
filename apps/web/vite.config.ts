import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    port: 5173,
    proxy: {
      "/api": {
        changeOrigin: true,
        target: "http://localhost:4000",
      },
      "/health": {
        changeOrigin: true,
        target: "http://localhost:4000",
      },
    },
    strictPort: true,
  },
});
