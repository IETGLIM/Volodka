/* ─── Volodka RPG – shared game types (barrel) ─── */

export type { SceneId } from '@/config/sceneDefinitions';

export * from './brands';

export * from './common/conditions';
export * from './common/effects';

export * from './definitions/skills';
export * from './definitions/items';
export * from './definitions/scene';
export * from './definitions/story';
export * from './definitions/dialogue';
export * from './definitions/npc';
export * from './definitions/quest';
export * from './definitions/poem';
export * from './definitions/interaction';
export * from './definitions/schedule';
export * from './definitions/combat';
export * from './definitions/progression';
export * from './definitions/weather';
export * from './definitions/thoughtCabinet';

export * from './state/relations';
export * from './state/quest';
export * from './state/combat';
export * from './state/combatRng';
export * from './state/daily';
export * from './state/player';
export * from './state/exploration';

export type { CameraWaypointData } from './camera';

// EventMap: import from '@/engine/events' (engine-owned bus types).
