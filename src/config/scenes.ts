// src/config/scenes.ts
import type { SceneId } from '@/data/types';
import type { PlayerPosition } from '@/data/rpgTypes';

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
   * Множитель визуального масштаба персонажей в 3D-исследовании для этой локации.
   * Итог: NPC `(npc.scale ?? 1) * explorationCharacterModelScale`, игрок — визуал × тот же коэффициент (коллайдер без изменений).
   */
  explorationCharacterModelScale?: number;
}

export const SCENE_CONFIG = {
  // НАЧАЛЬНАЯ СЦЕНА - Комната Заремы и Альберта
  // NPC используют GLTF модели из доступных
  kitchen_night: {
    id: 'kitchen_night', 
    name: 'Комната', 
    explorationCharacterModelScale: 0.92,
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
    id: 'kitchen_dawn', name: 'Кухня (рассвет)', size: [14, 14],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.6, color: '#ffddaa' },
    npcs: [],
    interactiveObjects: [{ id: 'kitchen_notebook', type: 'notebook', position: [-0.4, 0.97, -2], rotation: [0, 0.1, 0], size: [0.25, 0.01, 0.18], color: '#f5e6d3', canBeRead: true, itemId: 'note_draft' }],
  },
  
  home_morning: {
    id: 'home_morning', name: 'Дом (утро)', size: [14, 14],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.5, color: '#ffffff' }, npcs: [], interactiveObjects: [],
  },
  
  home_evening: {
    id: 'home_evening', name: 'Квартира, десятый этаж — снег за стеклом', explorationCharacterModelScale: 0.92, size: [14, 14],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.35, color: '#ffaa66' },
    npcs: [],
    interactiveObjects: [
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
    id: 'office_morning', name: 'Офис', explorationCharacterModelScale: 0.94, size: [16, 16],
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
    id: 'cafe_evening', name: 'Кафе "Синий Кот"', explorationCharacterModelScale: 0.93, size: [16, 16],
    spawnPoint: { x: 0, y: 1, z: 2, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.5, color: '#ffa500' },
    npcs: [
      { id: 'barista', name: 'Бариста', model: 'barista', modelPath: '/models/shibahu.glb', position: [0, 0, -3], rotation: [0, 0, 0], dialogueTree: 'barista_greeting' },
      { id: 'poet', name: 'Поэт', model: 'colleague', modelPath: '/models/witchapprentice.glb', position: [-3, 0, -5], rotation: [0, 0.5, 0], dialogueTree: 'poet_greeting' },
      { id: 'alisa', name: 'Алиса', model: 'shadow', modelPath: '/models/college_girl.glb', position: [-2, 0, 3], rotation: [0, 0.5, 0], dialogueTree: 'alisa_cafe' }
    ],
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
    id: 'street_night', name: 'Улица', explorationCharacterModelScale: 1.14, size: [26, 26],
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
    id: 'street_winter', name: 'Зимняя улица', explorationCharacterModelScale: 1.14, size: [26, 26],
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
    id: 'memorial_park', name: 'Мемориальный парк', explorationCharacterModelScale: 1.06, size: [22, 22],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.35, color: '#ffd9a0' },
    npcs: [],
    interactiveObjects: [{ id: 'park_poem', type: 'book', position: [0, 0.8, -9], poemId: 'poem_memorial_01', itemId: 'old_letter', canBeRead: true, size: [0.25, 0.03, 0.18], color: '#cd853f' }],
    backgroundMusic: '/audio/ambient-calm.mp3'
  },
  
  rooftop_night: {
    id: 'rooftop_night', name: 'Крыша', explorationCharacterModelScale: 1.02, size: [20, 20],
    spawnPoint: { x: 0, y: 0.5, z: -4, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.15, color: '#4a5568' },
    npcs: [],
    interactiveObjects: [{ id: 'rooftop_note', type: 'notebook', position: [0, 0.5, -2], poemId: 'poem_rooftop_01', itemId: 'therapist_note', canBeRead: true, size: [0.2, 0.01, 0.15], color: '#f5f5dc' }],
    backgroundMusic: '/audio/ambient-tense.mp3'
  },
  
  library: {
    id: 'library', name: 'Библиотека', explorationCharacterModelScale: 0.98, size: [30, 40],
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
    id: 'blue_pit', name: 'Синяя яма', size: [15, 15],
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
    id: 'zarema_albert_room', name: 'Комната Заремы и Альберта', explorationCharacterModelScale: 0.94, size: [10, 8],
    spawnPoint: { x: 0, y: 1, z: 0, rotation: 0 } as PlayerPosition,  // центр комнаты
    ambientLight: { intensity: 0.8, color: '#ffd93d' },  // усилен свет
    npcs: [
      { 
        id: 'zarema', 
        name: 'Зарема', 
        model: 'barista', 
        modelPath: '/models/smol_ame_in_an_upcycled_terrarium_hololiveen.glb',
        position: [-2, 0, 0], 
        dialogueTree: 'zarema_room',
        scale: 1.0
      },
      { 
        id: 'albert', 
        name: 'Альберт', 
        model: 'colleague', 
        modelPath: '/models/lillian__vgdc.glb',
        position: [2, 0, 0], 
        dialogueTree: 'albert_room',
        scale: 1.0
      }
    ],
    interactiveObjects: [{ id: 'room_book', type: 'book', position: [0, 0.9, -1], poemId: 'poem_zarema_01', itemId: 'gift_pen', canBeRead: true, size: [0.3, 0.04, 0.2], color: '#8b4513' }],
    backgroundMusic: '/audio/ambient-calm.mp3'
  },
  
  dream: {
    id: 'dream', name: 'Сон', explorationCharacterModelScale: 1.08, size: [20, 20],
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
    id: 'battle', name: 'Битва', explorationCharacterModelScale: 1.05, size: [20, 20],
    spawnPoint: { x: 0, y: 1, z: 0, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.25, color: '#ef4444' }, npcs: [], interactiveObjects: [],
  },
};

export const getSceneConfig = (sceneId: SceneId): SceneConfig => {
  return SCENE_CONFIG[sceneId] ?? SCENE_CONFIG.kitchen_night!;
};

/** Множитель визуала персонажей в 3D-исследовании для `sceneId` (1, если не задано в `SCENE_CONFIG`). */
export function getExplorationCharacterModelScale(sceneId: SceneId): number {
  const row = SCENE_CONFIG[sceneId as keyof typeof SCENE_CONFIG];
  return row?.explorationCharacterModelScale ?? 1;
}

export const getNPCsForScene = (sceneId: SceneId, _flags: Record<string, boolean> = {}): NPCConfig[] => {
  const config = getSceneConfig(sceneId);
  return config.npcs;
};

export const getInteractiveObjectsForScene = (sceneId: SceneId): InteractiveObjectConfig[] => {
  const config = getSceneConfig(sceneId);
  return config.interactiveObjects;
};
