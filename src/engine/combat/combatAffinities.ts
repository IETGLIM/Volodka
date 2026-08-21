/* ─── Combat Affinities — Elemental Weakness/Resistance System ───
 *  Persona/Disco Elysium-style type matchups: each enemy has vulnerabilities
 *  and resistances against specific damage channels. This adds strategic depth
 *  (knowing which poem power or skill to use against which enemy type) and
 *  rewards player knowledge — a key DE design principle.
 *
 *  Damage channels:
 *  - code     → hacking, exploit, programming attacks
 *  - logic    → analytical, deductive attacks
 *  - empathy  → emotional, compassionate attacks
 *  - intuition → perceptive, instinctive attacks
 *  - writing  → poetic, creative attacks (poem powers)
 *  - physical → brute force, stamina-based attacks
 *
 *  Affinity multipliers:
 *  - 2.0 = super effective (weakness)
 *  - 1.5 = effective (mild weakness)
 *  - 1.0 = neutral
 *  - 0.7 = resistant (mild resistance)
 *  - 0.5 = highly resistant (strong resistance)
 *  - 0.0 = immune (no damage)
 *
 *  Poem powers map to channels:
 *  - Logic poems (1,8,22) → logic channel
 *  - Empathy poems (4,7,14,15) → empathy channel
 *  - Writing poems (6,13,18,23) → writing channel
 *  - Intuition poems (3,9,16,20) → intuition channel
 *  - Code poems (5,11,21) → code channel
 *  - Physical poems (2,10,12,17,19) → physical channel
 */

import type { EnemyType } from '@/shared/types/definitions/combat';

/* ═══════════════════════════════════════════════════════════════
   DAMAGE CHANNELS
   ═══════════════════════════════════════════════════════════════ */

export type DamageChannel =
  | 'code'
  | 'logic'
  | 'empathy'
  | 'intuition'
  | 'writing'
  | 'physical';

/** All available damage channels — used for iteration and validation. */
export const DAMAGE_CHANNELS: readonly DamageChannel[] = [
  'code', 'logic', 'empathy', 'intuition', 'writing', 'physical',
];

/** Human-readable Russian labels for each damage channel (shown in UI). */
export const DAMAGE_CHANNEL_LABELS: Record<DamageChannel, string> = {
  code: 'Код',
  logic: 'Логика',
  empathy: 'Эмпатия',
  intuition: 'Интуиция',
  writing: 'Слово',
  physical: 'Сила',
};

/** Color mapping for UI display (matches cyberPalette tokens). */
export const DAMAGE_CHANNEL_COLORS: Record<DamageChannel, string> = {
  code: '#39ff14',      // CYBER_GREEN — coding/exploit
  logic: '#00e5ff',     // CYBER_CYAN — analytical
  empathy: '#ff6b9d',   // rose — compassionate
  intuition: '#a78bfa', // purple — perceptive
  writing: '#d4920a',   // amberGold — poetic
  physical: '#ffab00',  // CYBER_AMBER — brute force
};

/* ═══════════════════════════════════════════════════════════════
   AFFINITY MULTIPLIERS
   ═══════════════════════════════════════════════════════════════ */

export type AffinityMultiplier = 2.0 | 1.5 | 1.0 | 0.7 | 0.5 | 0.3 | 0.0;

export const AFFINITY_LABELS: Record<AffinityMultiplier, string> = {
  2.0: 'Суперэффективно!',
  1.5: 'Эффективно',
  1.0: '',
  0.7: 'Слабое сопротивление',
  0.5: 'Сильное сопротивление',
  0.3: 'Почти иммунитет',
  0.0: 'Иммунитет',
};

/** Visual emphasis level for UI — determines animation intensity. */
export const AFFINITY_EMPHASIS: Record<AffinityMultiplier, 'super' | 'strong' | 'normal' | 'weak' | 'immune'> = {
  2.0: 'super',
  1.5: 'strong',
  1.0: 'normal',
  0.7: 'weak',
  0.5: 'weak',
  0.3: 'weak',
  0.0: 'immune',
};

