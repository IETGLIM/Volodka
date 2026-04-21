// src/config/scenes.ts
import type { SceneId } from '@/data/types';
import type { PlayerPosition } from '@/data/rpgTypes';
import { PLAYER_GLB_TARGET_VISUAL_METERS } from '@/lib/playerScaleConstants';

export interface NPCConfig {
  id: string;
  name: string;
  model: string;
  modelPath?: string;  // Путь к GLTF модели
  position: [number, number, number];
  rotation?: [number, number, number];
  basePersonalSpace?: number;
  dialogueTree?: string;
  condition?: { flag: string; value: boolean };
  relationScore?: number;
  scale?: number;
}

export interface InteractiveObjectConfig {
  id: string;
  type: 'book' | 'chair' | 'notebook' | 'crate' | 'lamp' | 'generic';
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number, number];
  color?: string;
  poemId?: string;
  itemId?: string;  // ID предмета для добавления в инвентарь
  pages?: number;
  canBeRead?: boolean;
  hasWheels?: boolean;
  /** Все перечисленные навыки должны быть ≥ min для «Взять» / «Использовать». */
  requiredSkills?: { skill: string; min: number }[];
}

export interface SceneConfig {
  id: SceneId;
  name: string;
  size: [number, number];
  spawnPoint: PlayerPosition;
  ambientLight: { intensity: number; color: string };
  directionalLights?: { position: [number, number, number]; intensity: number }[];
  npcs: NPCConfig[];
  interactiveObjects: InteractiveObjectConfig[];
  backgroundMusic?: string;
  /**
   * Множитель визуального масштаба **игрока** в 3D-исследовании для этой локации (если не задано — 1).
   * Для новых узких интерьеров см. `suggestInteriorCharacterModelScale(max(size))` по эталону `volodka_room`.
   */
  explorationCharacterModelScale?: number;
  /**
   * Отдельный множитель визуала NPC в обходе; если не задан — как у игрока (`explorationCharacterModelScale` / авто).
   */
  explorationNpcModelScale?: number;
  /**
   * Множитель скорости ходьбы/бега игрока и патруля NPC в 3D-исследовании (коллайдеры без изменений).
   * Если не задано — выводится из итогового масштаба персонажа (как пара 0.48 / 0.9 у `volodka_room`).
   */
  explorationLocomotionScale?: number;
  /**
   * Целевая высота визуала GLB **игрока** в метрах сцены (см. `PhysicsPlayer` / `GLBPlayerModel`).
   * По умолчанию `PLAYER_GLB_TARGET_VISUAL_METERS` (~1.38). В узких комнатах уменьшайте явно — иначе
   * `explorationCharacterModelScale` почти не меняет размер (доминирует `target / bboxHeight`).
   */
  explorationPlayerGltfTargetMeters?: number;
}

function inferredExplorationLocomotionFromCharacter(characterScale: number): number {
  return Math.min(1.05, Math.max(0.78, 0.72 + characterScale * 0.35));
}

/**
 * Подсказка масштаба персонажей для **новых** узких интерьеров: эталон `volodka_room` (max габарит пола ~14 м → ~0.48).
 * Подставьте в `SCENE_CONFIG.*.explorationCharacterModelScale` при заведении локации.
 */
export function suggestInteriorCharacterModelScale(maxFloorDimensionMeters: number): number {
  const d = Math.max(6, maxFloorDimensionMeters);
  return Math.min(0.82, Math.max(0.45, 0.52 * (14 / d)));
}

