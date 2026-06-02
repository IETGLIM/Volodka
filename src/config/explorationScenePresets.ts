import type { SceneId } from '@/data/types';

export type RpgGroundGeometryArgs = [number, number, number];

export interface ExplorationFollowCameraPreset {
  distance: number;
  height: number;
  smoothness: number;
  shoulderOffset: number;
  lookAtHeightOffset: number;
  collisionSpring: number;
  minDistance: number;
  maxDistance: number;
  collisionRayOriginY: number;
  collisionRadius: number;
  pitchMin?: number;
  pitchMax?: number;
}

interface ExplorationLightTuning {
  directionalPosition: [number, number, number];
  directionalIntensity: number;
  hemisphereIntensity: number;
  hemisphereGround: string;
}

export interface ExplorationScenePreset {
  ambient: number;
  light: string;
  fogColor: string;
  groundGeometryArgs: RpgGroundGeometryArgs;
}

const GROUND_INDOOR: RpgGroundGeometryArgs = [20, 0.1, 20];
const GROUND_VOLODKA_ROOM: RpgGroundGeometryArgs = [14, 0.1, 11.2];
const GROUND_VOLODKA_CORRIDOR: RpgGroundGeometryArgs = [3.5, 0.1, 13.2];
const GROUND_PLAZA: RpgGroundGeometryArgs = [48, 0.1, 48];
const GROUND_OPEN: RpgGroundGeometryArgs = [40, 0.1, 40];

const DEFAULT_SCENE_PRESET: ExplorationScenePreset = {
  ambient: 0.35,
  light: '#b2bec3',
  fogColor: '#1a1a2e',
  groundGeometryArgs: GROUND_INDOOR,
};

const SCENE_PRESETS: Partial<Record<SceneId, ExplorationScenePreset>> = {
  kitchen_night: { ambient: 0.46, light: '#fff0dc', fogColor: '#0c0806', groundGeometryArgs: GROUND_INDOOR },
  zarema_albert_room: { ambient: 0.46, light: '#fff0dc', fogColor: '#0c0806', groundGeometryArgs: GROUND_INDOOR },
  kitchen_dawn: { ambient: 0.4, light: '#ffcc00', fogColor: '#1a1a2e', groundGeometryArgs: GROUND_INDOOR },
  home_morning: { ambient: 0.4, light: '#ffcc00', fogColor: '#1a1a2e', groundGeometryArgs: GROUND_INDOOR },
  home_evening: { ambient: 0.4, light: '#ffcc00', fogColor: '#1a1a2e', groundGeometryArgs: GROUND_INDOOR },
  volodka_room: { ambient: 0.4, light: '#7fe8d4', fogColor: '#060d10', groundGeometryArgs: GROUND_VOLODKA_ROOM },
  volodka_corridor: { ambient: 0.34, light: '#e8dcc8', fogColor: '#16140f', groundGeometryArgs: GROUND_VOLODKA_CORRIDOR },
  office_morning: { ambient: 0.5, light: '#ffffff', fogColor: '#2a2a3a', groundGeometryArgs: GROUND_INDOOR },
  cafe_evening: { ambient: 0.35, light: '#ffa500', fogColor: '#1a1510', groundGeometryArgs: GROUND_INDOOR },
  rooftop_night: { ambient: 0.15, light: '#4a5568', fogColor: '#0a0a15', groundGeometryArgs: GROUND_OPEN },
  dream: { ambient: 0.3, light: '#a855f7', fogColor: '#1a0a2e', groundGeometryArgs: GROUND_OPEN },
  battle: { ambient: 0.28, light: '#f97373', fogColor: '#140306', groundGeometryArgs: GROUND_OPEN },
  street_winter: { ambient: 0.14, light: '#39ff9c', fogColor: '#020806', groundGeometryArgs: GROUND_PLAZA },
  street_night: { ambient: 0.14, light: '#39ff9c', fogColor: '#020806', groundGeometryArgs: GROUND_PLAZA },
  district: { ambient: 0.2, light: '#dbeafe', fogColor: '#060912', groundGeometryArgs: GROUND_PLAZA },
  mvd: { ambient: 0.2, light: '#dbeafe', fogColor: '#060912', groundGeometryArgs: GROUND_PLAZA },
  memorial_park: { ambient: 0.35, light: '#ffd9a0', fogColor: '#0a1510', groundGeometryArgs: GROUND_PLAZA },
};

const DEFAULT_FOLLOW_CAMERA_PRESET: ExplorationFollowCameraPreset = {
  distance: 4.75,
  height: 2.9,
  smoothness: 0.115,
  shoulderOffset: 0.24,
  lookAtHeightOffset: 1.28,
  collisionSpring: 11,
  minDistance: 2,
  maxDistance: 15,
  collisionRayOriginY: 1.5,
  collisionRadius: 0.3,
};