/* ═══════════════════════════════════════════════════════════════
   ENEMY AFFINITY MAP
   Design philosophy: every enemy has at least one weakness (rewarding
   strategic play) and one resistance (punishing brute force). Daemons
   are weak to code because they ARE code; corporate enemies resist
   empathy because corporate culture suppresses emotion; ghosts/wraiths
   are immune to physical but weak to intuition/writing.
   ═══════════════════════════════════════════════════════════════ */

export type EnemyAffinityMap = Partial<Record<DamageChannel, AffinityMultiplier>>;

/** Default affinity: 1.0 (neutral) for any channel not explicitly listed. */
const NEUTRAL: AffinityMultiplier = 1.0;

export const ENEMY_AFFINITIES: Record<EnemyType, EnemyAffinityMap> = {
  // ── Act 1: Digital pests ──
  system_daemon: {
    code: 2.0,       // Exploits crash daemons — super effective
    logic: 1.5,      // Analytical debuffs work well
    empathy: 0.7,    // Daemons don't feel — mildly resisted
    physical: 0.5,   // Can't punch code — strongly resisted
  },
  corporate_golem: {
    code: 1.5,       // Hacking disrupts corporate systems
    empathy: 0.5,    // Corporate shields block emotional attacks
    physical: 2.0,   // Brute force overpowers corporate bulk
    writing: 0.7,    // Poetry doesn't penetrate corporate armor
  },
  corporate_drone: {
    code: 1.5,       // Exploits reprogram drones
    logic: 2.0,      // Logic traps confuse drone protocols
    intuition: 0.7,  // Drones follow rules, not intuition
    physical: 0.7,   // Drones have standard corporate armor
  },
  censor_drone: {
    writing: 2.0,    // Poetry is the censor's nemesis — super effective!
    code: 1.5,       // Hacking bypasses censorship filters
    empathy: 0.5,    // Censors suppress empathy by design
    intuition: 0.7,  // Censors patrol, not perceive
  },
  shadow_agent: {
    intuition: 2.0,  // Perception reveals hidden agents
    empathy: 1.5,    // Empathy exposes their human side
    code: 0.7,       // Agents have counter-hacking protocols
    physical: 0.7,   // Agents are agile, hard to hit
  },

  // ── Act 2: Digital ghosts ──
  data_phantom: {
    code: 2.0,       // Exploits destabilize phantom data
    intuition: 1.5,  // Intuition senses phantom presence
    physical: 0.3,   // Phantoms strongly resist physical — they're data (was 0.0 immune)
    writing: 0.7,    // Poetry barely affects raw data constructs
  },
  code_inquisitor: {
    writing: 2.0,    // Inquisitors hate free expression — super effective!
    empathy: 1.5,    // Compassion undermines inquisitorial authority
    code: 0.5,       // Inquisitors know code better than you
    physical: 0.7,   // Inquisitors are protected by guild law
  },
  data_wraith: {
    intuition: 2.0,  // Intuition reveals wraith patterns
    writing: 1.5,    // Creative expression disrupts data patterns
    physical: 0.3,   // Wraiths strongly resist physical — data entities (was 0.0 immune)
    code: 0.7,       // Wraiths are evolved data, hard to hack
  },
  memory_wraith: {
    empathy: 2.0,    // Empathy heals fractured memories
    writing: 1.5,    // Poetry reconstructs lost memories
    physical: 0.3,   // Memory wraiths strongly resist physical (was 0.0 immune)
    code: 0.7,       // Memory structures resist raw hacking
  },

  // ── Act 3: Guild enforcers ──
  guild_enforcer: {
    writing: 2.0,    // Poetry undermines enforcer ideology
    code: 1.5,       // Hacking disrupts guild coordination
    empathy: 0.5,    // Enforcers suppress empathy — guild doctrine
    intuition: 0.7,  // Enforcers are predictable, intuition wasted
  },
  firewall_guardian: {
    code: 0.5,       // Guardians are MADE of firewalls — resist hacking
    writing: 2.0,    // Poetry bypasses firewall logic — super effective!
    empathy: 1.5,    // Empathy finds gaps in rigid defenses
    physical: 0.7,   // Guardians have hardened infrastructure
  },

  // ── Act 2+: Hunters ──
  poetry_hunter: {
    writing: 0.5,    // Hunters are trained to resist poetry!
    empathy: 2.0,    // But they're vulnerable to genuine compassion
    intuition: 1.5,  // Intuition tracks hunter patterns
    code: 0.7,       // Hunters carry counter-hacking gear
  },

  // ── Act 6+: Endgame ──
  nexus_guardian: {
    writing: 2.0,    // Poetry is the ultimate weapon against surveillance
    empathy: 1.5,    // Empathy breaks through surveillance cynicism
    code: 0.5,       // Nexus has military-grade firewalls
    physical: 0.5,   // Nexus infrastructure is hardened
  },
  void_echo: {
    intuition: 2.0,  // Intuition pierces void concealment
    writing: 1.5,    // Poetry fills the void with meaning
    physical: 0.3,   // Void echoes strongly resist physical (was 0.0 immune)
    empathy: 0.7,    // Void suppresses emotional resonance
  },

  // ── NEW: Phase 11 additions ──
  network_spy: {
    code: 2.0,       // Hacking exposes spy protocols
    intuition: 1.5,  // Intuition detects surveillance
    empathy: 0.7,    // Spies compartmentalize emotions
    writing: 0.7,    // Spies are trained to resist manipulation
  },
  quantum_ghost: {
    logic: 2.0,      // Logic resolves quantum uncertainty
    intuition: 1.5,  // Intuition senses quantum patterns
    physical: 0.3,   // Quantum entities strongly resist physical (was 0.0 immune)
    code: 0.5,       // Quantum fluctuations resist hacking
  },
  grief_echo: {
    empathy: 2.0,    // Empathy heals grief — super effective!
    writing: 1.5,    // Poetry transforms grief into art
    logic: 0.7,      // Logic can't process grief
    physical: 0.3,   // Grief echoes strongly resist physical (was 0.0 immune)
  },
  corporate_ai: {
    logic: 1.5,      // Logic exploits AI reasoning bugs
    code: 2.0,       // Hacking is super effective against AI
    empathy: 0.0,    // AI has no empathy — immune!
    writing: 0.5,    // Poetry doesn't affect algorithmic logic
  },
  rust_sentinel: {
    code: 1.5,       // Hacking disrupts rusty old protocols
    physical: 2.0,   // Brute force overpowers degraded hardware
    intuition: 0.7,  // Sentinels follow old patterns predictably
    writing: 0.7,    // Poetry doesn't affect mechanical logic
  },
  memory_devourer: {
    writing: 2.0,    // Poetry reconstructs what devourer erases
    empathy: 1.5,    // Empathy connects to erased memories
    physical: 0.5,   // Devourer consumes physical traces
    intuition: 0.7,  // Devourer hides within memories
  },

  // ── BOSSES — designed with 2 weaknesses + 2 resistances for strategic depth ──
  boss_neuro_sys: {
    code: 2.0,       // Hacking the main AI core — super effective!
    logic: 1.5,      // Logic exploits AI reasoning flaws
    physical: 0.3,   // NeuroSys has no physical form — near-immune
    empathy: 0.5,    // Empathy can't reach a pure algorithm
  },
  boss_dream_eater: {
    empathy: 2.0,    // Empathy heals what dream-eater devours
    writing: 1.5,    // Poetry fills the void with meaning
    code: 0.5,       // Dream logic resists raw code
    physical: 0.3,   // A dream has no body to strike
  },
  boss_final_code: {
    writing: 2.0,    // The final poem is the ultimate weapon
    code: 1.5,       // Code can rewrite the final code
    physical: 0.5,   // Pure code resists physical strikes
    logic: 0.7,      // The final code outsmarts pure logic
  },

  // ── Новые враги v4.5.0 ──
  ranged_strelkov: {
    physical: 1.5,   // Стрелки уязвимы в ближнем бою
    code: 0.7,       // Дальнобойные слабы к код-атакам
    logic: 1.2,      // Логические уязвимости
  },
  dark_mage: {
    physical: 0.5,   // Маги устойчивы к физическому урону
    code: 1.5,       // Код нарушает их заклинания
    writing: 1.8,    // Поэзия разрушает магические барьеры
    empathy: 0.7,    // Маги холодны к эмпатии
  },
  boss_catacombs_keeper: {
    physical: 0.6,   // Босс устойчив к обычным атакам
    code: 1.2,       // Код-эксплойты эффективны
    writing: 2.0,    // Стихи — главное оружие против Хранителя
    empathy: 1.3,    // Эмпатия пробивает его броню
    logic: 0.8,      // Хранитель сопротивляется логике
  },
};

