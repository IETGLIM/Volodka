import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_MAP,
  TOTAL_ACHIEVEMENTS,
  RARITY_META,
} from '@/data/achievements';
import { formatStoryEffectReward, resolveAchievementAnnounce } from '@/data/achievementHelpers';
import { resolveAchievementProgress } from '@/engine/achievementProgressResolver';

const defaultProgress = {
  visitedScenes: ['volodka_room', 'cafe_evening', 'street_night', 'park_day', 'library_day'],
  combatVictories: 0,
  consecutiveVictories: 0,
  maxComboAchieved: 0,
  hasCriticalHit: false,
  defeatedEnemyTypes: [] as string[],
  nightTimeHours: 0,
  poemPowerUsedInCombat: false,
  goodKarmaStreak: 0,
  badKarmaStreak: 0,
};

describe('Achievement definitions', () => {
  it('all achievements have rarity, a11y announce and StoryEffect rewards', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.rarity, a.id).toBeTruthy();
      expect(RARITY_META[a.rarity], a.id).toBeTruthy();
      if (a.accessibilityAnnounce && !a.accessibilityAnnounce.startsWith('Достижение разблокировано')) {
        expect(a.accessibilityAnnounce.length, a.id).toBeGreaterThan(10);
      } else {
        expect(a.accessibilityAnnounce, a.id).toContain(a.title);
      }
      expect(a.soundEffect, a.id).toBeTruthy();
      for (const reward of a.rewards) {
        expect(['addXp', 'addKarma', 'addSkill', 'addCredits', 'setFlag', 'addStat']).toContain(reward.type);
      }
    }
  });

  it('cumulative achievements define progressTracking', () => {
    const explorer = ACHIEVEMENT_MAP.explorer_explorer;
    expect(explorer.progressTracking).toEqual({
      type: 'collection',
      collectionKind: 'scenes',
      target: 5,
    });
    const invincible = ACHIEVEMENT_MAP.combat_invincible;
    expect(invincible.progressTracking?.counterKey).toBe('consecutiveVictories');
    expect(invincible.progressTracking?.target).toBe(5);
  });

  it('Act 6–7 and CHK achievements exist', () => {
    expect(ACHIEVEMENT_MAP.story_traitor_revealed.unlockFlag).toBe('traitor_revealed');
    expect(ACHIEVEMENT_MAP.story_nadzor_destroyed.rarity).toBe('legendary');
    expect(ACHIEVEMENT_MAP.social_tolpa_member.unlockFlag).toBe('tolpa_honorary_chekist');
    expect(ACHIEVEMENT_MAP.story_game_completed.unlockFlag).toBe('game_completed');
    expect(ACHIEVEMENT_MAP.hidden_sacrifice).toBeTruthy();
  });

  it('minigame achievements use completion flags', () => {
    expect(ACHIEVEMENT_MAP.minigame_openstack_solved.unlockFlag).toBe('openstack_terminal_solved');
    expect(ACHIEVEMENT_MAP.minigame_poetry_composed.unlockFlag).toBe('poetry_composition_complete');
  });

  it('formatStoryEffectReward handles addXp', () => {
    expect(formatStoryEffectReward({ type: 'addXp', value: 50 })).toContain('50');
  });

  it('resolveAchievementProgress tracks scene visits', () => {
    const view = resolveAchievementProgress(
      ACHIEVEMENT_MAP.explorer_explorer,
      defaultProgress,
      { collectedPoems: [], karma: 0, flags: {} },
    );
    expect(view).toEqual({ current: 5, target: 5 });
  });

  it('resolveAchievementAnnounce falls back to title and description', () => {
    const text = resolveAchievementAnnounce(ACHIEVEMENT_MAP.story_first_awakening);
    expect(text).toContain('Первое пробуждение');
  });

  it('TOTAL_ACHIEVEMENTS matches array length', () => {
    expect(TOTAL_ACHIEVEMENTS).toBe(ACHIEVEMENTS.length);
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(40);
  });

  it('karma streak achievements track moral choices', () => {
    expect(ACHIEVEMENT_MAP.karma_virtuous_streak.progressTracking?.counterKey).toBe('goodKarmaStreak');
    expect(ACHIEVEMENT_MAP.karma_ruthless_streak.hidden).toBe(true);
  });
});
