import { describe, expect, it } from 'vitest';
import type { CinematicTimelineDef } from './cinematicTimelineTypes';
import {
  FACTORY_BASEMENT_ARRIVAL_TIMELINE,
  LIBRARY_DAY_ARRIVAL_TIMELINE,
  PARK_DAY_ARRIVAL_TIMELINE,
} from './streetLegendsArrivalTimelines';

const LEGENDS_ARRIVALS: CinematicTimelineDef[] = [
  PARK_DAY_ARRIVAL_TIMELINE,
  LIBRARY_DAY_ARRIVAL_TIMELINE,
  FACTORY_BASEMENT_ARRIVAL_TIMELINE,
];

const VALID_AUDIO_CUES = new Set(['footstep', 'notify', 'ui_open', 'mystery']);
const VALID_LIGHT_CUES = new Set(['neon_surge', 'dim_hold', 'warm_practical']);

describe('streetLegendsArrivalTimelines (контракт CinematicTimelineDef)', () => {
  it('id уникальны и соответствуют сценам', () => {
    const ids = LEGENDS_ARRIVALS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      'park_day_arrival',
      'library_day_arrival',
      'factory_basement_arrival',
    ]);
  });

  it('каждый таймлайн: 3 фазы, все с actor и camera', () => {
    for (const t of LEGENDS_ARRIVALS) {
      expect(t.phases.length).toBe(3);
      for (const phase of t.phases) {
        expect(phase.id).toBeTruthy();
        expect(phase.duration).toBeGreaterThan(0);
        expect(phase.actor).toBeDefined();
        expect(phase.camera).toBeDefined();
      }
    }
  });

  it('последняя фаза — handoff в exploration-фрейминг (плавный возврат камеры)', () => {
    for (const t of LEGENDS_ARRIVALS) {
      const last = t.phases[t.phases.length - 1]!;
      expect(last.camera.mode).toBe('handoff');
      // Финальная позиция актора — у нуля (spawn-точка), лицом вперёд.
      const lastKey = last.actor.mode === 'in_place'
        ? last.actor.keyframes[last.actor.keyframes.length - 1]
        : null;
      expect(lastKey).not.toBeNull();
      expect(lastKey!.facingY).toBe(0);
    }
  });

  it('все overlay-тексты на русском и непустые', () => {
    const cyrillic = /[А-Яа-яЁё]/;
    for (const t of LEGENDS_ARRIVALS) {
      const overlays = t.phases.filter((p) => p.overlay?.text);
      expect(overlays.length).toBeGreaterThanOrEqual(2);
      for (const p of overlays) {
        expect(p.overlay!.text!.length).toBeGreaterThan(10);
        expect(cyrillic.test(p.overlay!.text!)).toBe(true);
      }
    }
  });

  it('audioCue/lightCue — только валидные ключи (union типов)', () => {
    for (const t of LEGENDS_ARRIVALS) {
      for (const p of t.phases) {
        if (p.audioCue) expect(VALID_AUDIO_CUES.has(p.audioCue)).toBe(true);
        if (p.lightCue) expect(VALID_LIGHT_CUES.has(p.lightCue)).toBe(true);
      }
    }
  });

  it('у каждого таймлайна есть safety fallbackMs', () => {
    for (const t of LEGENDS_ARRIVALS) {
      expect(t.fallbackMs).toBeGreaterThan(5000);
    }
  });

  it('actor in_place: ключевые кадры монотонны по t в 0..1', () => {
    for (const t of LEGENDS_ARRIVALS) {
      for (const p of t.phases) {
        if (p.actor.mode !== 'in_place') continue;
        const ts = p.actor.keyframes.map((k) => k.t);
        for (let i = 1; i < ts.length; i++) {
          expect(ts[i]).toBeGreaterThan(ts[i - 1]!);
        }
        expect(ts[0]).toBeGreaterThanOrEqual(0);
        expect(ts[ts.length - 1]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('подвал: искрящаяся фаза дёргает камеру (cameraShake)', () => {
    const spark = FACTORY_BASEMENT_ARRIVAL_TIMELINE.phases.find((p) => p.id === 'basement_spark');
    expect(spark).toBeDefined();
    expect(spark!.cameraShake).toBeDefined();
    expect(spark!.overlay?.glitchIntensity).toBeGreaterThan(0);
  });
});
