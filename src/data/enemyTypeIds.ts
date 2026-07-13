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
] as const;
