# Перформанс: обход 3D (R3F + Rapier)

Краткие **зафиксированные** решения и куда смотреть дальше (см. также `docs/volodka-incremental-aaa-roadmap.md`).

## Frameloop

- `Canvas` обхода: `frameloop="always"` (`EXPLORATION_SCENE_FRAMELOOP` в `src/ui/3d/Scene.tsx`) — стабильная физика/камера; режим `demand` + `invalidate()` **не** включён на весь глоб граф (частично — в отдельных эффектах).

## GLB / память

- `src/lib/gltfModelCache.ts` — LRU по байтам, `useGLTF.clear` при вытеснении; лимит URL настроен под Vercel и размер клиента.
- `npm run asset-budget` в CI — контроль слишком крупного клиентского бандла.

## Мобилка

- `useMobileVisualPerf`, `visualLite` — снижение теней/поста; `ExplorationPostFX` и часть эффектов отключаются при `visualLite`.

## Instancing

- `InstancedMesh` для дистанционных пропов в части сцен (см. `CHANGELOG` / комментарии в `RPGGameCanvas`); универсальный instancing для **всех** NPC/пропов — будущая итерация.
