import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import Inspect from 'vite-plugin-inspect';
import { resolveManualChunk } from './vite/chunks';

export default defineConfig(({ mode }) => {
  const analyze = mode === 'analyze';
  const inspect = mode === 'inspect';

  return {
    plugins: [
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
