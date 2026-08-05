/// <reference types="vite/client" />

/**
 * Patches @dimforge/rapier wasm init: wasm-bindgen expects `{ module_or_path }` but the
 * published rapier.mjs calls init with a raw Uint8Array. Rollup also cannot parse the ~2 MB
 * single-line bundle, so we expand via esbuild then apply a string patch.
 *
 * Upstream issue: https://github.com/dimforge/rapier/issues (wasm-bindgen init arg)
 * TODO: Remove this plugin when upstream ships a fix (correct init arg + Rollup-friendly output).
 *
 * Improvements in this revision:
 * - Robust pattern matching with fallback for future wasm-bindgen layouts
 * - Validation that patched code still contains valid base64 and init call
 * - Better dev logging with version extraction and timing
 * - Cache keyed by content hash to avoid stale transforms
 * - Graceful fallback with warning if pattern not found
 */

import fs from 'fs';
import crypto from 'crypto';
import { transform as esbuildTransform } from 'esbuild';
import type { Plugin } from 'vite';

const RAPIER_INIT_PREFIX = /yield (\w+)\((\w+)\.toByteArray\("/;
const RAPIER_INIT_PREFIX_FALLBACK = /yield\s+(\w+)\s*\(\s*(\w+)\.toByteArray\s*\(/;
const BASE64_SCAN_MAX = 3_000_000;
const RAPIER_VERSION_RE = /rapier[^/]*@([\d.]+)/;
const MIN_BASE64_LEN = 100_000; // rapier wasm is >1MB base64, so <100k is suspicious

const transformCache = new Map<string, { hash: string; code: string }>();

function isRapierCompatModule(id: string): boolean {
  const normalized = id.replace(/\\/g, '/');
  return normalized.includes('@dimforge/rapier') && normalized.endsWith('.mjs');
}

function extractRapierVersion(id: string): string | undefined {
  return id.replace(/\\/g, '/').match(RAPIER_VERSION_RE)?.[1];
}

function hashContent(content: string): string {
  return crypto.createHash('sha1').update(content).digest('hex').slice(0, 12);
}

function isAlreadyPatched(code: string): boolean {
  // If code already contains {module_or_path: ... toByteArray, it was patched
  return code.includes('{module_or_path:') && code.includes('toByteArray("');
}

/** wasm-bindgen init expects `{ module_or_path }` — works on esbuild-expanded rapier.mjs. */
export function applyRapierInitFix(code: string): string {
  if (isAlreadyPatched(code)) {
    return code;
  }

  // Try primary pattern, then fallback
  let match = RAPIER_INIT_PREFIX.exec(code);
  if (!match) {
    match = RAPIER_INIT_PREFIX_FALLBACK.exec(code);
  }

  if (!match || match.index === undefined) {
    const msg = '[rapierInitFix] RAPIER_INIT_PREFIX not found — upstream pattern may have changed. Returning original.';
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn(msg);
    } else if (import.meta?.env?.DEV) {
      console.warn(msg);
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

  const base64Len = base64End - base64Start;

  if (base64Len < MIN_BASE64_LEN) {
    console.warn(`[rapierInitFix] Suspicious base64 length ${base64Len} < ${MIN_BASE64_LEN} — aborting patch`);
    return code;
  }

  if (base64Len >= BASE64_SCAN_MAX) {
    console.warn('[rapierInitFix] Base64 scan exceeded max length — returning original code');
    return code;
  }

  // Two known close patterns (minified and formatted)
  const closePatterns = [
    { close: '").buffer)}))}', replacement: '").buffer)}))}' },
    { close: '").buffer);', replacement: '").buffer});' },
    { close: '").buffer}))', replacement: '").buffer}))' }, // extra safety
  ];

  let closeLen = 0;
  let closeReplacement = '").buffer});';
  let matched = false;

  for (const { close, replacement } of closePatterns) {
    if (code.startsWith(close, base64End)) {
      closeLen = close.length;
      closeReplacement = replacement;
      matched = true;
      break;
    }
  }

  if (!matched) {
    console.warn('[rapierInitFix] Unknown close pattern after base64 — returning original code. Snippet:', code.slice(base64End, base64End + 50));
    return code;
  }

  const patched =
    code.slice(0, match.index) +
    `yield ${match[1]}({module_or_path:${match[2]}.toByteArray("` +
    code.slice(base64Start, base64End) +
    closeReplacement +
    code.slice(base64End + closeLen);

  // Validation: patched code must contain module_or_path and still have base64
  if (!patched.includes('{module_or_path:') || !patched.includes('toByteArray("')) {
    console.warn('[rapierInitFix] Patch validation failed — returning original');
    return code;
  }

  return patched;
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

      const raw = fs.readFileSync(id, 'utf8');
      const contentHash = hashContent(raw);
      const cached = transformCache.get(id);

      if (cached && cached.hash === contentHash) {
        return cached.code;
      }

      const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const version = extractRapierVersion(id);
      const versionSuffix = version ? ` (v${version})` : '';

      if (import.meta?.env?.DEV || process.env.NODE_ENV !== 'production') {
        console.log(`[rapierInitFix] Processing: ${id}${versionSuffix} [${contentHash}]`);
      }

      try {
        const expanded = await esbuildTransform(raw, {
          loader: 'js',
          format: 'esm',
          target: 'esnext',
        });

        const patched = applyRapierInitFix(expanded.code);
        const wasPatched = patched !== expanded.code;
        const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start;

        if (import.meta?.env?.DEV || process.env.NODE_ENV !== 'production') {
          console.log(`[rapierInitFix] ${wasPatched ? '✓ Patched' : '⚠ Unpatched'} in ${duration.toFixed(0)}ms, ${(patched.length / 1024).toFixed(0)}KB`);
          if (!wasPatched) {
            console.warn('[rapierInitFix] Upstream may have fixed init — consider removing plugin');
          }
        }

        // Store cache
        transformCache.set(id, { hash: contentHash, code: patched });
        return patched;
      } catch (err) {
        console.error(`[rapierInitFix] Failed to transform ${id}:`, err);
        // Return original raw to avoid breaking build completely — but with warning
        return raw;
      }
    },
  };
}

// For unit tests
export function _testExports() {
  return {
    RAPIER_INIT_PREFIX,
    MIN_BASE64_LEN,
    isAlreadyPatched,
    hashContent,
  };
}
