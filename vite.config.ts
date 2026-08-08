import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Rapier physics: redirect the package to our init shim, and expose the
      // original WASM bundle under a separate alias so the shim can re-export it.
      "@dimforge/rapier3d-compat/rapier_wasm3d.js": path.resolve(
        __dirname,
        "./node_modules/@dimforge/rapier3d-compat/rapier_wasm3d.js",
      ),
      "@dimforge/rapier3d-compat": path.resolve(
        __dirname,
        "./src/engine/physics/rapierCompat.ts",
      ),
      "@dimforge/rapier3d-compat-original": path.resolve(
        __dirname,
        "./node_modules/@dimforge/rapier3d-compat/rapier.mjs",
      ),
    },
  },
});
