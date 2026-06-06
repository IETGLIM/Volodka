import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

import tailwindcss from '@tailwindcss/vite';

import path from 'path';

import { resolveManualChunk } from './vite/chunks';



export default defineConfig({

  plugins: [react(), tailwindcss()],

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

});


