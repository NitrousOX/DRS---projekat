// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // QUIZ create (ako je na 5000)
      "/api/quizzes": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },

      // sve ostalo (users, profile, itd) ide na 5001
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
