import fs from 'fs';
import { transform as esbuildTransform } from 'esbuild';
import type { Plugin } from 'vite';

const RAPIER_INIT_PREFIX = /yield (\w+)\((\w+)\.toByteArray\("/;

function isRapierCompatModule(id: string): boolean {
  const normalized = id.replace(/\\/g, '/');
  return normalized.includes('@dimforge/rapier3d-compat/rapier.');
}

/** wasm-bindgen init expects `{ module_or_path }` — works on esbuild-expanded rapier.mjs. */
function applyRapierInitFix(code: string): string {
  const match = RAPIER_INIT_PREFIX.exec(code);
  if (!match || match.index === undefined) return code;

  const base64Start = match.index + match[0].length;
  let base64End = base64Start;
  while (base64End < code.length && /[A-Za-z0-9+/=]/.test(code[base64End])) {
    base64End += 1;
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

      const raw = fs.readFileSync(id, 'utf8');
      const expanded = await esbuildTransform(raw, {
        loader: 'js',
        format: 'esm',
        target: 'esnext',
      });
      return applyRapierInitFix(expanded.code);
    },
  };
}
