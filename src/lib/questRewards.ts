/**
 * Применение наград квеста к доменным сторам (фасад `useGameStore` @/state).
 * Логика согласована с legacy `gameStore.completeQuest`: статы, навыки, предметы, флаги, затем XP.
 */

import type { PlayerSkills, PlayerState, QuestReward } from '@/data/types';
import { usePlayerStore } from '@/state/playerStore';
import { useInventoryStore } from '@/state/inventoryStore';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function applyStatAndSkillRewardsFromQuest(reward: QuestReward): void {
  const state = usePlayerStore.getState();
  const ps = state.playerState;

  const updates: Partial<Pick<PlayerState, 'creativity' | 'mood' | 'stability' | 'karma'>> = {};
  if (reward.creativity != null) {
    updates.creativity = clamp((ps.creativity || 50) + reward.creativity, 0, 100);
  }
  if (reward.mood != null) {
    updates.mood = clamp((ps.mood || 50) + reward.mood, 0, 100);
  }
  if (reward.stability != null) {
    updates.stability = clamp((ps.stability || 50) + reward.stability, 0, 100);
  }
  if (reward.karma != null) {
    updates.karma = clamp((ps.karma || 50) + reward.karma, 0, 100);
  }

  const skillGains: Partial<Record<keyof PlayerSkills, number>> = {};
  if (reward.perception) skillGains.perception = reward.perception;
  if (reward.introspection) skillGains.introspection = reward.introspection;
  if (reward.writing) skillGains.writing = reward.writing;
  if (reward.empathy) skillGains.empathy = reward.empathy;
  if (reward.persuasion) skillGains.persuasion = reward.persuasion;
  if (reward.intuition) skillGains.intuition = reward.intuition;
  if (reward.resilience) skillGains.resilience = reward.resilience;

  let skills: PlayerSkills = ps.skills;
  if (Object.keys(skillGains).length > 0) {
    const next: PlayerSkills = { ...ps.skills };
    for (const k of Object.keys(skillGains) as Array<keyof PlayerSkills>) {
      if (k === 'skillPoints') continue;
      const v = skillGains[k];
      if (v == null) continue;
      const cur = (next[k] as number) || 0;
      (next as Record<keyof PlayerSkills, number>)[k] = clamp(cur + v, 0, 100);
    }
    skills = next;
  }

  if (reward.skillPoints) {
    skills = {
      ...skills,
      skillPoints: (skills.skillPoints || 0) + reward.skillPoints,
    };
  }

  if (Object.keys(updates).length > 0 || Object.keys(skillGains).length > 0 || (reward.skillPoints && reward.skillPoints !== 0)) {
    usePlayerStore.setState({
      playerState: {
        ...ps,
        ...updates,
        skills,
      },
    });
  }
}

/**
 * Содержимое `reward` (статы, навыки, предметы, флаги) и гарантированный XP за квест
 * (как в monolithic `gameStore` — default 36, `main_goal` 48, иначе `reward.experience` если > 0).
 */
export function applyQuestCompletionRewards(
  questId: string,
  reward: QuestReward | undefined,
): void {
  if (reward) {
    applyStatAndSkillRewardsFromQuest(reward);
    if (reward.itemRewards?.length) {
      const inv = useInventoryStore.getState();
      for (const itemId of reward.itemRewards) {
        inv.addItem(itemId, 1);
      }
    }
    if (reward.unlockFlags?.length) {
      for (const flag of reward.unlockFlags) {
        usePlayerStore.getState().setFlag(flag);
      }
    }
  }

  const qxp = reward?.experience;
  const xpAward =
    typeof qxp === 'number' && qxp > 0 ? qxp : questId === 'main_goal' ? 48 : 36;
  usePlayerStore.getState().addExperience(xpAward, `quest:${questId}`);
}
