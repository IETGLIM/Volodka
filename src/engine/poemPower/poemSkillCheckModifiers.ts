import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import type { PlayerSkills, TrainablePlayerSkill } from '@/shared/types/game';
import {
  resolveSkillCheckWithPoemFlags as resolvePure,
  type PoemSkillCheckResult,
} from '@/shared/poemPower/poemSkillCheckRules';

export type { PoemSkillCheckResult };

function consumePoemCheckFlag(flagKey: string): void {
  dispatchGameAction({ type: 'player/setFlag', key: flagKey, value: false });
  dispatchGameAction({ type: 'poem/removeTTLFlags', keys: [flagKey] });
}

/** Apply poem TTL flags that auto-pass or critically succeed the next matching skill check. */
export function applyPoemSkillCheckModifiers(
  skill: TrainablePlayerSkill,
  difficulty: number,
  playerSkills: PlayerSkills,
  flags: Record<string, boolean>,
): PoemSkillCheckResult {
  const resolved = resolvePure(skill, difficulty, playerSkills, flags);
  if (resolved.consumedFlag) {
    consumePoemCheckFlag(resolved.consumedFlag);
    if (resolved.critical) {
      dispatchGameAction({ type: 'player/addKarma', amount: 3 });
    }
  }
  return resolved;
}

/** Consume a poem skill-check flag after the player commits to a passing choice. */
export function consumePoemSkillCheckFlag(flagKey: string, options?: { critical?: boolean }): void {
  consumePoemCheckFlag(flagKey);
  if (options?.critical) {
    dispatchGameAction({ type: 'player/addKarma', amount: 3 });
  }
}
