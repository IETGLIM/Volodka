// src/config/scenes.ts
import type { SceneId } from '@/data/types';
import type { PlayerPosition } from '@/data/rpgTypes';

export interface NPCConfig {
  id: string;
  name: string;
  model: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  basePersonalSpace?: number;
  dialogueTree?: string;
  condition?: { flag: string; value: boolean };
  relationScore?: number;
}

export interface InteractiveObjectConfig {
  id: string;
  type: 'book' | 'chair' | 'notebook' | 'crate' | 'lamp' | 'generic';
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number, number];
  color?: string;
  poemId?: string;
  pages?: number;
  canBeRead?: boolean;
  hasWheels?: boolean;
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
}

export const SCENE_CONFIG: Partial<Record<SceneId, SceneConfig>> = {
  kitchen_night: {
    id: 'kitchen_night', name: 'Кухня', size: [14, 14],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.4, color: '#ffcc00' },
    directionalLights: [{ position: [5, 10, 5], intensity: 0.5 }],
    npcs: [{ id: 'maria_kitchen', name: 'Мария', model: 'barista', position: [-2, 0, 0], rotation: [0, 0.5, 0], dialogueTree: 'maria_kitchen' }],
    interactiveObjects: [{ id: 'kitchen_notebook', type: 'notebook', position: [-0.4, 0.97, -2], rotation: [0, 0.1, 0], size: [0.25, 0.01, 0.18], color: '#f5e6d3', canBeRead: true }],
    backgroundMusic: '/audio/ambient/room_tone.mp3'
  },
  kitchen_dawn: {
    id: 'kitchen_dawn', name: 'Кухня (рассвет)', size: [14, 14],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.6, color: '#ffddaa' },
    npcs: [],
    interactiveObjects: [{ id: 'kitchen_notebook', type: 'notebook', position: [-0.4, 0.97, -2], rotation: [0, 0.1, 0], size: [0.25, 0.01, 0.18], color: '#f5e6d3', canBeRead: true }],
  },
  home_morning: {
    id: 'home_morning', name: 'Дом (утро)', size: [14, 14],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.5, color: '#ffffff' }, npcs: [], interactiveObjects: [],
  },
  home_evening: {
    id: 'home_evening', name: 'Дом (вечер)', size: [14, 14],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.35, color: '#ffaa66' }, npcs: [], interactiveObjects: [],
  },
  office_morning: {
    id: 'office_morning', name: 'Офис', size: [16, 16],
    spawnPoint: { x: 0, y: 1, z: 2, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.5, color: '#ffffff' },
    directionalLights: [{ position: [5, 10, 5], intensity: 0.8 }],
    npcs: [{ id: 'kirill', name: 'Кирилл', model: 'colleague', position: [3, 0, 0.8], rotation: [0, Math.PI, 0], basePersonalSpace: 1.5, dialogueTree: 'kirill_office', condition: { flag: 'met_kirill', value: true } }],
    interactiveObjects: [{ id: 'office_poem', type: 'book', position: [-3, 0.8, 0.15], poemId: 'poem_office_01', canBeRead: true, size: [0.2, 0.03, 0.15], color: '#8b4513' }],
    backgroundMusic: '/audio/ambient/office_hum.mp3'
  },
  cafe_evening: {
    id: 'cafe_evening', name: 'Кафе "Синий Кот"', size: [16, 16],
    spawnPoint: { x: 0, y: 1, z: 2, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.35, color: '#ffa500' },
    npcs: [
      { id: 'barista', name: 'Бариста', model: 'barista', position: [0, 0, -3], rotation: [0, 0, 0], dialogueTree: 'barista_greeting' },
      { id: 'poet', name: 'Поэт', model: 'colleague', position: [-3, 0, -5], rotation: [0, 0.5, 0], dialogueTree: 'poet_greeting' },
      { id: 'alisa', name: 'Алиса', model: 'shadow', position: [-2, 0, 3], rotation: [0, 0.5, 0], dialogueTree: 'alisa_cafe' }
    ],
    interactiveObjects: [{ id: 'cafe_book', type: 'book', position: [0, 0.8, -3.5], poemId: 'poem_cafe_01', canBeRead: true, size: [0.22, 0.04, 0.16], color: '#a0522d' }],
    backgroundMusic: '/audio/ambient/cafe_ambient.mp3'
  },
  street_night: {
    id: 'street_night', name: 'Улица', size: [26, 26],
    spawnPoint: { x: 0, y: 1, z: 4, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.25, color: '#87ceeb' },
    npcs: [{ id: 'sergeich', name: 'Сергеич', model: 'elder', position: [-4, 0, 2], rotation: [0, 0.3, 0], basePersonalSpace: 1.5, dialogueTree: 'sergeich_street', condition: { flag: 'met_sergeich', value: true } }],
    interactiveObjects: [{ id: 'street_bottle', type: 'generic', position: [-6, 0.1, 1], size: [0.1, 0.2, 0.1], color: '#6b8e23' }],
    backgroundMusic: '/audio/ambient/night_city.mp3'
  },
  street_winter: {
    id: 'street_winter', name: 'Зимняя улица', size: [26, 26],
    spawnPoint: { x: 0, y: 1, z: 4, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.3, color: '#b0c4de' },
    npcs: [{ id: 'sergeich', name: 'Сергеич', model: 'elder', position: [-4, 0, 2], rotation: [0, 0.3, 0], dialogueTree: 'sergeich_street', condition: { flag: 'met_sergeich', value: true } }],
    interactiveObjects: [],
  },
  memorial_park: {
    id: 'memorial_park', name: 'Мемориальный парк', size: [22, 22],
    spawnPoint: { x: 0, y: 1, z: 3, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.35, color: '#ffd9a0' },
    npcs: [],
    interactiveObjects: [{ id: 'park_poem', type: 'book', position: [0, 0.8, -9], poemId: 'poem_memorial_01', canBeRead: true, size: [0.25, 0.03, 0.18], color: '#cd853f' }],
    backgroundMusic: '/audio/ambient/park_birds.mp3'
  },
  rooftop_night: {
    id: 'rooftop_night', name: 'Крыша', size: [20, 20],
    spawnPoint: { x: 0, y: 0.5, z: -4, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.15, color: '#4a5568' },
    npcs: [],
    interactiveObjects: [{ id: 'rooftop_note', type: 'notebook', position: [0, 0.5, -2], poemId: 'poem_rooftop_01', canBeRead: true, size: [0.2, 0.01, 0.15], color: '#f5f5dc' }],
    backgroundMusic: '/audio/ambient/wind_high.mp3'
  },
  library: {
    id: 'library', name: 'Библиотека', size: [30, 40],
    spawnPoint: { x: 0, y: 1, z: 5, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.4, color: '#ffd9a0' },
    npcs: [{ id: 'kirill', name: 'Кирилл', model: 'colleague', position: [4, 0, -2], dialogueTree: 'kirill_library', condition: { flag: 'kirill_in_library', value: true } }],
    interactiveObjects: [
      { id: 'library_poem_1', type: 'book', position: [2.5, 0.8, 3.2], poemId: 'poem_library_01', canBeRead: true, size: [0.3, 0.04, 0.2], color: '#8b4513' },
      { id: 'library_poem_2', type: 'book', position: [-3, 1.5, -1], poemId: 'poem_library_02', canBeRead: true, size: [0.25, 0.03, 0.18], color: '#2f4f4f' },
      { id: 'library_chair', type: 'chair', position: [6, 0, -3], hasWheels: true, size: [0.5, 0.5, 0.5], color: '#8b0000' }
    ],
    backgroundMusic: '/audio/ambient/library_ambient.mp3'
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
    npcs: [{ id: 'sergeich', name: 'Сергеич', model: 'elder', position: [5, 0, 2], dialogueTree: 'sergeich_district', condition: { flag: 'sergeich_district', value: true } }],
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
    id: 'zarema_albert_room', name: 'Комната Заремы и Альберта', size: [10, 8],
    spawnPoint: { x: 0, y: 1, z: 0, rotation: 0 } as PlayerPosition,  // центр комнаты
    ambientLight: { intensity: 0.6, color: '#ffd93d' },  // усилен свет
    npcs: [
      { id: 'zarema', name: 'Зарема', model: 'barista', position: [-2, 0, 0], dialogueTree: 'zarema_room' },
      { id: 'albert', name: 'Альберт', model: 'colleague', position: [2, 0, 0], dialogueTree: 'albert_room' }
    ],
    interactiveObjects: [{ id: 'room_book', type: 'book', position: [0, 0.9, -1], poemId: 'poem_zarema_01', canBeRead: true, size: [0.3, 0.04, 0.2], color: '#8b4513' }],
    backgroundMusic: '/audio/ambient/cozy_room.mp3'
  },
  dream: {
    id: 'dream', name: 'Сон', size: [20, 20],
    spawnPoint: { x: 0, y: 1, z: 0, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.3, color: '#a855f7' },
    npcs: [
      { id: 'lillian', name: 'Лилиан', model: 'barista', position: [0, 0, -4], dialogueTree: 'lillian_greeting' },
      { id: 'witch', name: 'Эмбер', model: 'shadow', position: [-3, 0, -2], dialogueTree: 'witch_greeting' },
      { id: 'galaxy', name: 'Астра', model: 'elder', position: [3, 0.5, -3], dialogueTree: 'galaxy_greeting' },
      { id: 'quester', name: 'Странник', model: 'colleague', position: [2, 0, 1], dialogueTree: 'quester_greeting' }
    ],
    interactiveObjects: [],
  },
  battle: {
    id: 'battle', name: 'Битва', size: [20, 20],
    spawnPoint: { x: 0, y: 1, z: 0, rotation: 0 } as PlayerPosition,
    ambientLight: { intensity: 0.25, color: '#ef4444' }, npcs: [], interactiveObjects: [],
  },
};

export const getSceneConfig = (sceneId: SceneId): SceneConfig => {
  return SCENE_CONFIG[sceneId] ?? SCENE_CONFIG.kitchen_night!;
};

export const getNPCsForScene = (sceneId: SceneId, flags: Record<string, boolean> = {}): NPCConfig[] => {
  const config = getSceneConfig(sceneId);
  return config.npcs.filter(npc => {
    if (!npc.condition) return true;
    const { flag, value } = npc.condition;
    return flags[flag] === value;
  });
};

export const getInteractiveObjectsForScene = (sceneId: SceneId): InteractiveObjectConfig[] => {
  const config = getSceneConfig(sceneId);
  return config.interactiveObjects;
};
