import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import Inspect from 'vite-plugin-inspect';
import { resolveManualChunk } from './vite/chunks';
import { rapierInitFix } from './vite/rapierInitFix';

export default defineConfig(({ mode }) => {
  const analyze = mode === 'analyze';
  const inspect = mode === 'inspect';

  return {
    plugins: [
      rapierInitFix(),
      react(),
      tailwindcss(),
      analyze &&
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
        }),
      inspect &&
        Inspect({
          build: true,
          outputDir: '.vite-inspect',
        }),
    ].filter(Boolean),

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@dimforge/rapier3d-compat/rapier_wasm3d.js': path.resolve(
          __dirname,
          './node_modules/@dimforge/rapier3d-compat/rapier_wasm3d.js',
        ),
        '@dimforge/rapier3d-compat': path.resolve(__dirname, './src/engine/physics/rapierCompat.ts'),
        '@dimforge/rapier3d-compat-original': path.resolve(
          __dirname,
          './node_modules/@dimforge/rapier3d-compat/rapier.mjs',
        ),
      },
    },

    server: {
      port: 3000,
      host: true,
    },

    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: resolveManualChunk,
        },
      },
    },

    assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.ktx2'],
  };
});
