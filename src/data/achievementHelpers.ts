import type { StoryEffect } from '@/shared/types/game';
import type { AchievementDefinition } from '@/data/achievements';

/** Default unlock stinger — procedural audio via AudioEngine. */
export const DEFAULT_ACHIEVEMENT_SOUND = 'stinger:discovery';

/** Human-readable reward label for achievement UI. */
export function formatStoryEffectReward(effect: StoryEffect): string {
  switch (effect.type) {
    case 'addXp':
      return `⚡ +${effect.value ?? 0} ОП`;
    case 'addKarma':
      return `☯ +${effect.value ?? 0} Карма`;
    case 'addSkill':
      return `🎯 +${effect.value ?? 0} ${effect.skill ?? 'навык'}`;
    case 'addCredits':
      return `₴ +${effect.value ?? 0}`;
    case 'setFlag':
      return `🔓 ${effect.flag ?? 'флаг'}`;
    case 'addStat':
      return `${effect.stat ?? 'стат'} ${(effect.value ?? 0) >= 0 ? '+' : ''}${effect.value ?? 0}`;
    case 'collectPoem':
      return `📜 стих ${effect.poemId ?? ''}`;
    case 'discoverLore':
      return `📖 лор`;
    default:
      return effect.type;
  }
}

/** Screen reader text for unlock — explicit announce or title + description. */
export function resolveAchievementAnnounce(def: AchievementDefinition): string {
  if (def.accessibilityAnnounce) return def.accessibilityAnnounce;
  return `Достижение разблокировано: ${def.title}. ${def.description}`;
}
