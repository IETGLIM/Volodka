/* ─── Volodka RPG – NPC Interaction Cutscenes ───
   Cinematic camera sequences triggered when interacting with NPCs.
   Each cutscene creates a dramatic reveal before dialogue starts.
*/

import type { CameraWaypointData } from '@/shared/types/game';

/* ─── NPC Cutscene definition ─── */
export interface NPCCutsceneDef {
  id: string;
  /** NPC ID this cutscene is associated with */
  npcId: string;
  /** Camera waypoints using the existing CameraWaypointData format */
  waypoints: CameraWaypointData[];
  /** Total duration of the cutscene in seconds */
  durationSeconds: number;
  /** Optional text overlay during cutscene */
  textOverlay?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Text duration in ms */
  textDurationMs?: number;
  /** Color tint for text */
  textAccentColor?: string;
  /** Minimum relation level to trigger (0-100, optional) */
  minRelation?: number;
  /** Maximum relation level to trigger (0-100, optional) */
  maxRelation?: number;
}

/* ══════════════════════════════════════════════════════════════
   DEFAULT NPC CUTSCENE TEMPLATES
   These are reused for NPCs without specific cutscenes
   ══════════════════════════════════════════════════════════════ */

/** Default friendly NPC cutscene - warm, welcoming approach */
export const DEFAULT_FRIENDLY_CUTSCENE: NPCCutsceneDef = {
  id: 'default_friendly',
  npcId: '__default_friendly__',
  durationSeconds: 1.8,
  textOverlay: undefined, // No text for default
  waypoints: [
    {
      position: [0, 2.5, 4],
      lookAt: [0, 1.2, 0],
      fov: 50,
      duration: 0,
    },
    {
      position: [1.5, 1.8, 2.5],
      lookAt: [0, 1.3, 0],
      fov: 45,
      duration: 0.8,
      controlPoint: [0.8, 2.2, 3.2],
    },
    {
      position: [1.2, 1.5, 1.8],
      lookAt: [0, 1.4, 0],
      fov: 40,
      duration: 1.0,
      controlPoint: [1.3, 1.6, 2.1],
    },
  ],
};

/** Default neutral NPC cutscene - standard approach */
export const DEFAULT_NEUTRAL_CUTSCENE: NPCCutsceneDef = {
  id: 'default_neutral',
  npcId: '__default_neutral__',
  durationSeconds: 1.5,
  waypoints: [
    {
      position: [0, 2.2, 3.5],
      lookAt: [0, 1.2, 0],
      fov: 55,
      duration: 0,
    },
    {
      position: [1.3, 1.6, 2.2],
      lookAt: [0, 1.3, 0],
      fov: 48,
      duration: 0.7,
      controlPoint: [0.6, 1.9, 2.8],
    },
    {
      position: [1.0, 1.4, 1.6],
      lookAt: [0, 1.4, 0],
      fov: 42,
      duration: 0.8,
      controlPoint: [1.1, 1.5, 1.9],
    },
  ],
};

/** Default hostile NPC cutscene - tense, dramatic approach */
export const DEFAULT_HOSTILE_CUTSCENE: NPCCutsceneDef = {
  id: 'default_hostile',
  npcId: '__default_hostile__',
  durationSeconds: 2.0,
  textOverlay: undefined,
  waypoints: [
    {
      position: [-2, 2.0, 4],
      lookAt: [0, 1.2, 0],
      fov: 60,
      duration: 0,
    },
    {
      position: [-1.5, 1.8, 3],
      lookAt: [0, 1.3, 0],
      fov: 55,
      duration: 0.6,
      controlPoint: [-1.8, 1.9, 3.5],
    },
    {
      position: [-0.8, 1.5, 2],
      lookAt: [0, 1.4, 0],
      fov: 45,
      duration: 0.8,
      controlPoint: [-1.1, 1.6, 2.5],
    },
    {
      position: [0.8, 1.4, 1.5],
      lookAt: [0, 1.5, 0],
      fov: 38,
      duration: 0.6,
      controlPoint: [0, 1.4, 1.7],
    },
  ],
};

/* ══════════════════════════════════════════════════════════════
   NPC-SPECIFIC CUTSCENES
   Custom cinematic introductions for key characters
   ══════════════════════════════════════════════════════════════ */

