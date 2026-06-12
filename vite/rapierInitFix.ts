import type { Plugin } from 'vite';

/** wasm-bindgen init expects `{ module_or_path }`; upstream -compat passes bytes directly. */
const RAPIER_INIT_FIX =
  /yield xA\(Lg\.toByteArray\("([^"]*)"\)\)/;

export function rapierInitFix(): Plugin {
  return {
    name: 'rapier-init-object-fix',
    transform(code, id) {
      const normalized = id.replace(/\\/g, '/');
      if (!normalized.includes('@dimforge/rapier3d-compat/rapier.')) return;
      if (!code.includes('yield xA(Lg.toByteArray(')) return;

      const fixed = code.replace(
        RAPIER_INIT_FIX,
        'yield xA({module_or_path:Lg.toByteArray("$1")})',
      );
      if (fixed === code) return;

      return { code: fixed, map: null };
    },
  };
}
