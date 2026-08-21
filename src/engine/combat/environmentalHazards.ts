/* ─── Combat System — Environmental Damage Zones (Task 4b-C3) ───
 *
 * Defines hazard types (fire, poison, electricity) and a simple system
 * for checking player proximity to hazards each frame.
 *
 * This module provides:
 *   - Hazard type definitions with damage, color, and status effects.
 *   - A frame-check function that computes distance-based DoT.
 *   - A hazard pool manager for adding/removing active hazards.
 *
 * NOTE: This is a data/logic module. The actual per-frame integration
 * point depends on the combat rendering loop. For the turn-based combat
 * system, hazards are checked once per turn rather than per render frame.
 */

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export type HazardDamageType = 'fire' | 'poison' | 'electricity';

export type HazardStatusEffect = 'none' | 'stun' | 'slow';

export interface EnvironmentalHazard {
  /** Unique instance ID (e.g. 'fire_zone_1'). */
  id: string;
  /** Hazard type — determines visual color and damage behavior. */
  type: HazardDamageType;
  /** World-space X position. */
  x: number;
  /** World-space Z position (Y is up). */
  z: number;
  /** Radius in world units — player inside this takes damage. */
  radius: number;
  /** Damage per second while inside the zone. */
  damagePerSecond: number;
  /** Visual color for rendering the hazard zone (hex). */
  color: string;
  /** Status effect applied while in the zone. */
  statusEffect: HazardStatusEffect;
  /** Duration of status effect in seconds (0 = only while in zone). */
  statusDuration: number;
  /** Remaining lifetime in seconds (0 = permanent until removed). */
  lifetime: number;
}

/** Result of checking a single hazard against the player. */
export interface HazardCheckResult {
  /** Total damage to apply this frame. */
  damage: number;
  /** Status effect to apply (if any). */
  statusEffect: HazardStatusEffect;
  /** Status effect duration. */
  statusDuration: number;
  /** Hazard ID that triggered the effect. */
  hazardId: string;
  /** Damage type label for combat log. */
  damageTypeLabel: string;
}

/* ═══════════════════════════════════════════════════════════════
   Hazard Presets
   ═══════════════════════════════════════════════════════════════ */

export interface HazardPreset {
  type: HazardDamageType;
  radius: number;
  damagePerSecond: number;
  color: string;
  statusEffect: HazardStatusEffect;
  statusDuration: number;
  damageTypeLabel: string;
}

/** Predefined hazard configurations — used to spawn hazards quickly. */
export const HAZARD_PRESETS: Record<HazardDamageType, HazardPreset> = {
  fire: {
    type: 'fire',
    radius: 3.0,
    damagePerSecond: 8,
    color: '#ef4444',
    statusEffect: 'none',
    statusDuration: 0,
    damageTypeLabel: 'огонь',
  },
  poison: {
    type: 'poison',
    radius: 4.0,
    damagePerSecond: 5,
    color: '#22c55e',
    statusEffect: 'slow',
    statusDuration: 2,
    damageTypeLabel: 'яд',
  },
  electricity: {
    type: 'electricity',
    radius: 2.5,
    damagePerSecond: 12,
    color: '#facc15',
    statusEffect: 'stun',
    statusDuration: 1,
    damageTypeLabel: 'электричество',
  },
};

/* ═══════════════════════════════════════════════════════════════
   Hazard Pool — manages active hazards
   ═══════════════════════════════════════════════════════════════ */

let nextHazardId = 1;

/** Create a hazard from a preset at a given world position. */
export function createHazard(
  type: HazardDamageType,
  x: number,
  z: number,
  lifetime: number = 0,
  overrides?: Partial<Pick<EnvironmentalHazard, 'radius' | 'damagePerSecond'>>,
): EnvironmentalHazard {
  const preset = HAZARD_PRESETS[type];
  return {
    id: `${type}_${nextHazardId++}`,
    type: preset.type,
    x,
    z,
    radius: overrides?.radius ?? preset.radius,
    damagePerSecond: overrides?.damagePerSecond ?? preset.damagePerSecond,
    color: preset.color,
    statusEffect: preset.statusEffect,
    statusDuration: preset.statusDuration,
    lifetime,
  };
}

/** Check all active hazards against the player position.
 *  Returns the worst (highest damage) hazard result.
 *  `deltaSeconds` is the frame/turn time delta for DoT calculation. */
export function checkHazardsAgainstPlayer(
  hazards: readonly EnvironmentalHazard[],
  playerX: number,
  playerZ: number,
  deltaSeconds: number,
): HazardCheckResult | null {
  let worstResult: HazardCheckResult | null = null;

  for (const hazard of hazards) {
    const dx = playerX - hazard.x;
    const dz = playerZ - hazard.z;
    const distSq = dx * dx + dz * dz;
    const radiusSq = hazard.radius * hazard.radius;

    if (distSq < radiusSq) {
      // Player is inside the hazard zone
      const damage = Math.max(1, Math.floor(hazard.damagePerSecond * deltaSeconds));

      if (!worstResult || damage > worstResult.damage) {
        worstResult = {
          damage,
          statusEffect: hazard.statusEffect,
          statusDuration: hazard.statusDuration,
          hazardId: hazard.id,
          damageTypeLabel: hazard.type === 'fire'
            ? HAZARD_PRESETS.fire.damageTypeLabel
            : hazard.type === 'poison'
              ? HAZARD_PRESETS.poison.damageTypeLabel
              : HAZARD_PRESETS.electricity.damageTypeLabel,
        };
      }
    }
  }

  return worstResult;
}

/** Update hazard lifetimes, removing expired ones.
 *  Returns a new array with only non-expired hazards. */
export function tickHazardLifetimes(
  hazards: readonly EnvironmentalHazard[],
  deltaSeconds: number,
): EnvironmentalHazard[] {
  return hazards.filter(h => {
    if (h.lifetime <= 0) return true; // Permanent hazard
    h.lifetime -= deltaSeconds;
    return h.lifetime > 0;
  });
}
