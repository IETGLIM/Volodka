/**
 * ───────────────────────────────────────────────────────────────────────────
 *  ОПАСНЫЕ ЗОНЫ ОКРУЖЕНИЯ (Environmental Hazards)
 * ───────────────────────────────────────────────────────────────────────────
 *  AAA-фича: урон от окружения в exploration-режиме.
 *
 *  Опасные зоны определяются по sceneId + позиции и наносят периодический
 *  урон игроку через stress/energy (в exploration нет HP-поля — combat
 *  отдельная система). Это создаёт ощущение реальной опасности:
 *    - край крыши → стресс (страх высоты)
 *    - слишком близко к огню → выносливость (жар)
 *    - электрические панели → стресс (опасность)
 *    - холодная вода у пирса → выносливость (переохлаждение)
 *
 *  Интеграция: PhysicsSceneProximityQuestMounts или новый mount вызывает
 *  tickEnvironmentalHazards(dt) каждый кадр. Модуль сам throttлит урон
 *  до раз в 1.5с, чтобы не спамить notifications.
 * ───────────────────────────────────────────────────────────────────────────
 */
import * as THREE from 'three';
import type { SceneId } from '@/shared/types/game';

export interface EnvironmentalHazard {
  readonly id: string;
  readonly sceneId: SceneId;
  readonly center: Readonly<[number, number, number]>;
  readonly radius: number;
  readonly damageType: 'stress' | 'energy';
  readonly amountPerTick: number;
  readonly warningText: string;
  readonly flavorText?: string;
}

/** Опасные зоны — координаты в локальном пространстве сцены. */
const HAZARDS: readonly EnvironmentalHazard[] = [
  // ── rooftop_edge — край крыши, страх высоты ──
  {
    id: 'rooftop_edge_north',
    sceneId: 'rooftop_edge',
    center: [0, 0, -5.5],
    radius: 1.8,
    damageType: 'stress',
    amountPerTick: 4,
    warningText: 'Край крыши опасно близко...',
    flavorText: 'Ветер тянет вниз. Высота давит на грудь.',
  },
  {
    id: 'rooftop_edge_east',
    sceneId: 'rooftop_edge',
    center: [5.5, 0, 0],
    radius: 1.8,
    damageType: 'stress',
    amountPerTick: 4,
    warningText: 'Не подходи к краю...',
    flavorText: 'Город внизу мерцает, как код. Заманчиво. Опасно.',
  },
  // ── abandoned_factory — электрические панели ──
  {
    id: 'factory_electric_panel',
    sceneId: 'abandoned_factory',
    center: [-3.5, 0, -2.0],
    radius: 1.2,
    damageType: 'stress',
    amountPerTick: 6,
    warningText: 'Искрящаяся панель! Держись подальше.',
    flavorText: 'Старая проводка тлеет. Один шаг — и ток найдёт путь.',
  },
  {
    id: 'factory_steam_pipe',
    sceneId: 'abandoned_factory',
    center: [2.8, 0, 3.5],
    radius: 1.5,
    damageType: 'energy',
    amountPerTick: 5,
    warningText: 'Горячий пар из трубы!',
    flavorText: 'Шипящий пар обжигает кожу. Надо отойти.',
  },
  // ── factory_basement — токсичные лужи ──
  {
    id: 'basement_toxic_pool',
    sceneId: 'factory_basement',
    center: [1.5, 0, -2.5],
    radius: 2.0,
    damageType: 'energy',
    amountPerTick: 7,
    warningText: 'Токсичная лужа — обходи!',
    flavorText: 'Химический запах режет лёгкие. Цвет неправильный.',
  },
  // ── river_pier — холодная вода ──
  {
    id: 'pier_cold_water',
    sceneId: 'river_pier',
    center: [-4.0, 0, -4.5],
    radius: 1.6,
    damageType: 'energy',
    amountPerTick: 3,
    warningText: 'Ледяная вода у свай...',
    flavorText: 'Река забирает тепло. Не стой в воде долго.',
  },
  // ── library_basement — пыль и плесень ──
  {
    id: 'library_basement_mold',
    sceneId: 'library_basement',
    center: [3.0, 0, -2.0],
    radius: 2.2,
    damageType: 'stress',
    amountPerTick: 3,
    warningText: 'Споры плесени в воздухе...',
    flavorText: 'Старые книги гниют. Запах бьёт в голову.',
  },
];

