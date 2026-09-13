import { describe, expect, it } from 'vitest';
import {
  METRIC_SCALE_AUDIT,
  NPC_GLTF_TARGET_HEIGHT_M,
  PLAYER_METRIC,
  PLAZA_MONUMENT_SCALE,
  STREET_FACADE_SCALE,
  STREET_SHUTTER_DOOR_SCALE,
  STREET_SHUTTER_WINDOW_SCALE,
  URBAN_FACADE_NATIVE_HEIGHT_M,
} from './metricScaleCoherence';
import { WAKEUP_CAMERA_WAYPOINTS } from '@/engine/wakeup/wakeUpCinematic';

describe('metricScaleCoherence', () => {
  it('anchors player metric at 1.75 m', () => {
    expect(PLAYER_METRIC.heightM).toBe(1.75);
    expect(PLAYER_METRIC.eyeHeightM).toBeGreaterThan(1.55);
    expect(PLAYER_METRIC.eyeHeightM).toBeLessThan(1.75);
  });

  it('keeps street shutter door multiplier near residential door band', () => {
    const shutterHeightM = PLAYER_METRIC.storefrontShutterHeightM * STREET_SHUTTER_DOOR_SCALE;
    expect(shutterHeightM).toBeGreaterThan(2.0);
    expect(shutterHeightM).toBeLessThan(2.3);
  });

  it('keeps street shutter window multiplier in residential window band', () => {
    const windowHeightM = PLAYER_METRIC.storefrontShutterWindowHeightM * STREET_SHUTTER_WINDOW_SCALE;
    expect(windowHeightM).toBeGreaterThan(1.2);
    expect(windowHeightM).toBeLessThan(1.5);
  });

  it('anchors NPC runtime fit to player height', () => {
    expect(NPC_GLTF_TARGET_HEIGHT_M).toBe(PLAYER_METRIC.heightM);
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

  it('street facade multipliers map measured 17 m native into 15–25 m silhouette band', () => {
    // Натив modular_urban_apartments_facade измерен по GLB:
    // accessor min/max × node-TRS → 51.53×17.0×6.66 м. Прежние ×1.78–2.38
    // (посылка «~3 м shell») давали 30–41 м — против процедурного силуэта 15–25 м.
    const heroHeightM = STREET_FACADE_SCALE.hero * URBAN_FACADE_NATIVE_HEIGHT_M;
    const midHeightM = STREET_FACADE_SCALE.mid * URBAN_FACADE_NATIVE_HEIGHT_M;
    const sideHeightM = STREET_FACADE_SCALE.side * URBAN_FACADE_NATIVE_HEIGHT_M;
    expect(heroHeightM).toBeGreaterThan(19);
    expect(heroHeightM).toBeLessThan(22);
    expect(midHeightM).toBeGreaterThan(16.5);
    expect(midHeightM).toBeLessThan(19);
    expect(sideHeightM).toBeGreaterThan(14);
    expect(sideHeightM).toBeLessThan(16);
    // Максимальная длина инстанса не выходит за пределы квартала (~61 м при hero).
    expect(51.53 * STREET_FACADE_SCALE.hero).toBeLessThan(70);
  });

  it('audit documents facade/lamp/bench scale fixes as measured rows', () => {
    for (const id of ['street_facade', 'street_lamp_alt', 'bench_scale']) {
      const row = METRIC_SCALE_AUDIT.find((r) => r.id === id);
      expect(row, `audit row ${id}`).toBeDefined();
      expect(row?.status).toBe('fixed');
    }
  });

  it('marks interior shell exterior-impostor debt as fixed in the audit', () => {
    const row = METRIC_SCALE_AUDIT.find((r) => r.id === 'volodka_room_envelope');
    expect(row?.status).toBe('fixed');
    expect(row?.targetM).toBe(3);
  });

  it('keeps player desk/chair metric band coherent with 1.75 m humanoid', () => {
    expect(PLAYER_METRIC.deskHeightM).toBeGreaterThan(0.7);
    expect(PLAYER_METRIC.deskHeightM).toBeLessThan(0.85);
    expect(PLAYER_METRIC.chairSeatHeightM).toBeGreaterThan(0.4);
    expect(PLAYER_METRIC.chairSeatHeightM).toBeLessThan(0.55);
    expect(PLAYER_METRIC.residentialDoorHeightM).toBeGreaterThan(PLAYER_METRIC.heightM);
  });
});
