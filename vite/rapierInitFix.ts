import type { Plugin } from 'vite';

const RAPIER_INIT_PREFIX = /yield (\w+)\((\w+)\.toByteArray\("/;
const RAPIER_INIT_SUFFIX = '").buffer)}))}';

/**
 * wasm-bindgen init expects `{ module_or_path }`; upstream -compat passes bytes directly.
 * Match only the call prefix — the inlined WASM base64 is ~2 MB; capturing it breaks the regex.
 * Close the `{ module_or_path: ... }` object before `.buffer` on the init yield.
 */
export function rapierInitFix(): Plugin {
  return {
    name: 'rapier-init-object-fix',
    transform(code, id) {
      const normalized = id.replace(/\\/g, '/');
      if (!normalized.includes('@dimforge/rapier3d-compat/rapier.')) return;

      const match = RAPIER_INIT_PREFIX.exec(code);
      if (!match || match.index === undefined) return;

      const base64Start = match.index + match[0].length;
      let base64End = base64Start;
      while (base64End < code.length && /[A-Za-z0-9+/=]/.test(code[base64End])) {
        base64End += 1;
      }

      if (code.slice(base64End, base64End + RAPIER_INIT_SUFFIX.length) !== RAPIER_INIT_SUFFIX) {
        return;
      }

      const suffixEnd = base64End + RAPIER_INIT_SUFFIX.length;
      const fixed =
        code.slice(0, match.index) +
        `yield ${match[1]}({module_or_path:${match[2]}.toByteArray("` +
        code.slice(base64Start, base64End) +
        '")}).buffer)}))}' +
        code.slice(suffixEnd);

      if (fixed === code) return;
      return { code: fixed, map: null };
    },
  };
}
