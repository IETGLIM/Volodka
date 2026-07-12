import { PERKS, PERK_CATEGORY_META, type PerkCategory, type PerkDefinition } from '@/data/perks';
import { DEFAULT_PERK_COST } from '@/engine/perks/perksPanelConstants';

export type PerkState = 'locked' | 'available' | 'acquired' | 'exclusive';

export type CategoryCounts = Record<PerkCategory, { acquired: number; total: number }>;

export type PerkCardVisualStyle = {
  borderColor: string;
  bgColor: string;
  glowStyle: Record<string, string>;
  usePulse: boolean;
};

export function getPerkCost(perk: Pick<PerkDefinition, 'cost'>): number {
  return perk.cost ?? DEFAULT_PERK_COST;
}

export function canAffordPerk(perkPoints: number, perk: Pick<PerkDefinition, 'cost'>): boolean {
  return perkPoints >= getPerkCost(perk);
}

export function getPerkState(
  perk: PerkDefinition,
  unlockedPerks: readonly string[],
  perkPoints: number,
  level: number,
): PerkState {
  if (unlockedPerks.includes(perk.id)) return 'acquired';

  if (perk.mutuallyExclusiveWith) {
    const hasExclusive = perk.mutuallyExclusiveWith.some((exId) => unlockedPerks.includes(exId));
    if (hasExclusive) return 'exclusive';
  }

  if (level < perk.minLevel) return 'locked';

  const prereqsMet = perk.requiredPerks.every((req) => unlockedPerks.includes(req));
  if (!prereqsMet) return 'locked';

  if (perkPoints <= 0) return 'available';

  return 'available';
}

export function computeCategoryCounts(unlockedPerks: readonly string[]): CategoryCounts {
  const counts: CategoryCounts = {
    survival: { acquired: 0, total: 0 },
    social: { acquired: 0, total: 0 },
    combat: { acquired: 0, total: 0 },
    poetic: { acquired: 0, total: 0 },
    technical: { acquired: 0, total: 0 },
  };

  for (const perk of PERKS) {
    counts[perk.category].total += 1;
    if (unlockedPerks.includes(perk.id)) {
      counts[perk.category].acquired += 1;
    }
  }

  return counts;
}

export function filterPerksByCategory(
  category: PerkCategory | 'all',
): PerkDefinition[] {
  if (category === 'all') return PERKS;
  return PERKS.filter((perk) => perk.category === category);
}

export function getPerkCardVisualStyle(
  state: PerkState,
  categoryColor: string,
  canAfford: boolean,
  reducedMotion: boolean,
): PerkCardVisualStyle {
  const isAcquired = state === 'acquired';
  const isAvailable = state === 'available';
  const isExclusive = state === 'exclusive';

  const borderColor = isAcquired
    ? categoryColor
    : isAvailable && canAfford
      ? `${categoryColor}88`
      : isAvailable
        ? `${categoryColor}55`
        : isExclusive
          ? 'rgba(251,113,133,0.3)'
          : 'rgba(100,116,139,0.15)';

  const bgColor = isAcquired
    ? `${categoryColor}12`
    : isAvailable && canAfford
      ? `${categoryColor}0c`
      : isAvailable
        ? `${categoryColor}06`
        : 'rgba(15,23,42,0.4)';

  const glowStyle: Record<string, string> =
    isAvailable && canAfford
      ? {
          boxShadow: `0 0 20px ${categoryColor}40, 0 0 40px ${categoryColor}18, inset 0 0 12px ${categoryColor}0a`,
        }
      : isAvailable
        ? {
            boxShadow: `0 0 10px ${categoryColor}20, inset 0 0 6px ${categoryColor}05`,
          }
        : isAcquired
          ? { boxShadow: `0 0 8px ${categoryColor}20, inset 0 0 4px ${categoryColor}08` }
          : {};

  const usePulse = !reducedMotion && isAvailable && canAfford;

  return { borderColor, bgColor, glowStyle, usePulse };
}

export function getCategoryMetaColor(category: PerkCategory): string {
  return PERK_CATEGORY_META[category].color;
}

export function getGridItemMotion(reducedMotion: boolean) {
  return reducedMotion
    ? { initial: false, animate: { opacity: 1, scale: 1 }, exit: undefined, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.2 },
      };
}

export function getAcquiredCardMotion(reducedMotion: boolean, isAcquired: boolean) {
  if (reducedMotion || !isAcquired) {
    return { animate: {}, transition: { duration: 0 } };
  }
  return {
    animate: { scale: [1, 1.02, 1] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
  };
}

export function getFlavorRevealTransition(reducedMotion: boolean) {
  return reducedMotion ? { duration: 0 } : { duration: 0.2 };
}
