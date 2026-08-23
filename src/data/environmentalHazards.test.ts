/* ─── Юнит-тесты чистой логики hazard-зон ───
 * Data-driven тюнинг (фикс аудита 3.3-e): стресс за тик и интервал
 * должны реально браться из damagePerTick/tickInterval дизайн-данных.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HAZARD_TICK_INTERVAL,
  ENVIRONMENTAL_HAZARDS,
  HAZARD_KIND_COLOR,
  HAZARD_STRESS_PER_TICK_CAP,
  getEnabledHazardsForScene,
  getHazardLabel,
  isHazardEnabled,
  isInsideHazard,
  resolveHazardStressPerTick,
  resolveHazardTickInterval,
  type EnvironmentalHazard,
} from '@/data/environmentalHazards';

const BASE: EnvironmentalHazard = {
  id: 'test_hazard',
  sceneId: 'abandoned_factory',
  position: [0, 0, 0],
  halfExtents: [1, 1, 1],
  kind: 'fire',
  damagePerTick: 5,
  tickInterval: 1.5,
};

function mkHazard(overrides: Partial<EnvironmentalHazard> = {}): EnvironmentalHazard {
  return { ...BASE, ...overrides };
}

describe('resolveHazardStressPerTick', () => {
  it('uses designer damagePerTick as stress when within cap', () => {
    expect(resolveHazardStressPerTick(mkHazard({ damagePerTick: 8 }))).toBe(8);
    expect(resolveHazardStressPerTick(mkHazard({ damagePerTick: 5 }))).toBe(5);
    expect(resolveHazardStressPerTick(mkHazard({ damagePerTick: 10 }))).toBe(10);
  });

  it('caps large damage (HP-part is combat-only) at HAZARD_STRESS_PER_TICK_CAP', () => {
    // Край крыши: 25 урона в данных, но стресс-эквивалент ограничен.
    expect(resolveHazardStressPerTick(mkHazard({ damagePerTick: 25 }))).toBe(HAZARD_STRESS_PER_TICK_CAP);
    expect(HAZARD_STRESS_PER_TICK_CAP).toBe(12);
  });

  it('rounds fractional damage to whole stress', () => {
    expect(resolveHazardStressPerTick(mkHazard({ damagePerTick: 7.6 }))).toBe(8);
    expect(resolveHazardStressPerTick(mkHazard({ damagePerTick: 2.3 }))).toBe(2);
  });

  it('keeps a minimum of 1 stress per tick', () => {
    expect(resolveHazardStressPerTick(mkHazard({ damagePerTick: 0 }))).toBe(1);
    expect(resolveHazardStressPerTick(mkHazard({ damagePerTick: 0.4 }))).toBe(1);
  });

  it('falls back to 1 for non-numeric damage', () => {
    expect(resolveHazardStressPerTick(mkHazard({ damagePerTick: Number.NaN }))).toBe(1);
  });
});

describe('resolveHazardTickInterval', () => {
  it('uses tickInterval from data', () => {
    expect(resolveHazardTickInterval(mkHazard({ tickInterval: 0.8 }))).toBe(0.8);
    expect(resolveHazardTickInterval(mkHazard({ tickInterval: 1.2 }))).toBe(1.2);
    expect(resolveHazardTickInterval(mkHazard({ tickInterval: 2.0 }))).toBe(2.0);
  });

  it('falls back to default for broken intervals', () => {
    expect(resolveHazardTickInterval(mkHazard({ tickInterval: 0 }))).toBe(DEFAULT_HAZARD_TICK_INTERVAL);
    expect(resolveHazardTickInterval(mkHazard({ tickInterval: -1 }))).toBe(DEFAULT_HAZARD_TICK_INTERVAL);
    expect(resolveHazardTickInterval(mkHazard({ tickInterval: Number.NaN }))).toBe(DEFAULT_HAZARD_TICK_INTERVAL);
    expect(resolveHazardTickInterval(mkHazard({ tickInterval: Number.POSITIVE_INFINITY }))).toBe(
      DEFAULT_HAZARD_TICK_INTERVAL,
    );
  });
});

describe('ENVIRONMENTAL_HAZARDS registry', () => {
  it('has unique ids across all five scenes', () => {
    const ids = ENVIRONMENTAL_HAZARDS.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(5);
  });

  it('every zone yields sane stress (1..cap) and a valid interval', () => {
    for (const hazard of ENVIRONMENTAL_HAZARDS) {
      const stress = resolveHazardStressPerTick(hazard);
      expect(stress).toBeGreaterThanOrEqual(1);
      expect(stress).toBeLessThanOrEqual(HAZARD_STRESS_PER_TICK_CAP);
      expect(resolveHazardTickInterval(hazard)).toBeGreaterThan(0);
    }
  });

  it('rooftop edge (25 dmg) is capped while zones stay data-driven', () => {
    const rooftop = ENVIRONMENTAL_HAZARDS.find((h) => h.id === 'rooftop_edge_hazard');
    expect(rooftop).toBeDefined();
    expect(rooftop!.damagePerTick).toBe(25);
    expect(resolveHazardStressPerTick(rooftop!)).toBe(HAZARD_STRESS_PER_TICK_CAP);
    // Интервал дизайнера (0.8с) больше не игнорируется хардкодом 1.5с.
    expect(resolveHazardTickInterval(rooftop!)).toBe(0.8);
  });

  it('every kind has a Russian label and a palette color', () => {
    for (const hazard of ENVIRONMENTAL_HAZARDS) {
      expect(getHazardLabel(hazard.kind).length).toBeGreaterThan(0);
      expect(HAZARD_KIND_COLOR[hazard.kind]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('isHazardEnabled / getEnabledHazardsForScene', () => {
  it('gates on requiredFlag and disabledWhenFlag', () => {
    const gated = mkHazard({ requiredFlag: 'key_found', disabledWhenFlag: 'fire_out' });
    expect(isHazardEnabled(gated, {})).toBe(false);
    expect(isHazardEnabled(gated, { key_found: true })).toBe(true);
    expect(isHazardEnabled(gated, { key_found: true, fire_out: true })).toBe(false);
  });

  it('returns only enabled hazards for a scene', () => {
    const noFlags: Record<string, boolean> = {};
    const factory = getEnabledHazardsForScene('abandoned_factory', noFlags);
    expect(factory.map((h) => h.id)).toEqual(['factory_electric_panel']);

    const allScenes = new Set(ENVIRONMENTAL_HAZARDS.map((h) => h.sceneId));
    for (const sceneId of allScenes) {
      expect(getEnabledHazardsForScene(sceneId, noFlags).length).toBeGreaterThan(0);
    }
  });
});

describe('isInsideHazard', () => {
  it('matches positions inside the AABB and rejects outside ones', () => {
    const zone = mkHazard({ position: [0, 0, -2], halfExtents: [0.8, 0.8, 0.8] });
    expect(isInsideHazard(zone, 0, 0, -2)).toBe(true);
    expect(isInsideHazard(zone, 0.79, 0.5, -1.3)).toBe(true);
    expect(isInsideHazard(zone, 0.81, 0, -2)).toBe(false);
    expect(isInsideHazard(zone, 0, 0, -1.19)).toBe(false);
  });
});
