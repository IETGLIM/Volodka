import type { EnemyType } from '@/shared/types/game';

/** Where the encounter was initiated — drives shared presentation beats. */
export type EncounterSource = 'creep' | 'story' | 'arena';

export interface EncounterContext {
  source: EncounterSource;
  enemyType: EnemyType;
  encounterName?: string;
  creepId?: string;
}
