import { useGLTF } from '@react-three/drei';

/**
 * Папка с `draco_decoder.js` / `draco_decoder.wasm` (trailing slash).
 * По умолчанию — CDN Google, версия под Three ~0.182 (см. `three/examples/jsm/libs/draco`).
 * Для строгого CSP или офлайна: скопируйте декодеры в `public/draco/` и задайте
 * `NEXT_PUBLIC_DRACO_DECODER_BASE=/draco`.
 */
export const DEFAULT_DRACO_DECODER_BASE = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7';

let decoderPathConfigured = false;

function normalizeDecoderBase(input: string): string {
  const t = input.trim();
  return t.endsWith('/') ? t : `${t}/`;
}

/**
 * Идемпотентно: один раз на вкладку до первого `useGLTF` / `preload`.
 * Вызывать с клиента (`useEffect` в `AppPerfWarmup` и при необходимости из Canvas).
 */
export function ensureGltfDracoDecoderPathConfigured(): void {
  if (typeof window === 'undefined' || decoderPathConfigured) return;
  const fromEnv = process.env.NEXT_PUBLIC_DRACO_DECODER_BASE?.trim();
  const base = normalizeDecoderBase(fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_DRACO_DECODER_BASE);
  useGLTF.setDecoderPath(base);
  decoderPathConfigured = true;
}

/** Только для тестов сброса состояния между кейсами. */
export function __resetGltfDracoDecoderPathTestState(): void {
  decoderPathConfigured = false;
}
