/* ─── Volodka RPG – NPC Gift Preferences & Affinity Levels ───
 * Defines what each NPC likes/dislikes receiving as gifts,
 * and the affinity level thresholds that unlock content.
 */

/* ─── Gift Preference Types ─── */

export type GiftPreference = 'loved' | 'liked' | 'neutral' | 'disliked' | 'hated';

export interface NPCGiftPreference {
  npcId: string;
  lovedItems: string[];     // +15 affinity, special dialogue
  likedItems: string[];     // +8 affinity
  neutralItems: string[];   // +2 affinity
  dislikedItems: string[];  // -5 affinity
  hatedItems: string[];     // -15 affinity
}

export interface NPCAffinityLevel {
  minAffinity: number;
  label: string;           // Russian
  description: string;     // Russian
  unlocks: string[];       // What this level unlocks (dialogue, quests, items)
}

/* ─── Affinity Level Definitions ─── */

export const NPC_AFFINITY_LEVELS: NPCAffinityLevel[] = [
  {
    minAffinity: -100,
    label: 'Враг',
    description: 'Этот человек вас ненавидит. Разговоры коротки и враждебны.',
    unlocks: ['Враждебные реплики', 'Отказ в торговле'],
  },
  {
    minAffinity: -49,
    label: 'Недоверие',
    description: 'Вы не вызвали доверия. Разговоры сдержанны и осторожны.',
    unlocks: ['Осторожные диалоги'],
  },
  {
    minAffinity: -9,
    label: 'Незнакомец',
    description: 'Вы едва знакомы. Нейтральное отношение.',
    unlocks: ['Базовые диалоги'],
  },
  {
    minAffinity: 11,
    label: 'Знакомый',
    description: 'Вас узнают и приветливо встречают. Открываются новые темы.',
    unlocks: ['Расширенные диалоги', 'Мелкие скидки'],
  },
  {
    minAffinity: 51,
    label: 'Друг',
    description: 'Доверие и искренняя привязанность. Делятся секретами.',
    unlocks: ['Секретные диалоги', 'Уникальные товары', 'Дополнительные задания'],
  },
  {
    minAffinity: 81,
    label: 'Близкий',
    description: 'Глубокая связь и полное доверие. Этот человек готов на всё ради вас.',
    unlocks: ['Скрытые квесты', 'Легендарные предметы', 'Финальные диалоги'],
  },
];

/* ─── Gift Preference Data for 7 NPCs ─── */

export const NPC_GIFT_PREFERENCES: NPCGiftPreference[] = [
  /* ── Albert: Philosopher at the cafe. Loves poetry and intellectual items. ── */
  {
    npcId: 'albert',
    lovedItems: ['book_poetry_modern', 'old_poetry_book', 'poem_fragment'],
    likedItems: ['tea', 'coffee', 'book_coding_guide', 'albert_philosophy_book'],
    neutralItems: ['candy', 'herbal_tea', 'cyber_balm', 'data_chip'],
    dislikedItems: ['energy_drink', 'vodka', 'combat_stim', 'cigarettes'],
    hatedItems: ['daemon_core', 'firewall_code'],
  },

  /* ── Zarema: Caring friend. Loves home-cooked things and comforting items. ── */
  {
    npcId: 'zarema',
    lovedItems: ['home_cooked_meal', 'herbal_tea', 'candy', 'zarema_herbal_tea'],
    likedItems: ['tea', 'healing_salve', 'book_poetry_modern', 'nano_patch'],
    neutralItems: ['coffee', 'data_chip', 'circuit_board', 'copper_wire'],
    dislikedItems: ['combat_stim', 'vodka', 'cigarettes', 'lighter'],
    hatedItems: ['daemon_core', 'wire_tap_kit'],
  },

  /* ── Cafe Barista: Knows more than they say. Loves coffee and tech. ── */
  {
    npcId: 'cafe_barista',
    lovedItems: ['coffee', 'coffee_extract', 'barista_special_coffee', 'espresso_shot'],
    likedItems: ['circuit_board', 'data_chip', 'tech_component', 'copper_wire'],
    neutralItems: ['candy', 'tea', 'scraps', 'lighter'],
    dislikedItems: ['vodka', 'cigarettes', 'old_poetry_book'],
    hatedItems: ['daemon_core', 'wire_tap_kit'],
  },

  /* ── Alexander: IT guild leader. Loves tech and professional items. ── */
  {
    npcId: 'office_alexander',
    lovedItems: ['coding_manual', 'firewall_code', 'server_fragment', 'hacked_terminal_key'],
    likedItems: ['coffee', 'energy_drink', 'circuit_board', 'data_chip', 'tech_component'],
    neutralItems: ['tea', 'candy', 'usb_drive', 'copper_wire'],
    dislikedItems: ['vodka', 'old_poetry_book', 'poem_fragment'],
    hatedItems: ['wire_tap_kit', 'lighter'],
  },

  /* ── Colleague: Nervous, knows secrets. Loves tech tools and secretive items. ── */
  {
    npcId: 'office_colleague',
    lovedItems: ['colleague_software_tool', 'encrypted_data_module', 'usb_drive', 'code_fragment'],
    likedItems: ['coffee', 'energy_drink', 'data_chip', 'circuit_board', 'tech_component'],
    neutralItems: ['tea', 'candy', 'nano_patch', 'lighter'],
    dislikedItems: ['vodka', 'combat_stim', 'cigarettes'],
    hatedItems: ['wire_tap_kit', 'daemon_core'],
  },

  /* ── Maria/Victoria: Mysterious stranger. Loves secret and rare items. ── */
  {
    npcId: 'maria',
    lovedItems: ['encrypted_data_module', 'digital_ghost_trace', 'poem_fragment', 'maria_decryption_key'],
    likedItems: ['book_poetry_modern', 'old_poetry_book', 'code_fragment', 'living_code_fragment'],
    neutralItems: ['coffee', 'tea', 'data_chip', 'candy'],
    dislikedItems: ['combat_stim', 'vodka', 'cigarettes'],
    hatedItems: ['firewall_code', 'lighter'],
  },

  /* ── Dmitry: Senior developer. Loves technical and retro items. ── */
  {
    npcId: 'office_dmitry',
    lovedItems: ['coding_manual', 'server_fragment', 'rare_alloy', 'old_poetry_book'],
    likedItems: ['coffee', 'tea', 'circuit_board', 'tech_component', 'book_coding_guide'],
    neutralItems: ['candy', 'data_chip', 'copper_wire', 'nano_patch'],
    dislikedItems: ['energy_drink', 'vodka', 'combat_stim'],
    hatedItems: ['wire_tap_kit', 'cigarettes'],
  },
];

