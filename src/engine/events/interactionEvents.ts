import type { SceneId } from '@/config/sceneDefinitions';

/** Object triggers and staged NPC interaction — InteractiveTriggers, InteractionSystemBridge. */
export interface InteractionEvents {
  'object:interact': { objectId: string; sceneId: SceneId; triggerZoneId?: string };
  'object:highlight': { triggerZoneId: string; position: [number, number, number]; size: [number, number, number] };
  'interaction:start': { npcId: string };
  'interaction:state_change': { state: number; npcId?: string };
  'interaction:end': Record<string, never>;
  'interaction:hint': { label: string; key: string; description?: string; type: 'npc' | 'object' | 'exit' | 'item' };
}
