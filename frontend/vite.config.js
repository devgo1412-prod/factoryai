// frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // 개발 중 CORS 없이 백엔드 호출
      "/api": {
        target: "http://localhost:8001",
        changeOrigin: true,
      },
    },
  },
});
