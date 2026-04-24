import type { InteractiveObjectConfig } from '@/config/scenes';
import type { PlayerSkills } from '@/data/types';
import { matchRequiredSkills } from '@/game/conditions/ConditionMatcher';

/** Сообщение, если не хватает навыка для взаимодействия с объектом. */
export function getInteractiveSkillBlockMessage(
  obj: InteractiveObjectConfig,
  skills: PlayerSkills,
): string | null {
  const r = matchRequiredSkills(obj.requiredSkills, skills);
  if (r.ok) return null;
  return `Нужен навык «${r.skill}»: минимум ${r.min} (сейчас ${r.have}).`;
}
