/* ─── Volodka RPG – NPC placement overrides for schedule-variant scenes ─── */
/* Variant scenes (albert_backroom, guild_mainframe, factory_roof, …) inherit
 * NPC schedule positions from a PARENT scene (SCENE_SCHEDULE_PARENT), but
 * their geometry differs — furniture/racks/chimneys stand elsewhere and rooms
 * are smaller. Positions authored for the parent can land INSIDE colliders or
 * off the floor in the variant (модель висит в пустоте / встроена в шкаф).
 *
 * This table remaps an NPC's position PER RENDERED SCENE. Keys:
 *   SceneId (rendered variant) → NPC id → world position (Y = floor top).
 * Applied at runtime by resolveNpcPlacementForScene() (NPCSystem,
 * InteractiveTriggers) and mirrored by the placement audit + vitest gate.
 *
 * Координаты проверены scripts/analyze-model-placement.ts (0 HIGH):
 * каждая точка на полу, в габаритах, вне стен/препятствий и не внутри
 * коллайдеров мебели своей сцены.
 */

import type { SceneId } from '@/config/sceneIds';

export const NPC_VARIANT_PLACEMENT_OVERRIDES: Partial<
  Record<SceneId, Partial<Record<string, readonly [number, number, number]>>>
> = {
  /* Подсобка кафе (8×6): стойка/полки не там, где в зале; позиции зала
   * выносили бариста за границы комнаты. */
  albert_backroom: {
    cafe_barista: [0.5, 0, -1],
    rival_poet_max: [-3, 0, 0.5],
    albert: [-2.5, 0, -1.9],
  },

  /* Серверная гильдии (16×14): две стойки-шкафа (верх 4 м) в [±3,-1] —
   * офисные рабочие места попадали внутрь шкафов. */
  guild_mainframe: {
    office_alexander: [3, 0, 0.7],
    sergey: [2.0, 0, -1],
    chk_based: [2.0, 0, -2.4],
    office_colleague: [2.0, 0, -1.6],
  },

  /* Подвал библиотеки (14×12): ящики у северной стены [0,-3.2] —
   * «читающие» места из зала упирались в них. */
  library_basement: {
    dying_poet: [-1, 0, -1.6],
  },

  /* Крыша завода (22×18): вентиляционная труба [2.5,-4] и труба-дымоход
   * [-3.5,-3] — позиции с края крыши родителя не проходят. */
  factory_roof: {
    grisha: [-5.5, 0, 1.5],
  },

  /* Костёр ЧК (24×22): очаг obstacle[0,-2] (верх 1 м) — «читающий» у костра
   * родительского леса сидит ВНУТРИ огня. */
  chk_campfire_night: {
    chk_smert: [1.15, 0, -1.35],
  },

  /* Лесная Поляна (20×20): валун obstacle[-3,-2] (верх 1.8 м) — маршрут
   * сталкера из леса Зорге проходит сквозь камень. */
  forest_clearing: {
    chk_stalker: [-1.55, 0, -2],
  },
};

/**
 * Runtime placement resolver — apply per-variant-scene position overrides.
 * NPCSystem/InteractiveTriggers/minimap call this for every placed NPC;
 * the placement audit mirrors it so static checks see what ships.
 */
export function resolveNpcPlacementForScene(
  sceneId: SceneId,
  npcId: string,
  fallback: readonly [number, number, number],
): readonly [number, number, number] {
  const byNpc = NPC_VARIANT_PLACEMENT_OVERRIDES[sceneId];
  const override = byNpc?.[npcId];
  return override ?? fallback;
}
