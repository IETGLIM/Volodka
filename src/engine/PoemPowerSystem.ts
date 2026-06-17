/* ─── Volodka RPG – Poem Power System ───
   Each collected poem grants a unique ability.
   Powers have cooldowns (once per in-game hour).
   Стихи — это сила. Каждое собранное стихотворение даёт уникальную способность.

   §4 Fix: Replaced setTimeout flag cleanup with TTL-based expiry model.
   Flags are now stored in game store as ActiveEffect with expiryTimestamp,
   ensuring they survive save/load and are correctly cleaned up.

   §5 Fix: Reverse-effect tracking for temporary skill/stat boosts.
   When TTL flags expire, reverseOnExpiry entries are applied so that
   temporary boosts (e.g. +persuasion) are correctly reverted.
   processExpiredTTLFlags() is now called from GameOrchestrator's game loop.
   activeEffects is cleared on game reset via resetAllPoemEffects().
*/

import { eventBus } from '@/engine/EventBus';
import {
  dispatchGameAction,
  getGameSnapshot,
  tryActivatePoemPower,
} from '@/engine/GameActionDispatcher';
import { partitionExpiredActiveTTLFlags } from '@/shared/activeTTLFlags';
export type { ActiveTTLFlag } from '@/shared/activeTTLFlags';
import { getSynergyReverseOnExpiry } from '@/config/poemSynergies';
import {
  recordPoemRhythm,
  tryApplyPoemSynergy,
} from '@/engine/poemPower/applyPoemSynergy';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import { isTrainablePlayerSkill, warnInvalidValue } from '@/shared/validation/typeGuards';
import {
  scalePoemPowerDurationMs,
  scalePoemPowerSkillDelta,
} from '@/engine/skills/passiveSkillModifiers';

function snap() {
  return getGameSnapshot();
}

function addSkill(skill: TrainablePlayerSkill, amount: number) {
  const snapshot = snap();
  const scaled = scalePoemPowerSkillDelta(
    amount,
    snapshot.playerState.progression.unlockedSkills,
    snapshot.playerState.flags,
    snapshot.playerState.skills.coding,
  );
  dispatchGameAction({ type: 'player/addSkill', skill, amount: scaled });
}

function addEnergy(amount: number) {
  dispatchGameAction({ type: 'player/addEnergy', amount });
}

function addStress(amount: number) {
  dispatchGameAction({ type: 'player/addStress', amount });
}

function addKarma(amount: number) {
  dispatchGameAction({ type: 'player/addKarma', amount });
}

function setFlag(key: string, value: boolean) {
  dispatchGameAction({ type: 'player/setFlag', key, value });
}

function setNpcRelation(npcId: string, delta: number) {
  dispatchGameAction({ type: 'player/setNpcRelation', npcId, delta });
}

function upsertTTLFlags(entries: Array<{ key: string; durationMs: number; poemId: string }>): void {
  if (entries.length === 0) return;
  const snapshot = snap();
  const now = Date.now();
  dispatchGameAction({
    type: 'poem/upsertTTLFlags',
    flags: entries.map(({ key, durationMs, poemId }) => ({
      key,
      poemId,
      expiryTimestamp:
        now
        + scalePoemPowerDurationMs(
          durationMs,
          snapshot.playerState.progression.unlockedSkills,
          snapshot.playerState.flags,
        ),
    })),
  });
}

function removeTTLFlags(keys: string[]): void {
  if (keys.length === 0) return;
  dispatchGameAction({ type: 'poem/removeTTLFlags', keys });
}

/* ─── Power definition ─── */
/** A single reversible effect entry — applied in reverse when the TTL flag expires */
export interface ReverseOnExpiryEntry {
  type: 'skill' | 'energy' | 'stress' | 'karma' | 'npcRelation';
  key?: string;
  value: number;
}

