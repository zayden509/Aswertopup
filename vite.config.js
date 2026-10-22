import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Firebase se yon gwo fichye apa, ki chaje sèlman lè baz done a konfigire
  build: { chunkSizeWarningLimit: 800 },
});
