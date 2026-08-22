import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import {
  resolveManualChunk,
  validateChunkConfig,
  ROLLUP_MIN_CHUNK_SIZE,
} from "./vite/chunks";
import { rapierInitFix } from "./vite/rapierInitFix";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fail-fast guard: emit warnings if a module id is listed in more than one
// DATA_* bucket in vite/chunks.ts (would cause non-deterministic chunking).
const chunkConfigWarnings = validateChunkConfig();
if (chunkConfigWarnings.length > 0) {
  console.warn("[chunks] configuration warnings:");
  for (const w of chunkConfigWarnings) console.warn(`  ${w}`);
}

// https://vite.dev/config/
export default defineConfig({
  // rapierInitFix pre-expands the ~2 MB single-line rapier.mjs via esbuild
  // (Rollup cannot parse it as-is) and patches the wasm-bindgen init signature
  // (upstream passes a raw Uint8Array where `{ module_or_path }` is expected).
  // Required for ANY bundling build that touches @dimforge/rapier3d-compat —
  // not specific to vite-plugin-singlefile.
  plugins: [react(), tailwindcss(), rapierInitFix()],
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
    // Default 500 KB is appropriate for code-split builds — singlefile needed
    // 15000 because all JS+CSS+WASM-base64 was inlined into one HTML.
    chunkSizeWarningLimit: 500,
    // No sourcemaps in production for smaller bundle
    sourcemap: false,
    rollupOptions: {
      output: {
        // Tier-based code splitting (see vite/chunks.ts):
        //   boot (index, vendor) — menu boot
        //   gameStart (three, r3f, drei, postfx, game-canvas, scene-volodka-room,
        //             data-story/dialogue/quests/poems/lore/narrative) — first playable scene
        //   lazy (physics, physics-scene, minigame, panel, game-ui-non-menu,
        //         scene-non-volodka-room, game-dev, engine-combat) — on demand
        manualChunks: resolveManualChunk,
        // Merge tiny chunks (<5 KB) into their parents — keeps the chunk count
        // manageable (otherwise every mini-data file would emit its own chunk).
        experimentalMinChunkSize: ROLLUP_MIN_CHUNK_SIZE,
      },
    },
    // CRITICAL for LCP: by default Vite emits a <link rel="modulepreload"> for
    // EVERY statically imported chunk in index.html. With our tier-based splitting,
    // index.html ended up with 68 modulepreload links — 68 HTTP requests fired
    // on first paint, blocking LCP to ~4s. Disabling lets the browser load
    // chunks lazily via dynamic import() when they're actually needed (3D scene
    // entry, panel open, etc.). The boot chunk (index) still loads via the
    // <script type="module"> tag.
    modulePreload: false,
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
