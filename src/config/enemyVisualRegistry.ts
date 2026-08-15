/* ─── FIX-1D (Phase 11.1 — TS error cleanup) ─────────────────────
 *  Date: 2026-07-24
 *  Changes:
 *    - Added `EnemyVisualSpec` entries for the 6 new Phase 11 enemy types
 *      (`corporate_ai`, `grief_echo`, `memory_devourer`, `network_spy`,
 *      `quantum_ghost`, `rust_sentinel`) so the `Record<EnemyType, EnemyVisualSpec>`
 *      type is fully satisfied (previously TS2740 — missing properties).
 *  Archetype selection (based on enemy lore in src/engine/combat/enemies.ts):
 *    - corporate_ai    → 'ethereal' (algorithmic AI — abstract entity)     scale 1.0
 *    - grief_echo      → 'ethereal' (grief manifestation — emotional)      scale 0.9
 *    - memory_devourer → 'ethereal' (erases identity — psychological)      scale 1.1
 *    - network_spy     → 'agent'    (surveillance operative — humanoid)    scale 1.0
 *    - quantum_ghost   → 'ethereal' (quantum data entity — unstable)       scale 0.95
 *    - rust_sentinel   → 'golem'    (degraded old-world protector — mech)  scale 1.2
 *  Note: Task brief suggested 'humanoid' for network_spy & rust_sentinel,
 *  but the only valid `EnemyVisualArchetype` values are
 *  `'ethereal' | 'golem' | 'agent' | 'censor'`. 'agent' and 'golem' are the
 *  closest lore matches (network_spy is shadow_agent-like; rust_sentinel is
 *  firewall_guardian-like).
 * ─────────────────────────────────────────────────────────────────── */

import type { EnemyType } from '@/shared/types/game';

export type EnemyVisualArchetype = 'ethereal' | 'golem' | 'agent' | 'censor';

export interface EnemyVisualSpec {
  readonly archetype: EnemyVisualArchetype;
  readonly scale: number;
}

const ENEMY_VISUAL_BY_TYPE: Record<EnemyType, EnemyVisualSpec> = {
  system_daemon: { archetype: 'ethereal', scale: 1 },
  data_phantom: { archetype: 'ethereal', scale: 0.95 },
  data_wraith: { archetype: 'ethereal', scale: 1.05 },
  void_echo: { archetype: 'ethereal', scale: 1.1 },
  memory_wraith: { archetype: 'ethereal', scale: 1 },
  corporate_golem: { archetype: 'golem', scale: 1.15 },
  guild_enforcer: { archetype: 'golem', scale: 1.05 },
  nexus_guardian: { archetype: 'golem', scale: 1.2 },
  firewall_guardian: { archetype: 'golem', scale: 1.25 },
  shadow_agent: { archetype: 'agent', scale: 1 },
  censor_drone: { archetype: 'agent', scale: 0.9 },
  corporate_drone: { archetype: 'agent', scale: 0.95 },
  code_inquisitor: { archetype: 'censor', scale: 1.05 },
  poetry_hunter: { archetype: 'censor', scale: 1 },
  // ── Phase 11: 6 new enemy visual specs ──
  corporate_ai: { archetype: 'ethereal', scale: 1.0 },
  grief_echo: { archetype: 'ethereal', scale: 0.9 },
  memory_devourer: { archetype: 'ethereal', scale: 1.1 },
  network_spy: { archetype: 'agent', scale: 1.0 },
  quantum_ghost: { archetype: 'ethereal', scale: 0.95 },
  rust_sentinel: { archetype: 'golem', scale: 1.2 },
  // ── Bosses — larger scale for cinematic presence ──
  boss_neuro_sys: { archetype: 'ethereal', scale: 1.4 },
  boss_dream_eater: { archetype: 'ethereal', scale: 1.5 },
  boss_final_code: { archetype: 'ethereal', scale: 1.3 },
};

export function resolveEnemyVisualSpec(enemyType: EnemyType): EnemyVisualSpec {
  return ENEMY_VISUAL_BY_TYPE[enemyType];
}

export function getEnemyVisualArchetype(enemyType: EnemyType): EnemyVisualArchetype {
  return resolveEnemyVisualSpec(enemyType).archetype;
}
