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
};

export function resolveEnemyVisualSpec(enemyType: EnemyType): EnemyVisualSpec {
  return ENEMY_VISUAL_BY_TYPE[enemyType];
}

export function getEnemyVisualArchetype(enemyType: EnemyType): EnemyVisualArchetype {
  return resolveEnemyVisualSpec(enemyType).archetype;
}
