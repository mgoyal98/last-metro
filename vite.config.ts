import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: ["es2022", "safari16.4"],
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@dimforge/rapier3d-compat")) return "physics";
          if (id.includes("/three/")) return "three";
        },
      },
    },
  },
  server: { port: 5173, strictPort: true },
});
