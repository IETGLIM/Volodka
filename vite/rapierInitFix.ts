/// <reference types="vite/client" />

/**
 * Patches @dimforge/rapier wasm init: wasm-bindgen expects `{ module_or_path }` but the
 * published rapier.mjs calls init with a raw Uint8Array. Rollup also cannot parse the ~2 MB
 * single-line bundle, so we expand via esbuild then apply a string patch.
 *
 * TODO: Remove this plugin when upstream ships a fix (correct init arg + Rollup-friendly output).
 */

// Vite plugins execute in Node.js only — fs is safe here.
import fs from 'fs';
/**
 * esbuild is a direct dependency; Vite also bundles esbuild internally for its own transforms.
 * We use the top-level import for the rapier.mjs expand step.
 */
import { transform as esbuildTransform } from 'esbuild';
import type { Plugin } from 'vite';

const RAPIER_INIT_PREFIX = /yield (\w+)\((\w+)\.toByteArray\("/;
const BASE64_SCAN_MAX = 3_000_000;
const RAPIER_VERSION_RE = /rapier[^/]*@([\d.]+)/;

const transformCache = new Map<string, string>();

function isRapierCompatModule(id: string): boolean {
  const normalized = id.replace(/\\/g, '/');
  return normalized.includes('@dimforge/rapier') && normalized.endsWith('.mjs');
}

function extractRapierVersion(id: string): string | undefined {
  return id.replace(/\\/g, '/').match(RAPIER_VERSION_RE)?.[1];
}

/** wasm-bindgen init expects `{ module_or_path }` — works on esbuild-expanded rapier.mjs. */
export function applyRapierInitFix(code: string): string {
  const match = RAPIER_INIT_PREFIX.exec(code);
  if (!match || match.index === undefined) {
    if (import.meta.env?.DEV) {
      console.warn(
        '[rapierInitFix] RAPIER_INIT_PREFIX not found — upstream pattern may have changed',
      );
    }
    return code;
  }

  const base64Start = match.index + match[0].length;
  let base64End = base64Start;
  while (
    base64End < code.length &&
    base64End - base64Start < BASE64_SCAN_MAX &&
    /[A-Za-z0-9+/=]/.test(code[base64End])
  ) {
    base64End += 1;
  }

  if (base64End - base64Start >= BASE64_SCAN_MAX) {
    if (import.meta.env?.DEV) {
      console.warn('[rapierInitFix] Base64 scan exceeded max length — returning original code');
    }
    return code;
  }

  const minifiedClose = '").buffer)}))}';
  const formattedClose = '").buffer);';

  let closeLen = 0;
  let closeReplacement = '").buffer});';

  if (code.startsWith(minifiedClose, base64End)) {
    closeLen = minifiedClose.length;
    closeReplacement = minifiedClose;
  } else if (code.startsWith(formattedClose, base64End)) {
    closeLen = formattedClose.length;
    closeReplacement = '").buffer});';
  } else {
    if (import.meta.env?.DEV) {
      console.warn(
        '[rapierInitFix] Unknown close pattern after base64 — returning original code',
      );
    }
    return code;
  }

  return (
    code.slice(0, match.index) +
    `yield ${match[1]}({module_or_path:${match[2]}.toByteArray("` +
    code.slice(base64Start, base64End) +
    closeReplacement +
    code.slice(base64End + closeLen)
  );
}

/**
 * Rollup cannot parse the ~2 MB single-line rapier.mjs — expand via esbuild, then patch init.
 */
export function rapierInitFix(): Plugin {
  return {
    name: 'rapier-init-object-fix',
    enforce: 'pre',
    async load(id) {
      if (!isRapierCompatModule(id)) return null;

      const cached = transformCache.get(id);
      if (cached !== undefined) return cached;

      if (import.meta.env?.DEV) {
        const version = extractRapierVersion(id);
        const versionSuffix = version ? ` (v${version})` : '';
        console.log(`[rapierInitFix] Processing: ${id}${versionSuffix}`);
      }

      const raw = fs.readFileSync(id, 'utf8');
      const expanded = await esbuildTransform(raw, {
        loader: 'js',
        format: 'esm',
        target: 'esnext',
      });
      const patched = applyRapierInitFix(expanded.code);
      transformCache.set(id, patched);
      return patched;
    },
  };
}
