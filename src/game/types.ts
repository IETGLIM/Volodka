export interface PromptInfo {
  icon: string;
  text: string;
}

export interface HudState {
  objectiveTitle: string;
  objectiveText: string;
  hasObjective: boolean;
  objDeg: number;
  objDist: number;
  stanzas: number;
  totalStanzas: number;
  fireflies: number;
  totalFireflies: number;
  lanterns: number;
  totalLanterns: number;
  prompt: PromptInfo | null;
  hints: boolean;
  timeLabel: string;
  day: number;
  finale: boolean;
  hp: number;
  maxHp: number;
  enemies: number;
  lootEssence: number;
  lootBerries: number;
  lootShards: number;
  lootBark: number;
  fishing: null | { phase: 'cast' | 'wait' | 'bite' | 'success' | 'fail'; t: number };
}

export interface DialogueChoice {
  label: string;
  idx: number;
}

export interface DialogueView {
  speaker: string;
  portrait: string;
  text: string;
  choices: DialogueChoice[];
}

export interface CutsceneView {
  idx: number;
  total: number;
  speaker: string;
  portrait: string;
  text: string;
  verse: string | null;
}

export interface ToastMsg {
  id: number;
  icon: string;
  text: string;
}

export interface Settings {
  music: number;
  sfx: number;
  quality: 'high' | 'low';
  hints: boolean;
}

export interface GameEvents {
  hud: (h: HudState) => void;
  dialogue: (d: DialogueView | null) => void;
  cutscene: (c: CutsceneView | null) => void;
  toast: (t: { icon: string; text: string }) => void;
  banner: (t: string) => void;
  fade: (a: number) => void;
  pause: (open: boolean) => void;
  journal: (open: boolean) => void;
}

export interface JournalStanza {
  place: string;
  title: string;
  lines: string[];
  found: boolean;
}

export interface JournalData {
  stanzas: JournalStanza[];
  fireflies: number;
  totalFireflies: number;
  lanterns: number;
  totalLanterns: number;
  metStarets: boolean;
  catBack: boolean;
  finale: boolean;
  timeLabel: string;
  day: number;
}
