import type { SceneId } from '@/shared/types/game';
import {
  WORLD_CELLS,
  WORLD_REGIONS,
  getCellForScene,
  getRegionForScene,
} from '@/engine/world/worldRegistry';

export interface SceneBannerPresentation {
  title: string;
  subtitle: string | null;
  /** Stable key for AnimatePresence */
  bannerKey: string;
}

/** Scene title + district/cell context for the location banner. */
export function formatSceneBanner(sceneId: SceneId, sceneName: string): SceneBannerPresentation {
  const cell = getCellForScene(sceneId);
  const region = getRegionForScene(sceneId);

  const cellLabel = cell ? WORLD_CELLS[cell.id]?.displayName : null;
  const regionLabel = region ? WORLD_REGIONS[region.id]?.displayName : null;

  let subtitle: string | null = null;
  if (cellLabel && regionLabel) {
    subtitle = cellLabel === regionLabel ? regionLabel : `${cellLabel} · ${regionLabel}`;
  } else if (regionLabel) {
    subtitle = regionLabel;
  }

  return {
    title: sceneName,
    subtitle,
    bannerKey: `${sceneId}:${sceneName}:${subtitle ?? ''}`,
  };
}
