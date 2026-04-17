import type { InteractiveObjectConfig } from '@/config/scenes';
import type { PlayerSkills } from '@/data/types';

/** Сообщение, если не хватает навыка для взаимодействия с объектом. */
export function getInteractiveSkillBlockMessage(
  obj: InteractiveObjectConfig,
  skills: PlayerSkills,
): string | null {
  const reqs = obj.requiredSkills;
  if (!reqs?.length) return null;
  for (const r of reqs) {
    const key = r.skill as keyof PlayerSkills;
    const have = typeof skills[key] === 'number' ? (skills[key] as number) : 0;
    if (have < r.min) {
      return `Нужен навык «${r.skill}»: минимум ${r.min} (сейчас ${have}).`;
    }
  }
  return null;
}
