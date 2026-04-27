'use client';

import type { CanvasTexture } from 'three';

import {
  createVolodkaCarpetTexture,
  createVolodkaFloorTexture,
  createVolodkaWallTexture,
  createVolodkaWoodTexture,
} from '@/ui/3d/exploration/volodkaRoomProceduralTextures';
import {
  createVolodkaFloorLightmap,
  createVolodkaWallLightmap,
} from '@/ui/3d/exploration/volodkaRoomLightmapTextures';

export type VolodkaRoomCanvasMaps = {
  wallMap: CanvasTexture;
  floorMap: CanvasTexture;
  carpetMap: CanvasTexture;
  woodMap: CanvasTexture;
  floorLightmap: CanvasTexture;
  wallLightmap: CanvasTexture;
};

/** Синхронная сборка (canvas) для lightmap-слоёв комнаты Володьки. */
export function createVolodkaRoomCanvasMapsSync(): VolodkaRoomCanvasMaps {
  const wallMap = createVolodkaWallTexture();
  wallMap.repeat.set(3.2, 2.4);
  const floorMap = createVolodkaFloorTexture();
  floorMap.repeat.set(5, 4);
  const carpetMap = createVolodkaCarpetTexture();
  carpetMap.repeat.set(2.2, 1.7);
  const woodMap = createVolodkaWoodTexture();
  woodMap.repeat.set(2, 2);
  const floorLightmap = createVolodkaFloorLightmap();
  floorLightmap.repeat.copy(floorMap.repeat);
  const wallLightmap = createVolodkaWallLightmap();
  wallLightmap.repeat.copy(wallMap.repeat);
  return {
    wallMap,
    floorMap,
    carpetMap,
    woodMap,
    floorLightmap,
    wallLightmap,
  };
}
