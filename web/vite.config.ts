import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // strictPort: if 5173 is taken (usually an old dev server still running), stop with an
    // error instead of quietly moving to 5174. On another port the API's CSRF check
    // (APP_ORIGIN = http://localhost:5173) would reject every sign-in and save.
    // Fix: npm run stop:dev, then start again.
    strictPort: true,
    // In development, forward /api/* to the Express API. The browser only ever talks to
    // localhost:5173, so dev behaves like production (one origin, Caddy routes /api):
    // no CORS setup, and cookies just work.
    proxy: {
      "/api": "http://localhost:3000",
      // Avatars (Stage 10): /media/<key> → Garage's website endpoint, which picks the bucket
      // from the Host header ("<bucket>.web.garage.localhost") and the object from the path.
      // Caddy does the same in production.
      "/media": {
        target: "http://localhost:3902",
        rewrite: (path) => path.replace(/^\/media/, ""),
        headers: { Host: "urconnections.web.garage.localhost" },
      },
    },
  },
  // `vite preview` (the production build, port 4173) reuses the proxy above. Same rule:
  // fail on a taken port rather than serve from another one.
  preview: {
    strictPort: true,
  },
});
