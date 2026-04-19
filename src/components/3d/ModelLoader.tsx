'use client';

/**
 * Шаг 3 (анти-мерцание): в репозитории нет отдельного «ModelLoader» — загрузка GLB такая:
 *
 * - **`GLTFLoader`** в `src/components/game/NPC.tsx` — `useGLTF(modelPath)` **только на верхнем уровне**
 *   компонента (не внутри `useEffect`).
 * - **`GLBPlayerModel`** в `src/components/game/PhysicsPlayer.tsx` — то же правило.
 *
 * **Путь к файлу** должен быть стабильным строковым URL: не добавлять **`?v=${Date.now()}`** и другой
 * динамический query — иначе каждый кадр/рендер новый ключ кэша → перезагрузка и мерцание.
 * Нормализация legacy-путей: **`rewriteLegacyModelPath`** (`config/modelUrls.ts`).
 * Учёт LRU кэша drei: **`retainGltfModelUrl`** / **`releaseGltfModelUrl`** (`lib/gltfModelCache.ts`).
 */

export { rewriteLegacyModelPath, getModelsPublicBase, MODEL_URLS } from '@/config/modelUrls';
export { retainGltfModelUrl, releaseGltfModelUrl } from '@/lib/gltfModelCache';