/** Минимальный интервал между тиками урона (сек). */
const DAMAGE_TICK_INTERVAL = 1.5;

/** Кеш активных хазардов по сцене для быстрого lookup. */
const HAZARDS_BY_SCENE = new Map<SceneId, EnvironmentalHazard[]>();
for (const h of HAZARDS) {
  const arr = HAZARDS_BY_SCENE.get(h.sceneId) ?? [];
  arr.push(h);
  HAZARDS_BY_SCENE.set(h.sceneId, arr);
}

export interface HazardTickResult {
  readonly damageType: 'stress' | 'energy';
  readonly amount: number;
  readonly warningText: string;
  readonly flavorText?: string;
  readonly hazardId: string;
}

/** Найти хазард, в котором находится игрок (если есть). */
export function getActiveHazard(
  sceneId: SceneId,
  playerPos: THREE.Vector3,
): EnvironmentalHazard | null {
  const sceneHazards = HAZARDS_BY_SCENE.get(sceneId);
  if (!sceneHazards || sceneHazards.length === 0) return null;
  for (const h of sceneHazards) {
    const dx = playerPos.x - h.center[0];
    const dz = playerPos.z - h.center[2];
    if (dx * dx + dz * dz <= h.radius * h.radius) {
      return h;
    }
  }
  return null;
}

/** Состояние тикера — отслеживает время с последнего урона. */
let timeSinceLastDamage = 0;
let lastHazardId: string | null = null;
let warningShownFor: string | null = null;

/**
 * Тикер опасных зон. Вызывается каждый кадр из R3F useFrame.
 * Возвращает результат, если нанесён урон (для UI feedback).
 * null — если игрок не в хазарде или тик ещё не наступил.
 */
export function tickEnvironmentalHazards(
  dt: number,
  sceneId: SceneId,
  playerPos: THREE.Vector3,
): HazardTickResult | null {
  const hazard = getActiveHazard(sceneId, playerPos);
  if (!hazard) {
    // Сброс: игрок вышел из хазарда — покажем предупреждение снова при входе
    if (lastHazardId !== null) {
      warningShownFor = null;
      lastHazardId = null;
    }
    timeSinceLastDamage = 0;
    return null;
  }

  // Показать warning один раз при входе в зону
  if (warningShownFor !== hazard.id) {
    warningShownFor = hazard.id;
    lastHazardId = hazard.id;
    return {
      damageType: hazard.damageType,
      amount: 0,
      warningText: hazard.warningText,
      flavorText: hazard.flavorText,
      hazardId: hazard.id,
    };
  }

  // Тик урона каждые DAMAGE_TICK_INTERVAL секунд
  timeSinceLastDamage += dt;
  if (timeSinceLastDamage < DAMAGE_TICK_INTERVAL) return null;
  timeSinceLastDamage = 0;

  return {
    damageType: hazard.damageType,
    amount: hazard.amountPerTick,
    warningText: hazard.flavorText ?? hazard.warningText,
    flavorText: hazard.flavorText,
    hazardId: hazard.id,
  };
}

/** Сбросить состояние хазард-системы (при смене сцены / выходе в меню). */
export function resetEnvironmentalHazards(): void {
  timeSinceLastDamage = 0;
  lastHazardId = null;
  warningShownFor = null;
}

/** Все определённые хазарды (для DevPanel / отладки). */
export function getAllHazards(): readonly EnvironmentalHazard[] {
  return HAZARDS;
}
