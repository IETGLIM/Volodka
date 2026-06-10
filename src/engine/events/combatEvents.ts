import type { CombatAction, EnemyType } from '@/shared/types/game';

/** Turn-based combat — CombatSystem, ScreenEffects, useCombatOrchestrator. */
export interface CombatEvents {
  'combat:start': { enemyType: EnemyType };
  'combat:turn': { turn: number; isPlayerTurn: boolean };
  'combat:action': { action: CombatAction; damage?: number };
  'combat:victory': { enemyType: EnemyType; xpGained: number; karmaGained: number; creditsGained: number; lootItemId?: string };
  'combat:defeat': { enemyType: EnemyType; energyLost: number; karmaLost: number };
  'combat:fled': { enemyType: EnemyType };
  'combat:end': Record<string, never>;
  'combat:hit': { damage: number; isPlayerHit: boolean; direction?: 'left' | 'right' | 'front' | 'back'; source?: string };
  'combat:miss': { source?: string };
  'combat:damage': { amount: number; source?: string; critical?: boolean };
  'combat:heal': { amount: number; source?: string };
  'combat:story_continue': { nodeId: string };
}
