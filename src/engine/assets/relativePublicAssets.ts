/**
 * itch.io / относительный хостинг: резолвер публичных ассетов.
 *
 * ПРОБЛЕМА: в коде сотни корневых URL ассетов ('/models/...', '/textures/...',
 * '/sounds/...', '/hdri/...', '/draco/...', '/basis/'). На Vercel SPA раздаётся
 * с корня домена — абсолютные пути работают. На itch.io HTML5-билд крутится в
 * iframe по вложенному пути (https://html-classic.itch.zone/<hash>/<ver>/index.html)
 * — корневые '/...' отдают 404.
 *
 * РЕШЕНИЕ: three.js прогоняет КАЖДУЮ загрузку через LoadingManager.resolveURL()
 * (FileLoader.load → `const url = this.manager.resolveURL(url)`). Подменяем
 * resolveURL у THREE.DefaultLoadingManager: корневые пути превращаются в
 * document-relative (new URL(path.slice(1), document.baseURI)) — на itch.io
 * резолвятся рядом с index.html, на корневом хостинге дают тот же абсолютный URL
 * (поведение идентично, патч безопасен для Vercel).
 *
 * Raw fetch() (не three-лоадеры) — например, Rapier WASM в rapierCompat.ts —
 * резолвится отдельно через import.meta.env.BASE_URL.
 */

let installed = false;

export function installRelativePublicAssetResolver(): void {
  if (installed) return;
  installed = true;

  if (typeof document === 'undefined') return;

  try {
    // three.js re-export: DefaultLoadingManager — синглтон всех штатных лоадеров.
    void import('three').then((THREE) => {
      const manager = THREE.DefaultLoadingManager;
      // Idempotent — повторный вызов после HMR не ломает цепочку.
      (manager as { __relativeResolverInstalled?: boolean }).__relativeResolverInstalled = false;
      manager.resolveURL = (url: string): string => {
        if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) {
          try {
            return new URL(url.slice(1), document.baseURI).toString();
          } catch {
            return url;
          }
        }
        return url;
      };
    });
  } catch {
    // three не загрузился — работаем как раньше (корневой хостинг).
  }
}
