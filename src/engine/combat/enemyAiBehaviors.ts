/* ─── Enemy AI Behaviors — patrol/chase/attack state machine (Task 4b-C5) ───
 *
 * Provides per-enemy-type AI configuration:
 *   - AGGRO_RANGE: Detection distance (default 12 world units)
 *   - LEASH_RANGE: Maximum chase distance before returning to patrol (default 20)
 *   - ATTACK_COOLDOWN_S: Minimum seconds between 3D-world attacks
 *   - PREFERRED_DISTANCE: Ranged enemies try to stay this far from the player
 *   - KITING_ENABLED: Whether ranged enemies maintain preferred distance
 *
 * These constants are designed for the 3D exploration layer (PatrollingCreeps),
 * not the turn-based combat system.
 */

import type { EnemyType } from '@/shared/types/game';

/* ═══════════════════════════════════════════════════════════════
   AI Behavior Configuration per Enemy Type
   ═══════════════════════════════════════════════════════════════ */

export interface EnemyAiConfig {
  /** Distance at which the enemy detects the player (world units). */
  aggroRange: number;
  /** Maximum chase distance — if player is farther, enemy returns to patrol. */
  leashRange: number;
  /** Minimum seconds between attack engagements (3D world, not turn-based). */
  attackCooldownS: number;
  /** Preferred combat distance — ranged enemies try to maintain this. */
  preferredDistance: number;
  /** Minimum preferred distance (ranged kiting range lower bound). */
  minPreferredDistance: number;
  /** Whether this enemy type uses ranged kiting behavior. */
  kitingEnabled: boolean;
}

/** Default AI config — used for enemies not explicitly listed. */
const DEFAULT_AI_CONFIG: EnemyAiConfig = {
  aggroRange: 12,
  leashRange: 20,
  attackCooldownS: 1.5,
  preferredDistance: 2.4,
  minPreferredDistance: 1.5,
  kitingEnabled: false,
};

/** Per-enemy-type AI behavior overrides.
 *  Ranged types (ranged_strelkov, censor_drone) kite the player.
 *  Fast types (void_echo, quantum_ghost) have shorter cooldowns.
 *  Boss types have larger aggro/leash ranges. */
const ENEMY_AI_OVERRIDES: Partial<Record<EnemyType, Partial<EnemyAiConfig>>> = {
  // Ranged: Стрелок — keeps 5-8 units away, fast attack rate
  ranged_strelkov: {
    aggroRange: 14,
    preferredDistance: 7,
    minPreferredDistance: 5,
    kitingEnabled: true,
    attackCooldownS: 1.0,
  },
  // Ranged: Дрон-Цензор — moderate kiting, slower attacks
  censor_drone: {
    aggroRange: 13,
    preferredDistance: 6,
    minPreferredDistance: 4,
    kitingEnabled: true,
    attackCooldownS: 1.8,
  },
  // Ranged: Корпоративный Дрон — short range, no kiting
  corporate_drone: {
    aggroRange: 10,
    attackCooldownS: 1.6,
  },
  // Fast: Эхо Пустоты — fast, aggressive, short aggro
  void_echo: {
    aggroRange: 15,
    attackCooldownS: 0.8,
  },
  // Fast: Квантовый Призрак — very fast, long aggro
  quantum_ghost: {
    aggroRange: 16,
    attackCooldownS: 0.7,
    leashRange: 24,
  },
  // Slow: Страж Межсетевого Экрана — short aggro, slow attacks
  firewall_guardian: {
    aggroRange: 8,
    attackCooldownS: 2.5,
    leashRange: 15,
  },
  // Slow: Корпоративный Голем — short aggro, slow
  corporate_golem: {
    aggroRange: 8,
    attackCooldownS: 2.2,
    leashRange: 15,
  },
  // Bosses: large aggro and leash ranges, long cooldowns
  boss_neuro_sys: {
    aggroRange: 20,
    leashRange: 30,
    attackCooldownS: 2.0,
  },
  boss_dream_eater: {
    aggroRange: 22,
    leashRange: 32,
    attackCooldownS: 1.8,
  },
  boss_final_code: {
    aggroRange: 24,
    leashRange: 35,
    attackCooldownS: 1.5,
  },
  boss_catacombs_keeper: {
    aggroRange: 18,
    leashRange: 28,
    attackCooldownS: 2.0,
  },
};

