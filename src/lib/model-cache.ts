'use client';

import { useGLTF } from '@react-three/drei';
import { getDefaultPlayerModelPath } from '@/config/modelUrls';

/**
 * Предзагрузка GLB в кэш drei (`useLoader`) до монтирования Canvas — меньше белого кадра при первом кадре обхода.
 * Вызывать только на клиенте (например из `AppPerfWarmup`).
 */
export function preloadExplorationPlayerGltf(): void {
  if (typeof window === 'undefined') return;
  try {
    useGLTF.preload(getDefaultPlayerModelPath());
  } catch {
    // сеть/404 не должны ронять старт приложения
  }
}
