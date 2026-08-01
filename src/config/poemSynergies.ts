import type { ReverseOnExpiryEntry } from '@/engine/PoemPowerSystem';
import type { PoemWorldEffectProfile } from '@/config/poemWorldEffects';
import type { TrainablePlayerSkill } from '@/shared/types/game';

/** Max gap between two poem activations to trigger a synergy combo. */
export const POEM_SYNERGY_WINDOW_MS = 5000;

export interface PoemSynergyFlag {
  key: string;
  durationMs: number;
  /** TTL reverse lookup id — defaults to parent synergyId when reversible. */
  reverseId?: string;
}

export interface PoemSynergyDefinition {
  synergyId: string;
  /** Player-facing combo name — «Штормовой Прорыв» */
  name: string;
  /** Bidirectional pair — order of activation does not matter. */
  poemIds: readonly [string, string];
  flagsToSet: PoemSynergyFlag[];
  reverseOnExpiry?: ReverseOnExpiryEntry[];
  /** Immediate stat boosts applied when the combo fires. */
  immediateSkills?: Partial<Record<TrainablePlayerSkill, number>>;
  /** Optional world VFX profile override for poem:synergy_triggered. */
  worldProfile?: Partial<PoemWorldEffectProfile>;
}

export const POEM_SYNERGIES: PoemSynergyDefinition[] = [
  {
    synergyId: 'storm_breakthrough',
    name: 'Штормовой Прорыв',
    poemIds: ['poem_5', 'poem_8'],
    flagsToSet: [
      { key: 'synergy_storm_breakthrough_skip', durationMs: 60000, reverseId: 'storm_breakthrough_skip' },
      { key: 'synergy_storm_breakthrough_intuition', durationMs: 60000 },
    ],
    immediateSkills: { intuition: 10 },
    reverseOnExpiry: [{ type: 'skill', key: 'intuition', value: -10 }],
    worldProfile: {
      category: 'combat',
      visualPreset: 'storm_break',
      audioCue: 'danger',
      durationMs: 4200,
      narrationLine: '«Шторм и прорыв сливаются — код подчиняется, интуиция вспыхивает.»',
    },
  },
  {
    synergyId: 'voice_word',
    name: 'Глас Слова',
    poemIds: ['poem_1', 'poem_6'],
    flagsToSet: [{ key: 'synergy_voice_word_crit', durationMs: 45000 }],
    worldProfile: {
      category: 'dialogue',
      visualPreset: 'letterbox_truth',
      audioCue: 'emotional',
      durationMs: 4000,
      narrationLine: '«Правда и мощь слова — следующее убеждение бьёт без промаха.»',
    },
  },
  {
    synergyId: 'city_star',
    name: 'Городская Звезда',
    poemIds: ['poem_3', 'poem_11'],
    flagsToSet: [
      { key: 'synergy_city_star_hints', durationMs: 90000, reverseId: 'city_star_hints' },
      { key: 'synergy_city_star_intuition', durationMs: 90000 },
    ],
    immediateSkills: { intuition: 5 },
    reverseOnExpiry: [{ type: 'skill', key: 'intuition', value: -5 }],
    worldProfile: {
      category: 'exploration',
      visualPreset: 'god_rays_gold',
      audioCue: 'discovery',
      durationMs: 5000,
      narrationLine: '«Звезда и шёпот улиц ведут сквозь неон — тайные пути проступают ярче.»',
      worldHint: 'exit_glow',
    },
  },
  {
    synergyId: 'heart_bond',
    name: 'Связь Сердец',
    poemIds: ['poem_4', 'poem_17'],
    flagsToSet: [{ key: 'synergy_heart_bond_active', durationMs: 60000, reverseId: 'heart_bond_active' }],
    worldProfile: {
      category: 'social',
      visualPreset: 'warm_echo',
      audioCue: 'emotional',
      durationMs: 4200,
      narrationLine: '«Память сердец и невидимая нить — союзник чувствует тебя ближе.»',
      worldHint: 'npc_shimmer',
    },
  },
  {
    synergyId: 'deep_storm',
    name: 'Шторм Мысли',
    poemIds: ['poem_5', 'poem_14'],
    flagsToSet: [
      { key: 'synergy_deep_storm_logic', durationMs: 45000 },
    ],
    immediateSkills: { logic: 6, intuition: 4 },
    reverseOnExpiry: [
      { type: 'skill', key: 'logic', value: -6 },
      { type: 'skill', key: 'intuition', value: -4 },
    ],
    worldProfile: {
      category: 'utility',
      visualPreset: 'matrix_pulse',
      audioCue: 'mystery',
      durationMs: 3800,
      narrationLine: '«Шторм ветра и глубокая мысль — логика и интуиция бурлят в унисон.»',
    },
  },
  {
    synergyId: 'second_breath_resurrection',
    name: 'Второе Дыхание',
    poemIds: ['poem_2', 'poem_18'],
    flagsToSet: [
      { key: 'synergy_second_breath_energy', durationMs: 60000 },
      { key: 'synergy_second_breath_stress_relief', durationMs: 60000 },
    ],
    immediateSkills: { empathy: 5 },
    reverseOnExpiry: [{ type: 'skill', key: 'empathy', value: -5 }],
    worldProfile: {
      category: 'dialogue',
      visualPreset: 'letterbox_truth',
      audioCue: 'emotional',
      durationMs: 5500,
      narrationLine: '«Смерть и возвращение правды — второе дыхание для измученной души.»',
      worldHint: 'npc_shimmer',
    },
  },
  {
    synergyId: 'chip_resistance',
    name: 'Сопротивление Контролю',
    poemIds: ['poem_10', 'poem_20'],
    flagsToSet: [
      { key: 'synergy_chip_resistance_coding', durationMs: 75000 },
      { key: 'synergy_chip_resistance_defense', durationMs: 75000 },
    ],
    immediateSkills: { coding: 8, empathy: 3 },
    reverseOnExpiry: [
      { type: 'skill', key: 'coding', value: -8 },
      { type: 'skill', key: 'empathy', value: -3 },
    ],
    worldProfile: {
      category: 'defense',
      visualPreset: 'shield_pulse',
      audioCue: 'tension',
      durationMs: 4800,
      narrationLine: '«Каменная кожа и чип в затылке — два щита от одной системы.»',
      worldHint: 'none',
    },
  },
  {
    synergyId: 'memory_star',
    name: 'Память и Путь',
    poemIds: ['poem_7', 'poem_12'],
    flagsToSet: [
      { key: 'synergy_memory_star_exploration', durationMs: 90000, reverseId: 'memory_star_exploration' },
    ],
    immediateSkills: { intuition: 8, writing: 3 },
    reverseOnExpiry: [
      { type: 'skill', key: 'intuition', value: -8 },
      { type: 'skill', key: 'writing', value: -3 },
    ],
    worldProfile: {
      category: 'exploration',
      visualPreset: 'god_rays_gold',
      audioCue: 'discovery',
      durationMs: 5800,
      narrationLine: '«Детский взгляд и звёздный путь — ребёнок видит то, что упускает усталый.»',
      worldHint: 'exit_glow',
    },
  },
  {
    synergyId: 'street_whisper_echo',
    name: 'Эхо Городских Голосов',
    poemIds: ['poem_9', 'poem_11'],
    flagsToSet: [
      { key: 'synergy_street_whisper_persuasion', durationMs: 50000 },
    ],
    immediateSkills: { persuasion: 7, intuition: 3 },
    reverseOnExpiry: [
      { type: 'skill', key: 'persuasion', value: -7 },
      { type: 'skill', key: 'intuition', value: -3 },
    ],
    worldProfile: {
      category: 'social',
      visualPreset: 'warm_echo',
      audioCue: 'emotional',
      durationMs: 4500,
      narrationLine: '«Шутовское слово и голос улиц — город сам становится собеседником.»',
      worldHint: 'npc_shimmer',
    },
  },
];

