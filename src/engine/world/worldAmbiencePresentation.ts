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
  /** Accent color derived from the scene's visual identity. */
  accentColor: string;
}

/** Per-scene accent colors for cinematic banners. Falls back to cyberpunk teal. */
const SCENE_BANNER_ACCENT: Partial<Record<string, string>> = {
  volodka_room: '#88ff99',
  volodka_corridor: '#ffcc88',
  home_evening: '#ff9944',
  street_night: '#ff22aa',
  street_winter: '#88aadd',
  cafe_evening: '#ddaa66',
  office_day: '#44bbee',
  park_day: '#66dd88',
  library_day: '#bb88dd',
  abandoned_factory: '#ff8833',
  factory_basement: '#22ff88',
  solnysh_room: '#ffdd88',
  zarema_albert_room: '#dd88bb',
  chk_forest_zorge: '#88bb66',
  rooftop_edge: '#dd4466',
  river_pier: '#66aacc',
  sleep_dream: '#aa88ff',
  combat: '#ff4444',
};

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
    accentColor: SCENE_BANNER_ACCENT[sceneId] ?? '#88aacc',
  };
}
