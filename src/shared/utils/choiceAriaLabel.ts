import type { StoryConditionResult } from '@/shared/storyConditions';
import type { TrainablePlayerSkill } from '@/shared/types/game';

const SKILL_LABELS: Record<TrainablePlayerSkill, string> = {
  logic: 'Логика',
  coding: 'Кодирование',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Письмо',
  rhythm: 'Ритм',
};

interface ChoiceAriaLabelOptions {
  index: number;
  text: string;
  cond: StoryConditionResult;
}

export function buildChoiceAriaLabel({ index, text, cond }: ChoiceAriaLabelOptions): string {
  const parts = [`Вариант ${index + 1}: ${text}`];

  if (!cond.pass) {
    parts.push('недоступно');
    if (cond.karmaNeeded) {
      const op = cond.karmaNeeded.type === 'min' ? 'не менее' : 'не более';
      parts.push(`требуется карма ${op} ${cond.karmaNeeded.needed}, сейчас ${cond.karmaNeeded.current}`);
    }
    if (cond.skillCheckNeeded) {
      parts.push(
        `требуется ${SKILL_LABELS[cond.skillCheckNeeded.skill]} ${cond.skillCheckNeeded.needed}+, сейчас ${cond.skillCheckNeeded.current}`,
      );
    }
    if (cond.skillCheckResult && !cond.skillCheckResult.success) {
      parts.push(
        `проверка ${SKILL_LABELS[cond.skillCheckResult.skill]} ${cond.skillCheckResult.difficulty}+ не пройдена`,
      );
    }
    if (cond.relationNeeded) {
      parts.push(`требуются отношения ${cond.relationNeeded.needed}+, сейчас ${cond.relationNeeded.current}`);
    }
    if (cond.actNeeded) {
      parts.push(`требуется акт ${cond.actNeeded.needed}, сейчас ${cond.actNeeded.current}`);
    }
    return parts.join('. ');
  }

  if (cond.skillCheck) {
    parts.push(`проверка навыка ${SKILL_LABELS[cond.skillCheck.skill]} ${cond.skillCheck.needed}+`);
  }
  if (cond.skillCheckResult?.success) {
    parts.push(`проверка ${SKILL_LABELS[cond.skillCheckResult.skill]} доступна`);
  }

  return parts.join('. ');
}
