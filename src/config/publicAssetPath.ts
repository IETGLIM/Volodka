/**
 * itch.io / вложенный хостинг: корневые публичные пути → document-relative.
 *
 * ПРОБЛЕМА (v4.44): константы вида `'/models/...'` на itch.io резолвятся в
 * корень ДОМЕНА (html-classic.itch.zone/models/...) вместо папки игры
 * (html-classic.itch.zone/html/<hash>/models/...) → 404 → падение модели
 * игрока → цикл ErrorBoundary → лавина тостов.
 *
 * Резолвер relativePublicAssets.ts патчит three LoadingManager, но ставит
 * патч АСИНХРОННО (import('three').then) — модульные useGLTF.preload() в
 * чанках сцен успевают выстрелить ДО патча (гонка старта). CSS url() и
 * сырые fetch() патчем не покрываются вовсе.
 *
 * РЕШЕНИЕ: все конфиг-константы публичных ассетов строятся через publicAsset():
 *   base '/'  (dev / Vercel) → '/models/...' (как раньше);
 *   base './' (build:itch)   → './models/...' (document-relative — работает
 *                               во вложенном iframe itch БЕЗ патча и без гонки).
 *
 * Хелпер безопасен вне Vite (scripts/prune-deploy-assets.ts запускается через
 * tsx, где import.meta.env отсутствует): BASE деградирует в '' → пути
 * остаются корневыми, как в старом поведении.
 */

type ImportMetaEnvLike = { BASE_URL?: string };

const RAW_BASE: string =
  (import.meta as unknown as { env?: ImportMetaEnvLike }).env?.BASE_URL ?? '/';

/** '' для base '/', '.' для base './', '/sub' для base '/sub/'. */
const BASE = RAW_BASE.replace(/\/+$/, '');

export function publicAsset(path: string): string {
  if (!path.startsWith('/')) return path;
  if (path.startsWith('//')) return path; // protocol-relative CDN — не трогаем
  return `${BASE}${path}`;
}
