import type { EncounterContext } from '@/engine/combat/encounterTypes';
import type { CombatAction, EnemyType, SceneId } from '@/shared/types/game';
import type { CombatDpadDirection } from '@/engine/combat/combatGamepadMap';

/** Turn-based combat — CombatSystem, ScreenEffects, useCombatOrchestrator. */
export interface CombatEvents {
  'encounter:presentation_start': EncounterContext & { sceneId: SceneId };
  'encounter:presentation_end': EncounterContext;
  'combat:start': { enemyType: EnemyType; encounterName?: string; encounterEmoji?: string };
  'combat:turn': { turn: number; isPlayerTurn: boolean };
  'combat:action': { action: CombatAction; damage?: number };
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
}
