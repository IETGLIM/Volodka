/* ─── FIX-1D (Phase 11.1 — TS error cleanup) ─────────────────────
 *  Date: 2026-07-24
 *  Changes:
 *    - Extended the `BuffEffect.stat_drain` union to include `'empathy'`
 *      alongside `'logic' | 'energy' | 'karma'`. Phase 11 enemies
 *      (`grief_echo` Потеря Надежды, `memory_devourer` Поглощение Навыка)
 *      apply empathy-drain debuffs; the prior type rejected them (TS2322).
 *  Rationale: `empathy` is a valid `PlayerSkill` and is already used as a
 *  drain target by `memory_wraith` (existing enemy) and the Phase 11
 *  successors. `CombatSystem.transitionToPlayerTurn` has been updated to
 *  handle the new `'empathy'` branch via `player/addSkill`.
 * ─────────────────────────────────────────────────────────────────── */

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
  | 'void_echo'
  | 'corporate_drone'
  | 'memory_wraith'
  | 'firewall_guardian'
  // Phase 11 — 6 new enemy types for content depth (20 total)
  | 'network_spy'       // Act 2+: Сетевой Шпион — surveillance operative
  | 'quantum_ghost'     // Act 3+: Квантовый Призрак — quantum data entity
  | 'grief_echo'        // Act 2+: Эхо Скорби — grief manifestation
  | 'corporate_ai'      // Act 4+: Корпоративный ИИ — algorithmic oppressor
  | 'rust_sentinel'     // Act 1+: Ржавый Страж — degraded old-world protector
  | 'memory_devourer'  // Act 5+: Пожиратель Памяти — erases identity
  // ── BOSSES — unique multi-phase enemies with special mechanics ──
  | 'boss_neuro_sys'        // Акт 3 финал: НейроСис — главный ИИ корпорации
  | 'boss_dream_eater'      // Акт 5 финал: Пожиратель Снов — сущность из Мира Снов
  | 'boss_final_code';      // Акт 7 финал: Финальный Код — последнее испытание

export type CombatAction = 'attack' | 'defend' | 'poem_power' | 'flee' | 'use_item';

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
  | { type: 'stat_drain'; stat: 'logic' | 'energy' | 'karma' | 'empathy'; value: number }
  | { type: 'defense_boost'; value: number }
  | { type: 'attack_boost'; value: number }
  | { type: 'hp_drain_percent'; value: number }
  | { type: 'silence_specials' }
  | { type: 'defensive_verse' }
  | { type: 'stun_immune' };

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
    | 'player_item'     // Phase 11: combat consumable use
    | 'info'
    | 'victory'
    | 'defeat'
    | 'buff_expire'
    | 'critical_hit'
    | 'combo_hit'
    | 'status_effect'
    | 'poem_combo'
    | 'affinity_super'  // Phase 11: super-effective hit
    | 'affinity_weak'   // Phase 11: resisted hit
    | 'affinity_immune'; // Phase 11: immune hit
  readonly damage?: number;
  readonly isCritical?: boolean;
  readonly comboCount?: number;
  /** Phase 11: affinity multiplier applied (2.0=super, 0.5=resist, 0.0=immune) */
  readonly affinityMultiplier?: number;
  /** Phase 11: damage channel used (code, logic, empathy, etc.) */
  readonly damageChannel?: string;
  /** Phase 11: item ID used if action was 'use_item' */
  readonly itemId?: string;
}
