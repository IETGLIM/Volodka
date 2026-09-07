/* ─── Volodka RPG – Thought Cabinet types (Disco Elysium inspired) ─── */

import type { TrainablePlayerSkill } from './skills';

export interface ThoughtCabinetEffect {
  readonly skill: TrainablePlayerSkill;
  readonly modifier: number;
  readonly description: string;
}

/* ── Проработка мысли (аудит-фича: арки внутреннего диалога) ──
 * Диско-Элизиум-механика, адаптированная под событийную прогрессию Volodka:
 * мысль с аркой при экипировке начинает «прорабатываться» — очки прозрения
 * (insight points) капают за осмысленные игровые события (выбор в диалоге,
 * сцена, бой, квест, стих). Эффекты масштабируются прогрессом (или включаются
 * только на 100%, если partialEffects=false). Мысли без арки работают как
 * раньше — мгновенные полные эффекты (обратная совместимость). */
export interface ThoughtInternalizationMilestone {
  /** Порог срабатывания (доля от requiredPoints, 0..1). */
  readonly at: number;
  /** Реплика внутреннего голоса при пересечении порога. */
  readonly text: string;
}

export interface ThoughtInternalizationArc {
  /** Очки прозрения до полной проработки. */
  readonly requiredPoints: number;
  /** true — эффекты растут линейно с прогрессом; false — только на 100%. */
  readonly partialEffects?: boolean;
  /** Реплики на порогах 0..1 (срабатывают однократно при пересечении). */
  readonly milestones?: readonly ThoughtInternalizationMilestone[];
  /** Финальная реплика при завершении проработки. */
  readonly completionText?: string;
}

export interface ThoughtCabinetItem {
  readonly id: string;
  readonly name: string;
  readonly voice: TrainablePlayerSkill;
  readonly description: string;
  readonly flavorText: string;
  readonly acquisitionCondition: string;
  readonly acquisitionNode?: string;
  readonly mutuallyExclusive?: readonly string[];
  readonly effects: readonly ThoughtCabinetEffect[];
  readonly hidden?: boolean;
  /** Арка проработки: если задана — эффекты включаются постепенно. */
  readonly internalization?: ThoughtInternalizationArc;
}