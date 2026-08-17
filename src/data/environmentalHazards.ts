/**
 * ───────────────────────────────────────────────────────────────────────────
 *  ОПАСНЫЕ ЗОНЫ ОКРУЖЕНИЯ (Environmental Hazards)
 * ───────────────────────────────────────────────────────────────────────────
 *  AAA-механика: зоны на сцене, наносящие урон игроку при нахождении в них.
 *  Примеры: огонь, электричество, токсичные пары, край крыши, глубокая вода.
 *
 *  Система читает позицию игрока из livePlayerPositionRef каждый кадр и
 *  применяет DoT (damage over time) с задержкой и интервалом.
 * ───────────────────────────────────────────────────────────────────────────
 */
import type { SceneId } from '@/shared/types/game';

export type HazardKind = 'fire' | 'electric' | 'toxic' | 'fall' | 'drown';

export interface EnvironmentalHazard {
  readonly id: string;
  readonly sceneId: SceneId;
  /** Center of the hazard zone in world space. */
  readonly position: [number, number, number];
  /** Half-extents of the AABB trigger (width, height, depth). */
  readonly halfExtents: [number, number, number];
  readonly kind: HazardKind;
  /** Damage per tick. */
  readonly damagePerTick: number;
  /** Seconds between damage ticks. */
  readonly tickInterval: number;
  /** Optional: only active while this flag is set. */
  readonly requiredFlag?: string;
  /** Optional: disabled once this flag is set (e.g. fire extinguished). */
  readonly disabledWhenFlag?: string;
  /** Flavour toast shown on first entry. */
  readonly enterToast?: string;
}

/**
 * Hazard registry. Designed as flat data so designers can add zones without
 * touching runtime code. Coordinates match scene spawn conventions.
 */
export const ENVIRONMENTAL_HAZARDS: readonly EnvironmentalHazard[] = [
  // ── abandoned_factory: exposed electrical panel in the main hall ──
  {
    id: 'factory_electric_panel',
    sceneId: 'abandoned_factory',
    position: [-3.5, 0, -2.0],
    halfExtents: [1.2, 1.5, 0.8],
    kind: 'electric',
    damagePerTick: 8,
    tickInterval: 1.2,
    enterToast: '⚡ Открытая электропанель искрит — не подходи близко!',
  },
  // ── factory_basement: toxic leak near the pipes ──
  {
    id: 'basement_toxic_leak',
    sceneId: 'factory_basement',
    position: [2.0, 0, -2.5],
    halfExtents: [1.5, 1.2, 1.5],
    kind: 'toxic',
    damagePerTick: 6,
    tickInterval: 1.5,
    enterToast: '☠ Токсичные пары из проржавевших труб — задержи дыхание!',
  },
  // ── rooftop_edge: the actual edge — stepping off deals fall damage ──
  {
    id: 'rooftop_edge_hazard',
    sceneId: 'rooftop_edge',
    position: [0, 0, -4.5],
    halfExtents: [4.0, 1.0, 0.6],
    kind: 'fall',
    damagePerTick: 25,
    tickInterval: 0.8,
    enterToast: '⚠ Край крыши! Одно неверное движение — и полёт.',
  },
  // ── river_pier: deep water at the pier edge (drowning) ──
  {
    id: 'pier_deep_water',
    sceneId: 'river_pier',
    position: [-1.8, 0, -4.0],
    halfExtents: [2.5, 1.0, 1.2],
    kind: 'drown',
    damagePerTick: 5,
    tickInterval: 2.0,
    enterToast: '🌊 Глубокое место у сваи — не уплыви.',
  },
  // ── chk_forest_zorge: campfire that burns if you stand in it ──
  {
    id: 'chk_campfire',
    sceneId: 'chk_forest_zorge',
    position: [0, 0, 0],
    halfExtents: [0.8, 0.8, 0.8],
    kind: 'fire',
    damagePerTick: 10,
    tickInterval: 1.0,
    enterToast: '🔥 Костёр горит жарко — не стой в огне!',
  },
];

/** Check if a world position is inside a hazard AABB. */
export function isInsideHazard(
  hazard: EnvironmentalHazard,
  x: number,
  y: number,
  z: number,
): boolean {
  const [hx, hy, hz] = hazard.position;
  const [hxh, hyh, hzh] = hazard.halfExtents;
  return (
    Math.abs(x - hx) <= hxh &&
    Math.abs(y - hy) <= hyh &&
    Math.abs(z - hz) <= hzh
  );
}

/** Filter hazards for a given scene (for fast lookup per frame). */
export function getHazardsForScene(sceneId: SceneId): readonly EnvironmentalHazard[] {
  return ENVIRONMENTAL_HAZARDS.filter((h) => h.sceneId === sceneId);
}