export const NPC_CUTSCENES: Record<string, NPCCutsceneDef> = {
  /* ── Maria: Mysterious poet, ethereal approach ── */
  maria_intro: {
    id: 'maria_intro',
    npcId: 'maria',
    durationSeconds: 2.2,
    textOverlay: 'Мария...',
    subtitle: 'Хранительница стихов',
    textDurationMs: 2000,
    textAccentColor: '#c084fc', // purple
    waypoints: [
      {
        position: [-1.5, 2.8, 5],
        lookAt: [0, 1.2, 0],
        fov: 55,
        duration: 0,
      },
      {
        position: [-0.8, 2.2, 3.5],
        lookAt: [0, 1.4, 0],
        fov: 50,
        duration: 1.0,
        controlPoint: [-1.1, 2.5, 4.2],
      },
      {
        position: [0.6, 1.6, 2],
        lookAt: [0, 1.5, 0],
        fov: 42,
        duration: 1.2,
        controlPoint: [-0.1, 1.9, 2.7],
      },
    ],
  },

  /* ── Albert: Gruff but kind, straightforward approach ── */
  albert_intro: {
    id: 'albert_intro',
    npcId: 'albert',
    durationSeconds: 1.6,
    textOverlay: 'Альберт',
    subtitle: 'Инженер-ветеран',
    textDurationMs: 1500,
    textAccentColor: '#f97316', // orange
    waypoints: [
      {
        position: [2, 2.0, 4],
        lookAt: [0, 1.2, 0],
        fov: 52,
        duration: 0,
      },
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

  /* ── Zarema: Elegant, dangerous, dramatic approach ── */
  zarema_intro: {
    id: 'zarema_intro',
    npcId: 'zarema',
    durationSeconds: 2.5,
    textOverlay: 'Зарема',
    subtitle: 'Тень в светлом плаще',
    textDurationMs: 2500,
    textAccentColor: '#ec4899', // pink
    waypoints: [
      {
        position: [-2.5, 3.0, 6],
        lookAt: [0, 1.2, 0],
        fov: 60,
        duration: 0,
      },
      {
        position: [-1.8, 2.4, 4],
        lookAt: [0, 1.3, 0],
        fov: 55,
        duration: 1.0,
        controlPoint: [-2.1, 2.7, 5],
      },
      {
        position: [-0.5, 1.8, 2.5],
        lookAt: [0, 1.4, 0],
        fov: 48,
        duration: 0.8,
        controlPoint: [-1.1, 2.1, 3.2],
      },
      {
        position: [0.7, 1.5, 1.8],
        lookAt: [0, 1.5, 0],
        fov: 38,
        duration: 0.7,
        controlPoint: [0.1, 1.6, 2.1],
      },
    ],
  },


};

/* ══════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ══════════════════════════════════════════════════════════════ */

/** Get cutscene for a specific NPC, or default based on relation level */
export function getNPCCutscene(npcId: string, relationLevel?: number): NPCCutsceneDef {
  // Check for NPC-specific cutscene
  const specificCutscene = Object.values(NPC_CUTSCENES).find(
    (c) => c.npcId === npcId
  );
  
  if (specificCutscene) {
    // Check relation constraints if specified
    if (specificCutscene.minRelation !== undefined && relationLevel !== undefined) {
      if (relationLevel < specificCutscene.minRelation) {
        // Relation too low, use default
        return getDefaultCutscene(relationLevel);
      }
    }
    if (specificCutscene.maxRelation !== undefined && relationLevel !== undefined) {
      if (relationLevel > specificCutscene.maxRelation) {
        // Relation too high, use default
        return getDefaultCutscene(relationLevel);
      }
    }
    return specificCutscene;
  }
  
  // No specific cutscene, use default based on relation
  return getDefaultCutscene(relationLevel ?? 50);
}

/** Get default cutscene based on relation level */
function getDefaultCutscene(relationLevel: number): NPCCutsceneDef {
  if (relationLevel >= 70) {
    return DEFAULT_FRIENDLY_CUTSCENE;
  } else if (relationLevel <= 30) {
    return DEFAULT_HOSTILE_CUTSCENE;
  } else {
    return DEFAULT_NEUTRAL_CUTSCENE;
  }
}

/** Get all NPC cutscene IDs */
export function getAllNPCCutsceneIds(): string[] {
  return Object.keys(NPC_CUTSCENES);
}

/** Check if an NPC has a specific cutscene */
export function hasNPCCutscene(npcId: string): boolean {
  return Object.values(NPC_CUTSCENES).some((c) => c.npcId === npcId);
}
