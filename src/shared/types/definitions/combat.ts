/* ─── Combat entity definitions ─── */

import type { TrainablePlayerSkill } from './skills';

export type EnemyType =
  | 'system_daemon'
  | 'corporate_golem'
  | 'shadow_agent'
  | 'data_phantom'
  | 'code_inquisitor'
  | 'guild_enforcer'
  | 'data_wraith'
  | 'censor_drone'
  | 'poetry_hunter'
  | 'nexus_guardian'
  | 'void_echo';

export type CombatAction = 'attack' | 'defend' | 'poem_power' | 'flee';

export interface CombatEnemy {
  readonly type: EnemyType;
  readonly name: string;
  readonly emoji: string;
  readonly maxHp: number;
  hp: number;
  readonly attack: number;
  readonly defense: number;
  readonly speed: number;
  readonly targetsStat: 'logic' | 'energy' | 'karma' | 'empathy';
  readonly lootTable: string[];
  readonly xpReward: number;
  specialCooldown: number;
}

export type BuffTarget = 'player' | 'enemy';

export interface CombatBuff {
  readonly id: string;
  readonly name: string;
  readonly source: string;
  readonly kind: 'buff' | 'debuff';
  readonly target: BuffTarget;
  duration: number;
  readonly effect: BuffEffect;
}

export type BuffEffect =
  | { type: 'defense_reduction'; value: number }
  | { type: 'damage_multiplier'; value: number }
  | { type: 'damage_reduction'; value: number }
  | { type: 'skip_turn' }
  | { type: 'stat_drain'; stat: 'logic' | 'energy' | 'karma'; value: number }
  | { type: 'defense_boost'; value: number }
  | { type: 'attack_boost'; value: number }
  | { type: 'hp_drain_percent'; value: number }
  | { type: 'silence_specials' }
  | { type: 'defensive_verse' };

export interface CombatReward {
  readonly xp: number;
  readonly karma: number;
  readonly credits: number;
  readonly lootItems: string[];
  readonly skillXp: Partial<Record<TrainablePlayerSkill, number>>;
}

export interface CombatLogEntry {
  readonly turn: number;
  readonly text: string;
  readonly type:
    | 'player_attack'
    | 'enemy_attack'
    | 'enemy_special'
    | 'player_defend'
    | 'player_power'
    | 'player_flee'
    | 'info'
    | 'victory'
    | 'defeat'
    | 'buff_expire'
    | 'critical_hit'
    | 'combo_hit'
    | 'status_effect'
    | 'poem_combo';
  readonly damage?: number;
  readonly isCritical?: boolean;
  readonly comboCount?: number;
}
