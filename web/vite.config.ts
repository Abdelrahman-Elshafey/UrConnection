import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development, forward /api/* to the Express API. The browser only ever talks to
    // localhost:5173, so dev behaves like production (one origin, Caddy routes /api):
    // no CORS setup, and cookies just work.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