/* ═══════════════════════════════════════════════════════════════
   POEM → DAMAGE CHANNEL MAPPING
   Which poem power uses which damage channel — used by CombatSystem
   to apply affinity multipliers when executing poem powers.
   ═══════════════════════════════════════════════════════════════ */

/** Maps poem IDs to their primary damage channel for affinity resolution.
 *  Standard attacks use 'physical' channel. Poem powers use their thematic channel. */
export const POEM_DAMAGE_CHANNEL: Record<string, DamageChannel> = {
  poem_1:  'logic',      // Правда Глас — logical truth
  poem_2:  'physical',   // Второе Дыхание — physical recovery
  poem_3:  'intuition',  // Путеводная Звезда — intuitive guidance
  poem_4:  'empathy',    // Память Сердец — emotional memory
  poem_5:  'code',       // Штормовой Ветер — code disruption
  poem_6:  'writing',    // Слово Мощь — written power
  poem_7:  'empathy',    // Детский Взгляд — child's empathy
  poem_8:  'logic',      // Прорыв — logical breakthrough
  poem_9:  'intuition',  // Мост Между Мирами — intuitive bridge
  poem_10: 'physical',   // Каменная Кожа — physical armor
  poem_11: 'code',       // Голос Улиц — code of the streets
  poem_12: 'physical',   // Звездный Путь — physical karma path
  poem_13: 'writing',    // Последнее Слово — final written word
  poem_14: 'empathy',    // Молчание Глубин — deep empathy
  poem_15: 'intuition',  // Тихий Шёпот — intuitive whisper
  poem_16: 'intuition',  // Эхо Памяти — intuitive echo
  poem_17: 'physical',   // Невидимая Нить — physical drain
  poem_18: 'writing',    // Финальный Аккорд — final written chord
  poem_19: 'physical',   // Неоновая Панихида — physical tribute
  poem_20: 'intuition',  // Чип в затылке — intuitive chip
  poem_21: 'code',       // Белая Река, Чёрный Кабель — code stream
  poem_22: 'logic',      // Бесконечный Коридор — logical corridor
  poem_23: 'writing',    // Ветер Высот — written heights
  // ── Act 4–5 poems (24–35): late-game powers — thematic channels ──
  poem_24: 'code',       // Ночной Код — night code disruption
  poem_25: 'empathy',    // Передышка — empathic rest
  poem_26: 'logic',      // Срыв Цикла — logical cycle break
  poem_27: 'intuition',  // Сигнал — intuitive signal
  poem_28: 'code',       // 404 — code error strike
  poem_29: 'writing',    // Черновик — written draft
  poem_30: 'empathy',    // Чистилище — empathic purgatory
  poem_31: 'code',       // Неоновый Дождь — code rain
  poem_32: 'intuition',  // Пустой Возврат — intuitive void return
  poem_33: 'code',       // След в Коде — code trace
  poem_34: 'intuition',  // Вне Сети — out-of-network intuition
  poem_35: 'writing',    // Древний Город — ancient written city
  // ── Act 6 poems: resistance/CHK-themed ──
  poem_tolpa:    'physical',   // Костёр ЧК — physical bonfire
  poem_act6_01:  'code',       // Неоновый шёпот — code whisper
  poem_act6_02:  'empathy',    // Тепло памяти — empathic warmth
  poem_act6_03:  'writing',    // Стойкость строки — written resilience
  poem_act6_04:  'logic',      // Щит Сопротивления — logical shield
  poem_act6_05:  'physical',   // Удар Предательства — physical betrayal strike
  poem_act6_06:  'logic',      // Высота правды — logical truth height
  poem_act6_07:  'code',       // Конец Системы — system code end
  poem_act6_08:  'writing',    // Свет строки — written light
  // ── Act 7 finale poems ──
  poem_act7_01:     'writing',  // Колыбельная тишины — written lullaby
  poem_act7_ending: 'writing',  // Рассвет — written dawn finale
};

