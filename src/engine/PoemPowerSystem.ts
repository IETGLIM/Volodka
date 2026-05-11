/* ─── Volodka RPG – Poem Power System ───
   Each collected poem grants a unique ability.
   Powers have cooldowns (once per in-game hour).
   Стихи — это сила. Каждое собранное стихотворение даёт уникальную способность.

   §4 Fix: Replaced setTimeout flag cleanup with TTL-based expiry model.
   Flags are now stored in game store as ActiveEffect with expiryTimestamp,
   ensuring they survive save/load and are correctly cleaned up.
*/

import { eventBus } from '@/engine/EventBus';
import { getGameStore } from '@/store/gameStore';

/* ─── Power definition ─── */
export interface PoemPower {
  poemId: string;
  name: string;
  description: string;
  cooldownMs: number; // 1 in-game hour = 3600000ms real-time (but we use shorter for gameplay)
  /** Immediate effects (skill boosts, karma, etc.) */
  effect: () => void;
  /** TTL-based flags to set — will be stored with expiryTimestamp for save/load safety */
  flagsToSet?: Array<{ key: string; durationMs: number }>;
}

/* ─── Active TTL Effect (stored in game store for serialization) ─── */
export interface ActiveTTLFlag {
  key: string;
  /** ID of the poem that created this flag (for event emission on expiry) */
  poemId: string;
  expiryTimestamp: number;
}

/* ─── Active effect tracking (non-serializable, for UI display only) ─── */
interface ActiveEffect {
  poemId: string;
  powerName: string;
  startedAt: number;
  durationMs: number;
}

const activeEffects: ActiveEffect[] = [];

/** Cancel all pending flag-cleanup timers (legacy — no longer needed with TTL model) */
export function clearAllPowerTimers(): void {
  activeEffects.length = 0;
}

/* ─── Helper: set a flag with TTL in the game store ─── */
function setTTLFlag(key: string, durationMs: number, poemId: string): void {
  const store = getGameStore();
  // Set the flag immediately
  store.setFlag(key, true);
  // Store the TTL entry for later cleanup
  const existing = store.activeTTLFlags ?? [];
  // Remove any existing entry for this key (refresh)
  const filtered = existing.filter((f: ActiveTTLFlag) => f.key !== key);
  store.setActiveTTLFlags([...filtered, { key, poemId, expiryTimestamp: Date.now() + durationMs }]);
}

/* ─── Helper: process expired TTL flags (call from game loop or on load) ─── */
export function processExpiredTTLFlags(): void {
  const store = getGameStore();
  const flags = store.activeTTLFlags ?? [];
  const now = Date.now();
  const expired = flags.filter((f: ActiveTTLFlag) => now >= f.expiryTimestamp);
  const remaining = flags.filter((f: ActiveTTLFlag) => now < f.expiryTimestamp);

  // Clear expired flags and emit events
  for (const f of expired) {
    store.setFlag(f.key, false);
    eventBus.emit('poem:power_expired', {
      flagKey: f.key,
      poemId: f.poemId,
      expiredAt: now,
    });
  }

  // Update the stored list
  if (expired.length > 0) {
    store.setActiveTTLFlags(remaining);
  }
}

