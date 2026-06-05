import type { SceneId } from '@/config/sceneDefinitions';

/** World clock and chunk streaming — useWorldClock, useWorldChunks. */
export interface WorldEvents {
  'world:hour_changed': {
    hour: number;
    previousHour: number;
    npcStates: Record<string, { position: [number, number, number]; sceneId: SceneId }>;
  };
  'world:tick': { hour: number; deltaHours: number };
  'world:chunks_changed': {
    toLoad: string[];
    toUnload: string[];
    active: string[];
    playerChunk: string;
  };
}
