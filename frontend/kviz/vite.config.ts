import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [tailwindcss(), react()],
    server: {
      host: true,
      port: 5173,
      strictPort: true,

      proxy: {
        "/api/quizzes": {
          target: env.VITE_API_SERVICE_URL,
          changeOrigin: true,
        },
        "/api/questions": {
          target: env.VITE_API_SERVICE_URL,
          changeOrigin: true,
        },
        "/api": {
          target: env.VITE_AUTH_SERVICE_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
