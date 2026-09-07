/* ─── Volodka RPG – чистая логика проработки мыслей (арки внутреннего диалога) ───
 * Roadmap «Days 31–60 → Thought Cabinet arcs»: мысль с аркой internalization
 * экипируется не в полный эффект, а «прорабатывается» — очки прозрения капают
 * за осмысленные игровые события. Модуль чистый (без store/React) — все
 * побочные эффекты (уведомления, persist) делает срез thoughtCabinetSlice.
 *
 * Дизайн-инварианты:
 *  • Мысль БЕЗ арки — прогресс всегда 1 (полные эффекты), очки не начисляются.
 *  • Прогресс — доля 0..1: min(points, requiredPoints) / requiredPoints.
 *  • partialEffects=false — эффекты 0 до 100% и полные после.
 *  • partialEffects=true (дефолт) — линейный масштаб, целочисленный:
 *    округление «от нуля» с сохранением знака, ноль на старте.
 *  • Вехи (milestones) срабатывают при строгом пересечении порога «вверх»
 *    ровно один раз — сравнение до/после, без скрытого состояния в чистом
 *    модуле; при загрузке сейва повторного срабатывания нет (порог уже
 *    пройден, «до» >= порога).
 *  • Очки не растут сверх requiredPoints (кламп) — сейвы не разбухают. */

import { THOUGHT_CABINET_MAP } from '@/data/thoughtCabinet';
import type {
  ThoughtCabinetEffect,
  ThoughtCabinetItem,
  ThoughtInternalizationMilestone,
} from '@/shared/types/definitions/thoughtCabinet';

/* ── Каноническая таблица событий → очки прозрения ──
 * Один источник правды для драйверов (useGameLifecycleManager) и тестов.
 * Значения сбалансированы под арки 40–120 очков: типичная сессия даёт
 * 1–2 проработанные мысли за акт. */
export const THOUGHT_INSIGHT_POINTS = {
  /** Выбор в диалоге (любой карма-вес) — осмысление себя через решение. */
  choice: 2,
  /** Успешный исход проверки навыка — прозрение через мастерство. */
  skillCheck: 3,
  /** Первое посещение сцены — новые образы для внутренней работы. */
  sceneVisit: 2,
  /** Победа в бою — адреналин расшатывает рамки самовосприятия. */
  combatVictory: 4,
  /** Завершённый объектив квеста — структура мышления. */
  questObjective: 5,
  /** Прочитанный/собранный стих — главный катализатор Володьки. */
  poem: 4,
} as const;

export type ThoughtInsightEventKind = keyof typeof THOUGHT_INSIGHT_POINTS;

/** Начисленные за событие очки (одна точка входа для драйверов). */
export function thoughtInsightPoints(kind: ThoughtInsightEventKind): number {
  return THOUGHT_INSIGHT_POINTS[kind];
}

/* ── Прогресс ── */

/** Доля проработки мысли 0..1 (без арки — всегда 1). */
export function thoughtProgressFraction(
  def: ThoughtCabinetItem | undefined,
  points: number | undefined,
): number {
  if (!def || !def.internalization) return 1;
  const { requiredPoints } = def.internalization;
  if (requiredPoints <= 0) return 1;
  const clamped = Math.min(Math.max(points ?? 0, 0), requiredPoints);
  return clamped / requiredPoints;
}

/** Масштаб эффектов по прогрессу: 0 → 0; 1 → полный; линейно между. */
export function thoughtEffectScale(def: ThoughtCabinetItem | undefined, points: number | undefined): number {
  if (!def || !def.internalization) return 1;
  if (def.internalization.partialEffects === false) {
    return thoughtProgressFraction(def, points) >= 1 ? 1 : 0;
  }
  return thoughtProgressFraction(def, points);
}

/** Целочисленный масштабированный модификатор: сохраняет знак, ноль на старте. */
export function scaleThoughtModifier(modifier: number, scale: number): number {
  if (scale >= 1) return modifier;
  if (scale <= 0) return 0;
  const scaled = modifier * scale;
  // Округление «от нуля» (не к нулю): частичный эффект честно тянется вверх.
  const rounded = scaled > 0 ? Math.ceil(scaled) : Math.floor(scaled);
  // Никогда не перепрыгиваем полный модификатор при частичном масштабе.
  if (modifier > 0) return Math.min(rounded, modifier);
  if (modifier < 0) return Math.max(rounded, modifier);
  return 0;
}

/** Эффекты мысли с учётом прогресса проработки. */
export function scaledThoughtEffects(
  def: ThoughtCabinetItem | undefined,
  points: number | undefined,
): ThoughtCabinetEffect[] {
  if (!def) return [];
  const scale = thoughtEffectScale(def, points);
  if (scale >= 1) return [...def.effects];
  return def.effects.map((eff) => ({
    ...eff,
    modifier: scaleThoughtModifier(eff.modifier, scale),
  }));
}

/* ── Продвижение очков ── */

export interface InternalizationAdvanceResult {
  /** Новая карта очков (тот же объект, если изменений нет). */
  next: Record<string, number>;
  /** id мыслей, завершивших проработку в этом шаге (раньше < требуемого). */
  completed: string[];
  /** Пересечённые вехи «вверх» (сравнение до/после, однократно). */
  crossedMilestones: { id: string; thought: ThoughtCabinetItem; milestone: ThoughtInternalizationMilestone }[];
  /** id мыслей, получивших очки (для уведомления в slice). */
  advanced: string[];
}

/**
 * Продвинуть проработку экипированных мыслей на `points` очков.
 * Чистая функция: prev мапа не мутируется; мысли без арки игнорируются;
 * завершённые (points >= required) больше не получают очки.
 */
export function advanceInternalizationPoints(
  prev: Readonly<Record<string, number>>,
  equippedIds: readonly string[],
  points: number,
  defs: Readonly<Record<string, ThoughtCabinetItem>> = THOUGHT_CABINET_MAP,
): InternalizationAdvanceResult {
  const result: InternalizationAdvanceResult = {
    next: prev ?? {},
    completed: [],
    crossedMilestones: [],
    advanced: [],
  };
  if (!Number.isFinite(points) || points <= 0) return result;

  let touched = false;
  const next: Record<string, number> = { ...prev };

  for (const id of equippedIds) {
    const def = defs[id];
    if (!def || !def.internalization) continue;
    const { requiredPoints, milestones } = def.internalization;

    const before = next[id] ?? 0;
    if (requiredPoints > 0 && before >= requiredPoints) continue; // уже проработана

    const after = requiredPoints > 0 ? Math.min(before + points, requiredPoints) : requiredPoints;
    if (after === before) continue;
    next[id] = after;
    touched = true;
    result.advanced.push(id);

    // Завершение — строгое пересечение границы requiredPoints.
    if (requiredPoints > 0 && before < requiredPoints && after >= requiredPoints) {
      result.completed.push(id);
    }

    // Вехи — пересечение порога вверх (порог 1.0 обрабатывается как completed).
    if (milestones) {
      for (const milestone of milestones) {
        if (milestone.at >= 1) continue; // финал — отдельный канал completionText
        const threshold = milestone.at * requiredPoints;
        if (before < threshold && after >= threshold) {
          result.crossedMilestones.push({ id, thought: def, milestone });
        }
      }
    }
  }

  if (touched) result.next = next;
  return result;
}

/** Готовая русская строка процента для UI («42%»). */
export function formatThoughtProgressPercent(fraction: number): string {
  const percent = Math.round(Math.min(Math.max(fraction, 0), 1) * 100);
  return `${percent}%`;
}
