import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

/** Rollup manual chunk resolver — keeps the entry index chunk lean. */
function manualChunks(id: string): string | undefined {
  if (id.includes('node_modules')) {
    if (
      id.includes('/three/') ||
      id.includes('\\three\\') ||
      id.includes('@react-three') ||
      id.includes('postprocessing') ||
      id.includes('@dimforge/rapier')
    ) {
      return 'three';
    }
    if (
      id.includes('/react-dom/') ||
      id.includes('\\react-dom\\') ||
      id.includes('/react/') ||
      id.includes('\\react\\') ||
      id.includes('zustand') ||
      id.includes('framer-motion') ||
      id.includes('@radix-ui') ||
      id.includes('lucide-react') ||
      id.includes('recharts') ||
      id.includes('cmdk') ||
      id.includes('vaul') ||
      id.includes('embla-carousel')
    ) {
      return 'vendor';
    }
    return undefined;
  }

  // Largest narrative blobs (~245 KB source each)
  if (id.includes('storyNodes') || id.includes('dialogueNodes')) {
    return 'data-narrative';
  }
  if (id.includes('/data/') || id.includes('\\data\\')) {
    return 'data';
  }
  // ScheduleEngine is store-free; remaining engine↔store cycles (combat, poems) stay in graph
  return undefined;
}

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
        manualChunks,
      },
    },
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
});
