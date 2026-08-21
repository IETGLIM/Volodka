/**
 * Локация: Лесная окраина
 * Природная зона на границе города — опушки, поляны, река
 */

import type { LocationDefinition } from './catacombs';

export const FOREST_OUTSKIRTS_LOCATION: LocationDefinition = {
  id: 'forest_outskirts',
  name: 'Лесная окраина',
  description: 'Край густого леса, где городские постройки уступают место древним деревьям. Тропинки петляют между дубами и берёзами, птицы поют, а в воздухе пахнет хвоей и сырой землёй. Здесь можно найти редкие травы, но beware — не все обитатели леса дружелюбны.',
  connections: ['city_center', 'forest_deep', 'river_bank', 'old_mill'],
  enemySpawns: [
    { enemyType: 'wolf', position: [15, 0, -20], count: 3 },
    { enemyType: 'wolf', position: [-10, 0, -30], count: 2 },
    { enemyType: 'bandit', position: [20, 0, -35], count: 2 },
    { enemyType: 'lizard', position: [5, 0, -45], count: 2 },
  ],
  lootContainers: [
    {
      id: 'forest_cache_1',
      position: [12, 0, -15],
      lootTable: ['healing_herb', 'night_vision_potion', 'gold_small'],
    },
    {
      id: 'abandoned_camp',
      position: [-8, 0, -28],
      lootTable: ['iron_sword', 'leather_armor', 'boris_shipment_crate'],
    },
    {
      id: 'riverside_chest',
      position: [25, 0, -50],
      lootTable: ['fishing_rod', 'dragon_scale', 'crystal_shard'],
      locked: true,
    },
  ],
  hazardZones: [
    {
      type: 'poison',
      position: [-15, 0, -40],
      radius: 3,
      damagePerSecond: 2,
    },
  ],
  ambientLight: 0.6,
  fogColor: '#c8e6c9',
  fogDensity: 0.01,
};