export const SCENE_CONFIG = {
  // НАЧАЛЬНАЯ СЦЕНА - Комната Заремы и Альберта
  // NPC используют GLTF модели из доступных
  kitchen_night: {
    id: 'kitchen_night', 
    name: 'Комната', 
    explorationCharacterModelScale: 0.92,
    explorationLocomotionScale: 0.9,
    size: [10, 8],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,  // Спавн у входа
    ambientLight: { intensity: 0.8, color: '#ffd93d' },
    directionalLights: [{ position: [5, 10, 5], intensity: 1.2 }],
    npcs: [
      // Зарема - стоит у окна
      { 
        id: 'zarema', 
        name: 'Зарема', 
        model: 'barista', 
        modelPath: '/models/college_girl.glb',
        position: [-3, 0, -2], 
        rotation: [0, 0.8, 0], 
        dialogueTree: 'zarema_room',
        scale: 0.8
      },
      // Альберт - сидит за столом
      { 
        id: 'albert', 
        name: 'Альберт', 
        model: 'colleague', 
        modelPath: '/models/lowpoly_anime_character_cyberstyle.glb',
        position: [2, 0, -1], 
        rotation: [0, -0.5, 0], 
        dialogueTree: 'albert_room',
        scale: 0.7
      }
    ],
    interactiveObjects: [
      { id: 'room_book', type: 'book', position: [0, 0.9, -2], poemId: 'poem_01', itemId: 'notebook', canBeRead: true, size: [0.3, 0.04, 0.2], color: '#8b4513' }
    ],
    backgroundMusic: '/audio/ambient-calm.mp3'
  },
  
  kitchen_dawn: {
    id: 'kitchen_dawn',
    name: 'Кухня (рассвет)',
    explorationLocomotionScale: 1,
    size: [14, 14],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.6, color: '#ffddaa' },
    npcs: [],
    interactiveObjects: [{ id: 'kitchen_notebook', type: 'notebook', position: [-0.4, 0.97, -2], rotation: [0, 0.1, 0], size: [0.25, 0.01, 0.18], color: '#f5e6d3', canBeRead: true, itemId: 'note_draft' }],
  },
  
  home_morning: {
    id: 'home_morning',
    name: 'Дом (утро)',
    explorationLocomotionScale: 1,
    size: [14, 14],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.5, color: '#ffffff' }, npcs: [], interactiveObjects: [],
  },

  /** Комната Володьки в панельной трёшке: удалёнка, два ноутбука, три монитора, мониторинг; дверь в коридор квартиры. */
  volodka_room: {
    id: 'volodka_room',
    name: 'Комната Володьки',
    explorationCharacterModelScale: 0.48,
    /** Ниже глобального 1.38: в узкой комнате иначе персонаж доминирует кадр при TPS. */
    explorationPlayerGltfTargetMeters: 0.96,
    explorationLocomotionScale: 0.9,
    size: [14, 10],
    spawnPoint: { x: 2.2, y: 0.06, z: 1.8, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.42, color: '#c8dff0' },
    directionalLights: [{ position: [4, 8, 2], intensity: 0.95 }],
    npcs: [],
    interactiveObjects: [
      {
        id: 'volodka_laptop_work',
        type: 'notebook',
        position: [2.95, 0.82, 0.35],
        rotation: [0, -0.35, 0],
        size: [0.34, 0.02, 0.22],
        color: '#2f3640',
        itemId: 'note_draft',
      },
      {
        id: 'volodka_laptop_personal',
        type: 'notebook',
        position: [3.15, 0.82, -0.25],
        rotation: [0, 0.2, 0],
        size: [0.32, 0.02, 0.2],
        color: '#1e272e',
      },
      {
        id: 'volodka_monitor_rack',
        type: 'generic',
        position: [3.5, 1.05, 0.05],
        size: [1.15, 0.55, 0.18],
        color: '#1a1f28',
      },
      {
        id: 'volodka_kibana_tail',
        type: 'generic',
        position: [3.35, 0.72, 0.55],
        size: [0.55, 0.04, 0.38],
        color: '#f4e6c2',
      },
      {
        id: 'volodka_zabbix_screen',
        type: 'generic',
        position: [3.72, 0.88, -0.45],
        size: [0.22, 0.28, 0.02],
        color: '#c0392b',
      },
      {
        id: 'volodka_grafana_board',
        type: 'generic',
        position: [3.72, 0.88, 0.55],
        size: [0.22, 0.28, 0.02],
        color: '#2980b9',
      },
      {
        id: 'volodka_desk_main',
        type: 'generic',
        position: [3.2, 0.45, 0.1],
        size: [1.4, 0.06, 0.75],
        color: '#3d2817',
      },
      {
        id: 'volodka_desk_side',
        type: 'generic',
        position: [0.8, 0.45, -2.8],
        size: [1.0, 0.06, 0.55],
        color: '#4a3728',
      },
      {
        id: 'volodka_wardrobe_right',
        type: 'crate',
        position: [5.2, 0.95, 0.2],
        size: [0.55, 1.75, 0.65],
        color: '#2d2419',
      },
      {
        id: 'volodka_wardrobe_left',
        type: 'crate',
        position: [5.2, 0.95, -1.4],
        size: [0.55, 1.75, 0.65],
        color: '#352a1f',
      },
      {
        id: 'volodka_sofa',
        type: 'chair',
        position: [-3.8, 0.42, 1.2],
        size: [1.85, 0.55, 0.85],
        color: '#4a5568',
      },
      {
        id: 'volodka_window',
        type: 'generic',
        position: [-5.85, 1.05, 0.4],
        size: [0.15, 1.1, 2.4],
        color: '#1e3a5f',
      },
      {
        id: 'volodka_door_corridor',
        type: 'generic',
        position: [0.05, 0.55, 4.35],
        rotation: [0, 0, 0],
        size: [1.05, 1.9, 0.12],
        color: '#5c4a3a',
      },
    ],
    backgroundMusic: '/audio/ambient-calm.mp3',
  },

  /** Узкий коридор трёшки: между комнатой Володьки и общей зоной; впереди — кухня/гостиная, сбоку — проёмы под санузел/кухню и спальни (пока без отдельных сцен). */
  volodka_corridor: {
    id: 'volodka_corridor',
    name: 'Коридор',
    /** Чуть крупнее узкой комнаты: 0.48 давало «пропавшего» персонажа на некоторых клиентах (кэш GLB / масштаб). */
    explorationCharacterModelScale: 0.58,
    explorationLocomotionScale: 0.86,
    size: [3.5, 12],
    spawnPoint: { x: 0, y: 0.06, z: -3.92, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.32, color: '#e8dcc8' },
    directionalLights: [{ position: [0, 6, 2], intensity: 0.55 }],
    npcs: [],
    interactiveObjects: [
      {
        id: 'corridor_door_volodka_room',
        type: 'generic',
        position: [0, 0.55, -5.58],
        size: [1.0, 1.9, 0.1],
        color: '#5c4a3a',
      },
      {
        id: 'corridor_door_home_common',
        type: 'generic',
        position: [0, 0.55, 5.58],
        size: [1.0, 1.9, 0.1],
        color: '#4a3f35',
      },
      {
        id: 'corridor_shoe_shelf',
        type: 'generic',
        position: [-1.15, 0.32, -4.05],
        size: [0.62, 0.52, 0.26],
        color: '#3d3428',
      },
      {
        id: 'corridor_radiator',
        type: 'generic',
        position: [1.22, 0.38, -0.8],
        size: [0.1, 0.48, 2.35],
        color: '#aeb2b8',
      },
      {
        id: 'corridor_ceiling_lamp',
        type: 'generic',
        position: [0, 2.38, 0.4],
        size: [0.32, 0.07, 0.85],
        color: '#dcd6cf',
      },
      {
        id: 'corridor_door_wing_left',
        type: 'generic',
        position: [-1.58, 0.55, 3.65],
        rotation: [0, Math.PI / 2, 0],
        size: [0.1, 1.85, 0.92],
        color: '#4a4036',
      },
      {
        id: 'corridor_door_wing_right',
        type: 'generic',
        position: [1.58, 0.55, 3.65],
        rotation: [0, -Math.PI / 2, 0],
        size: [0.1, 1.85, 0.92],
        color: '#4a4036',
      },
    ],
    backgroundMusic: '/audio/ambient-calm.mp3',
  },
  
  home_evening: {
    id: 'home_evening', name: 'Квартира Володьки — кухня и общие комнаты', explorationCharacterModelScale: 0.52, explorationLocomotionScale: 0.9, size: [14, 14],
    spawnPoint: { x: 0, y: 0.06, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.35, color: '#ffaa66' },
    npcs: [],
    interactiveObjects: [
      {
        id: 'home_door_volodka_room',
        type: 'generic',
        position: [5.65, 0.55, 4.1],
        size: [0.95, 1.85, 0.12],
        color: '#4a3f35',
      },
      {
        id: 'home_radio',
        type: 'generic',
        position: [-4.2, 0.55, -2.8],
        size: [0.55, 0.35, 0.22],
        color: '#4a4a5a',
      },
      {
        id: 'home_book_bedside',
        type: 'book',
        position: [-3.4, 0.42, -4.2],
        size: [0.28, 0.06, 0.2],
        color: '#5c3317',
        poemId: 'poem_1',
        canBeRead: true,
      },
      {
        id: 'home_water_pitcher',
        type: 'generic',
        position: [2.8, 0.52, 0.6],
        size: [0.22, 0.38, 0.22],
        color: '#9ec5e8',
      },
      {
        id: 'home_notebook_desk',
        type: 'notebook',
        position: [-2.2, 0.88, 2.4],
        rotation: [0, 0.35, 0],
        size: [0.32, 0.04, 0.24],
        color: '#2f3542',
        itemId: 'note_draft',
      },
      {
        id: 'home_tea_mug',
        type: 'generic',
        position: [0.4, 0.48, 1.9],
        size: [0.14, 0.12, 0.14],
        color: '#c4a574',
        itemId: 'tea',
      },
      {
        id: 'home_chocolate_box',
        type: 'generic',
        position: [0.85, 0.46, 1.75],
        size: [0.2, 0.08, 0.14],
        color: '#3d2314',
        itemId: 'chocolate',
      },
      {
        id: 'home_window_corner',
        type: 'generic',
        position: [-5.8, 1.05, 1.2],
        size: [0.35, 0.5, 0.2],
        color: '#1e3a5f',
      },
      {
        id: 'home_fridge',
        type: 'crate',
        position: [4.6, 0.95, -2.4],
        size: [0.85, 1.65, 0.75],
        color: '#dfe6e9',
      },
      {
        id: 'home_phone_coffee_table',
        type: 'generic',
        position: [1.1, 0.52, 1.35],
        size: [0.12, 0.03, 0.2],
        color: '#2d3436',
      },
      {
        id: 'home_potted_plant',
        type: 'lamp',
        position: [3.6, 0.65, -3.8],
        size: [0.35, 0.55, 0.35],
        color: '#2d6a4f',
      },
    ],
  },
  
  office_morning: {
    id: 'office_morning', name: 'Офис', explorationCharacterModelScale: 0.94, explorationLocomotionScale: 0.92, size: [16, 16],
    spawnPoint: { x: 0, y: 1, z: 2, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.5, color: '#ffffff' },
    directionalLights: [{ position: [5, 10, 5], intensity: 0.8 }],
    npcs: [
      { 
        id: 'kirill', 
        name: 'Кирилл', 
        model: 'colleague', 
        modelPath: '/models/lowpoly_anime_character_cyberstyle.glb',
        position: [3, 0, 0.8], 
        rotation: [0, Math.PI, 0], 
        basePersonalSpace: 1.5, 
        dialogueTree: 'kirill_office'
        // Без условия - доступен сразу
      }
    ],
    interactiveObjects: [{ id: 'office_poem', type: 'book', position: [-3, 0.8, 0.15], poemId: 'poem_office_01', itemId: 'cafe_invite', canBeRead: true, size: [0.2, 0.03, 0.15], color: '#8b4513' }],
    backgroundMusic: '/audio/ambient-tense.mp3'
  },
  
  cafe_evening: {
    id: 'cafe_evening',
    name: 'Бар «Синяя яма»',
    explorationCharacterModelScale: 0.93,
    explorationLocomotionScale: 0.91,
    size: [16, 16],
    spawnPoint: { x: 0, y: 1, z: 2, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.5, color: '#ffa500' },
    npcs: [],
    interactiveObjects: [
      { id: 'cafe_book', type: 'book', position: [0, 0.8, -3.5], poemId: 'poem_cafe_01', itemId: 'poem_fragment_1', canBeRead: true, size: [0.22, 0.04, 0.16], color: '#a0522d' },
      {
        id: 'cafe_jack_portable',
        type: 'notebook',
        position: [4.1, 0.72, -1.8],
        rotation: [0, -0.45, 0],
        size: [0.32, 0.05, 0.24],
        color: '#1e272e',
        itemId: 'lucky_coin',
        requiredSkills: [{ skill: 'coding', min: 22 }],
      },
    ],
    backgroundMusic: '/audio/ambient-calm.mp3'
  },
  
  street_night: {
    id: 'street_night', name: 'Улица', explorationCharacterModelScale: 1.14, explorationLocomotionScale: 1.08, size: [26, 26],
    spawnPoint: { x: 0, y: 1, z: 4, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.25, color: '#87ceeb' },
    npcs: [
      { 
        id: 'sergeich', 
        name: 'Сергеич', 
        model: 'elder', 
        modelPath: '/models/on_a_quest.glb',
        position: [-4, 0, 2], 
        rotation: [0, 0.3, 0], 
        basePersonalSpace: 1.5, 
        dialogueTree: 'sergeich_street'
        // Без условия - доступен сразу
      }
    ],
    interactiveObjects: [{ id: 'street_bottle', type: 'generic', position: [-6, 0.1, 1], size: [0.1, 0.2, 0.1], color: '#6b8e23', itemId: 'lucky_coin' }],
    backgroundMusic: '/audio/ambient-tense.mp3'
  },
  
  street_winter: {
    id: 'street_winter', name: 'Зимняя улица', explorationCharacterModelScale: 1.14, explorationLocomotionScale: 1.08, size: [26, 26],
    spawnPoint: { x: 0, y: 1, z: 4, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.3, color: '#b0c4de' },
    npcs: [
      { 
        id: 'sergeich', 
        name: 'Сергеич', 
        model: 'elder', 
        modelPath: '/models/on_a_quest.glb',
        position: [-4, 0, 2], 
        rotation: [0, 0.3, 0], 
        dialogueTree: 'sergeich_street'
      }
    ],
    interactiveObjects: [],
  },
  
  memorial_park: {
    id: 'memorial_park', name: 'Мемориальный парк', explorationCharacterModelScale: 1.06, explorationLocomotionScale: 1.02, size: [22, 22],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.35, color: '#ffd9a0' },
    npcs: [],
    interactiveObjects: [{ id: 'park_poem', type: 'book', position: [0, 0.8, -9], poemId: 'poem_memorial_01', itemId: 'old_letter', canBeRead: true, size: [0.25, 0.03, 0.18], color: '#cd853f' }],
    backgroundMusic: '/audio/ambient-calm.mp3'
  },
  
  rooftop_night: {
    id: 'rooftop_night', name: 'Крыша', explorationCharacterModelScale: 1.02, explorationLocomotionScale: 0.98, size: [20, 20],
    spawnPoint: { x: 0, y: 0.5, z: -4, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.15, color: '#4a5568' },
    npcs: [],
    interactiveObjects: [{ id: 'rooftop_note', type: 'notebook', position: [0, 0.5, -2], poemId: 'poem_rooftop_01', itemId: 'therapist_note', canBeRead: true, size: [0.2, 0.01, 0.15], color: '#f5f5dc' }],
    backgroundMusic: '/audio/ambient-tense.mp3'
  },
  
  library: {
    id: 'library', name: 'Библиотека', explorationCharacterModelScale: 0.98, explorationLocomotionScale: 0.95, size: [30, 40],
    spawnPoint: { x: 0, y: 1, z: 5, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.4, color: '#ffd9a0' },
    npcs: [
      { 
        id: 'kirill', 
        name: 'Кирилл', 
        model: 'colleague', 
        modelPath: '/models/lowpoly_anime_character_cyberstyle.glb',
        position: [4, 0, -2], 
        dialogueTree: 'kirill_library'
      }
    ],
    interactiveObjects: [
      { id: 'library_poem_1', type: 'book', position: [2.5, 0.8, 3.2], poemId: 'poem_library_01', itemId: 'gift_book', canBeRead: true, size: [0.3, 0.04, 0.2], color: '#8b4513' },
      { id: 'library_poem_2', type: 'book', position: [-3, 1.5, -1], poemId: 'poem_library_02', itemId: 'old_photograph', canBeRead: true, size: [0.25, 0.03, 0.18], color: '#2f4f4f' },
      { id: 'library_chair', type: 'chair', position: [6, 0, -3], hasWheels: true, size: [0.5, 0.5, 0.5], color: '#8b0000' }
    ],
    backgroundMusic: '/audio/ambient-calm.mp3'
  },
  
  blue_pit: {
    id: 'blue_pit',
    name: '«Синяя яма» (служебная сцена)',
    size: [15, 15],
    spawnPoint: { x: 0, y: 0.5, z: 0, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.3, color: '#0066ff' }, npcs: [], interactiveObjects: [],
  },
  
  green_zone: {
    id: 'green_zone', name: 'Зелёнка', size: [18, 18],
    spawnPoint: { x: 0, y: 0.2, z: 0, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.4, color: '#00ff66' }, npcs: [], interactiveObjects: [],
  },
  
  district: {
    id: 'district', name: 'Район', size: [20, 20],
    spawnPoint: { x: 0, y: 1, z: 4, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.35, color: '#ffa500' },
    npcs: [
      { 
        id: 'sergeich', 
        name: 'Сергеич', 
        model: 'elder', 
        modelPath: '/models/on_a_quest.glb',
        position: [5, 0, 2], 
        dialogueTree: 'sergeich_district'
      }
    ],
    interactiveObjects: [],
  },
  
  mvd: {
    id: 'mvd', name: 'Отделение МВД', size: [12, 10],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.45, color: '#4a90d9' }, npcs: [], interactiveObjects: [],
  },
  
  president_hotel: {
    id: 'president_hotel', name: 'Президент Отель', size: [14, 10],
    spawnPoint: { x: 0, y: 1, z: 5, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.5, color: '#ffd700' }, npcs: [], interactiveObjects: [],
  },
  
  zarema_albert_room: {
    id: 'zarema_albert_room',
    name: 'Комната Заремы и Альберта',
    /**
     * Игрок чуть меньше NPC — меньше «ботинок в кадре» при узкой орбите; NPC остаются читабельными.
     * См. пресет камеры `zarema_albert_room` в `RPGGameCanvas`.
     */
    explorationCharacterModelScale: 0.38,
    explorationNpcModelScale: 0.52,
    explorationLocomotionScale: 0.86,
    /** Явная привязка к сцене: без этого `visualModelScale` слабо влияет на итоговый uniform GLB. */
    explorationPlayerGltfTargetMeters: 0.78,
    size: [10, 8],
    spawnPoint: { x: 0, y: 1, z: 0, rotation: 0 } as PlayerPosition,  // центр комнаты
    ambientLight: { intensity: 0.8, color: '#ffd93d' },  // усилен свет
    /** В 3D-обходе используются `zarema_home` / `albert_home` из `npcDefinitions`; здесь — справочные слоты под VN/квесты. */
    npcs: [
      {
        id: 'zarema',
        name: 'Зарема',
        model: 'barista',
        modelPath: '/models/smol_ame_in_an_upcycled_terrarium_hololiveen.glb',
        position: [-1.55, 0, 0.65],
        dialogueTree: 'zarema_room',
        scale: 1.0,
      },
      {
        id: 'albert',
        name: 'Альберт',
        model: 'colleague',
        modelPath: '/models/lowpoly_anime_character_cyberstyle.glb',
        position: [2.05, 0, -0.35],
        dialogueTree: 'albert_room',
        scale: 1.0,
      },
    ],
    interactiveObjects: [{ id: 'room_book', type: 'book', position: [0, 0.9, -1], poemId: 'poem_zarema_01', itemId: 'gift_pen', canBeRead: true, size: [0.3, 0.04, 0.2], color: '#8b4513' }],
    backgroundMusic: '/audio/ambient-calm.mp3'
  },
  
  dream: {
    id: 'dream', name: 'Сон', explorationCharacterModelScale: 1.08, explorationLocomotionScale: 1.04, size: [20, 20],
    spawnPoint: { x: 0, y: 1, z: 0, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.4, color: '#a855f7' },
    npcs: [
      { id: 'lillian', name: 'Лилиан', model: 'barista', modelPath: '/models/lillian__vgdc.glb', position: [0, 0, -4], dialogueTree: 'lillian_greeting' },
      { id: 'witch', name: 'Эмбер', model: 'shadow', modelPath: '/models/witchapprentice.glb', position: [-3, 0, -2], dialogueTree: 'witch_greeting' },
      { id: 'galaxy', name: 'Астра', model: 'elder', modelPath: '/models/miss_galaxy.glb', position: [3, 0.5, -3], dialogueTree: 'galaxy_greeting' },
      { id: 'quester', name: 'Странник', model: 'colleague', modelPath: '/models/on_a_quest.glb', position: [2, 0, 1], dialogueTree: 'quester_greeting' }
    ],
    interactiveObjects: [],
  },
  
  battle: {
    id: 'battle', name: 'Битва', explorationCharacterModelScale: 1.05, explorationLocomotionScale: 1.02, size: [20, 20],
    spawnPoint: { x: 0, y: 1, z: 0, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.25, color: '#ef4444' }, npcs: [], interactiveObjects: [],
  },
};

