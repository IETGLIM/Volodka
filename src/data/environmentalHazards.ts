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
  // Позиция синхронизирована с реальным костром (kenney_city_campfire в
  // scenePropDressing стоит в [0, 0, -2.0]) — раньше триггер висел в 2 м
  // от горящего пропа и не совпадал ни с визуалом, ни с логикой.
  {
    id: 'chk_campfire',
    sceneId: 'chk_forest_zorge',
    position: [0, 0, -2.0],
    halfExtents: [0.8, 0.8, 0.8],
    kind: 'fire',
    damagePerTick: 10,
    tickInterval: 1.0,
    enterToast: '🔥 Костёр горит жарко — не стой в огне!',
  },
];

/* ─── Data-driven тюнинг (единый источник игровых значений) ─────────────── */

/**
 * Потолок стресса за один тик hazard-зоны.
 *
 * damagePerTick в данных — дизайнерское значение ПОЛНОГО урона (в бою оно
 * бьёт по HP). В exploration HP не трогается (осознанный дизайн: HP живёт
 * только в combat), зона конвертирует урон в стресс. Чтобы «край крыши»
 * (25 урона) не выжигал весь стресс-бар за пару тиков, полный урон капится
 * в разумный стресс-эквивалент: min(damagePerTick, HAZARD_STRESS_PER_TICK_CAP).
 * HP-часть урона продолжает применяться только в бою.
 */
export const HAZARD_STRESS_PER_TICK_CAP = 12;

/** Fallback-интервал тиков, если дизайнер сломал tickInterval в данных. */
export const DEFAULT_HAZARD_TICK_INTERVAL = 1.5;

/** Минимально допустимый интервал (защита от мгновенных тиков). */
export const MIN_HAZARD_TICK_INTERVAL = 0.2;

/**
 * Стресс за тик: урон из данных, капнутый и округлённый до целого (мин. 1).
 * До фикса система игнорировала damagePerTick (хардкод 3) — теперь
 * дизайнерские значения реально управляют давлением зоны.
 */
export function resolveHazardStressPerTick(hazard: EnvironmentalHazard): number {
  const raw = Number.isFinite(hazard.damagePerTick) ? hazard.damagePerTick : 1;
  return Math.max(1, Math.round(Math.min(raw, HAZARD_STRESS_PER_TICK_CAP)));
}

/**
 * Интервал тиков из данных с санитайзом: NaN/бесконечность/слишком быстрые
 * значения откатываются к DEFAULT_HAZARD_TICK_INTERVAL.
 */
export function resolveHazardTickInterval(hazard: EnvironmentalHazard): number {
  const raw = hazard.tickInterval;
  if (!Number.isFinite(raw) || raw < MIN_HAZARD_TICK_INTERVAL) {
    return DEFAULT_HAZARD_TICK_INTERVAL;
  }
  return raw;
}

/** Активна ли зона при текущих флагах игрока (гейт requiredFlag/disabledWhenFlag). */
export function isHazardEnabled(
  hazard: EnvironmentalHazard,
  flags: Readonly<Record<string, boolean>>,
): boolean {
  if (hazard.requiredFlag && !flags[hazard.requiredFlag]) return false;
  if (hazard.disabledWhenFlag && flags[hazard.disabledWhenFlag]) return false;
  return true;
}

/** Только включённые зоны сцены — для рантайм-тика и 3D-маркеров. */
export function getEnabledHazardsForScene(
  sceneId: SceneId,
  flags: Readonly<Record<string, boolean>>,
): readonly EnvironmentalHazard[] {
  return ENVIRONMENTAL_HAZARDS.filter(
    (h) => h.sceneId === sceneId && isHazardEnabled(h, flags),
  );
}

/** Русская подпись типа опасности — тосты входа и HUD-индикатор. */
export function getHazardLabel(kind: HazardKind): string {
  switch (kind) {
    case 'fire': return 'Огонь';
    case 'electric': return 'Электричество';
    case 'toxic': return 'Токсичные пары';
    case 'fall': return 'Край';
    case 'drown': return 'Глубокая вода';
  }
}

/**
 * Единая палитра типов опасности — 3D-маркеры и HUD-индикатор читают отсюда,
 * чтобы цвет зоны в мире совпадал с цветом предупреждения на экране.
 */
export const HAZARD_KIND_COLOR: Readonly<Record<HazardKind, string>> = {
  electric: '#7fd8ff',
  toxic: '#5dff8a',
  fall: '#ff5a5a',
  drown: '#5a9dff',
  fire: '#ff8a3d',
};

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
