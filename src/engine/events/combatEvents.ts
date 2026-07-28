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
  'combat:hit': { damage: number; isPlayerHit: boolean; direction?: 'left' | 'right' | 'front' | 'back'; source?: string };
  'combat:damage': { amount: number; source?: string; critical?: boolean };
  'combat:heal': { amount: number; source?: string };
  'combat:story_continue': { nodeId: string };
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
    reason: 'critical_hit' | 'affinity_super' | 'combo_hit' | 'player_stagger';
  };
  /** Phase 11: Combat consumable item used — for UI animation feedback. */
  'combat:item_used': { itemId: string; name: string; emoji: string };
}
