/* ─── Volodka RPG – Cutscene Data ───
   Cutscenes that trigger between acts.
   Each cutscene defines camera waypoints, text overlay, and trigger conditions.
   Сцены между актами — кинематографические переходы.
*/

import type { CameraWaypointData } from '@/engine/events';

/* ─── Cutscene definition ─── */
export interface CutsceneDef {
  id: string;
  /** Displayed text overlay (Russian) during the hold phase */
  textOverlay: string;
  /** Subtitle / secondary text below main overlay */
  subtitle?: string;
  /** Camera waypoints using the existing CameraWaypointData format */
  waypoints: CameraWaypointData[];
  /** Story node that triggers this cutscene */
  triggerStoryNode: string;
  /** Alternative: flag that triggers this cutscene */
  triggerFlag?: string;
  /** Total duration of the cutscene in ms (for the text display) */
  textDurationMs: number;
  /** Color tint for the text overlay */
  textAccentColor: string;
  /** Cutscene type — affects visual presentation */
  type?: 'act_transition' | 'character_intro' | 'story_moment' | 'revelation';
  /** Whether this cutscene can only play once (default: true for character intros and act transitions) */
  oneShot?: boolean;
  /** Letterbox bar style */
  letterboxStyle?: 'full' | 'thin' | 'none';
  /** Whether to show ember particles during the cutscene */
  showEmbers?: boolean;
  /** Glitch intensity during cutscene (0-1) */
  glitchIntensity?: number;
}

/* ══════════════════════════════════════════════════════════════
   CUTSCENE DEFINITIONS
   ══════════════════════════════════════════════════════════════ */

