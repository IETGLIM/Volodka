import type { SceneId } from '@/data/types';
import { SCENE_CONFIG } from '@/config/scenes';

/**
 * Все URL из `SceneConfig[sceneId].streaming.chunks[].assets` (дедуп, нормализация `/`).
 * Пусто, если профиля или чанков нет.
 */
export function collectPrefetchGltfUrlsForScene(sceneId: SceneId): string[] {
  const streaming = SCENE_CONFIG[sceneId]?.streaming;
  const chunks = streaming?.chunks;
  if (!chunks?.length) return [];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const ch of chunks) {
    for (const a of ch.assets ?? []) {
      const raw = a.url?.trim();
      if (!raw) continue;
      const u = raw.startsWith('/') ? raw : `/${raw}`;
      if (seen.has(u)) continue;
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}
