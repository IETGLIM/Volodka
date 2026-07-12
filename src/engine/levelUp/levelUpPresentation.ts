import type { DeviceTier } from '@/hooks/useDeviceTier';
import { LEVEL_UP_PARTICLE_COUNT } from '@/engine/levelUp/levelUpConstants';

export type LevelUpViewState = {
  newLevel: number;
  prevLevel: number;
  id: string;
  levelsGained: number;
  perkPointsGained: number;
};

export type ParticleSpec = {
  id: number;
  angle: number;
  distance: number;
  delay: number;
  size: number;
  variant: 'gold' | 'cyan';
};

function pluralRu(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function formatSkillPointsLabel(count: number): string {
  const word = pluralRu(count, 'очко навыка', 'очка навыка', 'очков навыка');
  return `+${count} ${word}`;
}

export function formatPerkPointsLabel(count: number): string {
  const word = pluralRu(count, 'очко черты', 'очка черты', 'очков черты');
  return `+${count} ${word}`;
}

export function buildLevelUpAnnouncement(state: LevelUpViewState): string {
  const parts = [`Уровень повышен до ${state.newLevel}`];
  if (state.levelsGained > 0) {
    parts.push(formatSkillPointsLabel(state.levelsGained).replace('+', 'Получено '));
  }
  if (state.perkPointsGained > 0) {
    parts.push(formatPerkPointsLabel(state.perkPointsGained).replace('+', 'Получено '));
  }
  return `${parts.join('. ')}.`;
}

export function getParticleCountForTier(tier: DeviceTier, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  return LEVEL_UP_PARTICLE_COUNT[tier];
}

export function formatSkillPointsShortLabel(count: number): string {
  return pluralRu(count, 'Очко навыка', 'Очка навыка', 'Очков навыка');
}

export function formatPerkPointsShortLabel(count: number): string {
  return pluralRu(count, 'Очко черты', 'Очка черты', 'Очков черты');
}

export function buildSummaryParticleSpecs(count: number): ParticleSpec[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    angle: (360 / count) * index,
    distance: 100 + (index % 4) * 50,
    delay: index * 0.025,
    size: 3 + (index % 5),
    variant: index % 3 === 0 ? 'cyan' : 'gold',
  }));
}

export function buildParticleSpecs(count: number): ParticleSpec[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    angle: (360 / count) * index,
    distance: 80 + (index % 3) * 40,
    delay: index * 0.03,
    size: 3 + (index % 4),
    variant: index % 2 === 0 ? 'gold' : 'cyan',
  }));
}