/* ─── Power definitions ─── */
const POEM_POWERS: Record<string, PoemPower> = {
  poem_1: {
    poemId: 'poem_1',
    name: 'Правда Глас',
    description: 'Обнажить скрытую правду в диалоге. Следующая проверка убеждения автоматически проходит.',
    cooldownMs: 60000,
    effect: () => {
      const store = getGameStore();
      store.addSkill('persuasion', 3);
    },
    flagsToSet: [{ key: 'truth_voice_active', durationMs: 30000 }],
  },
  poem_2: {
    poemId: 'poem_2',
    name: 'Второе Дыхание',
    description: 'Возродиться из отчаяния. Восстанавливает 30 энергии и снимает 20 стресса.',
    cooldownMs: 90000,
    effect: () => {
      const store = getGameStore();
      store.addEnergy(30);
      store.addStress(-20);
    },
  },
  poem_3: {
    poemId: 'poem_3',
    name: 'Путеводная Звезда',
    description: 'Найти путь сквозь тьму. Показывает скрытые выходы и подсказки в текущей сцене.',
    cooldownMs: 120000,
    effect: () => {
      eventBus.emit('ui:exploration_message', { text: '⭐ Путеводная Звезда освещает скрытые пути...' });
    },
    flagsToSet: [{ key: 'guiding_star_active', durationMs: 60000 }],
  },
  poem_4: {
    poemId: 'poem_4',
    name: 'Память Сердец',
    description: 'Укрепить связь с союзником. +15 к отношению ближайшего NPC.',
    cooldownMs: 90000,
    effect: () => {
      const store = getGameStore();
      const relations = store.npcRelations;
      if (relations.length > 0) {
        const best = relations.reduce((a, b) => (a.value > b.value ? a : b));
        store.setNpcRelation(best.npcId, 15);
      }
    },
  },
  poem_5: {
    poemId: 'poem_5',
    name: 'Штормовой Ветер',
    description: 'Прорвать преграды. +5 к интуиции и логике на 30 секунд.',
    cooldownMs: 90000,
    effect: () => {
      const store = getGameStore();
      store.addSkill('intuition', 5);
      store.addSkill('logic', 5);
    },
    flagsToSet: [{ key: 'storm_wind_active', durationMs: 30000 }],
  },
  poem_6: {
    poemId: 'poem_6',
    name: 'Слово Мощь',
    description: 'Сила поэтического слова. +4 к навыку письма и убеждения.',
    cooldownMs: 60000,
    effect: () => {
      const store = getGameStore();
      store.addSkill('writing', 4);
      store.addSkill('persuasion', 4);
    },
  },
  poem_7: {
    poemId: 'poem_7',
    name: 'Детский Взгляд',
    description: 'Увидеть мир глазами ребёнка. Раскрывает скрытые стихи в текущей локации.',
    cooldownMs: 180000,
    effect: () => {
      const store = getGameStore();
      store.addSkill('intuition', 3);
      eventBus.emit('ui:exploration_message', { text: '👁 Детский Взгляд раскрывает скрытое...' });
    },
    flagsToSet: [{ key: 'child_gaze_active', durationMs: 45000 }],
  },
  poem_8: {
    poemId: 'poem_8',
    name: 'Прорыв',
    description: 'Свершить невозможное. Следующая проверка кодинга проходит автоматически.',
    cooldownMs: 120000,
    effect: () => {
      const store = getGameStore();
      store.addSkill('coding', 5);
    },
    flagsToSet: [{ key: 'breakthrough_active', durationMs: 30000 }],
  },
  poem_9: {
    poemId: 'poem_9',
    name: 'Шутово Слово',
    description: 'Обернуть насмешку в оружие. Враги теряют уверенность, +3 кармы.',
    cooldownMs: 60000,
    effect: () => {
      const store = getGameStore();
      store.addKarma(3);
      store.addSkill('persuasion', 2);
    },
  },
  poem_10: {
    poemId: 'poem_10',
    name: 'Каменная Кожа',
    description: 'Стать твёрже камня. Снижает входящий стресс на 50% на 60 секунд.',
    cooldownMs: 90000,
    effect: () => {
      const store = getGameStore();
      store.addStress(-15);
    },
    flagsToSet: [{ key: 'stone_skin_active', durationMs: 60000 }],
  },
  poem_11: {
    poemId: 'poem_11',
    name: 'Голос Улиц',
    description: 'Услышать шёпот города. Раскрывает слухи и подсказки о квестах.',
    cooldownMs: 120000,
    effect: () => {
      const store = getGameStore();
      store.addSkill('intuition', 4);
      eventBus.emit('ui:exploration_message', { text: '🌆 Голос Улиц шепчет секреты...' });
    },
    flagsToSet: [{ key: 'city_voice_active', durationMs: 45000 }],
  },
  poem_12: {
    poemId: 'poem_12',
    name: 'Звездный Путь',
    description: 'Путеводная звезда ведёт к цели. Автоматически завершает одно задание квеста.',
    cooldownMs: 180000,
    effect: () => {
      const store = getGameStore();
      store.addSkill('coding', 3);
    },
    flagsToSet: [{ key: 'star_path_active', durationMs: 30000 }],
  },
  poem_13: {
    poemId: 'poem_13',
    name: 'Последнее Слово',
    description: 'Произнести финальное слово. +8 кармы, но +10 стресса от тяжести правды.',
    cooldownMs: 120000,
    effect: () => {
      const store = getGameStore();
      store.addKarma(8);
      store.addStress(10);
    },
  },
  poem_14: {
    poemId: 'poem_14',
    name: 'Глубокое Размышление',
    description: 'Погрузиться в глубокое раздумье. +5 к письму и логике, но +5 стресса от тяжести мыслей.',
    cooldownMs: 180000,
    effect: () => {
      const store = getGameStore();
      store.addSkill('writing', 5);
      store.addSkill('logic', 5);
      store.addStress(5);
      eventBus.emit('ui:exploration_message', { text: '🧠 Глубокое Размышление... Мысли тяжелеют, но обретают ясность.' });
    },
    flagsToSet: [{ key: 'deep_thought_active', durationMs: 45000 }],
  },
  poem_15: {
    poemId: 'poem_15',
    name: 'Ироничный Шёпот',
    description: 'Прошептать иронию и раскрыть скрытые смыслы. Показывает скрытые варианты диалогов, +4 к убеждению.',
    cooldownMs: 150000,
    effect: () => {
      const store = getGameStore();
      store.addSkill('persuasion', 4);
      eventBus.emit('ui:exploration_message', { text: '😏 Ироничный Шёпот раскрывает скрытые смыслы...' });
    },
    flagsToSet: [{ key: 'ironic_whisper_active', durationMs: 45000 }],
  },
  poem_16: {
    poemId: 'poem_16',
    name: 'Эхо Детства',
    description: 'Вспомнить детство и обрести силы. +40 энергии и +3 эмпатии от эха памяти.',
    cooldownMs: 120000,
    effect: () => {
      const store = getGameStore();
      store.addEnergy(40);
      store.addSkill('empathy', 3);
      eventBus.emit('ui:exploration_message', { text: '👶 Эхо Детства... Воспоминания придают сил.' });
    },
    flagsToSet: [{ key: 'childhood_echo_active', durationMs: 30000 }],
  },
  poem_17: {
    poemId: 'poem_17',
    name: 'Невидимая Связь',
    description: 'Почувствовать невидимую нить между людьми. +10 к отношению ближайшего NPC и -10 стресса.',
    cooldownMs: 150000,
    effect: () => {
      const store = getGameStore();
      const relations = store.npcRelations;
      if (relations.length > 0) {
        const best = relations.reduce((a, b) => (a.value > b.value ? a : b));
        store.setNpcRelation(best.npcId, 10);
      }
      store.addStress(-10);
      eventBus.emit('ui:exploration_message', { text: '🤝 Невидимая Связь... Мы не одни в этом мире.' });
    },
    flagsToSet: [{ key: 'invisible_bond_active', durationMs: 30000 }],
  },
  poem_18: {
    poemId: 'poem_18',
    name: 'Возвращение Правды',
    description: 'Клевета вернётся в сто крат. +12 кармы и -25 стресса — истина приносит покой.',
    cooldownMs: 180000,
    effect: () => {
      const store = getGameStore();
      store.addKarma(12);
      store.addStress(-25);
      eventBus.emit('ui:exploration_message', { text: '⚖️ Возвращение Правды... Истина освобождает.' });
    },
    flagsToSet: [{ key: 'truth_return_active', durationMs: 30000 }],
  },
};

