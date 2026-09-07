import { describe, expect, it, beforeEach } from 'vitest';
// Порядок важен: gameStore первым связывает slice-сторы (bindSliceStores)
// и задаёт порядок оценки модулей, как в проде.
import '../gameStore';
import { usePlayerStore } from '@/store/stores/playerStore';
import { THOUGHT_CABINET_MAP } from '@/data/thoughtCabinet';
import { scaledThoughtEffects } from '@/shared/thoughts/thoughtInternalization';

/** Сбросить player-store: пустой кабинет + чистые очки проработки. */
function resetCabinet(): void {
  usePlayerStore.setState((state) => ({
    ...state,
    playerState: { ...state.playerState },
    acquiredThoughtIds: [],
    equippedThoughtIds: [],
    thoughtInternalizationPoints: {},
    notifications: [],
  }));
}

/** Взять из данных реальную арочную мысль с заданным режимом эффектов. */
function findArcItem(partial: boolean) {
  const item = Object.values(THOUGHT_CABINET_MAP).find(
    (t) =>
      t.internalization &&
      (t.internalization.partialEffects !== false) === partial,
  );
  if (!item) throw new Error(`нет арочной мысли partial=${partial}`);
  return item;
}

describe('thoughtCabinetSlice.internalization (v4.16)', () => {
  beforeEach(resetCabinet);

  it('advanceThoughtInternalization копит очки экипированной арочной мысли', () => {
    const item = findArcItem(true);
    const store = usePlayerStore.getState();
    store.acquireThought(item.id);
    store.equipThought(item.id);

    usePlayerStore.getState().advanceThoughtInternalization('choice'); // +2
    usePlayerStore.getState().advanceThoughtInternalization('sceneVisit'); // +2

    const state = usePlayerStore.getState();
    expect(state.thoughtInternalizationPoints[item.id]).toBe(4);
  });

  it('getEquippedThoughtEffects масштабируется прогрессом (частичная арка)', () => {
    const item = findArcItem(true);
    const arc = item.internalization!;
    const store = usePlayerStore.getState();
    store.acquireThought(item.id);
    store.equipThought(item.id);

    // Продвигаем до 50% и сверяем с чистым модулем масштабирования
    usePlayerStore.setState((s) => ({
      ...s,
      thoughtInternalizationPoints: { ...s.thoughtInternalizationPoints, [item.id]: arc.requiredPoints / 2 },
    }));
    const effects = usePlayerStore.getState().getEquippedThoughtEffects();
    const expected = scaledThoughtEffects(item, arc.requiredPoints / 2);
    expect(effects.filter((e) => item.effects.some((ie) => ie.skill === e.skill))).toEqual(
      expected.filter((e) => item.effects.some((ie) => ie.skill === e.skill)),
    );

    // Полный прогресс — полные эффекты
    usePlayerStore.setState((s) => ({
      ...s,
      thoughtInternalizationPoints: { ...s.thoughtInternalizationPoints, [item.id]: arc.requiredPoints },
    }));
    const full = usePlayerStore.getState().getEquippedThoughtEffects();
    expect(full.filter((e) => item.effects.some((ie) => ie.skill === e.skill))).toEqual(
      item.effects.map((e) => ({ ...e })),
    );
  });

  it('гейт-арка (partialEffects=false): эффекты только после завершения', () => {
    const gated = Object.values(THOUGHT_CABINET_MAP).find(
      (t) => t.internalization?.partialEffects === false,
    );
    if (!gated) return; // гейт-мысль может отсутствовать — тест информативен, не обязателен

    const store = usePlayerStore.getState();
    store.acquireThought(gated.id);
    store.equipThought(gated.id);

    // Почти готово — эффекты нулевые
    usePlayerStore.setState((s) => ({
      ...s,
      thoughtInternalizationPoints: {
        ...s.thoughtInternalizationPoints,
        [gated.id]: gated.internalization!.requiredPoints - 1,
      },
    }));
    const before = usePlayerStore
      .getState()
      .getEquippedThoughtEffects()
      .filter((e) => gated.effects.some((ge) => ge.skill === e.skill));
    for (const eff of before) expect(eff.modifier).toBe(0);

    // Завершение — полные эффекты
    usePlayerStore.setState((s) => ({
      ...s,
      thoughtInternalizationPoints: {
        ...s.thoughtInternalizationPoints,
        [gated.id]: gated.internalization!.requiredPoints,
      },
    }));
    const after = usePlayerStore
      .getState()
      .getEquippedThoughtEffects()
      .filter((e) => gated.effects.some((ge) => ge.skill === e.skill));
    expect(after).toEqual(gated.effects);
  });

  it('завершение проработки шлёт уведомление с русским текстом', () => {
    const item = findArcItem(true);
    const store = usePlayerStore.getState();
    store.acquireThought(item.id);
    store.equipThought(item.id);

    usePlayerStore.setState((s) => ({
      ...s,
      notifications: [],
      thoughtInternalizationPoints: {
        ...s.thoughtInternalizationPoints,
        [item.id]: item.internalization!.requiredPoints,
      },
    }));

    // Одно событие поверх уже полного прогресса → ничего не начисляется.
    // Вместо этого проверим финал через advance от нуля:
    usePlayerStore.setState((s) => ({
      ...s,
      notifications: [],
      thoughtInternalizationPoints: { [item.id]: item.internalization!.requiredPoints - 1 },
    }));
    usePlayerStore.getState().advanceThoughtInternalization('questObjective'); // +5 хватает

    const notifications = usePlayerStore.getState().notifications;
    const completion = notifications.find((n) => n.text.includes('проработана'));
    expect(completion).toBeDefined();
    expect(completion?.text).toContain(item.name);
  });

  it('пересечение вехи шлёт уведомление с текстом вехи', () => {
    const item = findArcItem(true);
    const arc = item.internalization!;
    const store = usePlayerStore.getState();
    store.acquireThought(item.id);
    store.equipThought(item.id);

    // Ставим очки ровно перед порогом 25% и добавляем ровно до него
    const quarter = Math.floor(arc.requiredPoints * 0.25);
    usePlayerStore.setState((s) => ({
      ...s,
      notifications: [],
      thoughtInternalizationPoints: { [item.id]: quarter - 1 },
    }));
    usePlayerStore.getState().advanceThoughtInternalization('choice'); // +2 → пересекает 25%

    const notifications = usePlayerStore.getState().notifications;
    const milestone = notifications.find((n) => n.text.includes(item.name));
    expect(milestone).toBeDefined();
    expect(milestone?.text).toContain(arc.milestones?.[0]?.text ?? '');
  });

  it('мысли без арки работают как раньше — полный эффект сразу', () => {
    const plain = Object.values(THOUGHT_CABINET_MAP).find((t) => !t.internalization);
    if (!plain) return;
    const store = usePlayerStore.getState();
    store.acquireThought(plain.id);
    store.equipThought(plain.id);

    const effects = usePlayerStore.getState().getEquippedThoughtEffects();
    const own = effects.filter((e) => plain.effects.some((pe) => pe.skill === e.skill));
    expect(own).toEqual(plain.effects);
    // Очки не начисляются
    usePlayerStore.getState().advanceThoughtInternalization('poem');
    expect(usePlayerStore.getState().thoughtInternalizationPoints[plain.id]).toBeUndefined();
  });

  it('unequip сохраняет прогресс, re-equip продолжает с него', () => {
    const item = findArcItem(true);
    const store = usePlayerStore.getState();
    store.acquireThought(item.id);
    store.equipThought(item.id);
    usePlayerStore.getState().advanceThoughtInternalization('poem'); // +4
    expect(usePlayerStore.getState().thoughtInternalizationPoints[item.id]).toBe(4);

    usePlayerStore.getState().unequipThought(item.id);
    usePlayerStore.getState().equipThought(item.id);

    usePlayerStore.getState().advanceThoughtInternalization('poem'); // +4
    expect(usePlayerStore.getState().thoughtInternalizationPoints[item.id]).toBe(8);
  });

  it('getThoughtInternalizationFraction считает долю корректно', () => {
    const item = findArcItem(true);
    const arc = item.internalization!;
    const store = usePlayerStore.getState();
    store.acquireThought(item.id);
    store.equipThought(item.id);

    expect(usePlayerStore.getState().getThoughtInternalizationFraction(item.id)).toBe(0);
    usePlayerStore.setState((s) => ({
      ...s,
      thoughtInternalizationPoints: { [item.id]: arc.requiredPoints / 4 },
    }));
    expect(usePlayerStore.getState().getThoughtInternalizationFraction(item.id)).toBeCloseTo(0.25);
    // Мысль без арки — всегда 1
    const plain = Object.values(THOUGHT_CABINET_MAP).find((t) => !t.internalization);
    if (plain) {
      expect(usePlayerStore.getState().getThoughtInternalizationFraction(plain.id)).toBe(1);
    }
  });

  it('состояние среза — чистая карта очков после сброса', () => {
    expect(usePlayerStore.getState().thoughtInternalizationPoints ?? {}).toEqual({});
  });
});
