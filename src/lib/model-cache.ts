'use client';

import { useGLTF } from '@react-three/drei';
import { getDefaultPlayerModelPath, rewriteLegacyModelPath } from '@/config/modelUrls';
import { ensureGltfDracoDecoderPathConfigured } from '@/lib/explorationGltfDecoders';

/**
 * Предзагрузка произвольного GLB в кэш drei (`useLoader`) до монтирования `useGLTF` в сцене.
 * В типах drei `useGLTF.preload` может быть `void` — оборачиваем в `Promise` и ловим только синхронные ошибки;
 * сбой сети при фоновой загрузке не роняет приложение (см. `useGLTF` в сцене + fallback NPC/игрок).
 */
export function preloadGltf(path: string): Promise<void> {
  if (typeof window === 'undefined' || !path.trim()) return Promise.resolve();
  ensureGltfDracoDecoderPathConfigured();
  const url = rewriteLegacyModelPath(path.trim());
  return Promise.resolve().then(() => {
    try {
      useGLTF.preload(url);
    } catch (error: unknown) {
      console.error('[model-cache] GLTF preload failed:', url, error);
    }
  });
}

/**
 * Предзагрузка GLB игрока в кэш drei до монтирования Canvas — меньше белого кадра при первом кадре обхода.
 * Вызывать только на клиенте (например из `AppPerfWarmup`).
 */
export function preloadExplorationPlayerGltf(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  ensureGltfDracoDecoderPathConfigured();
  const url = getDefaultPlayerModelPath();
  return Promise.resolve().then(() => {
    try {
      useGLTF.preload(url);
    } catch (error: unknown) {
      console.error('[model-cache] Player GLTF preload failed:', url, error);
    }
  });
}
