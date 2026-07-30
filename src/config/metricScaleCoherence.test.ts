import { describe, expect, it } from 'vitest';
import {
  METRIC_SCALE_AUDIT,
  PLAYER_METRIC,
  PLAZA_MONUMENT_SCALE,
  STREET_FACADE_SCALE,
  STREET_SHUTTER_DOOR_SCALE,
} from './metricScaleCoherence';
import { WAKEUP_CAMERA_WAYPOINTS } from '@/engine/wakeup/wakeUpCinematic';

describe('metricScaleCoherence', () => {
  it('anchors player metric at 1.75 m', () => {
    expect(PLAYER_METRIC.heightM).toBe(1.75);
    expect(PLAYER_METRIC.eyeHeightM).toBeGreaterThan(1.55);
    expect(PLAYER_METRIC.eyeHeightM).toBeLessThan(1.75);
  });

  it('keeps street shutter multiplier near human door band', () => {
    const shutterHeightM = PLAYER_METRIC.storefrontShutterHeightM * STREET_SHUTTER_DOOR_SCALE;
    expect(shutterHeightM).toBeGreaterThan(2.0);
    expect(shutterHeightM).toBeLessThan(2.8);
  });

  it('keeps plaza monument under 2 m at configured scale', () => {
    const statueBaseHeightM = 1.85;
    expect(statueBaseHeightM * PLAZA_MONUMENT_SCALE).toBeLessThan(1.75);
  });

  it('documents at least one open debt row', () => {
    expect(METRIC_SCALE_AUDIT.some((row) => row.status === 'debt')).toBe(true);
  });

  it('wake standing/walking camera lookAt targets eye band for 1.75 m player', () => {
    const standing = WAKEUP_CAMERA_WAYPOINTS[2];
    const walking = WAKEUP_CAMERA_WAYPOINTS[3];
    expect(standing.lookAt.y).toBeGreaterThan(1.4);
    expect(standing.lookAt.y).toBeLessThan(1.7);
    expect(walking.lookAt.y).toBeGreaterThan(1.35);
    expect(walking.lookAt.y).toBeLessThan(1.65);
  });

  it('street facade multipliers stay in 2-storey band', () => {
    expect(STREET_FACADE_SCALE.hero).toBeGreaterThan(2.0);
    expect(STREET_FACADE_SCALE.hero).toBeLessThan(2.6);
  });
});
