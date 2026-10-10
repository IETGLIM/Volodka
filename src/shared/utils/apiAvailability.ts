/**
 * v4.44: /api/* серверлессы существуют только на корневом SPA-хостинге
 * (Vercel). На статике (itch.io — build с base './') запросы /api/* бьют
 * в 404 и шумят в консоли браузера («Failed to load resource»), хотя JS
 * обрабатывает отказ тихо. Гейт отсекает сам ВЫЗОВ fetch на статике.
 *
 * В dev (base '/') и на Vercel (base '/') — API доступен, поведение прежнее.
 */

type ImportMetaEnvLike = { BASE_URL?: string };

const BASE_URL: string =
  (import.meta as unknown as { env?: ImportMetaEnvLike }).env?.BASE_URL ?? '/';

/** true — рантайм раздаётся с корня домена и имеет серверлесс /api. */
export function isApiRuntimeAvailable(): boolean {
  return !BASE_URL.startsWith('.');
}
