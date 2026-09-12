/* ─── Юнит-тесты чистой логики hazard-зон ───
 * Data-driven тюнинг (фикс аудита 3.3-e): стресс за тик и интервал
 * должны реально браться из damagePerTick/tickInterval дизайн-данных.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HAZARD_TICK_INTERVAL,
  ENVIRONMENTAL_HAZARDS,
  HAZARD_KIND_COLOR,
  HAZARD_KIND_SFX,
  HAZARD_STRESS_PER_TICK_CAP,
  getEnabledHazardsForScene,
  getHazardLabel,
  isHazardEnabled,
  isInsideHazard,
  pickStrongestHazard,
  resolveHazardStressPerTick,
  resolveHazardTickInterval,
  type EnvironmentalHazard,
} from '@/data/environmentalHazards';
import { SFX_PRESETS } from '@/engine/audio/sfxPresets';

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
  it('has unique ids across all scenes (9 зон в 9 сценах)', () => {
    const ids = ENVIRONMENTAL_HAZARDS.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(9);
    // v4.20: +4 зоны — library_basement / guild_mainframe / factory_roof /
    // underground_bunker (глушилка «Белого шума» — перекликается с фазой
    // «Белый шум» босса «Тихий Хранитель»).
    const scenes = new Set(ENVIRONMENTAL_HAZARDS.map((h) => h.sceneId));
    expect(scenes).toContain('library_basement');
    expect(scenes).toContain('guild_mainframe');
    expect(scenes).toContain('factory_roof');
    expect(scenes).toContain('underground_bunker');
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

  it('every kind has a Russian label, a palette color and an sfx preset', () => {
    for (const hazard of ENVIRONMENTAL_HAZARDS) {
      expect(getHazardLabel(hazard.kind).length).toBeGreaterThan(0);
      expect(HAZARD_KIND_COLOR[hazard.kind]).toMatch(/^#[0-9a-f]{6}$/i);
      // v4.20: у каждого типа есть звук входа/тика — и он существует в SFX_PRESETS.
      const sfxKey = HAZARD_KIND_SFX[hazard.kind];
      expect(sfxKey.startsWith('hazard_')).toBe(true);
      expect(SFX_PRESETS[sfxKey]).toBeDefined();
    }
  });

  it('static kind («Белый шум») полностью описан в реестрах', () => {
    expect(getHazardLabel('static')).toBe('Белый шум');
    expect(HAZARD_KIND_COLOR.static).toBe('#cfe8ff');
    expect(HAZARD_KIND_SFX.static).toBe('hazard_static');
    expect(SFX_PRESETS.hazard_static).toBeDefined();
  });
});

describe('pickStrongestHazard', () => {
  it('returns null for an empty set and the zone itself for a single zone', () => {
    expect(pickStrongestHazard([])).toBeNull();
    const solo = mkHazard({ id: 'solo' });
    expect(pickStrongestHazard([solo])).toBe(solo);
  });

  it('prefers the zone with the highest stress-per-tick', () => {
    const weak = mkHazard({ id: 'a', damagePerTick: 4 });
    const strong = mkHazard({ id: 'b', damagePerTick: 10 });
    expect(pickStrongestHazard([weak, strong])).toBe(strong);
    expect(pickStrongestHazard([strong, weak])).toBe(strong);
  });

  it('breaks stress ties by raw damage, then by id (deterministic)', () => {
    // Обе капнутся в одинаковый стресс (≥ cap), но у second урон выше.
    const first = mkHazard({ id: 'a', damagePerTick: 25 });
    const second = mkHazard({ id: 'b', damagePerTick: 30 });
    expect(pickStrongestHazard([first, second])).toBe(second);
    // Полное равенство — меньший id детерминированно выигрывает.
    const x = mkHazard({ id: 'x', damagePerTick: 7 });
    const y = mkHazard({ id: 'y', damagePerTick: 7 });
    expect(pickStrongestHazard([y, x])).toBe(x);
    expect(pickStrongestHazard([x, y])).toBe(x);
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

    // v4.20: новые сцены отдают ровно свои зоны.
    expect(getEnabledHazardsForScene('library_basement', noFlags).map((h) => h.id))
      .toEqual(['library_basement_mold']);
    expect(getEnabledHazardsForScene('guild_mainframe', noFlags).map((h) => h.id))
      .toEqual(['guild_mainframe_rail']);
    expect(getEnabledHazardsForScene('factory_roof', noFlags).map((h) => h.id))
      .toEqual(['factory_roof_south_edge']);
    expect(getEnabledHazardsForScene('underground_bunker', noFlags).map((h) => h.id))
      .toEqual(['bunker_whitenoise_emitter']);

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