/* ═══════════════════════════════════════════════════════════════
   AI Behavior Resolution
   ═══════════════════════════════════════════════════════════════ */

/** Get the resolved AI config for an enemy type. */
export function getEnemyAiConfig(enemyType: EnemyType): EnemyAiConfig {
  const overrides = ENEMY_AI_OVERRIDES[enemyType];
  if (!overrides) return DEFAULT_AI_CONFIG;
  return { ...DEFAULT_AI_CONFIG, ...overrides };
}

/* ═══════════════════════════════════════════════════════════════
   AI State Machine Types
   ═══════════════════════════════════════════════════════════════ */

export type EnemyAiState = 'patrol' | 'chase' | 'kite' | 'attack' | 'cooldown' | 'return';

export interface EnemyAiContext {
  /** Current AI state. */
  state: EnemyAiState;
  /** Distance from enemy to player (world units). */
  playerDistance: number;
  /** Whether the player is within the vision cone. */
  playerInCone: boolean;
  /** Whether the player is within aggro range. */
  playerInAggroRange: boolean;
  /** Whether the player is beyond leash range. */
  playerBeyondLeash: boolean;
  /** Whether the enemy is closer than the preferred distance (for kiting). */
  tooClose: boolean;
  /** Seconds since last attack. */
  timeSinceLastAttack: number;
  /** AI config for this enemy type. */
  config: EnemyAiConfig;
}

/** Resolve the next AI state based on current context.
 *  Pure function — no side effects. */
export function resolveEnemyAiState(ctx: EnemyAiContext): EnemyAiState {
  const { state, config } = ctx;

  // Universal leash check — if player is too far, return to patrol
  if (ctx.playerBeyondLeash) {
    return 'return';
  }

  switch (state) {
    case 'patrol':
      // Detect player: must be in range AND in vision cone
      if (ctx.playerInAggroRange && ctx.playerInCone) {
        return 'chase';
      }
      return 'patrol';

    case 'chase':
      // Close enough for melee attack
      if (ctx.playerDistance < 2.0 && ctx.timeSinceLastAttack >= config.attackCooldownS) {
        return 'attack';
      }
      // Ranged enemy reached preferred distance
      if (config.kitingEnabled) {
        if (ctx.playerDistance >= config.minPreferredDistance && ctx.playerDistance <= config.preferredDistance) {
          if (ctx.timeSinceLastAttack >= config.attackCooldownS) {
            return 'attack';
          }
          return 'kite'; // Hold distance
        }
        // Too close — back away (kite)
        if (ctx.playerDistance < config.minPreferredDistance) {
          return 'kite';
        }
      }
      return 'chase';

    case 'kite':
      // Ranged enemy maintaining distance
      if (ctx.playerDistance < config.minPreferredDistance) {
        return 'kite'; // Keep backing away
      }
      if (ctx.playerDistance > config.preferredDistance + 2) {
        return 'chase'; // Player moved away, close in again
      }
      // In sweet spot — attack if ready
      if (ctx.timeSinceLastAttack >= config.attackCooldownS) {
        return 'attack';
      }
      return 'kite';

    case 'attack':
      // After attacking, decide next action
      if (config.kitingEnabled && ctx.playerDistance < config.minPreferredDistance) {
        return 'kite';
      }
      return 'chase';

    case 'cooldown':
      if (ctx.playerInAggroRange) {
        return 'chase';
      }
      return 'patrol';

    case 'return':
      // Once back near a waypoint (handled by caller), resume patrol
      return 'patrol';
  }
}
