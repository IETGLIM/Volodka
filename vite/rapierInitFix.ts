import type { Plugin } from 'vite';

/**
 * wasm-bindgen init expects `{ module_or_path }`; upstream -compat passes bytes directly.
 * Match only the call prefix — the inlined WASM base64 is ~2 MB; capturing it breaks the regex.
 */
const RAPIER_INIT_CALL_PREFIX = /yield (\w+)\((\w+)\.toByteArray\(/;

export function rapierInitFix(): Plugin {
  return {
    name: 'rapier-init-object-fix',
    transform(code, id) {
      const normalized = id.replace(/\\/g, '/');
      if (!normalized.includes('@dimforge/rapier3d-compat/rapier.')) return;
      if (!RAPIER_INIT_CALL_PREFIX.test(code)) return;

      const fixed = code.replace(
        RAPIER_INIT_CALL_PREFIX,
        'yield $1({module_or_path:$2.toByteArray(',
      );
      if (fixed === code) return;

      return { code: fixed, map: null };
    },
  };
}