const FOLLOW_CAMERA_PRESETS: Partial<Record<SceneId, ExplorationFollowCameraPreset>> = {
  volodka_corridor: {
    distance: 1.82,
    height: 1.48,
    smoothness: 0.12,
    shoulderOffset: 0.05,
    lookAtHeightOffset: 0.98,
    collisionSpring: 12,
    minDistance: 1.05,
    maxDistance: 2.55,
    collisionRayOriginY: 1.05,
    collisionRadius: 0.2,
  },
  volodka_room: {
    distance: 2.38,
    height: 1.52,
    smoothness: 0.11,
    shoulderOffset: 0.1,
    lookAtHeightOffset: 1.22,
    collisionSpring: 12,
    minDistance: 1.52,
    maxDistance: 3.12,
    collisionRayOriginY: 1.42,
    collisionRadius: 0.2,
    pitchMin: -0.06,
    pitchMax: 0.38,
  },
  home_evening: {
    distance: 2.28,
    height: 1.78,
    smoothness: 0.11,
    shoulderOffset: 0.12,
    lookAtHeightOffset: 1.1,
    collisionSpring: 11,
    minDistance: 1.22,
    maxDistance: 3.05,
    collisionRayOriginY: 1.22,
    collisionRadius: 0.24,
  },
  zarema_albert_room: {
    distance: 2.62,
    height: 1.58,
    smoothness: 0.11,
    shoulderOffset: 0.1,
    lookAtHeightOffset: 1.32,
    collisionSpring: 11,
    minDistance: 1.48,
    maxDistance: 3.15,
    collisionRayOriginY: 1.48,
    collisionRadius: 0.22,
    pitchMin: -0.12,
    pitchMax: 0.34,
  },
  kitchen_night: {
    distance: 2.62,
    height: 1.58,
    smoothness: 0.11,
    shoulderOffset: 0.1,
    lookAtHeightOffset: 1.32,
    collisionSpring: 11,
    minDistance: 1.48,
    maxDistance: 3.15,
    collisionRayOriginY: 1.48,
    collisionRadius: 0.22,
    pitchMin: -0.12,
    pitchMax: 0.34,
  },
  blue_pit: {
    distance: 2.35,
    height: 1.55,
    smoothness: 0.12,
    shoulderOffset: 0.15,
    lookAtHeightOffset: 1.15,
    collisionSpring: 11,
    minDistance: 1.25,
    maxDistance: 3.25,
    collisionRayOriginY: 1.25,
    collisionRadius: 0.25,
    pitchMin: -0.1,
    pitchMax: 0.35,
  },
  battle: {
    distance: 4.35,
    height: 2.55,
    smoothness: 0.125,
    shoulderOffset: 0.22,
    lookAtHeightOffset: 1.22,
    collisionSpring: 12,
    minDistance: 2.1,
    maxDistance: 12,
    collisionRayOriginY: 1.45,
    collisionRadius: 0.28,
    pitchMin: -0.18,
    pitchMax: 0.42,
  },
};

const PANEL_DISTRICT_CAMERA_PRESET: ExplorationFollowCameraPreset = {
  distance: 5.25,
  height: 3.05,
  smoothness: 0.11,
  shoulderOffset: 0.26,
  lookAtHeightOffset: 1.3,
  collisionSpring: 10,
  minDistance: 2,
  maxDistance: 15,
  collisionRayOriginY: 1.5,
  collisionRadius: 0.3,
};

const LIGHT_TUNING_PRESETS: Partial<Record<SceneId, ExplorationLightTuning>> = {
  volodka_room: {
    directionalPosition: [3.2, 7.5, 1.8],
    directionalIntensity: 0.76,
    hemisphereIntensity: 0.92,
    hemisphereGround: '#080f14',
  },
  zarema_albert_room: {
    directionalPosition: [-3.4, 7.9, 4.1],
    directionalIntensity: 0.52,
    hemisphereIntensity: 1.08,
    hemisphereGround: '#1a100c',
  },
  kitchen_night: {
    directionalPosition: [-3.4, 7.9, 4.1],
    directionalIntensity: 0.52,
    hemisphereIntensity: 1.08,
    hemisphereGround: '#1a100c',
  },
  district: {
    directionalPosition: [8.5, 14.5, 6.2],
    directionalIntensity: 0.74,
    hemisphereIntensity: 0.56,
    hemisphereGround: '#0b1018',
  },
  mvd: {
    directionalPosition: [8.5, 14.5, 6.2],
    directionalIntensity: 0.74,
    hemisphereIntensity: 0.56,
    hemisphereGround: '#0b1018',
  },
};

export function getExplorationScenePreset(sceneId: SceneId): ExplorationScenePreset {
  return SCENE_PRESETS[sceneId] ?? DEFAULT_SCENE_PRESET;
}

export function getExplorationFollowCameraPreset(
  sceneId: SceneId,
  isPanelDistrict: boolean,
): ExplorationFollowCameraPreset {
  if (isPanelDistrict) return PANEL_DISTRICT_CAMERA_PRESET;
  return FOLLOW_CAMERA_PRESETS[sceneId] ?? DEFAULT_FOLLOW_CAMERA_PRESET;
}

export function getExplorationLightTuning(sceneId: SceneId): ExplorationLightTuning | null {
  return LIGHT_TUNING_PRESETS[sceneId] ?? null;
}

export function getNarrowIndoorFogConfig(sceneId: SceneId, introCutsceneActive: boolean) {
  if (sceneId === 'volodka_room') {
    if (introCutsceneActive) return { near: 4.2, far: 74 } as const;
    return { near: 1.92, far: 74 } as const;
  }
  if (sceneId === 'zarema_albert_room' || sceneId === 'kitchen_night') {
    if (introCutsceneActive) return { near: 3.9, far: 60 } as const;
    return { near: 2.15, far: 58 } as const;
  }
  if (introCutsceneActive) {
    return { near: 3.6, far: 56 } as const;
  }
  return { near: 2.65, far: 50 } as const;
}