/* ─── Lookup Map ─── */

const GIFT_PREF_MAP = new Map<string, NPCGiftPreference>(
  NPC_GIFT_PREFERENCES.map((p) => [p.npcId, p]),
);

/**
 * Get gift preferences for a specific NPC.
 * Returns undefined if the NPC has no preferences defined.
 */
export function getNPCGiftPreference(npcId: string): NPCGiftPreference | undefined {
  return GIFT_PREF_MAP.get(npcId);
}

/**
 * Determine the preference level for a specific item given to an NPC.
 * Returns 'neutral' if the item is not in any preference list.
 */
export function getItemPreference(npcId: string, itemId: string): GiftPreference {
  const pref = GIFT_PREF_MAP.get(npcId);
  if (!pref) return 'neutral';

  if (pref.lovedItems.includes(itemId)) return 'loved';
  if (pref.likedItems.includes(itemId)) return 'liked';
  if (pref.dislikedItems.includes(itemId)) return 'disliked';
  if (pref.hatedItems.includes(itemId)) return 'hated';
  return 'neutral';
}

/**
 * Get the affinity change for giving an item to an NPC.
 */
export function getAffinityChange(preference: GiftPreference): number {
  switch (preference) {
    case 'loved': return 15;
    case 'liked': return 8;
    case 'neutral': return 2;
    case 'disliked': return -5;
    case 'hated': return -15;
  }
}

/**
 * Get the XP reward for gifting an item.
 */
export function getGiftXpReward(preference: GiftPreference): number {
  switch (preference) {
    case 'loved': return 10;
    case 'liked': return 5;
    case 'neutral': return 2;
    case 'disliked': return 0;
    case 'hated': return 0;
  }
}

/**
 * Get the current affinity level for a given affinity score.
 */
export function getAffinityLevel(affinity: number): NPCAffinityLevel {
  // Iterate from highest to lowest to find the matching level
  for (let i = NPC_AFFINITY_LEVELS.length - 1; i >= 0; i--) {
    if (affinity >= NPC_AFFINITY_LEVELS[i].minAffinity) {
      return NPC_AFFINITY_LEVELS[i];
    }
  }
  return NPC_AFFINITY_LEVELS[0]; // Fallback to Враг
}

/**
 * Get reaction text for a gift preference level.
 */
export function getGiftReactionText(npcName: string, preference: GiftPreference): string {
  switch (preference) {
    case 'loved': return `🌟 ${npcName} в восторге!`;
    case 'liked': return `😊 ${npcName} благодарит вас`;
    case 'neutral': return `📦 ${npcName} принимает подарок`;
    case 'disliked': return `😐 ${npcName} недоволен`;
    case 'hated': return `💢 ${npcName} оскорблён!`;
  }
}

/**
 * Get the color class for a gift preference level.
 */
export function getGiftPreferenceColor(preference: GiftPreference): string {
  switch (preference) {
    case 'loved': return 'text-amber-400';
    case 'liked': return 'text-emerald-400';
    case 'neutral': return 'text-slate-400';
    case 'disliked': return 'text-amber-500';
    case 'hated': return 'text-rose-400';
  }
}

/**
 * Get the background color class for a gift preference level.
 */
export function getGiftPreferenceBg(preference: GiftPreference): string {
  switch (preference) {
    case 'loved': return 'bg-amber-500/15 border-amber-500/30';
    case 'liked': return 'bg-emerald-500/15 border-emerald-500/30';
    case 'neutral': return 'bg-slate-500/15 border-slate-500/30';
    case 'disliked': return 'bg-amber-600/15 border-amber-600/30';
    case 'hated': return 'bg-rose-500/15 border-rose-500/30';
  }
}

/**
 * Get the glow color for a gift preference level (for CSS box-shadow).
 */
export function getGiftPreferenceGlow(preference: GiftPreference): string {
  switch (preference) {
    case 'loved': return 'rgba(251,191,36,0.25)';
    case 'liked': return 'rgba(52,211,153,0.25)';
    case 'neutral': return 'rgba(100,116,139,0.15)';
    case 'disliked': return 'rgba(245,158,11,0.2)';
    case 'hated': return 'rgba(244,63,94,0.25)';
  }
}

/**
 * Get the icon emoji for a gift preference level.
 */
export function getGiftPreferenceIcon(preference: GiftPreference): string {
  switch (preference) {
    case 'loved': return '❤️';
    case 'liked': return '👍';
    case 'neutral': return '📦';
    case 'disliked': return '😐';
    case 'hated': return '💢';
  }
}
