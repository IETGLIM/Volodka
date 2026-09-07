import { describe, expect, it } from 'vitest';
import {
  THOUGHT_INSIGHT_POINTS,
  advanceInternalizationPoints,
  formatThoughtProgressPercent,
  scaleThoughtModifier,
  scaledThoughtEffects,
  thoughtEffectScale,
  thoughtProgressFraction,
} from './thoughtInternalization';
import { THOUGHT_CABINET_ITEMS } from '@/data/thoughtCabinet';
import type { ThoughtCabinetItem } from '@/shared/types/definitions/thoughtCabinet';

/* ── Тестовые артефакты ── */

const ARC_PARTIAL: ThoughtCabinetItem = {
  id: 'test_arc_partial',
  name: 'Арка (частичные эффекты)',
  voice: 'logic',
  description: 'd',
  flavorText: 'f',
  acquisitionCondition: 'x',
  effects: [
    { skill: 'logic', modifier: 4, description: '+4' },
    { skill: 'empathy', modifier: -2, description: '-2' },
  ],
  internalization: {
    requiredPoints: 100,
    partialEffects: true,
    milestones: [
      { at: 0.25, text: 'a' },
      { at: 0.5, text: 'b' },
      { at: 0.75, text: 'c' },
    ],
    completionText: 'done',
  },
};

const ARC_GATED: ThoughtCabinetItem = {
  id: 'test_arc_gated',
  name: 'Арка (гейт на 100%)',
  voice: 'rhythm',
  description: 'd',
  flavorText: 'f',
  acquisitionCondition: 'x',
  effects: [{ skill: 'rhythm', modifier: 3, description: '+3' }],
  internalization: { requiredPoints: 50, partialEffects: false },
};

const NO_ARC: ThoughtCabinetItem = {
  id: 'test_no_arc',
  name: 'Без арки',
  voice: 'coding',
  description: 'd',
  flavorText: 'f',
  acquisitionCondition: 'x',
  effects: [{ skill: 'coding', modifier: 2, description: '+2' }],
};

const DEFS: Record<string, ThoughtCabinetItem> = {
  [ARC_PARTIAL.id]: ARC_PARTIAL,
  [ARC_GATED.id]: ARC_GATED,
  [NO_ARC.id]: NO_ARC,
};

/* ── Прогресс и масштаб ── */

describe('thoughtProgressFraction', () => {
  it('мысль без арки — всегда полный прогресс', () => {
    expect(thoughtProgressFraction(NO_ARC, 0)).toBe(1);
    expect(thoughtProgressFraction(undefined, 5)).toBe(1);
  });

  it('арка без очков — ноль; очки клампятся', () => {
    expect(thoughtProgressFraction(ARC_PARTIAL, undefined)).toBe(0);
    expect(thoughtProgressFraction(ARC_PARTIAL, 25)).toBe(0.25);
    expect(thoughtProgressFraction(ARC_PARTIAL, 250)).toBe(1);
    expect(thoughtProgressFraction(ARC_PARTIAL, -5)).toBe(0);
  });

  it('requiredPoints<=0 — защита от деления на ноль', () => {
    const broken = { ...ARC_PARTIAL, internalization: { requiredPoints: 0 } };
    expect(thoughtProgressFraction(broken as ThoughtCabinetItem, 0)).toBe(1);
  });
});

describe('thoughtEffectScale', () => {
  it('partialEffects=true — линейный масштаб', () => {
    expect(thoughtEffectScale(ARC_PARTIAL, 0)).toBe(0);
    expect(thoughtEffectScale(ARC_PARTIAL, 50)).toBe(0.5);
    expect(thoughtEffectScale(ARC_PARTIAL, 100)).toBe(1);
  });

  it('partialEffects=false — ноль до 100%, единица после', () => {
    expect(thoughtEffectScale(ARC_GATED, 49)).toBe(0);
    expect(thoughtEffectScale(ARC_GATED, 50)).toBe(1);
  });

  it('мысль без арки — всегда полный масштаб', () => {
    expect(thoughtEffectScale(NO_ARC, undefined)).toBe(1);
  });
});

describe('scaleThoughtModifier', () => {
  it('сохраняет знак и округляет «от нуля»', () => {
    expect(scaleThoughtModifier(4, 0.5)).toBe(2);
    expect(scaleThoughtModifier(4, 0.3)).toBe(2); // ceil(1.2)=2
    expect(scaleThoughtModifier(-2, 0.5)).toBe(-1);
    expect(scaleThoughtModifier(-2, 0.3)).toBe(-1); // floor(-0.6)=-1
  });

  it('крайние случаи: 0 и полный масштаб', () => {
    expect(scaleThoughtModifier(4, 0)).toBe(0);
    expect(scaleThoughtModifier(-2, 0)).toBe(0);
    expect(scaleThoughtModifier(4, 1)).toBe(4);
    expect(scaleThoughtModifier(4, 1.5)).toBe(4); // кламп сверху
  });

  it('нулевой модификатор остаётся нулём', () => {
    expect(scaleThoughtModifier(0, 0.7)).toBe(0);
  });
});

describe('scaledThoughtEffects', () => {
  it('частичный прогресс масштабирует модификаторы', () => {
    const effects = scaledThoughtEffects(ARC_PARTIAL, 50); // 50%
    expect(effects[0]?.modifier).toBe(2);
    expect(effects[1]?.modifier).toBe(-1);
  });

  it('гейт-арка до завершения — нулевые модификаторы', () => {
    const effects = scaledThoughtEffects(ARC_GATED, 10);
    expect(effects[0]?.modifier).toBe(0);
  });

  it('полный прогресс — полный эффект (копия массива)', () => {
    const effects = scaledThoughtEffects(ARC_PARTIAL, 100);
    expect(effects).toEqual(ARC_PARTIAL.effects);
    expect(effects).not.toBe(ARC_PARTIAL.effects);
  });

  it('мысль без арки — эффекты как есть', () => {
    expect(scaledThoughtEffects(NO_ARC, undefined)).toEqual(NO_ARC.effects);
  });
});

