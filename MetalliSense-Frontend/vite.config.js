import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Basic Vite config (no proxy) - backend must handle CORS (OPTIONS + POST) at http://localhost:8001
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
