import type { DeviceTier } from '@/hooks/useDeviceTier';
import { LEVEL_UP_PARTICLE_COUNTS } from '@/engine/microAnimations/microAnimationsConstants';

export function formatStatChangeText(statName: string, value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value} ${statName}`;
}

export function buildStatChangeAnnouncement(statName: string, value: number): string {
  return `Изменение: ${formatStatChangeText(statName, value)}`;
}

export function buildItemGainedAnnouncement(name: string): string {
  return `Получено: ${name}`;
}

export function buildKarmaShiftLabel(delta: number, currentKarma: number): string {
  if (delta > 0) {
    return currentKarma >= 70 ? 'Свет' : 'Добро';
  }
  return currentKarma <= 30 ? 'Тьма' : 'Тень';
}

export function buildKarmaShiftAnnouncement(delta: number, currentKarma: number): string {
  const sign = delta > 0 ? '+' : '';
  const label = buildKarmaShiftLabel(delta, currentKarma);
  return `Карма ${sign}${delta}, ${label}`;
}

export function buildXpGainAnnouncement(amount: number): string {
  return `Получено ${amount} опыта`;
}

export function buildLevelUpAnnouncement(level: number): string {
  return `Новый уровень: ${level}`;
}

/** Default stat popup anchor — upper-right HUD zone, SSR-safe. */
export function computeStatChangePosition(stackIndex: number): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 };
  }
  return {
    x: window.innerWidth - 140 - (stackIndex % 3) * 12,
    y: 96 + stackIndex * 28,
  };
}

export function getLevelUpParticleCount(tier: DeviceTier, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  return LEVEL_UP_PARTICLE_COUNTS[tier];
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
