/**
 * Локация: Катакомбы
 * Подземные туннели под городом с врагами, ловушками и боссом
 */

export interface LocationDefinition {
  id: string;
  name: string;
  description: string;
  connections: string[];
  enemySpawns: Array<{
    enemyType: string;
    position: [number, number, number];
    count: number;
  }>;
  lootContainers: Array<{
    id: string;
    position: [number, number, number];
    lootTable: string[];
    locked?: boolean;
  }>;
  hazardZones: Array<{
    type: 'poison' | 'fire' | 'electricity';
    position: [number, number, number];
    radius: number;
    damagePerSecond: number;
  }>;
  ambientLight: number;
  fogColor?: string;
  fogDensity?: number;
}

export const CATACOMBS_LOCATION: LocationDefinition = {
  id: 'catacombs',
  name: 'Древние катакомбы',
  description: 'Лабиринт подземных ходов, проложенных столетия назад. Воздух спёртый и холодный. Стены покрыты мхом и неизвестными символами. Где-то вдалеке капает вода, а иногда слышится далёкий шёпот — то ли эхо, то ли что-то иное.',
  connections: ['city_outskirts', 'underground_passage'],
  enemySpawns: [
    { enemyType: 'skeleton', position: [-5, 0, -10], count: 3 },
    { enemyType: 'dark_mage', position: [0, 0, -25], count: 1 },
    { enemyType: 'skeleton', position: [8, 0, -15], count: 2 },
    { enemyType: 'boss_catacombs_keeper', position: [0, 0, -40], count: 1 },
  ],
  lootContainers: [
    {
      id: 'catacomb_chest_1',
      position: [-3, 0, -8],
      lootTable: ['healing_potion', 'catacomb_note_1', 'gold_small'],
    },
    {
      id: 'catacomb_chest_2',
      position: [5, 0, -18],
      lootTable: ['mana_potion', 'catacomb_note_2', 'rare_iron_ore'],
      locked: true,
    },
    {
      id: 'catacomb_chest_3',
      position: [-2, 0, -35],
      lootTable: ['shadow_amulet', 'catacomb_note_3', 'crystal_shard'],
      locked: true,
    },
  ],
  hazardZones: [
    {
      type: 'poison',
      position: [0, 0, -20],
      radius: 4,
      damagePerSecond: 3,
    },
    {
      type: 'fire',
      position: [0, 0, -38],
      radius: 6,
      damagePerSecond: 5,
    },
  ],
  ambientLight: 0.15,
  fogColor: '#1a0a2e',
  fogDensity: 0.04,
};
