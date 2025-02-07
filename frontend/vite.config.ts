import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import type { Connect, ViteDevServer } from "vite";
import type { ServerResponse } from "http";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "spa-fallback",
      configureServer(server: ViteDevServer) {
        return () => {
          server.middlewares.use(
            (
              req: Connect.IncomingMessage,
              res: ServerResponse,
              next: Connect.NextFunction
            ) => {
              const url = req.url;
              if (url && !url.includes(".") && !url.startsWith("/api")) {
                req.url = "/index.html";
              }
              next();
            }
          );
        };
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          firebase: ["firebase/auth", "firebase/app"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
