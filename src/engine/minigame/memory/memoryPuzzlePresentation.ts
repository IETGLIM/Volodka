import {
  ACCENT_RGB,
  CYAN_RGB,
  DIFFICULTY_CONFIG,
  TOTAL_CELLS,
  type MemoryDifficulty,
  type MemoryGamePhase,
} from '@/engine/minigame/memory/memoryPuzzleConstants';

export function generatePattern(length: number, existing: number[] = []): number[] {
  const pattern = [...existing];
  while (pattern.length < length) {
    const next = Math.floor(Math.random() * TOTAL_CELLS);
    if (pattern.length > 0 && pattern[pattern.length - 1] === next) continue;
    pattern.push(next);
  }
  return pattern;
}

export function getRating(roundsCompleted: number): { label: string; color: string } {
  if (roundsCompleted >= 9) return { label: 'Нейромант', color: `rgba(${ACCENT_RGB}, 0.95)` };
  if (roundsCompleted >= 5) return { label: 'Оператор', color: `rgba(${CYAN_RGB}, 0.9)` };
  return { label: 'Новичок', color: 'rgba(148, 163, 184, 0.7)' };
}

export function calculateMemoryRewards(roundsCompleted: number): {
  xpReward: number;
  karmaReward: number;
  codingSkill: number;
} {
  return {
    xpReward: Math.min(5 + roundsCompleted * 2, 20),
    karmaReward: Math.min(2 + roundsCompleted, 10),
    codingSkill: 1,
  };
}

export function buildCellAriaLabel(index: number): string {
  return `Нейрон ${index + 1}`;
}

export function buildPhaseAnnouncement(
  phase: MemoryGamePhase,
  round: number,
  patternLength: number,
  lives: number,
  simplified: boolean,
): string {
  switch (phase) {
    case 'showing':
      return simplified
        ? `Раунд ${round}. Паттерн из ${patternLength} ячеек. Повторите последовательность.`
        : `Раунд ${round}. Запоминайте паттерн из ${patternLength} ячеек.`;
    case 'input':
      return `Раунд ${round}. Повторите паттерн из ${patternLength} ячеек.`;
    case 'wrong':
      return `Ошибка. Осталось ${lives} ${lives === 1 ? 'жизнь' : lives >= 2 && lives <= 4 ? 'жизни' : 'жизней'}.`;
    case 'correct':
      return `Паттерн верный. Раунд ${round} пройден.`;
    case 'results':
      return 'Сеанс завершён. Заберите награды или играйте снова.';
    case 'setup':
      return 'Выберите сложность и подключитесь к нейросети.';
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

export function getEffectiveShowTiming(
  difficulty: MemoryDifficulty,
  simplified: boolean,
): { showDelay: number; showDuration: number } {
  const base = DIFFICULTY_CONFIG[difficulty];
  if (!simplified) {
    return { showDelay: base.showDelay, showDuration: base.showDuration };
  }
  return {
    showDelay: base.showDelay * 2,
    showDuration: base.showDuration * 2,
  };
}
