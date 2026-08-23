import type { EnemyType } from '@/shared/types/definitions/combat';

/** Canonical enemy type ids — keep in sync with ENEMY_TEMPLATES in engine/combat/enemies. */
export const ENEMY_TYPE_IDS: readonly EnemyType[] = [
  'system_daemon',
  'corporate_golem',
  'shadow_agent',
  'data_phantom',
  'code_inquisitor',
  'guild_enforcer',
  'data_wraith',
  'censor_drone',
  'poetry_hunter',
  'nexus_guardian',
  'void_echo',
  'corporate_drone',
  'memory_wraith',
  'firewall_guardian',
  // Phase 11 — content depth expansion
  'network_spy',
  'quantum_ghost',
  'grief_echo',
  'corporate_ai',
  'rust_sentinel',
  'memory_devourer',
  // Task 4b-C1 — ranged/mage archetypes
  'ranged_strelkov',
  'dark_mage',
  // Bosses
  'boss_neuro_sys',
  'boss_dream_eater',
  'boss_final_code',
  'boss_catacombs_keeper',
] as const;
