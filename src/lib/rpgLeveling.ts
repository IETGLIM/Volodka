/**
 * Кривая опыта и уровней персонажа (классическая RPG-логика: растущий порог до следующего уровня).
 * Нарратив: «опыт» = прожитые узлы истории, квесты, стихи — без гринда ради числа.
 */

/** Максимальный уровень персонажа (мягкий потолок для баланса сюжета). */
export const RPG_MAX_CHARACTER_LEVEL = 60;

/** Очков навыков за каждый полученный уровень (дальше — в традиционную ветку навыков). */
export const RPG_XP_SKILL_POINTS_PER_LEVEL = 1;

/**
 * Опыт, нужный чтобы перейти с `level` на `level + 1` (на текущем уровне в бакете до level up).
 * `level` — 1-based. На максимуме — 0.
 */
export function experienceRequiredForNextLevel(level: number): number {
  if (!Number.isFinite(level) || level < 1) return 95;
  if (level >= RPG_MAX_CHARACTER_LEVEL) return 0;
  const base = 95;
  const growth = 1.13;
  return Math.max(28, Math.floor(base * growth ** (level - 1)));
}

export type ApplyExperienceResult = {
  characterLevel: number;
  experience: number;
  experienceToNextLevel: number;
  levelsGained: number;
};

/** Начислить опыт; вернуть новое состояние уровня/бакета (без побочных эффектов). */
export function applyExperienceGain(
  characterLevel: number,
  experience: number,
  gain: number,
): ApplyExperienceResult {
  let lvl = Math.max(1, Math.min(RPG_MAX_CHARACTER_LEVEL, Math.floor(characterLevel)));
  let xp = Math.max(0, experience) + Math.max(0, gain);
  let levelsGained = 0;
  let next = experienceRequiredForNextLevel(lvl);

  while (lvl < RPG_MAX_CHARACTER_LEVEL && next > 0 && xp >= next) {
    xp -= next;
    lvl += 1;
    levelsGained += 1;
    next = experienceRequiredForNextLevel(lvl);
  }

  return {
    characterLevel: lvl,
    experience: xp,
    experienceToNextLevel: next,
    levelsGained,
  };
}