const SYNERGY_BY_PAIR = new Map<string, PoemSynergyDefinition>();

for (const synergy of POEM_SYNERGIES) {
  const [a, b] = synergy.poemIds;
  SYNERGY_BY_PAIR.set(`${a}|${b}`, synergy);
  SYNERGY_BY_PAIR.set(`${b}|${a}`, synergy);
}

const SYNERGY_BY_ID = new Map(POEM_SYNERGIES.map((s) => [s.synergyId, s]));

export function getPoemSynergyById(synergyId: string): PoemSynergyDefinition | undefined {
  return SYNERGY_BY_ID.get(synergyId);
}

/** Resolve bidirectional synergy when two distinct poems fire within the rhythm window. */
export function findPoemSynergy(
  currentPoemId: string,
  previousPoemId: string | null,
  previousTimestamp: number | null,
  now: number,
): PoemSynergyDefinition | null {
  if (!previousPoemId || previousTimestamp == null) return null;
  if (previousPoemId === currentPoemId) return null;
  if (now - previousTimestamp > POEM_SYNERGY_WINDOW_MS) return null;
  return SYNERGY_BY_PAIR.get(`${previousPoemId}|${currentPoemId}`) ?? null;
}

export function getSynergyReverseOnExpiry(poemOrSynergyId: string): ReverseOnExpiryEntry[] | undefined {
  return getPoemSynergyById(poemOrSynergyId)?.reverseOnExpiry;
}
