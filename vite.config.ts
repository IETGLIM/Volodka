import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import Inspect from 'vite-plugin-inspect';
import { resolveManualChunk } from './vite/chunks';
import { rapierInitFix } from './vite/rapierInitFix';

function buildContentSecurityPolicy(isDev: boolean): string {
  const connectSrc = isDev ? "'self' ws: wss:" : "'self'";
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'wasm-unsafe-eval'";

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    `connect-src ${connectSrc}`,
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ');
}

export default defineConfig(({ mode }) => {
  // Canonical URL for OG meta in index.html (%VITE_SITE_URL% substitution)
  process.env.VITE_SITE_URL ??= 'https://volodka.vercel.app';
  const siteUrl = process.env.VITE_SITE_URL.replace(/\/$/, '');

  const analyze = mode === 'analyze';
  const inspect = mode === 'inspect';
  const isDev = mode === 'development';
  const contentSecurityPolicy = buildContentSecurityPolicy(isDev);

  return {
    plugins: [
      {
        name: 'html-transform-site-url',
        transformIndexHtml(html) {
          return html.replaceAll('%VITE_SITE_URL%', siteUrl);
        },
      },
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

    optimizeDeps: {
      entries: ['index.html'],
    },

    server: {
      port: 3000,
      host: true,
      headers: {
        'Content-Security-Policy': contentSecurityPolicy,
      },
    },

    preview: {
      headers: {
        'Content-Security-Policy': buildContentSecurityPolicy(false),
      },
    },

    build: {
      target: 'esnext',
      rollupOptions: {
        output: {
          manualChunks: resolveManualChunk,
          experimentalMinChunkSize: 5 * 1024,
        },
      },
    },

    assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.ktx2'],
  };
});