/* ── Продвижение очков ── */

describe('advanceInternalizationPoints', () => {
  it('копит очки для экипированных арочных мыслей', () => {
    const r = advanceInternalizationPoints({}, [ARC_PARTIAL.id], 10, DEFS);
    expect(r.next[ARC_PARTIAL.id]).toBe(10);
    expect(r.advanced).toEqual([ARC_PARTIAL.id]);
    expect(r.completed).toEqual([]);
  });

  it('не мутирует prev и возвращает тот же объект при нуле изменений', () => {
    const prev = { [ARC_PARTIAL.id]: 100 };
    const noop = advanceInternalizationPoints(prev, [ARC_PARTIAL.id], 5, DEFS);
    expect(noop.next).toBe(prev); // уже завершена — нет изменений
    expect(prev[ARC_PARTIAL.id]).toBe(100);

    const zero = advanceInternalizationPoints(prev, [ARC_PARTIAL.id], 0, DEFS);
    expect(zero.next).toBe(prev);
  });

  it('завершение фиксируется однократно', () => {
    const first = advanceInternalizationPoints({}, [ARC_GATED.id], 40, DEFS);
    expect(first.completed).toEqual([]);
    const second = advanceInternalizationPoints(first.next, [ARC_GATED.id], 20, DEFS);
    expect(second.completed).toEqual([ARC_GATED.id]);
    // Дальше — очки не начисляются
    const third = advanceInternalizationPoints(second.next, [ARC_GATED.id], 30, DEFS);
    expect(third.next[ARC_GATED.id]).toBe(50);
    expect(third.completed).toEqual([]);
    expect(third.advanced).toEqual([]);
  });

  it('вехи пересекаются строго вверх и однократно', () => {
    // 25% от 100 = 25 очков
    const step1 = advanceInternalizationPoints({}, [ARC_PARTIAL.id], 25, DEFS);
    expect(step1.crossedMilestones.map((m) => m.milestone.at)).toEqual([0.25]);

    // Повторное пересечение 25% невозможно (before уже >= threshold)
    const step2 = advanceInternalizationPoints(step1.next, [ARC_PARTIAL.id], 25, DEFS);
    expect(step2.crossedMilestones.map((m) => m.milestone.at)).toEqual([0.5]);

    // Прыжок через две вехи сразу — обе пойманы
    const step3 = advanceInternalizationPoints(step2.next, [ARC_PARTIAL.id], 50, DEFS);
    expect(step3.crossedMilestones.map((m) => m.milestone.at)).toEqual([0.75]);
    expect(step3.completed).toEqual([ARC_PARTIAL.id]);
  });

  it('мысли без арки и неэкипированные мысли игнорируются', () => {
    const r = advanceInternalizationPoints({}, [NO_ARC.id, ARC_PARTIAL.id], 10, DEFS);
    expect(r.next[NO_ARC.id]).toBeUndefined();
    expect(r.next[ARC_PARTIAL.id]).toBe(10);
  });

  it('некорректные очки — no-op', () => {
    for (const bad of [0, -5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const r = advanceInternalizationPoints({ [ARC_PARTIAL.id]: 1 }, [ARC_PARTIAL.id], bad, DEFS);
      expect(r.advanced).toEqual([]);
      expect(r.next).toEqual({ [ARC_PARTIAL.id]: 1 });
    }
  });
});

describe('THOUGHT_INSIGHT_POINTS', () => {
  it('все значения положительные целые', () => {
    for (const v of Object.values(THOUGHT_INSIGHT_POINTS)) {
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThan(0);
    }
  });
});

describe('formatThoughtProgressPercent', () => {
  it('русский формат с клампом', () => {
    expect(formatThoughtProgressPercent(0)).toBe('0%');
    expect(formatThoughtProgressPercent(0.424)).toBe('42%');
    expect(formatThoughtProgressPercent(1)).toBe('100%');
    expect(formatThoughtProgressPercent(1.5)).toBe('100%');
    expect(formatThoughtProgressPercent(-0.2)).toBe('0%');
  });
});

/* ── Контент-инварианты арок в данных ── */

describe('THOUGHT_CABINET_ITEMS internalization arcs (данные)', () => {
  const arcItems = THOUGHT_CABINET_ITEMS.filter((t) => t.internalization);

  it('арки есть (>= 10) — фича не пустая', () => {
    expect(arcItems.length).toBeGreaterThanOrEqual(10);
  });

  it('все арки валидны: точки > 0, вехи в (0..1) по возрастанию, тексты непустые', () => {
    for (const item of arcItems) {
      const arc = item.internalization!;
      expect(arc.requiredPoints).toBeGreaterThan(0);
      if (arc.milestones) {
        let prev = 0;
        for (const m of arc.milestones) {
          expect(m.at).toBeGreaterThan(prev);
          expect(m.at).toBeLessThan(1);
          expect(m.text.length).toBeGreaterThan(3);
          prev = m.at;
        }
      }
      if (arc.completionText) {
        expect(arc.completionText.length).toBeGreaterThan(3);
      }
    }
  });

  it('каждая арка достижима за разумное число событий', () => {
    // Даже самая дорогая арка собирается из <= 60 событий одного типа
    const maxRequired = Math.max(...arcItems.map((t) => t.internalization!.requiredPoints));
    const minPoints = Math.min(...Object.values(THOUGHT_INSIGHT_POINTS));
    expect(maxRequired / minPoints).toBeLessThanOrEqual(60);
  });
});
