/* ─── FIX-1D (Phase 11.1 — TS error cleanup) ─────────────────────
 *  Date: 2026-07-24
 *  Changes:
 *    - Extended the `combat:action` event payload with an optional `itemId`
 *      field so `CombatSystem.playerUseItem` can emit the consumed item ID
 *      alongside the `use_item` action (previously rejected by TS2353).
 *  Rationale: `combat:action` is the canonical per-turn action event; the
 *  Phase 11 item-use path legitimately needs to surface the consumed item
 *  so UI/animation listeners can react. Adding an optional field is the
 *  cleanest fix and is fully backwards-compatible with existing emitters
 *  that omit `itemId`.
 * ─────────────────────────────────────────────────────────────────── */

import type { EncounterContext } from '@/engine/combat/encounterTypes';
import type { CombatAction, EnemyType, SceneId } from '@/shared/types/game';
import type { CombatDpadDirection } from '@/engine/combat/combatGamepadMap';

/** Turn-based combat — CombatSystem, ScreenEffects, useCombatOrchestrator. */
export interface CombatEvents {
  'encounter:presentation_start': EncounterContext & { sceneId: SceneId };
  'encounter:presentation_end': EncounterContext;
  'combat:start': { enemyType: EnemyType; encounterName?: string; encounterEmoji?: string };
  'combat:turn': { turn: number; isPlayerTurn: boolean };
  'combat:action': {
    action: CombatAction;
    damage?: number;
    itemId?: string;
    /** Affinity / poem damage channel when attack or poem power deals damage */
    damageChannel?: string;
    isCritical?: boolean;
    comboCount?: number;
  };
  'combat:victory': { enemyType: EnemyType; xpGained: number; karmaGained: number; creditsGained: number; lootItemId?: string };
  'combat:defeat': { enemyType: EnemyType; energyLost: number; karmaLost: number };
  'combat:fled': { enemyType: EnemyType };
  'combat:end': Record<string, never>;
  'combat:hit': { damage: number; isPlayerHit: boolean; direction?: 'left' | 'right' | 'front' | 'back'; source?: string; isCritical?: boolean };
  'combat:damage': { amount: number; source?: string; critical?: boolean };
  'combat:heal': { amount: number; source?: string };
  'combat:story_continue': { nodeId: string };
  /** v4.7.8 «Волна из двух врагов» — первый враг пал, из очереди вступает
   *  следующий: UI меняет портрет/панель, аудио — стингер, flash — смена
   *  цели. Награды за павшего начислены (половинные). */
  'combat:wave_swap': {
    defeatedType: EnemyType;
    nextType: EnemyType;
    nextName: string;
  };
  /** Boss phase transition (combat/bossPhases.ts) — UI flash, audio stinger,
   *  announcer. Emitted when HP crosses a threshold (100/60/30). */
  'combat:boss_phase': {
    enemyType: EnemyType;
    /** New phase index (0-based). */
    phase: number;
    /** Russian phase description (e.g. «Фаза 3: Ярость»). */
    description: string;
    /** Flash color for the phase-transition screen flash (hex). */
    flashColor: string;
    /** Outgoing damage multiplier of the new phase. */
    damageMultiplier: number;
  };
  /** Telegraph: the enemy spent its turn CHARGING a special attack. The
   *  special fires guaranteed on the enemy's next turn — the player gets a
   *  one-turn counter-window (defend applies an extra ×0.4 damage cut). */
  'combat:telegraph': {
    enemyType: EnemyType;
    attackId: string;
    /** Russian special-attack name for the «Готовит: …!» indicator. */
    attackName: string;
  };
  /** Gamepad-triggered combat actions — emitted by useCombatGamepad hook. */
  'combat:gamepad_attack': Record<string, never>;
  'combat:gamepad_defend': Record<string, never>;
  'combat:gamepad_flee': Record<string, never>;
  'combat:gamepad_poem_cycle_prev': Record<string, never>;
  'combat:gamepad_poem_cycle_next': Record<string, never>;
  'combat:gamepad_poem_use_selected': Record<string, never>;
  'combat:gamepad_dpad_nav': { direction: CombatDpadDirection };
  /** Max Payne-style bullet time — crit / affinity / combo / player stagger. */
  'combat:bullet_time': {
    duration: number;
    intensity: number;
    reason: 'critical_hit' | 'affinity_super' | 'combo_hit' | 'player_stagger' | 'poem_power';
  };
  /** Phase 11: Combat consumable item used — for UI animation feedback. */
  'combat:item_used': { itemId: string; name: string; emoji: string };
  /** v4.8.7 «Опережающий удар» — реал-тайм замах до пошагового боя
   *  (meleeStrike.ts). Эмитится только при ПОПАДАНИИ: FX-искры (пул
   *  combatTransientPool) и хаптика реагируют на попадание. */
  'combat:melee_strike': {
    source: 'mouse' | 'mobile_hud' | 'gamepad';
    /** Всегда true в текущей версии (промахи не эмитятся). */
    hit: boolean;
    /** v4.8.8: удар стал ДОБИВАНИЕМ — крип повержен до пошаговой фазы. */
    finished: boolean;
    creepId: string;
    enemyName: string;
    /** Точка удара (мировые координаты) — спавн искр. */
    x: number;
    y: number;
    z: number;
  };
  /** v4.8.8 «Добивание» — крип повержен ударом ДО пошагового боя
   *  (реал-тайм слой: creepVitality + meleeStrike). Награды уже начислены
   *  (урезанные computeCreepFinisherRewards); слушатель PatrollingCreeps
   *  снимает крипа со сцены, как при combat:victory. */
  'combat:creep_finished': {
    creepId: string;
    enemyType: EnemyType;
    enemyName: string;
    /** Точка добивания (мировые координаты). */
    x: number;
    y: number;
    z: number;
    xpGained: number;
    karmaGained: number;
    creditsGained: number;
  };
}
