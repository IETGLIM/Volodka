import { describe, expect, it } from 'vitest';
import {
  FPS_PROCEDURAL_RIG_SCALE,
  resolveFpsArmsProceduralOnly,
  resolveFpsArmsRigScale,
} from './fpsArmsPresentation';

describe('fpsArmsPresentation', () => {
  it('treats metre-scale Soldier interim as procedural', () => {
    expect(resolveFpsArmsProceduralOnly(1.8, true)).toBe(true);
    expect(resolveFpsArmsRigScale(true)).toBe(FPS_PROCEDURAL_RIG_SCALE);
  });

  it('uses real mesh scale for compact arms-only rigs with fingers', () => {
    expect(resolveFpsArmsProceduralOnly(0.65, true)).toBe(false);
    expect(resolveFpsArmsRigScale(false)).toBe(1);
  });

  it('uses procedural path for sleeve stubs without finger meshes', () => {
    expect(resolveFpsArmsProceduralOnly(0.65, false)).toBe(true);
  });
});