/**
 * Для 3D-исследования: только сцены из `SCENE_CONFIG`. Иначе — комната Володьки в панели
 * (битые/старые сохранения не должны вести в «пустой» или чужой конфиг).
 */
export function sanitizeExplorationSceneId(raw: unknown): SceneId {
  if (typeof raw === 'string' && raw in SCENE_CONFIG) {
    return raw as SceneId;
  }
  return 'volodka_room';
}

export const getSceneConfig = (sceneId: SceneId): SceneConfig => {
  return SCENE_CONFIG[sceneId] ?? SCENE_CONFIG.kitchen_night!;
};

/** Множитель визуала игрока в 3D-исследовании для `sceneId` (1, если не задано в `SCENE_CONFIG`). */
export function getExplorationCharacterModelScale(sceneId: SceneId): number {
  const entry = SCENE_CONFIG[sceneId];
  if (!entry) return 1;
  return entry.explorationCharacterModelScale ?? 1;
}

/**
 * Множитель визуала NPC в обходе: по умолчанию совпадает с игроком; можно задать `explorationNpcModelScale` только для NPC.
 */
export function getExplorationNpcModelScale(sceneId: SceneId): number {
  const entry = SCENE_CONFIG[sceneId];
  if (!entry) return 1;
  return entry.explorationNpcModelScale ?? getExplorationCharacterModelScale(sceneId);
}

/** Множитель скорости в 3D-исследовании для `sceneId` (из масштаба персонажа, если не задано явно). */
export function getExplorationLocomotionScale(sceneId: SceneId): number {
  const entry = SCENE_CONFIG[sceneId];
  if (!entry) return 1;
  if (entry.explorationLocomotionScale != null) return entry.explorationLocomotionScale;
  return inferredExplorationLocomotionFromCharacter(getExplorationCharacterModelScale(sceneId));
}

/** Целевая высота GLB игрока в метрах сцены для `sceneId` (см. `explorationPlayerGltfTargetMeters` в `SCENE_CONFIG`). */
export function getExplorationPlayerGltfTargetMeters(sceneId: SceneId): number {
  const entry = SCENE_CONFIG[sceneId];
  return entry?.explorationPlayerGltfTargetMeters ?? PLAYER_GLB_TARGET_VISUAL_METERS;
}

export const getInteractiveObjectsForScene = (sceneId: SceneId): InteractiveObjectConfig[] => {
  const config = getSceneConfig(sceneId);
  return config.interactiveObjects;
};
