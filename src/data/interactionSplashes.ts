/* ─── Volodka RPG – Interaction Splash Catalog ───
   Brief 3D cinematic beats (0.8–2.5 s) before dialogue / examine / prop use.
   Wire via splashProfile on trigger zones, npcSplashProfile on NPC defs, or defaults by interactionType.

   Adding a splash for a new interaction:
   1. Pick or add a preset in SPLASH_PRESETS (waypoints are offsets from anchor).
   2. Map zone id / npc id / interactionType in SPLASH_CATALOG below.
   3. Optional: set splashProfile on TriggerZone or npcSplashProfile on NPCDefinition.
   4. Repeat visits skip automatically when an interacted_* / examined_* flag is already set.
*/

import type { CameraWaypointData } from '@/shared/types/camera';
import type { InteractionType } from '@/shared/types/game';

export type InteractionSplashKind =
  | 'npc_orbit'
  | 'prop_push_in'
  | 'examine_close_up'
  | 'door_hold'
  | 'read_focus';

export interface InteractionSplashPreset {
  id: string;
  kind: InteractionSplashKind;
  /** Total splash duration in milliseconds (0.8–2.5 s recommended) */
  durationMs: number;
  /** Camera path relative to anchor (NPC root or prop world position) */
  waypoints: CameraWaypointData[];
  letterboxStyle?: 'full' | 'thin' | 'none';
  /** Optional overlay title (NPC intros) */
  textOverlay?: string;
  subtitle?: string;
  textAccentColor?: string;
}

/** Shared prop / examine push-in — dolly toward object, brief hold */
export const SPLASH_PROP_PUSH_IN: InteractionSplashPreset = {
  id: 'prop_push_in',
  kind: 'prop_push_in',
  durationMs: 1400,
  letterboxStyle: 'thin',
  waypoints: [
    { position: [0.4, 1.6, 2.2], lookAt: [0, 0.75, 0], fov: 52, duration: 0 },
    {
      position: [0.15, 1.15, 1.25],
      lookAt: [0, 0.65, 0],
      fov: 44,
      duration: 0.85,
      controlPoint: [0.25, 1.35, 1.7],
    },
    {
      position: [0.05, 1.0, 0.95],
      lookAt: [0, 0.6, 0],
      fov: 38,
      duration: 0.55,
      controlPoint: [0.1, 1.05, 1.1],
    },
  ],
};

/** Examine close-up — tighter framing on readable surfaces */
export const SPLASH_EXAMINE_CLOSE_UP: InteractionSplashPreset = {
  id: 'examine_close_up',
  kind: 'examine_close_up',
  durationMs: 1200,
  letterboxStyle: 'thin',
  waypoints: [
    { position: [0, 1.5, 2.0], lookAt: [0, 0.8, 0], fov: 48, duration: 0 },
    {
      position: [0, 1.1, 1.15],
      lookAt: [0, 0.7, 0],
      fov: 40,
      duration: 0.75,
      controlPoint: [0, 1.25, 1.5],
    },
    {
      position: [0, 0.95, 0.9],
      lookAt: [0, 0.65, 0],
      fov: 36,
      duration: 0.45,
    },
  ],
};

/** NPC orbit — approach face from slight angle */
export const SPLASH_NPC_ORBIT: InteractionSplashPreset = {
  id: 'npc_orbit',
  kind: 'npc_orbit',
  durationMs: 1800,
  letterboxStyle: 'thin',
  waypoints: [
    { position: [1.8, 2.0, 3.8], lookAt: [0, 1.35, 0], fov: 52, duration: 0 },
    {
      position: [1.2, 1.65, 2.4],
      lookAt: [0, 1.4, 0],
      fov: 46,
      duration: 0.85,
      controlPoint: [1.5, 1.85, 3.0],
    },
    {
      position: [0.85, 1.45, 1.75],
      lookAt: [0, 1.45, 0],
      fov: 40,
      duration: 0.95,
      controlPoint: [1.0, 1.55, 2.05],
    },
  ],
};

