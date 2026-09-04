import type { EnemyType } from '@/shared/types/game';

/** Where the encounter was initiated — drives shared presentation beats. */
export type EncounterSource = 'creep' | 'story' | 'arena';

export interface EncounterContext {
  source: EncounterSource;
  enemyType: EnemyType;
  encounterName?: string;
  creepId?: string;
  /**
   * v4.8.7 «Опережающий удар»: доля HP, с которой враг вступает в бой
   * (0 < pct < 1). Ставится реал-тайм слоем (meleeStrike.ts), когда игрок
   * ударил первым — крип вовлекается ослабленным. Не задано → полные HP.
   */
  introHpPct?: number;
}
