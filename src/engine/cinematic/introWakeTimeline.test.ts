/* ─── Контракт intro wake-таймлайна (FIX v4.48.14) ───
 *
 * Регрессия «стоит в ботинках на кровати»: до v4.48.14 фаза standing
 * начиналась прямо на BED_SIT_EDGE (x=1.15 — НА матрасе, кровать занимает
 * x=[1.04, 2.52]) с клипом idle — Володька ~0.8с стоял в ботинках на кровати,
 * затем «сплывал» на пол.
 *
 * Контракт:
 *  1. НИ ОДНА keyframe-позиция клипа 'idle' (стоя) не находится на матрасе
 *     (x ≥ 1.04 при y > 0.1) — стоять можно только на полу.
 *  2. Фаза dismount существует, играется клипом 'sitting' и заканчивает
 *     на полу ВНЕ матраса.
 *  3. Постельные фазы используют лежачие/сидячие клипы (sleeping/sitting),
 *     а не стоячие.
 *  4. Каждой waypoint-фазе доступен валидный вейпоинт камеры (wpToData
 *     бросил бы на undefined — модуль бы не загрузился, но проверяем явно).
 *  5. Суммарный хронометраж не деградировал (v4.46-контракт ~22.6с).
 */

import { describe, expect, it } from 'vitest';
import { INTRO_WAKE_TIMELINE } from './introWakeTimeline';
import {
  BED_FLOOR_SPOT,
  BED_POSITION,
  BED_SIT_EDGE,
  WAKEUP_CAMERA_WAYPOINTS,
  WAKEUP_PHASE,
  WAKEUP_TOTAL,
} from '@/engine/wakeup/wakeUpCinematic';

/** Матрас кровати: центр [1.78, 2.05], half-width ~0.74 → x=[1.04, 2.52]. */
const BED_MIN_X = 1.04;
const BED_MAX_X = 2.52;
const FLOOR_Y = 0.05;

type Keyframe = { t: number; position: [number, number, number]; clipPhase: string };

function collectKeyframes(clip: string): Keyframe[] {
  const out: Keyframe[] = [];
  for (const phase of INTRO_WAKE_TIMELINE.phases) {
    if (phase.actor.mode !== 'in_place') continue;
    if (phase.actor.clip !== clip) continue;
    for (const k of phase.actor.keyframes) {
      out.push({ t: k.t, position: k.position, clipPhase: phase.id });
    }
  }
  return out;
}

describe('introWakeTimeline — v4.48.14 «не стоим на матрасе»', () => {
  it('клип idle (стоя) не имеет НИ ОДНОЙ позиции на матрасе', () => {
    const keys = collectKeyframes('idle');
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) {
      const [x, y] = k.position;
      const onMattress = x >= BED_MIN_X && x <= BED_MAX_X && y > FLOOR_Y;
      expect(onMattress, `фаза ${k.clipPhase}: idle-кейфрейм t=${k.t} на матрасе [${x}, ${y}]`).toBe(false);
    }
  });

  it('фаза dismount существует, сидя, и заканчивает на полу вне матраса', () => {
    const dismount = INTRO_WAKE_TIMELINE.phases.find((p) => p.id === 'dismount');
    expect(dismount).toBeDefined();
    expect(dismount!.actor.mode).toBe('in_place');
    if (dismount!.actor.mode !== 'in_place') return;
    expect(dismount!.actor.clip).toBe('sitting');
    const last = dismount!.actor.keyframes[dismount!.actor.keyframes.length - 1];
    const [x, y] = last.position;
    expect(x).toBeLessThan(BED_MIN_X);
    expect(y).toBeLessThanOrEqual(FLOOR_Y);
    // Совпадает с канонической константой пола у кровати
    expect(x).toBeCloseTo(BED_FLOOR_SPOT.x, 5);
    expect(y).toBeCloseTo(BED_FLOOR_SPOT.y, 5);
  });

  it('фаза standing стартует с пола у кровати, а не с матраса', () => {
    const standing = INTRO_WAKE_TIMELINE.phases.find((p) => p.id === 'standing');
    expect(standing).toBeDefined();
    if (standing!.actor.mode !== 'in_place') return;
    const first = standing!.actor.keyframes[0];
    expect(first.position[0]).toBeCloseTo(BED_FLOOR_SPOT.x, 5);
    expect(first.position[1]).toBeLessThanOrEqual(FLOOR_Y);
    expect(first.position[0]).toBeLessThan(BED_MIN_X);
  });

  it('постельные фазы играют лежачие/сидячие клипы, не стоячие', () => {
    const clipOf = (id: string): string => {
      const phase = INTRO_WAKE_TIMELINE.phases.find((p) => p.id === id);
      expect(phase, `фаза ${id}`).toBeDefined();
      if (!phase || phase.actor.mode !== 'in_place') return '';
      return phase.actor.clip;
    };
    expect(clipOf('terminal')).toBe('sleeping');
    expect(clipOf('rise')).toBe('sitting');
    expect(clipOf('dismount')).toBe('sitting');
    expect(clipOf('standing')).toBe('idle');
  });

  it('bed-позиции каноничны: лежим на матрасе (BED_POSITION), сидим на краю (BED_SIT_EDGE)', () => {
    const terminal = INTRO_WAKE_TIMELINE.phases.find((p) => p.id === 'terminal');
    if (terminal?.actor.mode === 'in_place') {
      const first = terminal.actor.keyframes[0];
      expect(first.position[0]).toBeCloseTo(BED_POSITION.x, 5);
      expect(first.position[2]).toBeCloseTo(BED_POSITION.z, 5);
    }
    const rise = INTRO_WAKE_TIMELINE.phases.find((p) => p.id === 'rise');
    if (rise?.actor.mode === 'in_place') {
      const last = rise.actor.keyframes[rise.actor.keyframes.length - 1];
      expect(last.position[0]).toBeCloseTo(BED_SIT_EDGE.x, 5);
      expect(last.position[2]).toBeCloseTo(BED_SIT_EDGE.z, 5);
    }
  });

  it('каждой waypoint-фазе соответствует валидный вейпоинт камеры', () => {
    let usedWaypoints = 0;
    for (const phase of INTRO_WAKE_TIMELINE.phases) {
      if (phase.camera.mode !== 'waypoint') continue;
      const idx = INTRO_WAKE_TIMELINE.phases
        .filter((p) => p.camera.mode === 'waypoint')
        .indexOf(phase);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(WAKEUP_CAMERA_WAYPOINTS[idx]).toBeDefined();
      usedWaypoints++;
    }
    expect(usedWaypoints).toBeLessThanOrEqual(WAKEUP_CAMERA_WAYPOINTS.length);
  });

  it('хронометраж не деградировал: WAKEUP_TOTAL ≈ 22.6с (контракт v4.46/v4.48.14)', () => {
    expect(WAKEUP_TOTAL).toBeCloseTo(22.6, 5);
    expect(WAKEUP_PHASE.dismount).toBeGreaterThan(0);
    expect(WAKEUP_PHASE.dismount + WAKEUP_PHASE.standing).toBeCloseTo(2.0, 5);
  });

  it('у таймлайна 9 фаз после вставки dismount', () => {
    expect(INTRO_WAKE_TIMELINE.phases.map((p) => p.id)).toEqual([
      'terminal',
      'rise',
      'dismount',
      'standing',
      'walking',
      'sitting',
      'settle',
      'monitor',
      'handoff',
    ]);
  });
});