export interface PoemPower {
  poemId: string;
  name: string;
  description: string;
  cooldownMs: number;
  /** Optional act override for presentation (defaults from poem id). */
  act?: 1 | 2 | 3;
  /** Optional color theme override for FX (defaults from poem id). */
  colorTheme?: 'act1' | 'act2' | 'act3' | 'combat' | 'defense';
  /** Immediate effects (skill boosts, karma, etc.) */
  effect: () => void;
  /** TTL-based flags to set — will be stored with expiryTimestamp for save/load safety */
  flagsToSet?: Array<{ key: string; durationMs: number }>;
  /** Effects to reverse when TTL flags expire (for temporary skill/stat boosts) */
  reverseOnExpiry?: ReverseOnExpiryEntry[];
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

/** Reset all poem effects — call from saveSlice on game reset.
 *  Clears the non-serializable activeEffects array and all TTL flags in the store. */
export function resetAllPoemEffects(): void {
  activeEffects.length = 0;
  dispatchGameAction({ type: 'poem/clearAllEffects' });
}

let unsubPoemReset: (() => void) | null = null;

/** Re-bind after EventBus dispose (StrictMode / HMR). */
export function bindPoemResetListener(): void {
  unsubPoemReset?.();
  unsubPoemReset = eventBus.on('poem:reset_all_effects', () => {
    activeEffects.length = 0;
  });
}

bindPoemResetListener();

/** How often (ms) the game loop should call processExpiredTTLFlags */
export function getTTLCheckInterval(): number {
  return 1000;
}

/* ─── Helper: process expired TTL flags (call from game loop or on load) ─── */
export function processExpiredTTLFlags(): void {
  const flags = snap().activeTTLFlags ?? {};
  const now = Date.now();
  const { expired } = partitionExpiredActiveTTLFlags(flags, now);

  if (expired.length === 0) return;

  for (const f of expired) {
    setFlag(f.key, false);

    const power = POEM_POWERS[f.poemId];
    const reverseOnExpiry = power?.reverseOnExpiry ?? getSynergyReverseOnExpiry(f.poemId);
    if (reverseOnExpiry) {
      for (const rev of reverseOnExpiry) {
        switch (rev.type) {
          case 'skill':
            if (rev.key) {
              if (isTrainablePlayerSkill(rev.key)) {
                addSkill(rev.key, rev.value);
              } else {
                warnInvalidValue('poem reverseOnExpiry skill', rev.key);
              }
            }
            break;
          case 'energy':
            addEnergy(rev.value);
            break;
          case 'stress':
            addStress(rev.value);
            break;
          case 'karma':
            addKarma(rev.value);
            break;
        }
      }
    }

    for (let i = activeEffects.length - 1; i >= 0; i--) {
      if (activeEffects[i].poemId === f.poemId) {
        activeEffects.splice(i, 1);
      }
    }

    eventBus.emit('poem:power_expired', {
      flagKey: f.key,
      poemId: f.poemId,
      expiredAt: now,
    });
  }

  removeTTLFlags(expired.map((f) => f.key));
}

/* ─── Power definitions ─── */
const POEM_POWERS: Record<string, PoemPower> = {
  poem_1: {
    poemId: 'poem_1',
    name: 'Правда Глас',
    description: 'Обнажить скрытую правду в диалоге. Следующая проверка убеждения автоматически проходит.',
    cooldownMs: 60000,
    effect: () => {
      addSkill('persuasion', 3);
    },
    flagsToSet: [{ key: 'truth_voice_active', durationMs: 30000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'persuasion', value: -3 }],
  },
  poem_2: {
    poemId: 'poem_2',
    name: 'Второе Дыхание',
    description: 'Возродиться из отчаяния. Восстанавливает 30 энергии и снимает 20 стресса.',
    cooldownMs: 90000,
    effect: () => {
      addEnergy(30);
      addStress(-20);
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
      const relations = snap().npcRelations;
      if (relations.length > 0) {
        const best = relations.reduce((a, b) => (a.value > b.value ? a : b));
        setNpcRelation(best.npcId, 15);
      }
    },
  },
  poem_5: {
    poemId: 'poem_5',
    name: 'Штормовой Ветер',
    description: 'Прорвать преграды. +5 к интуиции и логике на 30 секунд.',
    cooldownMs: 90000,
    effect: () => {
      addSkill('intuition', 5);
      addSkill('logic', 5);
    },
    flagsToSet: [{ key: 'storm_wind_active', durationMs: 30000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'intuition', value: -5 }, { type: 'skill', key: 'logic', value: -5 }],
  },
  poem_6: {
    poemId: 'poem_6',
    name: 'Слово Мощь',
    description: 'Сила поэтического слова. +4 к навыку письма и убеждения.',
    cooldownMs: 60000,
    effect: () => {
      addSkill('writing', 4);
      addSkill('persuasion', 4);
    },
    flagsToSet: [{ key: 'word_power_active', durationMs: 30000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'writing', value: -4 }, { type: 'skill', key: 'persuasion', value: -4 }],
  },
  poem_7: {
    poemId: 'poem_7',
    name: 'Детский Взгляд',
    description: 'Увидеть мир глазами ребёнка. Раскрывает скрытые стихи в текущей локации.',
    cooldownMs: 180000,
    effect: () => {
      addSkill('intuition', 3);
      eventBus.emit('ui:exploration_message', { text: '👁 Детский Взгляд раскрывает скрытое...' });
    },
    flagsToSet: [{ key: 'child_gaze_active', durationMs: 45000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'intuition', value: -3 }],
  },
  poem_8: {
    poemId: 'poem_8',
    name: 'Прорыв',
    description: 'Свершить невозможное. Следующая проверка кодинга проходит автоматически.',
    cooldownMs: 120000,
    effect: () => {
      addSkill('coding', 5);
    },
    flagsToSet: [{ key: 'breakthrough_active', durationMs: 30000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'coding', value: -5 }],
  },
  poem_9: {
    poemId: 'poem_9',
    name: 'Шутово Слово',
    description: 'Обернуть насмешку в оружие. Враги теряют уверенность, +3 кармы.',
    cooldownMs: 60000,
    effect: () => {
      addKarma(3);
      addSkill('persuasion', 2);
    },
    flagsToSet: [{ key: 'jester_word_active', durationMs: 30000 }],
    reverseOnExpiry: [{ type: 'karma', value: -3 }, { type: 'skill', key: 'persuasion', value: -2 }],
  },
  poem_10: {
    poemId: 'poem_10',
    name: 'Каменная Кожа',
    description: 'Стать твёрже камня. Снижает входящий стресс на 50% на 60 секунд.',
    cooldownMs: 90000,
    effect: () => {
      addStress(-15);
    },
    flagsToSet: [{ key: 'stone_skin_active', durationMs: 60000 }],
  },
  poem_11: {
    poemId: 'poem_11',
    name: 'Голос Улиц',
    description: 'Услышать шёпот города. Раскрывает слухи и подсказки о квестах.',
    cooldownMs: 120000,
    effect: () => {
      addSkill('intuition', 4);
      eventBus.emit('ui:exploration_message', { text: '🌆 Голос Улиц шепчет секреты...' });
    },
    flagsToSet: [{ key: 'city_voice_active', durationMs: 45000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'intuition', value: -4 }],
  },
  poem_12: {
    poemId: 'poem_12',
    name: 'Звездный Путь',
    description: 'Путеводная звезда ведёт к цели. Автоматически завершает одно задание квеста.',
    cooldownMs: 180000,
    effect: () => {
      addSkill('coding', 3);
    },
    flagsToSet: [{ key: 'star_path_active', durationMs: 30000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'coding', value: -3 }],
  },
  poem_13: {
    poemId: 'poem_13',
    name: 'Последнее Слово',
    description: 'Произнести финальное слово. +8 кармы, но +10 стресса от тяжести правды.',
    cooldownMs: 120000,
    effect: () => {
      addKarma(8);
      addStress(10);
    },
  },
  poem_14: {
    poemId: 'poem_14',
    name: 'Глубокое Размышление',
    description: 'Погрузиться в глубокое раздумье. +5 к письму и логике, но +5 стресса от тяжести мыслей.',
    cooldownMs: 180000,
    effect: () => {
      addSkill('writing', 5);
      addSkill('logic', 5);
      addStress(5);
      eventBus.emit('ui:exploration_message', { text: '🧠 Глубокое Размышление... Мысли тяжелеют, но обретают ясность.' });
    },
    flagsToSet: [{ key: 'deep_thought_active', durationMs: 45000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'writing', value: -5 }, { type: 'skill', key: 'logic', value: -5 }, { type: 'stress', value: -5 }],
  },
  poem_15: {
    poemId: 'poem_15',
    name: 'Ироничный Шёпот',
    description: 'Прошептать иронию и раскрыть скрытые смыслы. Показывает скрытые варианты диалогов, +4 к убеждению.',
    cooldownMs: 150000,
    effect: () => {
      addSkill('persuasion', 4);
      eventBus.emit('ui:exploration_message', { text: '😏 Ироничный Шёпот раскрывает скрытые смыслы...' });
    },
    flagsToSet: [{ key: 'ironic_whisper_active', durationMs: 45000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'persuasion', value: -4 }],
  },
  poem_16: {
    poemId: 'poem_16',
    name: 'Эхо Детства',
    description: 'Вспомнить детство и обрести силы. +40 энергии и +3 эмпатии от эха памяти.',
    cooldownMs: 120000,
    effect: () => {
      addEnergy(40);
      addSkill('empathy', 3);
      eventBus.emit('ui:exploration_message', { text: '👶 Эхо Детства... Воспоминания придают сил.' });
    },
    flagsToSet: [{ key: 'childhood_echo_active', durationMs: 30000 }],
    reverseOnExpiry: [{ type: 'energy', value: -40 }, { type: 'skill', key: 'empathy', value: -3 }],
  },
  poem_17: {
    poemId: 'poem_17',
    name: 'Невидимая Связь',
    description: 'Почувствовать невидимую нить между людьми. +10 к отношению ближайшего NPC и -10 стресса.',
    cooldownMs: 150000,
    effect: () => {
      const relations = snap().npcRelations;
      if (relations.length > 0) {
        const best = relations.reduce((a, b) => (a.value > b.value ? a : b));
        setNpcRelation(best.npcId, 10);
      }
      addStress(-10);
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
      addKarma(12);
      addStress(-25);
      eventBus.emit('ui:exploration_message', { text: '⚖️ Возвращение Правды... Истина освобождает.' });
    },
    flagsToSet: [{ key: 'truth_return_active', durationMs: 30000 }],
  },
  poem_19: {
    poemId: 'poem_19',
    name: 'Неоновая Панихида',
    description: 'Память павших даёт силу. +8 кармы, +30 энергии и временное улучшение эмпатии на +4. Неон горит в их честь.',
    cooldownMs: 160000,
    effect: () => {
      addKarma(8);
      addEnergy(30);
      addSkill('empathy', 4);
      eventBus.emit('ui:exploration_message', { text: '🕯️ Неоновая Панихида... Память павших наполняет силой.' });
    },
    flagsToSet: [{ key: 'neon_requiem_active', durationMs: 35000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'empathy', value: -4 }],
  },
  poem_20: {
    poemId: 'poem_20',
    name: 'Чип в затылке',
    description: 'Отказ от контроля пробуждает волю. +15 к хакингу, -20 стресса, временное сопротивление корпоративным флагам.',
    cooldownMs: 170000,
    effect: () => {
      addSkill('coding', 15);
      addStress(-20);
      eventBus.emit('ui:exploration_message', { text: '🔓 Чип в затылке... Свобода думать — величайшая сила.' });
    },
    flagsToSet: [{ key: 'chip_resistance_active', durationMs: 40000 }, { key: 'corporate_immune', durationMs: 40000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'coding', value: -15 }],
  },
  poem_21: {
    poemId: 'poem_21',
    name: 'Белая Река, Чёрный Кабель',
    description: 'Древняя река смывает корпоративную скверну. +20 кармы, полное восстановление энергии, очистка негативных статус-эффектов.',
    cooldownMs: 200000,
    effect: () => {
      const energy = snap().playerState.energy;
      addKarma(20);
      addEnergy(Math.max(0, 100 - energy));
      addStress(-50);
      addSkill('persuasion', 5);
      eventBus.emit('ui:exploration_message', { text: '🌊 Белая Река... Древняя сила смывает тьму. Чёрный Кабель разорван.' });
    },
    flagsToSet: [{ key: 'white_river_purification', durationMs: 45000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'persuasion', value: -5 }],
  },
  poem_tolpa: {
    poemId: 'poem_tolpa',
    name: 'Портвейн у костра',
    description: 'Сила ЧК: −30 стресса, +6 кармы, +3 эмпатии. Укрытие для души, когда система давит.',
    cooldownMs: 150000,
    effect: () => {
      addKarma(6);
      addStress(-30);
      addSkill('empathy', 3);
      eventBus.emit('ui:exploration_message', { text: '🏕️ Портвейн у костра... Чекисты держат тыл.' });
    },
    flagsToSet: [{ key: 'tolpa_campfire_blessing', durationMs: 40000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'empathy', value: -3 }],
  },
  poem_act6_04: {
    poemId: 'poem_act6_04',
    name: 'Сопротивление',
    description: 'Стих как щит: +10 к кодингу, обход защиты сервера в квестах акта 6.',
    cooldownMs: 180000,
    effect: () => {
      addSkill('coding', 10);
      addKarma(8);
      eventBus.emit('ui:exploration_message', { text: '⚔️ Сопротивление... Код становится оружием.' });
    },
    flagsToSet: [{ key: 'resistance_poem_active', durationMs: 45000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'coding', value: -10 }],
  },
  poem_act6_05: {
    poemId: 'poem_act6_05',
    name: 'Предатель',
    description: 'Правда режет глубже кода: +8 к логике, открывает ядро «Надзора» в квестах.',
    cooldownMs: 180000,
    effect: () => {
      addSkill('logic', 8);
      addStress(-15);
      eventBus.emit('ui:exploration_message', { text: '🗡️ Предатель... Истина открывает двери.' });
    },
    flagsToSet: [{ key: 'traitor_truth_active', durationMs: 45000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'logic', value: -8 }],
  },
  poem_act6_07: {
    poemId: 'poem_act6_07',
    name: 'Финал — не конец',
    description: 'Конец системы — начало свободы: +12 кармы, отключает защиту ядра в финале.',
    cooldownMs: 200000,
    effect: () => {
      addKarma(12);
      addSkill('writing', 6);
      addStress(-25);
      eventBus.emit('ui:exploration_message', { text: '🌅 Финал — не конец... Система падает. Люди остаются.' });
    },
    flagsToSet: [{ key: 'system_shutdown_poem_active', durationMs: 60000 }],
    reverseOnExpiry: [{ type: 'skill', key: 'writing', value: -6 }],
  },
};

/* ─── Public API ─── */

/** Get the power definition for a poem. Returns undefined if poem has no power. */
export function getPoemPower(poemId: string): PoemPower | undefined {
  return POEM_POWERS[poemId];
}

/** Check if a poem power can be used (not on cooldown, poem is collected). */
export function canUsePower(poemId: string): boolean {
  const state = snap();
  if (!state.collectedPoems.includes(poemId)) return false;

  const powerState = state.poemPowers[poemId];
  if (!powerState) return true;

  const now = Date.now();
  const elapsed = now - powerState.lastUsed;
  return elapsed >= powerState.cooldownMs;
}

/** Get remaining cooldown in ms for a poem power. Returns 0 if ready. */
export function getCooldownRemaining(poemId: string): number {
  const powerState = snap().poemPowers[poemId];
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

  const success = tryActivatePoemPower(poemId);
  if (!success) return false;

  const activatedAt = Date.now();

  // Execute the power effect only after store confirms activation
  power.effect();

  // Rhythm synergy — second poem within 5s of the first triggers combo bonus
  tryApplyPoemSynergy(poemId, activatedAt);

  // Set TTL-based flags in one store update when a poem sets multiple flags
  if (power.flagsToSet) {
    for (const flag of power.flagsToSet) {
      setFlag(flag.key, true);
    }
    upsertTTLFlags(
      power.flagsToSet.map((flag) => ({
        key: flag.key,
        durationMs: flag.durationMs,
        poemId,
      })),
    );
  }

  // Track active effect (UI-only, non-serializable)
  // Use the power's longest flag duration, or 30s default
  const longestFlagDuration = power.flagsToSet?.length
    ? Math.max(
        ...power.flagsToSet.map((f) =>
          scalePoemPowerDurationMs(
            f.durationMs,
            snap().playerState.progression.unlockedSkills,
            snap().playerState.flags,
          ),
        ),
      )
    : 30000;
  activeEffects.push({
    poemId,
    powerName: power.name,
    startedAt: Date.now(),
    durationMs: longestFlagDuration,
  });

  // Emit event for visual/audio feedback
  eventBus.emit('poem:power_used', { poemId, powerName: power.name });

  recordPoemRhythm(poemId, activatedAt);

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