/* ═══════════════════════════════════════════════════════════════
   API — resolve affinity multiplier for a given attack vs enemy
   ═══════════════════════════════════════════════════════════════ */

/** Resolve the affinity multiplier for an attack's damage channel
 *  against a specific enemy type. Returns 1.0 (neutral) for any
 *  channel not explicitly listed in the enemy's affinity map.
 *
 *  Usage: multiply the base damage by this value before applying
 *  minimum damage clamps. Super-effective hits get 2× multiplier,
 *  resisted hits get reduced damage, immune hits deal 0.
 */
export function resolveAffinityMultiplier(
  enemyType: EnemyType,
  channel: DamageChannel,
): AffinityMultiplier {
  const affinityMap = ENEMY_AFFINITIES[enemyType];
  if (!affinityMap) return NEUTRAL;
  return (affinityMap[channel] ?? NEUTRAL) as AffinityMultiplier;
}

/** Get all weaknesses (multiplier > 1.0) for an enemy type.
 *  Used by CombatUI to display "Weaknesses" section. */
export function getEnemyWeaknesses(enemyType: EnemyType): Array<{ channel: DamageChannel; multiplier: AffinityMultiplier }> {
  const affinityMap = ENEMY_AFFINITIES[enemyType];
  if (!affinityMap) return [];
  return DAMAGE_CHANNELS
    .filter((ch) => (affinityMap[ch] ?? 1.0) > 1.0)
    .map((ch) => ({ channel: ch, multiplier: (affinityMap[ch] ?? 1.0) as AffinityMultiplier }))
    .sort((a, b) => b.multiplier - a.multiplier);
}

