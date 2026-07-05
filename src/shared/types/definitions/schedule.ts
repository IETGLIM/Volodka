/* ─── NPC schedule definitions ─── */

import type { SceneId } from '@/config/sceneDefinitions';

export interface ScheduleEntry {
  readonly startHour: number;
  readonly endHour: number;
  readonly sceneId: SceneId;
  readonly position: [number, number, number];
  readonly activity: 'work' | 'read' | 'rest' | 'walk' | 'talk' | 'sleep';
}