/* ─── Public API ─── */

/** Get the power definition for a poem. Returns undefined if poem has no power. */
export function getPoemPower(poemId: string): PoemPower | undefined {
  return POEM_POWERS[poemId];
}

/** Check if a poem power can be used (not on cooldown, poem is collected). */
export function canUsePower(poemId: string): boolean {
  const store = getGameStore();
  if (!store.collectedPoems.includes(poemId)) return false;

  const powerState = store.poemPowers[poemId];
  if (!powerState) return true; // Never used

  const now = Date.now();
  const elapsed = now - powerState.lastUsed;
  return elapsed >= powerState.cooldownMs;
}

/** Get remaining cooldown in ms for a poem power. Returns 0 if ready. */
export function getCooldownRemaining(poemId: string): number {
  const store = getGameStore();
  const powerState = store.poemPowers[poemId];
  if (!powerState) return 0;

  const now = Date.now();
  const elapsed = now - powerState.lastUsed;
  const remaining = powerState.cooldownMs - elapsed;
  return Math.max(0, remaining);
}

/** Activate a poem power. Returns true if successful. Not a React hook — named to avoid ESLint confusion. */
export function activatePoemPowerById(poemId: string): boolean {
  if (!canUsePower(poemId)) return false;

  const power = POEM_POWERS[poemId];
  if (!power) return false;

  // Set cooldown in store FIRST — if store rejects (e.g. poem not collected), don't apply effect
  const store = getGameStore();
  const success = store.activatePoemPower(poemId);
  if (!success) return false;

  // Execute the power effect only after store confirms activation
  power.effect();

  // Set TTL-based flags instead of setTimeout
  if (power.flagsToSet) {
    for (const flag of power.flagsToSet) {
      setTTLFlag(flag.key, flag.durationMs, poemId);
    }
  }

  // Track active effect (UI-only, non-serializable)
  // Use the power's longest flag duration, or 30s default
  const longestFlagDuration = power.flagsToSet?.length
    ? Math.max(...power.flagsToSet.map(f => f.durationMs))
    : 30000;
  activeEffects.push({
    poemId,
    powerName: power.name,
    startedAt: Date.now(),
    durationMs: longestFlagDuration,
  });

  // Emit event for visual/audio feedback
  eventBus.emit('poem:power_used', { poemId, powerName: power.name });

  return true;
}

/** Get currently active effects. */
export function getActiveEffects(): ActiveEffect[] {
  const now = Date.now();
  // Clean up expired effects
  for (let i = activeEffects.length - 1; i >= 0; i--) {
    if (now - activeEffects[i].startedAt > activeEffects[i].durationMs) {
      activeEffects.splice(i, 1);
    }
  }
  return [...activeEffects];
}

/** Get all poem power definitions (for UI display). */
export function getAllPoemPowers(): PoemPower[] {
  return Object.values(POEM_POWERS);
}
