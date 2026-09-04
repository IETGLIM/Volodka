import { describe, expect, it } from 'vitest';
import {
  MELEE_STRIKE_HALF_ANGLE_RAD,
  MELEE_STRIKE_POINT_BLANK_M,
  MELEE_STRIKE_REACH_M,
  resolveMeleeSweep,
} from '@/engine/combat/realtime/meleeSweep';

/** Кандидат-заглушка: только позиция XZ (как провайдер крипа). */
interface Candidate {
  id: string;
  x: number;
  z: number;
}

/** Взгляд вдоль +Z (yaw = 0): forward = (sin 0, cos 0) = (0, 1). */
const FORWARD_PLUS_Z = { forwardX: 0, forwardZ: 1 };

describe('resolveMeleeSweep (v4.8.7 «Опережающий удар»)', () => {
  it('hits a target dead ahead within reach and sorts by distance', () => {
    const candidates: Candidate[] = [
      { id: 'far', x: 0, z: 2.4 },
      { id: 'near', x: 0, z: 1.8 },
    ];
    const hits = resolveMeleeSweep({ px: 0, pz: 0, reachM: MELEE_STRIKE_REACH_M, candidates, ...FORWARD_PLUS_Z });
    expect(hits.map((h) => h.target.id)).toEqual(['near', 'far']);
    expect(hits[0]!.distM).toBeCloseTo(1.8, 5);
  });

  it('misses targets beyond reach', () => {
    const candidates: Candidate[] = [{ id: 'beyond', x: 0, z: MELEE_STRIKE_REACH_M + 0.5 }];
    const hits = resolveMeleeSweep({ px: 0, pz: 0, reachM: MELEE_STRIKE_REACH_M, candidates, ...FORWARD_PLUS_Z });
    expect(hits).toHaveLength(0);
  });

  it('misses targets outside the view cone', () => {
    // 90° вбок — за пределами полу-угла ~58°.
    const candidates: Candidate[] = [{ id: 'side', x: 2.0, z: 0.1 }];
    const hits = resolveMeleeSweep({ px: 0, pz: 0, reachM: MELEE_STRIKE_REACH_M, candidates, ...FORWARD_PLUS_Z });
    expect(hits).toHaveLength(0);
  });

  it('always hits point-blank targets regardless of the cone', () => {
    // Вплотную за спиной — конус не проверяется.
    const candidates: Candidate[] = [{ id: 'behind', x: 0, z: -MELEE_STRIKE_POINT_BLANK_M + 0.05 }];
    const hits = resolveMeleeSweep({ px: 0, pz: 0, reachM: MELEE_STRIKE_REACH_M, candidates, ...FORWARD_PLUS_Z });
    expect(hits).toHaveLength(1);
    expect(hits[0]!.target.id).toBe('behind');
  });

  it('respects the cone boundary at the half angle', () => {
    // Цель точно на границе полу-угла (dot == cos(half)) — попадание.
    const dist = 2.2;
    const x = Math.sin(MELEE_STRIKE_HALF_ANGLE_RAD) * dist;
    const z = Math.cos(MELEE_STRIKE_HALF_ANGLE_RAD) * dist;
    const candidates: Candidate[] = [{ id: 'edge', x, z }];
    const hits = resolveMeleeSweep({ px: 0, pz: 0, reachM: MELEE_STRIKE_REACH_M, candidates, ...FORWARD_PLUS_Z });
    expect(hits).toHaveLength(1);
  });

  it('just outside the half angle misses', () => {
    const dist = 2.2;
    const half = MELEE_STRIKE_HALF_ANGLE_RAD + 0.15;
    const candidates: Candidate[] = [
      { id: 'outside', x: Math.sin(half) * dist, z: Math.cos(half) * dist },
    ];
    const hits = resolveMeleeSweep({ px: 0, pz: 0, reachM: MELEE_STRIKE_REACH_M, candidates, ...FORWARD_PLUS_Z });
    expect(hits).toHaveLength(0);
  });

  it('follows the look direction (forward is not hardcoded +Z)', () => {
    // Взгляд вдоль −X: цель на западе поражена, на востоке — нет.
    const candidates: Candidate[] = [
      { id: 'west', x: -2.0, z: 0 },
      { id: 'east', x: 2.0, z: 0 },
    ];
    const hits = resolveMeleeSweep({
      px: 0, pz: 0, reachM: MELEE_STRIKE_REACH_M,
      forwardX: -1, forwardZ: 0,
      candidates,
    });
    expect(hits.map((h) => h.target.id)).toEqual(['west']);
  });

  it('tolerates a non-normalized forward vector', () => {
    const candidates: Candidate[] = [{ id: 'ahead', x: 0, z: 2.0 }];
    const hits = resolveMeleeSweep({
      px: 0, pz: 0, reachM: MELEE_STRIKE_REACH_M,
      forwardX: 0, forwardZ: 17, // ненормированный
      candidates,
    });
    expect(hits).toHaveLength(1);
  });

  it('returns empty for an empty candidate list', () => {
    const hits = resolveMeleeSweep({ px: 0, pz: 0, reachM: MELEE_STRIKE_REACH_M, candidates: [], ...FORWARD_PLUS_Z });
    expect(hits).toHaveLength(0);
  });
});
