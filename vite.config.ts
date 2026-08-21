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
    // Force a single instance of rapier3d-compat across the dependency tree.
    // @react-three/rapier bundles its own nested copy under
    // node_modules/@react-three/rapier/node_modules/@dimforge/rapier3d-compat.
    // Without dedupe, Vite may resolve the nested copy separately from our
    // top-level alias → TWO independent rapierCompat module instances →
    // initPromise is not shared → <Physics> re-triggers rapier.init() AFTER
    // preloadPhysicsChunk already did, causing the duplicate 'rapier:init-start'
    // perf mark and ~1.3s of wasted WASM-compile work on every boot.
    dedupe: ["@dimforge/rapier3d-compat"],
  },
  build: {
    // Target modern browsers — smaller output, modern JS features
    target: "es2022",
    // Aggressive minification
    minify: "esbuild",
    // Raise chunk size warning limit (singlefile inlines everything)
    chunkSizeWarningLimit: 15000,
    // No sourcemaps in production for smaller bundle
    sourcemap: false,
  },
  optimizeDeps: {
    // Pre-bundle heavy dependencies for faster dev startup
    include: [
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "@react-three/rapier",
      "zustand",
      "framer-motion",
    ],
  },
});