/** Get all resistances (multiplier < 1.0) for an enemy type.
 *  Used by CombatUI to display "Resistances" section. */
export function getEnemyResistances(enemyType: EnemyType): Array<{ channel: DamageChannel; multiplier: AffinityMultiplier }> {
  const affinityMap = ENEMY_AFFINITIES[enemyType];
  if (!affinityMap) return [];
  return DAMAGE_CHANNELS
    .filter((ch) => (affinityMap[ch] ?? 1.0) < 1.0)
    .map((ch) => ({ channel: ch, multiplier: (affinityMap[ch] ?? 1.0) as AffinityMultiplier }))
    .sort((a, b) => a.multiplier - b.multiplier);
}

/** Determine the damage channel for a combat action.
 *  Standard attacks → 'physical', poem powers → their thematic channel. */
export function resolveActionChannel(
  action: 'attack' | 'defend' | 'flee' | string,
  poemId?: string,
): DamageChannel {
  if (action === 'poem_power' && poemId) {
    return POEM_DAMAGE_CHANNEL[poemId] ?? 'writing';
  }
  // Standard attack uses physical channel
  return 'physical';
}

/** Compute affinity-adjusted damage.
 *  Takes base damage, applies affinity multiplier, then applies minimum
 *  damage floor (1 for non-immune, 0 for immune). */
export function applyAffinityToDamage(
  baseDamage: number,
  enemyType: EnemyType,
  channel: DamageChannel,
): { damage: number; multiplier: AffinityMultiplier; label: string } {
  const multiplier = resolveAffinityMultiplier(enemyType, channel);
  const adjustedDamage = Math.floor(baseDamage * multiplier);

  // Immune targets deal 0 damage regardless of base
  if (multiplier === 0.0) {
    return { damage: 0, multiplier, label: AFFINITY_LABELS[0.0] };
  }

  // Minimum 1 damage for non-immune attacks (even resisted ones)
  const finalDamage = Math.max(1, adjustedDamage);
  const label = multiplier !== 1.0 ? AFFINITY_LABELS[multiplier] : '';

  return { damage: finalDamage, multiplier, label };
}
