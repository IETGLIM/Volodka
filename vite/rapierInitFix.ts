import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Plugin } from 'vite';

const RAPIER_VIRTUAL_ID = '\0rapier-compat-fixed';
const INIT_PREFIX = /yield (\w+)\((\w+)\.toByteArray\("/;
const B64_CHAR = /[A-Za-z0-9+/=]/;
const INIT_SUFFIX = '").buffer)}))}';

const RAPIER_MJS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../node_modules/@dimforge/rapier3d-compat/rapier.mjs',
);

/**
 * wasm-bindgen init expects `{ module_or_path }`; upstream -compat passes
 * `toByteArray("…").buffer` directly. The inlined WASM literal is ~2 MB — do not
 * capture it in a regex.
 */
export function fixRapierInit(code: string): string | null {
  const match = INIT_PREFIX.exec(code);
  if (!match || match.index === undefined) return null;

  const b64Start = match.index + match[0].length;
  let b64End = b64Start;
  while (b64End < code.length && B64_CHAR.test(code[b64End])) b64End += 1;

  if (code.slice(b64End, b64End + INIT_SUFFIX.length) !== INIT_SUFFIX) return null;

  const suffixEnd = b64End + INIT_SUFFIX.length;
  const fixed =
    code.slice(0, match.index) +
    `yield ${match[1]}({module_or_path:${match[2]}.toByteArray("` +
    code.slice(b64Start, b64End) +
    '")}).buffer)}))}' +
    code.slice(suffixEnd);

  return fixed === code ? null : fixed;
}

/**
 * Rollup cannot parse the ~2 MB single-line rapier.mjs on disk.
 * Resolve the compat alias to a virtual module and serve the patched source from `load`.
 */
export function rapierInitFix(): Plugin {
  return {
    name: 'rapier-init-object-fix',
    enforce: 'pre',
    resolveId(source) {
      if (source === '@dimforge/rapier3d-compat-original') {
        return RAPIER_VIRTUAL_ID;
      }
      return null;
    },
    load(id) {
      if (id !== RAPIER_VIRTUAL_ID) return null;

      const raw = fs.readFileSync(RAPIER_MJS, 'utf8');
      return fixRapierInit(raw) ?? raw;
    },
  };
}
