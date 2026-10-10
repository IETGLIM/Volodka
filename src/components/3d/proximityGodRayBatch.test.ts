import { describe, it, expect, afterEach } from 'vitest';
import { Group, Mesh, MeshBasicMaterial, SpotLight } from 'three';
import type { RootState } from '@react-three/fiber';
import {
  addGodRayBatchEntry,
  getGodRayBatchEntryCountForTests,
  isGodRayBatchTickRegisteredForTests,
  removeGodRayBatchEntry,
  resetGodRayBatchForTests,
  runProximityGodRayBatch,
  type GodRayBatchEntry,
} from './proximityGodRayBatch';
import { DEFAULT_FRAME_GAME_SNAPSHOT } from '@/engine/frame/frameGameSnapshot';
import { getRegisteredTickCount } from '@/engine/frame/FrameBudgetRegistry';

const frameCtx = { state: {} as RootState, delta: 1 / 60, game: DEFAULT_FRAME_GAME_SNAPSHOT };

function makeEntry(overrides: Partial<GodRayBatchEntry> = {}): GodRayBatchEntry {
  const activeRef = { current: false };
  return {
    props: { activeRef },
    usesActiveRef: true,
    rootGroup: { current: new Group() },
    spot: { current: null },
    fill: { current: null },
    coneMat: { current: new MeshBasicMaterial() },
    glintMat: { current: new MeshBasicMaterial() },
    glintMesh: { current: new Mesh() },
    hidden: true,
    pulse: 0,
    ...overrides,
  };
}

describe('proximityGodRayBatch (этап 27 — батчинг тиков зон)', () => {
  afterEach(() => {
    resetGodRayBatchForTests();
  });

  it('регистрирует ОДИН центральный тик на N экземпляров, а не N тиков', () => {
    const before = getRegisteredTickCount();

    const entries = Array.from({ length: 19 }, () => makeEntry());
    for (const entry of entries) addGodRayBatchEntry(entry);

    expect(getGodRayBatchEntryCountForTests()).toBe(19);
    expect(getRegisteredTickCount()).toBe(before + 1); // +1, а не +19
    expect(isGodRayBatchTickRegisteredForTests()).toBe(true);

    for (const entry of entries) removeGodRayBatchEntry(entry);
    expect(getRegisteredTickCount()).toBe(before);
    expect(isGodRayBatchTickRegisteredForTests()).toBe(false);
  });

  it('неактивный луч скрывает группу один раз (edge-trigger), активный — обновляет материалы', () => {
    const activeRef = { current: false };
    const entry = makeEntry({ props: { activeRef } });
    entry.hidden = false;
    entry.rootGroup.current!.visible = true; // был видимым до перехода в idle
    addGodRayBatchEntry(entry);

    runProximityGodRayBatch(frameCtx);
    expect(entry.rootGroup.current!.visible).toBe(false);
    expect(entry.hidden).toBe(true);

    runProximityGodRayBatch(frameCtx);
    expect(entry.rootGroup.current!.visible).toBe(false); // повторной записи нет

    activeRef.current = true;
    runProximityGodRayBatch(frameCtx);
    expect(entry.rootGroup.current!.visible).toBe(true);
    expect(entry.coneMat.current!.opacity).toBeGreaterThan(0);
  });

  it('неактивный луч не тратит запись таймингов — выходит сразу', () => {
    const activeRef = { current: false };
    const entry = makeEntry({ props: { activeRef } });
    addGodRayBatchEntry(entry);

    // Не падает и не аллоцирует — главная семантика быстрого выхода.
    expect(() => runProximityGodRayBatch(frameCtx)).not.toThrow();
    expect(entry.coneMat.current!.opacity).toBe(1); // untouched default
  });

  it('staticHighlight гасит пульс, flash даёт всплеск интенсивности', () => {
    const activeRef = { current: true };
    const spot = new SpotLight();
    const entry = makeEntry({
      props: { activeRef, staticHighlightRef: { current: true } },
      spot: { current: spot },
    });
    addGodRayBatchEntry(entry);
    runProximityGodRayBatch(frameCtx);
    // prox >= 0.25; без пульса: 0.4 * prox
    expect(spot.intensity).toBeCloseTo(0.4 * Math.max(0.25, 1), 5);

    const flashSpot = new SpotLight();
    const flashEntry = makeEntry({
      props: { activeRef, flashRef: { current: true } },
      spot: { current: flashSpot },
    });
    addGodRayBatchEntry(flashEntry);
    runProximityGodRayBatch(frameCtx);
    expect(flashSpot.intensity).toBeGreaterThan(0.4);
  });

  it('самостоятельный pulse растёт от delta, когда pulsePhaseRef не задан', () => {
    const activeRef = { current: true };
    const entry = makeEntry({ props: { activeRef } });
    addGodRayBatchEntry(entry);
    runProximityGodRayBatch(frameCtx);
    expect(entry.pulse).toBeCloseTo((1 / 60) * 3.4, 5);
  });
});
