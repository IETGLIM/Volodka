/**
 * Poly Haven GLTF URLs warmed by street_night / city_square visuals.
 * Evicted on scene:unload via sceneGpuLifecycle (not the global prop registry).
 */

import { POLYHAVEN_MODELS } from '@/config/polyhavenAssets';
import type { SceneId } from '@/shared/types/game';

/** street_night — HeroStreetFacadesWithAssets + StreetPropDressing. */
export const STREET_NIGHT_DRESSING_URLS: readonly string[] = [
  POLYHAVEN_MODELS.bench,
  POLYHAVEN_MODELS.fireEscape,
  POLYHAVEN_MODELS.urbanFacade,
  POLYHAVEN_MODELS.shutterDoor,
  POLYHAVEN_MODELS.shutterWindow,
  POLYHAVEN_MODELS.shutterWindowAlt,
  POLYHAVEN_MODELS.streetLamp,
  POLYHAVEN_MODELS.streetLampAlt,
  POLYHAVEN_MODELS.industrialLamp,
  POLYHAVEN_MODELS.metalTrashCan,
  POLYHAVEN_MODELS.trashbag,
  POLYHAVEN_MODELS.roadBarrier,
  POLYHAVEN_MODELS.roadBarrierAlt,
  POLYHAVEN_MODELS.wetFloorSign,
  POLYHAVEN_MODELS.barrel,
  POLYHAVEN_MODELS.cardboardBox,
  POLYHAVEN_MODELS.woodenCrate,
  POLYHAVEN_MODELS.oldTyre,
  POLYHAVEN_MODELS.manholeCover,
  POLYHAVEN_MODELS.exteriorAirconUnit,
  POLYHAVEN_MODELS.powerBox,
  POLYHAVEN_MODELS.securityCamera,
  POLYHAVEN_MODELS.utilityBox,
];

/** city_square — AuthoredPlazaProp + plaza preloads. */
export const CITY_SQUARE_DRESSING_URLS: readonly string[] = [
  POLYHAVEN_MODELS.bench,
  POLYHAVEN_MODELS.urbanFacade,
  POLYHAVEN_MODELS.fireEscape,
  POLYHAVEN_MODELS.shutterDoor,
  POLYHAVEN_MODELS.gothicStatue,
  POLYHAVEN_MODELS.streetLamp,
  POLYHAVEN_MODELS.streetLampAlt,
  POLYHAVEN_MODELS.roadBarrier,
  POLYHAVEN_MODELS.roadBarrierAlt,
  POLYHAVEN_MODELS.metalTrashCan,
  POLYHAVEN_MODELS.trashbag,
  POLYHAVEN_MODELS.cardboardBox,
  POLYHAVEN_MODELS.wetFloorSign,
  POLYHAVEN_MODELS.barrel,
  POLYHAVEN_MODELS.utilityBox,
  POLYHAVEN_MODELS.powerBox,
  POLYHAVEN_MODELS.oldTyre,
  POLYHAVEN_MODELS.manholeCover,
  POLYHAVEN_MODELS.woodenCrate,
  POLYHAVEN_MODELS.exteriorAirconUnit,
  POLYHAVEN_MODELS.securityCamera,
];

const SCENE_STREET_DRESSING_URLS: Partial<Record<SceneId, readonly string[]>> = {
  street_night: STREET_NIGHT_DRESSING_URLS,
  city_square: CITY_SQUARE_DRESSING_URLS,
};

export function getSceneStreetDressingUrls(sceneId: SceneId): readonly string[] {
  return SCENE_STREET_DRESSING_URLS[sceneId] ?? [];
}