export const SPLASH_PRESETS: Record<string, InteractionSplashPreset> = {
  prop_push_in: SPLASH_PROP_PUSH_IN,
  examine_close_up: SPLASH_EXAMINE_CLOSE_UP,
  npc_orbit: SPLASH_NPC_ORBIT,

  albert_cafe: {
    id: 'albert_cafe',
    kind: 'npc_orbit',
    durationMs: 1600,
    letterboxStyle: 'thin',
    textOverlay: 'Альберт',
    subtitle: 'Философ в углу',
    textAccentColor: '#f97316',
    waypoints: [
      { position: [2, 2.0, 4], lookAt: [0, 1.2, 0], fov: 52, duration: 0 },
      {
        position: [1.2, 1.6, 2.5],
        lookAt: [0, 1.3, 0],
        fov: 46,
        duration: 0.8,
        controlPoint: [1.6, 1.8, 3.2],
      },
      {
        position: [0.9, 1.4, 1.6],
        lookAt: [0, 1.4, 0],
        fov: 40,
        duration: 0.8,
        controlPoint: [1.0, 1.5, 2.0],
      },
    ],
  },

  zarema_kitchen: {
    id: 'zarema_kitchen',
    kind: 'npc_orbit',
    durationMs: 2000,
    letterboxStyle: 'thin',
    textOverlay: 'Зарема',
    subtitle: 'Тёплый свет кухни',
    textAccentColor: '#ec4899',
    waypoints: [
      { position: [-2.2, 2.6, 5], lookAt: [0, 1.2, 0], fov: 58, duration: 0 },
      {
        position: [-1.4, 2.0, 3.5],
        lookAt: [0, 1.35, 0],
        fov: 50,
        duration: 0.9,
        controlPoint: [-1.8, 2.3, 4.2],
      },
      {
        position: [0.6, 1.55, 1.9],
        lookAt: [0, 1.45, 0],
        fov: 40,
        duration: 1.1,
        controlPoint: [0, 1.6, 2.6],
      },
    ],
  },

  barista_counter: {
    id: 'barista_counter',
    kind: 'npc_orbit',
    durationMs: 1500,
    letterboxStyle: 'thin',
    textOverlay: 'Бариста',
    subtitle: '«Синяя яма»',
    textAccentColor: '#38bdf8',
    waypoints: [
      { position: [0, 2.2, 3.5], lookAt: [0, 1.25, 0], fov: 50, duration: 0 },
      {
        position: [0.9, 1.7, 2.2],
        lookAt: [0, 1.35, 0],
        fov: 44,
        duration: 0.75,
        controlPoint: [0.5, 1.95, 2.8],
      },
      {
        position: [0.7, 1.5, 1.65],
        lookAt: [0, 1.4, 0],
        fov: 38,
        duration: 0.75,
      },
    ],
  },

  server_fragment: {
    id: 'server_fragment',
    kind: 'prop_push_in',
    durationMs: 1600,
    letterboxStyle: 'thin',
    waypoints: [
      { position: [0.5, 1.7, 2.4], lookAt: [0, 0.55, 0], fov: 50, duration: 0 },
      {
        position: [0.2, 1.25, 1.35],
        lookAt: [0, 0.5, 0],
        fov: 42,
        duration: 0.9,
        controlPoint: [0.35, 1.45, 1.85],
      },
      {
        position: [0.05, 1.05, 1.0],
        lookAt: [0, 0.48, 0],
        fov: 36,
        duration: 0.7,
      },
    ],
  },

  encrypted_scroll: {
    id: 'encrypted_scroll',
    kind: 'read_focus',
    durationMs: 1300,
    letterboxStyle: 'thin',
    waypoints: [
      { position: [0.35, 1.45, 1.9], lookAt: [0, 0.72, 0], fov: 46, duration: 0 },
      {
        position: [0.12, 1.05, 1.05],
        lookAt: [0, 0.68, 0],
        fov: 38,
        duration: 0.8,
        controlPoint: [0.22, 1.2, 1.45],
      },
      {
        position: [0.02, 0.92, 0.82],
        lookAt: [0, 0.64, 0],
        fov: 34,
        duration: 0.5,
      },
    ],
  },

  digital_amulet: {
    id: 'digital_amulet',
    kind: 'prop_push_in',
    durationMs: 1500,
    letterboxStyle: 'thin',
    waypoints: [
      { position: [0.3, 1.55, 2.0], lookAt: [0, 0.85, 0], fov: 48, duration: 0 },
      {
        position: [0.1, 1.15, 1.1],
        lookAt: [0, 0.78, 0],
        fov: 40,
        duration: 0.85,
        controlPoint: [0.2, 1.3, 1.5],
      },
      {
        position: [0, 1.0, 0.88],
        lookAt: [0, 0.75, 0],
        fov: 35,
        duration: 0.65,
      },
    ],
  },
};

/** Default preset by interaction verb when no explicit catalog entry exists */
export const SPLASH_BY_INTERACTION_TYPE: Partial<Record<InteractionType, string>> = {
  examine: 'examine_close_up',
  read: 'encrypted_scroll',
  talk: 'npc_orbit',
  open: 'examine_close_up',
  take: 'prop_push_in',
  hack: 'prop_push_in',
  use: 'examine_close_up',
};

/** Per trigger-zone overrides (zones with propModelId and key story beats) */
export const ZONE_SPLASH_PROFILES: Record<string, string> = {
  room_desk: 'encrypted_scroll',
  office_server_room: 'server_fragment',
  factory_vault_neutral_fragment: 'digital_amulet',
  library_poetry_stash: 'encrypted_scroll',
  basement_server_rack: 'server_fragment',
};

/** Per-NPC splash templates */
export const NPC_SPLASH_PROFILES: Record<string, string> = {
  albert: 'albert_cafe',
  zarema: 'zarema_kitchen',
  cafe_barista: 'barista_counter',
};

export function getSplashPreset(profileId: string): InteractionSplashPreset | undefined {
  return SPLASH_PRESETS[profileId];
}
