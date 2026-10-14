/* ─── Контракт настенного расписания оверлеев (FIX v4.48.20, P2) ───
 *
 * Регрессия «титры wake-таймлайна не доходят до CutsceneOverlay»: оверлеи
 * эмитились ТОЛЬКО из кадрового тика на первом тике фазы-владельца. Тик —
 * кадровый клок (dt кламп 0.05с), фоллбек раннера — настенный (total+2с).
 * Ниже ~20fps настенный фоллбек завершал таймлайн раньше хвостовых фаз —
 * их первые тики не наступали, эмит терялся (headless-QA: 0 оверлеев за
 * прогон в 3 прогонах подряд).
 *
 * Контракт:
 *  1. intro_wakeup получает РОВНО 2 бита: monitor на 16.0с, handoff на 20.0с
 *     (суммы длительностей предшествующих фаз — mirrors tick-path semantics).
 *  2. durationMs бита = остаток таймлайна от фазы до конца (v4.17.1-контракт):
 *     monitor 6.6с, handoff 2.6с.
 *  3. Таймлайн без оверлеев → пустое расписание (без фантомных таймеров).
 *  4. Оверлей с letterboxStyle 'none' НЕ планируются (тик-путь их не эмитил).
 *  5. Отрицательные/нулевые длительности не двигают расписание в минус.
 *  6. Вырожденный remaining (пустой хвост) → безопасные 2000мс.
 */

import { describe, expect, it } from 'vitest';
import { INTRO_WAKE_TIMELINE } from './introWakeTimeline';
import {
  computeTimelineOverlaySchedule,
  timelineRemainingMs,
} from './cinematicOverlaySchedule';
import type { CinematicTimelineDef } from './cinematicTimelineTypes';

describe('computeTimelineOverlaySchedule (v4.48.20 wall-clock beats)', () => {
  it('intro_wakeup: ровно 2 бита — monitor@16000, handoff@20000', () => {
    const beats = computeTimelineOverlaySchedule(INTRO_WAKE_TIMELINE);
    expect(beats).toHaveLength(2);

    const monitor = INTRO_WAKE_TIMELINE.phases.findIndex((p) => p.id === 'monitor');
    const handoff = INTRO_WAKE_TIMELINE.phases.findIndex((p) => p.id === 'handoff');
    expect(beats[0].phaseIndex).toBe(monitor);
    expect(beats[0].atMs).toBe(16_000); // 3.4+3.0+0.8+1.2+3.6+2.4+1.6
    expect(beats[1].phaseIndex).toBe(handoff);
    expect(beats[1].atMs).toBe(20_000); // 16.0 + monitor 4.0
  });

  it('биты идут в порядке фаз и внутри хронометража таймлайна', () => {
    const beats = computeTimelineOverlaySchedule(INTRO_WAKE_TIMELINE);
    expect(beats[0].atMs).toBeLessThan(beats[1].atMs);
    const totalMs = INTRO_WAKE_TIMELINE.phases.reduce((s, p) => s + p.duration, 0) * 1000;
    for (const b of beats) {
      expect(b.atMs).toBeGreaterThanOrEqual(0);
      expect(b.atMs).toBeLessThan(totalMs);
    }
  });

  it('timelineRemainingMs: monitor 6600, handoff 2600 (остаток таймлайна)', () => {
    const monitor = INTRO_WAKE_TIMELINE.phases.findIndex((p) => p.id === 'monitor');
    const handoff = INTRO_WAKE_TIMELINE.phases.findIndex((p) => p.id === 'handoff');
    expect(timelineRemainingMs(INTRO_WAKE_TIMELINE, monitor)).toBe(6_600);
    expect(timelineRemainingMs(INTRO_WAKE_TIMELINE, handoff)).toBe(2_600);
  });

  it('таймлайн без оверлеев → пустое расписание', () => {
    const def: CinematicTimelineDef = {
      id: 'no_overlays',
      fallbackMs: 1000,
      phases: [
        { id: 'a', duration: 1, actor: { mode: 'none' }, camera: { mode: 'hold', at: { position: [0, 0, 0], lookAt: [0, 0, -1], fov: 60, duration: 0 } } },
        { id: 'b', duration: 2, actor: { mode: 'none' }, camera: { mode: 'hold', at: { position: [0, 0, 0], lookAt: [0, 0, -1], fov: 60, duration: 0 } } },
      ],
    };
    expect(computeTimelineOverlaySchedule(def)).toEqual([]);
  });

  it("letterboxStyle 'none' не планируется (тик-путь такие не эмитил)", () => {
    const def: CinematicTimelineDef = {
      id: 'none_style',
      fallbackMs: 1000,
      phases: [
        {
          id: 'hidden',
          duration: 1,
          actor: { mode: 'none' },
          camera: { mode: 'hold', at: { position: [0, 0, 0], lookAt: [0, 0, -1], fov: 60, duration: 0 } },
          overlay: { text: 'x', letterboxStyle: 'none' },
        },
        {
          id: 'shown',
          duration: 1,
          actor: { mode: 'none' },
          camera: { mode: 'hold', at: { position: [0, 0, 0], lookAt: [0, 0, -1], fov: 60, duration: 0 } },
          overlay: { text: 'y', letterboxStyle: 'thin' },
        },
      ],
    };
    const beats = computeTimelineOverlaySchedule(def);
    expect(beats).toHaveLength(1);
    expect(beats[0].atMs).toBe(1000);
  });

  it('отрицательные/нулевые длительности клампятся — расписание не уходит в минус', () => {
    const def: CinematicTimelineDef = {
      id: 'clamped',
      fallbackMs: 1000,
      phases: [
        { id: 'neg', duration: -5, actor: { mode: 'none' }, camera: { mode: 'hold', at: { position: [0, 0, 0], lookAt: [0, 0, -1], fov: 60, duration: 0 } } },
        {
          id: 'first',
          duration: 2,
          actor: { mode: 'none' },
          camera: { mode: 'hold', at: { position: [0, 0, 0], lookAt: [0, 0, -1], fov: 60, duration: 0 } },
          overlay: { text: 'a' },
        },
      ],
    };
    const beats = computeTimelineOverlaySchedule(def);
    expect(beats).toHaveLength(1);
    expect(beats[0].atMs).toBe(0); // -5с клампнуты в 0, бит не уехал в минус
  });

  it('вырожденный remaining (пустой хвост) → 2000мс', () => {
    const def: CinematicTimelineDef = {
      id: 'degenerate',
      fallbackMs: 1000,
      phases: [{ id: 'a', duration: 1, actor: { mode: 'none' }, camera: { mode: 'hold', at: { position: [0, 0, 0], lookAt: [0, 0, -1], fov: 60, duration: 0 } } }],
    };
    expect(timelineRemainingMs(def, 5)).toBe(2000);
  });
});