export const CUTSCENES: Record<string, CutsceneDef> = {
  /* ── ACT I OPENING — Prologue title card ──
     Triggered when reaching the 'start' node for the first time.
     Shows a dramatic "АКТ I" title card before the story begins. */
  act1_prologue: {
    id: 'act1_prologue',
    textOverlay: 'АКТ I',
    subtitle: 'Пробуждение',
    triggerStoryNode: 'start',
    textDurationMs: 4500,
    textAccentColor: '#00ff66', // green — monitor glow
    type: 'act_transition',
    oneShot: true,
    letterboxStyle: 'full',
    showEmbers: true,
    glitchIntensity: 0.3,
    waypoints: [
      // Start: Extreme close-up on the monitor
      {
        position: [0, 1.2, -2.2],
        lookAt: [0, 1.0, -2.5],
        fov: 35, // tight on screen
        duration: 0,
      },
      // Slowly pull back — revealing the desk
      {
        position: [0.5, 1.5, -1.5],
        lookAt: [0, 1.0, -2.0],
        fov: 45,
        duration: 2.5,
        controlPoint: [0.2, 1.3, -1.8],
      },
      // Pull further — room reveals itself
      {
        position: [0, 2.0, 0],
        lookAt: [0, 0.5, -2.0],
        fov: 55,
        duration: 2.0,
        controlPoint: [0.3, 1.8, -0.5],
      },
      // Settle behind where player will be standing
      {
        position: [0, 2.5, 2],
        lookAt: [0, 1.0, -1.0],
        fov: 60,
        duration: 1.5,
        controlPoint: [0, 2.2, 0.5],
      },
    ],
  },

  act1_corridor_solnysh: {
    id: 'act1_corridor_solnysh',
    textOverlay: 'Алина · Солныш',
    subtitle: '«Доброе утро, Володька. Ты опять не спал?»',
    triggerStoryNode: 'corridor_door',
    textDurationMs: 5000,
    textAccentColor: '#ffb8d0',
    type: 'character_intro',
    oneShot: true,
    letterboxStyle: 'thin',
    showEmbers: false,
    glitchIntensity: 0,
    waypoints: [
      {
        position: [0, 1.7, 4.5],
        lookAt: [0, 1.1, 2.0],
        fov: 52,
        duration: 0,
      },
      {
        position: [0.8, 1.5, 2.8],
        lookAt: [0.4, 1.15, 1.5],
        fov: 44,
        duration: 2.2,
        controlPoint: [0.5, 1.6, 3.5],
      },
      {
        position: [0.2, 1.35, 2.0],
        lookAt: [0.5, 1.2, 1.2],
        fov: 38,
        duration: 1.8,
        controlPoint: [0.35, 1.4, 2.4],
      },
      {
        position: [0, 1.8, 3.2],
        lookAt: [0, 1.0, 0.5],
        fov: 50,
        duration: 1.5,
        controlPoint: [0.1, 1.5, 2.0],
      },
    ],
  },

  solnysh_roof_toast: {
    id: 'solnysh_roof_toast',
    textOverlay: 'Алина',
    subtitle: '«Спасибо, что ты есть, солнце!»',
    triggerStoryNode: 'solnysh_roof_arrival',
    textDurationMs: 5500,
    textAccentColor: '#ffd0a8',
    type: 'story_moment',
    oneShot: true,
    letterboxStyle: 'thin',
    showEmbers: false,
    glitchIntensity: 0,
    waypoints: [
      {
        position: [0, 2.2, 6],
        lookAt: [0, 1.2, 0],
        fov: 55,
        duration: 0,
      },
      {
        position: [1.2, 1.8, 3],
        lookAt: [0.3, 1.3, -1],
        fov: 42,
        duration: 2.5,
        controlPoint: [0.6, 2.0, 1.5],
      },
      {
        position: [0.4, 1.5, 1.5],
        lookAt: [0, 1.25, -2],
        fov: 38,
        duration: 2.0,
        controlPoint: [0.5, 1.6, 0.5],
      },
      {
        position: [0, 2.0, 4],
        lookAt: [0, 1.0, -4],
        fov: 50,
        duration: 1.5,
        controlPoint: [0.2, 1.7, 1.0],
      },
    ],
  },

  /* ── ZAREMA FIRST ENCOUNTER ──
     Triggered when reaching the kitchen_table node for the first time.
     Warm, intimate camera movement — Zarema caring for Volodka. */
  zarema_first_meeting: {
    id: 'zarema_first_meeting',
    textOverlay: 'Зарема',
    subtitle: '«Садись. Я налью тебе суп.»',
    triggerStoryNode: 'kitchen_table',
    textDurationMs: 4000,
    textAccentColor: '#ffaa44', // warm amber
    type: 'character_intro',
    oneShot: true,
    letterboxStyle: 'thin',
    showEmbers: false,
    glitchIntensity: 0,
    waypoints: [
      // Start: Doorway — seeing the kitchen for the first time
      {
        position: [0, 1.8, 3],
        lookAt: [0, 1.0, 0],
        fov: 55,
        duration: 0,
      },
      // Move closer — warm light
      {
        position: [1.0, 1.5, 1.5],
        lookAt: [0, 1.2, -0.5],
        fov: 45,
        duration: 2.0,
        controlPoint: [0.5, 1.6, 2.2],
      },
      // Close-up on the tea
      {
        position: [0.5, 1.2, 0.3],
        lookAt: [0, 1.0, -0.3],
        fov: 38,
        duration: 1.5,
        controlPoint: [0.7, 1.3, 0.8],
      },
      // Settle back for dialogue
      {
        position: [0, 2.0, 2.5],
        lookAt: [0, 1.0, 0],
        fov: 50,
        duration: 1.5,
        controlPoint: [0.2, 1.6, 1.5],
      },
    ],
  },

  /* ── VICTORIA FIRST ENCOUNTER ──
     Triggered when reaching the maria_curious node.
     Mysterious, unsettling — she emerges from the shadows. */
  victoria_first_encounter: {
    id: 'victoria_first_encounter',
    textOverlay: 'Виктория',
    subtitle: '«Я видела твой код в архивах.»',
    triggerStoryNode: 'maria_curious',
    textDurationMs: 4500,
    textAccentColor: '#c084fc', // purple — mysterious
    type: 'character_intro',
    oneShot: true,
    letterboxStyle: 'thin',
    showEmbers: true,
    glitchIntensity: 0.2,
    waypoints: [
      // Start: Looking at the alley from a distance
      {
        position: [4, 2, 8],
        lookAt: [0, 1.0, 0],
        fov: 55,
        duration: 0,
      },
      // Slow approach — unease
      {
        position: [2, 1.8, 5],
        lookAt: [0, 1.2, 0],
        fov: 50,
        duration: 2.0,
        controlPoint: [3, 1.9, 6.5],
      },
      // Push into the shadow — she's there
      {
        position: [-0.5, 1.5, 2.5],
        lookAt: [0, 1.3, 0],
        fov: 42,
        duration: 2.0,
        controlPoint: [0.5, 1.6, 3.5],
      },
      // Close — the chip in her hand
      {
        position: [0.3, 1.2, 1.2],
        lookAt: [0, 1.4, 0],
        fov: 38,
        duration: 1.5,
        controlPoint: [0, 1.3, 1.8],
      },
    ],
  },

  /* ── POEM REVELATION ──
     Triggered when reaching fix_success — the moment the poem is discovered in the code.
     Triumphant, transcendent — code becomes poetry. */
  poem_revelation: {
    id: 'poem_revelation',
    textOverlay: 'Стихи в коде...',
    subtitle: '«Не код. Стихи. Настоящие, живые стихи.»',
    triggerStoryNode: 'fix_success',
    textDurationMs: 5000,
    textAccentColor: '#34d399', // emerald — revelation
    type: 'revelation',
    oneShot: true,
    letterboxStyle: 'full',
    showEmbers: true,
    glitchIntensity: 0.5,
    waypoints: [
      // Start: Close on the terminal screen
      {
        position: [0, 1.3, -1.5],
        lookAt: [0, 1.0, -2.5],
        fov: 40,
        duration: 0,
      },
      // Pull back slowly — processing what you see
      {
        position: [0, 1.8, -0.5],
        lookAt: [0, 1.0, -2.0],
        fov: 50,
        duration: 2.5,
        controlPoint: [0, 1.5, -1.0],
      },
      // Rise — the realization dawns
      {
        position: [0, 3.0, 1],
        lookAt: [0, 1.0, -1.5],
        fov: 55,
        duration: 2.0,
        controlPoint: [0, 2.4, 0],
      },
      // Push back to normal view
      {
        position: [0, 2.5, 3],
        lookAt: [0, 1.0, 0],
        fov: 60,
        duration: 1.5,
        controlPoint: [0, 2.7, 2],
      },
    ],
  },

  /* ── Act 1 → Act 2: The Network Awakens ──
     Triggered when reaching act2_transition node.
     Camera sweeps over the city at night, pulling into the underground. */
  act1_to_act2: {
    id: 'act1_to_act2',
    textOverlay: 'Сеть пробуждается...',
    subtitle: 'Под поверхностью города пульсирует что-то иное',
    triggerStoryNode: 'act2_transition',
    textDurationMs: 4000,
    textAccentColor: 'var(--cyber-cyan)', // cyan
    type: 'act_transition',
    oneShot: true,
    letterboxStyle: 'full',
    showEmbers: true,
    glitchIntensity: 0.4,
    waypoints: [
      // Start: High overview of the city
      {
        position: [0, 12, 20],
        lookAt: [0, 2, 0],
        fov: 60,
        duration: 0, // Start point
      },
      // Sweep down toward street level
      {
        position: [5, 8, 12],
        lookAt: [0, 1, 0],
        fov: 55,
        duration: 2.5,
        controlPoint: [2, 10, 16],
      },
      // Move through neon-lit alley
      {
        position: [-3, 3, 5],
        lookAt: [0, 1.5, -2],
        fov: 50,
        duration: 2.0,
        controlPoint: [1, 5, 8],
      },
      // Push into the underground entrance
      {
        position: [0, 1.5, -1],
        lookAt: [0, 0.5, -3],
        fov: 45,
        duration: 2.0,
        controlPoint: [-1, 2, 2],
      },
    ],
  },

  /* ── Act 2 → Act 3: Shadows Gather ──
     Triggered when reaching act3_transition node.
     Camera descends into darkness, Zarema's arrest looms. */
  act2_to_act3: {
    id: 'act2_to_act3',
    textOverlay: 'Тени сгущаются...',
    subtitle: 'Гильдия закрывает кольцо',
    triggerStoryNode: 'act3_transition',
    textDurationMs: 4000,
    textAccentColor: '#a78bfa', // violet
    waypoints: [
      // Start: Medium shot of the safehouse
      {
        position: [-2, 4, 8],
        lookAt: [0, 1.5, 0],
        fov: 55,
        duration: 0,
      },
      // Pull back — unease, the walls closing in
      {
        position: [4, 6, 14],
        lookAt: [0, 2, 0],
        fov: 60,
        duration: 2.5,
        controlPoint: [1, 5, 11],
      },
      // Sweep to a darker corner — shadows deepen
      {
        position: [-6, 3, 10],
        lookAt: [0, 1, 2],
        fov: 50,
        duration: 2.0,
        controlPoint: [-2, 4.5, 12],
      },
      // Push into darkness
      {
        position: [-2, 1.5, 4],
        lookAt: [0, 1, 0],
        fov: 40,
        duration: 2.0,
        controlPoint: [-4, 2, 7],
      },
    ],
  },

  /* ── Act 3 → Act 4: Revolution Begins ──
     Triggered when reaching act4_transition node.
     Camera rises from below, looking up at the Guild tower. */
  act3_to_act4: {
    id: 'act3_to_act4',
    textOverlay: 'Революция начинается...',
    subtitle: 'Время выбирать сторону',
    triggerStoryNode: 'act4_transition',
    textDurationMs: 4000,
    textAccentColor: '#f97316', // orange
    waypoints: [
      // Start: Low angle, looking up
      {
        position: [0, 1, 6],
        lookAt: [0, 8, 0],
        fov: 70,
        duration: 0,
      },
      // Rise up — the scale of the conflict
      {
        position: [3, 6, 10],
        lookAt: [0, 10, 0],
        fov: 60,
        duration: 2.5,
        controlPoint: [1, 3, 8],
      },
      // Sweeping wide — the city divides
      {
        position: [-5, 8, 15],
        lookAt: [0, 5, 0],
        fov: 55,
        duration: 2.0,
        controlPoint: [-1, 7, 12],
      },
      // Push forward into action
      {
        position: [0, 3, 3],
        lookAt: [0, 2, 0],
        fov: 50,
        duration: 2.0,
        controlPoint: [-2, 5, 9],
      },
    ],
  },

  /* ── Act 4 → Act 5: Finale ──
     Triggered when reaching the final act after act4_final_choice.
     Camera drifts upward into light — resolution. */
  act4_to_act5: {
    id: 'act4_to_act5',
    textOverlay: 'Финал...',
    subtitle: 'Каждое слово вело сюда',
    triggerStoryNode: 'act4_final_choice',
    textDurationMs: 5000,
    textAccentColor: '#fbbf24', // amber/gold
    waypoints: [
      // Start: Close and personal
      {
        position: [0, 2, 4],
        lookAt: [0, 1.5, 0],
        fov: 45,
        duration: 0,
      },
      // Slowly pull back — reflection
      {
        position: [2, 4, 8],
        lookAt: [0, 2, 0],
        fov: 50,
        duration: 3.0,
        controlPoint: [1, 3, 6],
      },
      // Rise — transcendence
      {
        position: [0, 10, 14],
        lookAt: [0, 3, 0],
        fov: 60,
        duration: 2.5,
        controlPoint: [1, 7, 11],
      },
      // Final: wide and luminous
      {
        position: [0, 14, 20],
        lookAt: [0, 2, 0],
        fov: 55,
        duration: 2.5,
        controlPoint: [0, 12, 17],
      },
    ],
  },

  /* ── Poem Virus Revelation ──
     Triggered when Vladimir discovers the truth about the poem virus phenomenon.
     Camera spirals through glitched data, reality breaking apart. */
  poem_virus_revelation: {
    id: 'poem_virus_revelation',
    textOverlay: 'Стихи — это код. Код — это свобода.',
    subtitle: 'Феномен не аномалия. Феномен — ответ.',
    triggerStoryNode: 'poem_virus_truth',
    textDurationMs: 5000,
    textAccentColor: '#34d399', // emerald
    waypoints: [
      // Start: Disoriented, inside the glitch
      {
        position: [0, 2, 3],
        lookAt: [0, 1.5, 0],
        fov: 75, // wide, distorted
        duration: 0,
      },
      // Spiral outward — fragments of text swirl
      {
        position: [4, 4, 6],
        lookAt: [0, 2, 0],
        fov: 65,
        duration: 2.5,
        controlPoint: [2, 3, 4],
      },
      // Pull through a corridor of data
      {
        position: [-3, 6, 10],
        lookAt: [0, 3, 0],
        fov: 55,
        duration: 2.5,
        controlPoint: [-1, 5, 8],
      },
      // Emerge into clarity — understanding
      {
        position: [0, 8, 16],
        lookAt: [0, 2, 0],
        fov: 50,
        duration: 3.0,
        controlPoint: [1, 7, 13],
      },
    ],
  },

  /* ── Digital Resistance Awakening ──
     Triggered when Vladimir joins the "Чёрная Чернильница" resistance.
     Camera rises from underground through the city to the rooftops — liberation. */
  resistance_awakening: {
    id: 'resistance_awakening',
    textOverlay: 'Чёрная Чернильница пробуждается...',
    subtitle: 'Каждое слово — удар. Каждый стих — щит.',
    triggerStoryNode: 'join_resistance',
    textDurationMs: 5500,
    textAccentColor: '#f43f5e', // rose
    waypoints: [
      // Start: Underground, enclosed
      {
        position: [0, 0.5, 3],
        lookAt: [0, 1, 0],
        fov: 50, // tight, confined
        duration: 0,
      },
      // Rise through the floor — breaking through
      {
        position: [1, 3, 6],
        lookAt: [0, 2, 0],
        fov: 55,
        duration: 2.5,
        controlPoint: [0.5, 1.5, 4],
      },
      // Ascend past neon signs — the city reveals itself
      {
        position: [-2, 7, 12],
        lookAt: [0, 4, 0],
        fov: 60,
        duration: 2.5,
        controlPoint: [-1, 5, 9],
      },
      // Reach the rooftops — freedom, wind, flag
      {
        position: [0, 12, 18],
        lookAt: [0, 6, 0],
        fov: 65, // wide, liberating
        duration: 3.0,
        controlPoint: [0, 10, 15],
      },
    ],
  },
};

/** Get a cutscene by its trigger story node ID */
export function getCutsceneForNode(storyNodeId: string): CutsceneDef | undefined {
  return Object.values(CUTSCENES).find((c) => c.triggerStoryNode === storyNodeId);
}

/** Get all cutscene IDs */
export function getAllCutsceneIds(): string[] {
  return Object.keys(CUTSCENES);
}
