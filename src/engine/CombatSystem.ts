/* ─── Volodka RPG – Turn-based Combat System ───
   Бой — это не только сила. Это мудрость.
   Each collected poem = unique combat ability.

   §3.1 Fixes:
   1. Buff/debuff duration system — replaces implicit flags
   2. Enemy special attacks — each type has 2 unique specials
   3. Cumulative flee mechanic — +15% per failed attempt + skill influence
   4. Poem ability cooldowns — reuse after N turns instead of single-use
*/

import { eventBus } from '@/engine/EventBus';
import { getGameStore } from '@/store/gameStore';
import { createInventoryItem } from '@/data/items';
import { getPoemDisplayName, getPoemDescription } from '@/data/unifiedPoemRegistry';
import type {
  EnemyType,
  CombatEnemy,
  CombatState,
  CombatLogEntry,
  CombatAction,
  CombatBuff,
  BuffEffect,
  EnemySpecialAttack,
  SideEffect,
  CombatReward,
} from '@/shared/types/game';

/** Maximum combat log entries — prevents unbounded memory growth */
const MAX_COMBAT_LOG = 50;

/** Append entries to combat log, trimming oldest if over the limit */
function appendLog(current: CombatLogEntry[], ...entries: CombatLogEntry[]): CombatLogEntry[] {
  const combined = [...current, ...entries];
  return combined.length > MAX_COMBAT_LOG ? combined.slice(-MAX_COMBAT_LOG) : combined;
}

/* ═══════════════════════════════════════════════════════════════
   §1 — BUFF / DEBUFF DURATION SYSTEM
   ═══════════════════════════════════════════════════════════════ */

/** Create a buff/debuff with a unique id */
function createBuff(
  state: CombatState,
  name: string,
  source: string,
  kind: 'buff' | 'debuff',
  target: 'player' | 'enemy',
  duration: number,
  effect: BuffEffect,
): CombatBuff {
  const id = `${source}_${state._nextBuffId}`;
  return { id, name, source, kind, target, duration, effect };
}

/** Add a buff to combat state with stack limit and mutual exclusion rules.
 *  Max 2 active buffs per target. defense_reduction and damage_multiplier
 *  on the same target are mutually exclusive (the weaker one is removed). */
function addBuff(state: CombatState, buff: CombatBuff): CombatState {
  let filtered = state.buffs.filter((b) => b.source !== buff.source || b.target !== buff.target || b.effect.type !== buff.effect.type);

  // Mutual exclusion: defense_reduction and damage_multiplier are incompatible on the same target
  const MUTUALLY_EXCLUSIVE: Record<BuffEffect['type'], BuffEffect['type'][]> = {
    defense_reduction: ['damage_multiplier'],
    damage_multiplier: ['defense_reduction'],
    skip_turn: [],
    stat_drain: [],
    defense_boost: [],
    damage_reduction: [],
    attack_boost: [],
    hp_drain_percent: [],
    silence_specials: [],
    defensive_verse: [],
  };
  const excluded = MUTUALLY_EXCLUSIVE[buff.effect.type] ?? [];
  for (const excludedType of excluded) {
    filtered = filtered.filter((b) => !(b.target === buff.target && b.effect.type === excludedType));
  }

  // Stack limit: max 2 buffs per target (excluding the one being refreshed)
  const existingForTarget = filtered.filter((b) => b.target === buff.target);
  if (existingForTarget.length >= 2) {
    // Remove the oldest buff for this target to make room
    const oldestId = existingForTarget[0].id;
    filtered = filtered.filter((b) => b.id !== oldestId);
  }

  return { ...state, buffs: [...filtered, buff], _nextBuffId: state._nextBuffId + 1 };
}

/** Calculate total buff effect of a given type for a target */
function sumBuffEffect(state: CombatState, target: 'player' | 'enemy', effectType: BuffEffect['type']): number {
  return state.buffs
    .filter((b) => b.target === target && b.effect.type === effectType)
    .reduce((sum, b) => {
      if ('value' in b.effect) return sum + (b.effect as { type: string; value: number }).value;
      return sum;
    }, 0);
}

/** Check if target has a specific buff effect type */
function hasBuffEffect(state: CombatState, target: 'player' | 'enemy', effectType: BuffEffect['type']): boolean {
  return state.buffs.some((b) => b.target === target && b.effect.type === effectType);
}

/** Process buff durations at start of a target's turn. Returns updated state + log entries */
function tickBuffs(state: CombatState, target: 'player' | 'enemy'): { state: CombatState; expiredLog: CombatLogEntry[] } {
  const expiredLog: CombatLogEntry[] = [];
  const remaining: CombatBuff[] = [];

  for (const buff of state.buffs) {
    if (buff.target !== target) {
      // Not this target's buff — keep unchanged
      remaining.push(buff);
      continue;
    }

    const newDuration = buff.duration - 1;
    if (newDuration <= 0) {
      expiredLog.push({
        turn: state.turn,
        text: `⏳ ${buff.name} рассеивается.`,
        type: 'buff_expire',
      });
    } else {
      remaining.push({ ...buff, duration: newDuration });
    }
  }

  return {
    state: { ...state, buffs: remaining },
    expiredLog,
  };
}

/* ═══════════════════════════════════════════════════════════════
   §2 — ENEMY TEMPLATES & SPECIAL ATTACKS
   ═══════════════════════════════════════════════════════════════ */

interface EnemyTemplate {
  type: EnemyType;
  name: string;
  emoji: string;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  targetsStat: 'logic' | 'energy' | 'karma' | 'empathy';
  lootTable: string[];
  xpReward: number;
  specialAttacks: EnemySpecialAttack[];
}

/** Системный Демон — focusses on logic disruption */
const DAEMON_SPECIALS: EnemySpecialAttack[] = [
  {
    id: 'daemon_system_crash',
    name: 'Сбой Системы',
    description: 'Перегружает логику, оглушая игрока',
    chance: 0.3,
    cooldown: 3,
    execute: (state, enemy) => {
      const buff1 = createBuff(state, 'Сбой Системы', 'daemon_system_crash', 'debuff', 'player', 1, { type: 'skip_turn' });
      let s = addBuff(state, buff1);
      const buff2 = createBuff(s, 'Сбой Системы: Логика', 'daemon_system_crash_logic', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'logic', value: 2 });
      s = addBuff(s, buff2);

      return {
        ...s,
        log: [
          ...s.log,
          {
            turn: state.turn,
            text: `${enemy.emoji} Сбой Системы! Логика под ударом, вы оглушены!`,
            type: 'enemy_special' as const,
          },
        ],
      };
    },
  },
  {
    id: 'daemon_digital_prison',
    name: 'Цифровая Тюрьма',
    description: 'Запирает игрока, снижая защиту',
    chance: 0.25,
    cooldown: 4,
    execute: (state, enemy) => {
      // Use a vulnerability effect: positive value on defense_reduction means player takes MORE damage
      // damage_reduction with negative semantics -> we model as defense_reduction on player (reduces their defense)
      // But getPlayerDamageReduction clamps to >=0, so we use attack_boost on enemy instead for the same effect
      const buff = createBuff(state, 'Цифровая Тюрьма', 'daemon_digital_prison', 'debuff', 'player', 2, { type: 'defense_reduction', value: 0.3 });
      const s = addBuff(state, buff);
      return {
        ...s,
        log: [
          ...s.log,
          {
            turn: state.turn,
            text: `${enemy.emoji} Цифровая Тюрьма! Ваша защита снижена на 2 хода!`,
            type: 'enemy_special' as const,
          },
        ],
      };
    },
  },
];

/** Корпоративный Голем — focusses on energy drain and defense */
const GOLEM_SPECIALS: EnemySpecialAttack[] = [
  {
    id: 'golem_corporate_pressure',
    name: 'Корпоративное Давление',
    description: 'Усиливает оборону на 2 хода',
    chance: 0.35,
    cooldown: 3,
    execute: (state, enemy) => {
      const buff = createBuff(state, 'Корпоративное Давление', 'golem_corporate_pressure', 'buff', 'enemy', 2, { type: 'defense_boost', value: 8 });
      const s = addBuff(state, buff);
      return {
        ...s,
        log: [
          ...s.log,
          {
            turn: state.turn,
            text: `${enemy.emoji} Корпоративное Давление! Защита врага усилена на 2 хода!`,
            type: 'enemy_special' as const,
          },
        ],
      };
    },
  },
  {
    id: 'golem_resource_writeoff',
    name: 'Списание Ресурсов',
    description: 'Выкачивает энергию игрока',
    chance: 0.3,
    cooldown: 3,
    execute: (state, enemy) => {
      return {
        ...state,
        _sideEffects: [{ type: 'addEnergy', value: -15 } as SideEffect],
        log: [
          ...state.log,
          {
            turn: state.turn,
            text: `${enemy.emoji} Списание Ресурсов! Вы теряете 15 энергии!`,
            type: 'enemy_special' as const,
          },
        ],
      };
    },
  },
];

/** Теневой Агент — focusses on stealth and karma manipulation */
const AGENT_SPECIALS: EnemySpecialAttack[] = [
  {
    id: 'agent_shadow_strike',
    name: 'Удар из Тени',
    description: 'Критический удар из невидимости (2x урон)',
    chance: 0.3,
    cooldown: 3,
    execute: (state, enemy) => {
      // Use buff-aware attack (includes getEnemyAttackBoost)
      const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
      const enemyDmgMultiplier = getEnemyDamageMultiplier(state);
      let damage = Math.max(1, Math.floor(effectiveAttack * enemyDmgMultiplier * (0.85 + Math.random() * 0.3)));
      damage = damage * 2; // critical from stealth

      // Apply player defense_boost buff
      const playerDefBoost = getPlayerDefenseBoost(state);
      if (playerDefBoost > 0) {
        damage = Math.max(1, damage - playerDefBoost);
      }

      // Apply buff-based damage reduction
      const playerDmgReduction = getPlayerDamageReduction(state);
      if (playerDmgReduction > 0) {
        damage = Math.max(1, Math.floor(damage * (1 - playerDmgReduction)));
      }

      // Apply player vulnerability from defense_reduction debuffs
      const playerVulnerability = getPlayerVulnerability(state);
      if (playerVulnerability > 0) {
        damage = Math.max(1, Math.floor(damage * (1 + playerVulnerability)));
      }

      const newPlayerHp = Math.max(0, state.playerHp - damage);
      return {
        ...state,
        playerHp: newPlayerHp,
        log: [
          ...state.log,
          {
            turn: state.turn,
            text: `${enemy.emoji} Удар из Тени! Критический удар: -${damage} HP!`,
            type: 'enemy_special' as const,
            damage,
          },
        ],
      };
    },
  },
  {
    id: 'agent_mind_poison',
    name: 'Отравление Разума',
    description: 'Отравляет карму, снижая её на 5 + дебафф',
    chance: 0.25,
    cooldown: 4,
    execute: (state, enemy) => {
      const buff = createBuff(state, 'Отравление Разума', 'agent_mind_poison', 'debuff', 'player', 3, { type: 'stat_drain', stat: 'karma', value: 2 });
      const s = addBuff(state, buff);
      return {
        ...s,
        _sideEffects: [{ type: 'addKarma', value: -5 } as SideEffect],
        log: [
          ...s.log,
          {
            turn: state.turn,
            text: `${enemy.emoji} Отравление Разума! Карма -5, яд действует 3 хода!`,
            type: 'enemy_special' as const,
          },
        ],
      };
    },
  },
];

const ENEMY_TEMPLATES: Record<EnemyType, EnemyTemplate> = {
  system_daemon: {
    type: 'system_daemon',
    name: 'Системный Демон',
    emoji: '👾',
    baseHp: 40,
    baseAttack: 12,
    baseDefense: 4,
    baseSpeed: 8,
    targetsStat: 'logic',
    lootTable: ['daemon_core', 'code_fragment', 'energy_drink'],
    xpReward: 25,
    specialAttacks: DAEMON_SPECIALS,
  },
  corporate_golem: {
    type: 'corporate_golem',
    name: 'Корпоративный Голем',
    emoji: '🤖',
    baseHp: 80,
    baseAttack: 8,
    baseDefense: 10,
    baseSpeed: 3,
    targetsStat: 'energy',
    lootTable: ['corporate_badge', 'encrypted_usb', 'coffee'],
    xpReward: 40,
    specialAttacks: GOLEM_SPECIALS,
  },
  shadow_agent: {
    type: 'shadow_agent',
    name: 'Теневой Агент',
    emoji: '🥷',
    baseHp: 55,
    baseAttack: 10,
    baseDefense: 6,
    baseSpeed: 6,
    targetsStat: 'karma',
    lootTable: ['shadow_cloak', 'poem_fragment', 'painkiller'],
    xpReward: 35,
    specialAttacks: AGENT_SPECIALS,
  },
  /* ─── G13: New enemy types for variety ─── */
  data_phantom: {
    type: 'data_phantom',
    name: 'Фантом Данных',
    emoji: '👻',
    baseHp: 35,
    baseAttack: 14,
    baseDefense: 2,
    baseSpeed: 10,
    targetsStat: 'logic',
    lootTable: ['code_fragment', 'energy_drink', 'poem_fragment'],
    xpReward: 30,
    specialAttacks: [
      {
        id: 'phantom_data_corruption',
        name: 'Искажение Данных',
        description: 'Повреждает логику и кодинг игрока',
        chance: 0.35,
        cooldown: 3,
        execute: (state, enemy) => {
          const buff = createBuff(state, 'Искажение Данных', 'phantom_data_corruption', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'logic', value: 3 });
          const s = addBuff(state, buff);
          return {
            ...s,
            log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Искажение Данных! Кодинг под ударом!`, type: 'enemy_special' as const }],
          };
        },
      },
      {
        id: 'phantom_phase_shift',
        name: 'Фазовый Сдвиг',
        description: 'Уклоняется от следующей атаки',
        chance: 0.3,
        cooldown: 4,
        execute: (state, enemy) => {
          const buff = createBuff(state, 'Фазовый Сдвиг', 'phantom_phase_shift', 'buff', 'enemy', 1, { type: 'defense_boost', value: 20 });
          const s = addBuff(state, buff);
          return {
            ...s,
            log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Фазовый Сдвиг! Враг становится неуловимым!`, type: 'enemy_special' as const }],
          };
        },
      },
    ],
  },
  code_inquisitor: {
    type: 'code_inquisitor',
    name: 'Инквизитор Кода',
    emoji: '⚖️',
    baseHp: 70,
    baseAttack: 9,
    baseDefense: 8,
    baseSpeed: 4,
    targetsStat: 'empathy',
    lootTable: ['corporate_badge', 'access_card', 'herbal_tea'],
    xpReward: 45,
    specialAttacks: [
      {
        id: 'inquisitor_audit',
        name: 'Аудит Совести',
        description: 'Проверяет карму и штрафует за добрые дела',
        chance: 0.3,
        cooldown: 3,
        execute: (state, enemy) => {
          const store = getGameStore();
          const karma = store.playerState.karma;
          let damage = karma > 50 ? Math.floor(karma * 0.15) : 5;
          const playerDefBoost = getPlayerDefenseBoost(state);
          if (playerDefBoost > 0) damage = Math.max(1, damage - playerDefBoost);
          const playerDmgReduction = getPlayerDamageReduction(state);
          if (playerDmgReduction > 0) damage = Math.max(1, Math.floor(damage * (1 - playerDmgReduction)));
          const playerVulnerability = getPlayerVulnerability(state);
          if (playerVulnerability > 0) damage = Math.max(1, Math.floor(damage * (1 + playerVulnerability)));
          const newPlayerHp = Math.max(1, state.playerHp - damage);
          return { ...state, playerHp: newPlayerHp, log: [...state.log, { turn: state.turn, text: `${enemy.emoji} Аудит Совести! Ваши добрые дела обращаются против вас: -${damage} HP!`, type: 'enemy_special' as const, damage }] };
        },
      },
      {
        id: 'inquisitor_purge',
        name: 'Очищение Памяти',
        description: 'Стирает баффы игрока',
        chance: 0.25,
        cooldown: 5,
        execute: (state, enemy) => {
          const playerBuffs = state.buffs.filter((b) => b.target === 'player');
          const purgedCount = playerBuffs.length;
          const remaining = state.buffs.filter((b) => b.target !== 'player');
          return { ...state, buffs: remaining, log: [...state.log, { turn: state.turn, text: `${enemy.emoji} Очищение Памяти! ${purgedCount > 0 ? `Стерто ${purgedCount} ваших усилений!` : 'Ваши мысли чисты.'}`, type: 'enemy_special' as const }] };
        },
      },
    ],
  },
  /* ─── Task 8: New enemy types ─── */
  guild_enforcer: {
    type: 'guild_enforcer',
    name: 'Каратель Гильдии',
    emoji: '🛡️',
    baseHp: 90,
    baseAttack: 11,
    baseDefense: 12,
    baseSpeed: 3,
    targetsStat: 'energy',
    lootTable: ['corporate_badge', 'hacked_terminal_key', 'combat_stim'],
    xpReward: 55,
    specialAttacks: [
      {
        id: 'enforcer_shield_bash',
        name: 'Удар Щитом',
        description: 'Тяжёлый удар щитом, оглушает на 1 ход',
        chance: 0.3,
        cooldown: 3,
        execute: (state, enemy) => {
          const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
          let damage = Math.max(1, Math.floor(effectiveAttack * 1.5 * (0.85 + Math.random() * 0.3)));
          const playerDmgReduction = getPlayerDamageReduction(state);
          if (playerDmgReduction > 0) damage = Math.max(1, Math.floor(damage * (1 - playerDmgReduction)));
          const playerVulnerability = getPlayerVulnerability(state);
          if (playerVulnerability > 0) damage = Math.max(1, Math.floor(damage * (1 + playerVulnerability)));
          const buff = createBuff(state, 'Оглушение', 'enforcer_shield_bash', 'debuff', 'player', 1, { type: 'skip_turn' });
          const s = addBuff(state, buff);
          const newPlayerHp = Math.max(0, s.playerHp - damage);
          return { ...s, playerHp: newPlayerHp, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Удар Щитом! -${damage} HP, оглушение!`, type: 'enemy_special' as const, damage }] };
        },
      },
      {
        id: 'enforcer_fortify',
        name: 'Укрепление',
        description: 'Усиливает защиту и атаку на 2 хода',
        chance: 0.25,
        cooldown: 4,
        execute: (state, enemy) => {
          const buff1 = createBuff(state, 'Укрепление: защита', 'enforcer_fortify_def', 'buff', 'enemy', 2, { type: 'defense_boost', value: 6 });
          let s = addBuff(state, buff1);
          const buff2 = createBuff(s, 'Укрепление: атака', 'enforcer_fortify_atk', 'buff', 'enemy', 2, { type: 'attack_boost', value: 4 });
          s = addBuff(s, buff2);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Укрепление! Защита и атака усилены на 2 хода!`, type: 'enemy_special' as const }] };
        },
      },
    ],
  },
  data_wraith: {
    type: 'data_wraith',
    name: 'Призрак Данных',
    emoji: '👁️',
    baseHp: 45,
    baseAttack: 15,
    baseDefense: 3,
    baseSpeed: 12,
    targetsStat: 'logic',
    lootTable: ['code_fragment', 'digital_ghost_trace', 'energy_drink'],
    xpReward: 40,
    specialAttacks: [
      {
        id: 'wraith_soul_drain',
        name: 'Похищение Души',
        description: 'Крадёт HP игрока и восстанавливает свои',
        chance: 0.35,
        cooldown: 3,
        execute: (state, enemy) => {
          const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
          let damage = Math.max(1, Math.floor(effectiveAttack * 1.2 * (0.85 + Math.random() * 0.3)));
          const playerDmgReduction = getPlayerDamageReduction(state);
          if (playerDmgReduction > 0) damage = Math.max(1, Math.floor(damage * (1 - playerDmgReduction)));
          const newPlayerHp = Math.max(0, state.playerHp - damage);
          const healAmount = Math.floor(damage * 0.5);
          const newEnemyHp = Math.min(enemy.maxHp, enemy.hp + healAmount);
          return { ...state, playerHp: newPlayerHp, enemy: { ...enemy, hp: newEnemyHp }, log: [...state.log, { turn: state.turn, text: `${enemy.emoji} Похищение Души! -${damage} HP, враг исцеляется на ${healAmount}!`, type: 'enemy_special' as const, damage }] };
        },
      },
      {
        id: 'wraith_digital_fever',
        name: 'Цифровая Лихорадка',
        description: 'Заражает игрока цифровой лихорадкой — 15% HP/ход, 3 хода',
        chance: 0.3,
        cooldown: 4,
        execute: (state, enemy) => {
          const buff = createBuff(state, 'Цифровая Лихорадка', 'wraith_digital_fever', 'debuff', 'player', 3, { type: 'hp_drain_percent', value: 0.15 });
          const s = addBuff(state, buff);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Цифровая Лихорадка! Вы заражены: -15% HP/ход на 3 хода!`, type: 'enemy_special' as const }] };
        },
      },
    ],
  },
  censor_drone: {
    type: 'censor_drone',
    name: 'Дрон-Цензор',
    emoji: '📡',
    baseHp: 55,
    baseAttack: 8,
    baseDefense: 9,
    baseSpeed: 7,
    targetsStat: 'empathy',
    lootTable: ['circuit_board', 'data_chip', 'nano_patch'],
    xpReward: 35,
    specialAttacks: [
      {
        id: 'drone_silence',
        name: 'Завеса Тишины',
        description: 'Блокирует специальные атаки игрока на 2 хода',
        chance: 0.3,
        cooldown: 4,
        execute: (state, enemy) => {
          const buff = createBuff(state, 'Завеса Тишины', 'drone_silence', 'debuff', 'player', 2, { type: 'silence_specials' });
          const s = addBuff(state, buff);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Завеса Тишины! Ваши способности заблокированы на 2 хода!`, type: 'enemy_special' as const }] };
        },
      },
      {
        id: 'drone_scan',
        name: 'Сканирование',
        description: 'Сканирует уязвимости, повышая свою атаку',
        chance: 0.35,
        cooldown: 3,
        execute: (state, enemy) => {
          const buff = createBuff(state, 'Сканирование', 'drone_scan', 'buff', 'enemy', 2, { type: 'attack_boost', value: 5 });
          const s = addBuff(state, buff);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Сканирование! Атака врага усилена на 2 хода!`, type: 'enemy_special' as const }] };
        },
      },
    ],
  },
  poetry_hunter: {
    type: 'poetry_hunter',
    name: 'Охотник за Стихами',
    emoji: '🗡️',
    baseHp: 75,
    baseAttack: 13,
    baseDefense: 7,
    baseSpeed: 9,
    targetsStat: 'karma',
    lootTable: ['poem_fragment', 'old_poetry_book', 'shadow_cloak'],
    xpReward: 60,
    specialAttacks: [
      {
        id: 'hunter_verse_steal',
        name: 'Кража Стиха',
        description: 'Крадёт силу стихов — снижает навык письма на 3',
        chance: 0.3,
        cooldown: 3,
        execute: (state, enemy) => {
          const buff = createBuff(state, 'Кража Стиха', 'hunter_verse_steal', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'logic', value: 3 });
          const s = addBuff(state, buff);
          return { ...s, _sideEffects: [{ type: 'addSkill', skill: 'writing', value: -2 } as SideEffect], log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Кража Стиха! Ваше писательство ослаблено!`, type: 'enemy_special' as const }] };
        },
      },
      {
        id: 'hunter_execution',
        name: 'Казнь Стихотворца',
        description: 'Мощный удар, увеличивающийся с каждым вашим стихом',
        chance: 0.25,
        cooldown: 4,
        execute: (state, enemy) => {
          const store = getGameStore();
          const poemCount = store.collectedPoems.length;
          const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
          let damage = Math.max(1, Math.floor(effectiveAttack * (1.5 + poemCount * 0.1) * (0.85 + Math.random() * 0.3)));
          const playerDmgReduction = getPlayerDamageReduction(state);
          if (playerDmgReduction > 0) damage = Math.max(1, Math.floor(damage * (1 - playerDmgReduction)));
          const playerVulnerability = getPlayerVulnerability(state);
          if (playerVulnerability > 0) damage = Math.max(1, Math.floor(damage * (1 + playerVulnerability)));
          const newPlayerHp = Math.max(0, state.playerHp - damage);
          return { ...state, playerHp: newPlayerHp, log: [...state.log, { turn: state.turn, text: `${enemy.emoji} Казнь Стихотворца! -${damage} HP! (бонус от ${poemCount} стихов)`, type: 'enemy_special' as const, damage }] };
        },
      },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════
   §3 — POEM COMBAT ABILITIES (with cooldowns)
   ═══════════════════════════════════════════════════════════════ */

interface PoemCombatAbility {
  poemId: string;
  name: string;
  description: string;
  /** Cooldown in turns before this ability can be reused */
  cooldown: number;
  /** Execute the poem ability, returning updated state.
   *  May include _sideEffects for deferred store mutations (P0-2.6). */
  execute: (state: CombatState) => CombatState;
}

const POEM_COMBAT_ABILITIES: Record<string, PoemCombatAbility> = {
  poem_1: {
    poemId: 'poem_1',
    name: 'Правда Глас',
    description: 'Обнажить слабость врага. Снижает защиту на 50% на 2 хода.',
    cooldown: 3,
    execute: (state) => {
      const buff = createBuff(state, 'Правда Глас', 'poem_1', 'debuff', 'enemy', 2, { type: 'defense_reduction', value: 0.5 });
      const s = addBuff(state, buff);
      return {
        ...s,
        enemyDefenseReduction: 0.5, // sync flat field for backward compat
        log: [
          ...s.log,
          { turn: state.turn, text: '✦ Правда Глас обнажает слабость врага! Защита снижена на 2 хода.', type: 'player_power' as const },
        ],
      };
    },
  },
  poem_2: {
    poemId: 'poem_2',
    name: 'Второе Дыхание',
    description: 'Исцеление. Восстанавливает 40% максимального HP.',
    cooldown: 4,
    execute: (state) => {
      const healAmount = Math.floor(state.playerMaxHp * 0.4);
      return {
        ...state,
        playerHp: Math.min(state.playerMaxHp, state.playerHp + healAmount),
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Второе Дыхание! +${healAmount} HP`, type: 'player_power' as const, damage: healAmount },
        ],
      };
    },
  },
  poem_3: {
    poemId: 'poem_3',
    name: 'Путеводная Звезда',
    description: 'Ослепить врага. Пропускает следующий ход врага.',
    cooldown: 3,
    execute: (state) => {
      const buff = createBuff(state, 'Путеводная Звезда', 'poem_3', 'debuff', 'enemy', 1, { type: 'skip_turn' });
      const s = addBuff(state, buff);
      return {
        ...s,
        enemyDefending: true, // backward compat for old check
        log: [
          ...s.log,
          { turn: state.turn, text: '✦ Путеводная Звезда ослепляет врага!', type: 'player_power' as const },
        ],
      };
    },
  },
  poem_4: {
    poemId: 'poem_4',
    name: 'Память Сердец',
    description: 'Укрепить дух. Восстанавливает 25% HP и +5 кармы.',
    cooldown: 3,
    execute: (state) => {
      const healAmount = Math.floor(state.playerMaxHp * 0.25);
      return {
        ...state,
        playerHp: Math.min(state.playerMaxHp, state.playerHp + healAmount),
        _sideEffects: [{ type: 'addKarma', value: 5 } as SideEffect],
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Память Сердец! +${healAmount} HP, +5 кармы`, type: 'player_power' as const, damage: healAmount },
        ],
      };
    },
  },
  poem_5: {
    poemId: 'poem_5',
    name: 'Штормовой Ветер',
    description: 'Мощный удар. Наносит 200% урона от атаки.',
    cooldown: 3,
    execute: (state) => {
      const store = getGameStore();
      const playerAttack = store.playerState.skills.coding + store.playerState.skills.logic;
      const enemyDef = Math.max(0, state.enemy.defense * (1 - getEnemyDefenseReduction(state)));
      const damage = Math.max(1, Math.floor((playerAttack * 2 - enemyDef) * (0.9 + Math.random() * 0.2)));
      const newEnemyHp = Math.max(0, state.enemy.hp - damage);
      return {
        ...state,
        enemy: { ...state.enemy, hp: newEnemyHp },
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Штормовой Ветер! ${damage} урона!`, type: 'player_attack' as const, damage },
        ],
      };
    },
  },
  poem_6: {
    poemId: 'poem_6',
    name: 'Слово Мощь',
    description: 'Усилить атаку. Следующая атака нанесёт +50% урона (2 хода).',
    cooldown: 3,
    execute: (state) => {
      const buff = createBuff(state, 'Слово Мощь', 'poem_6', 'buff', 'player', 2, { type: 'damage_multiplier', value: 1.5 });
      const s = addBuff(state, buff);
      return {
        ...s,
        doubleAttack: true, // backward compat
        log: [
          ...s.log,
          { turn: state.turn, text: '✦ Слово Мощь! Следующая атака усилена на 2 хода!', type: 'player_power' as const },
        ],
      };
    },
  },
  poem_7: {
    poemId: 'poem_7',
    name: 'Детский Взгляд',
    description: 'Увидеть уязвимость. Снижает защиту врага на 30% на 2 хода и +3 интуиции.',
    cooldown: 3,
    execute: (state) => {
      const buff = createBuff(state, 'Детский Взгляд', 'poem_7', 'debuff', 'enemy', 2, { type: 'defense_reduction', value: 0.3 });
      const s = addBuff(state, buff);
      return {
        ...s,
        _sideEffects: [{ type: 'addSkill', skill: 'intuition', value: 3 } as SideEffect],
        log: [
          ...s.log,
          { turn: state.turn, text: '✦ Детский Взгляд раскрывает уязвимость! Защита врага -30% на 2 хода', type: 'player_power' as const },
        ],
      };
    },
  },
  poem_8: {
    poemId: 'poem_8',
    name: 'Прорыв',
    description: 'Прорвать оборону. Игнорирует защиту врага, наносит чистый урон.',
    cooldown: 4,
    execute: (state) => {
      const store = getGameStore();
      const playerAttack = store.playerState.skills.coding + store.playerState.skills.logic;
      const damage = Math.max(1, Math.floor(playerAttack * 1.5 * (0.9 + Math.random() * 0.2)));
      const newEnemyHp = Math.max(0, state.enemy.hp - damage);
      return {
        ...state,
        enemy: { ...state.enemy, hp: newEnemyHp },
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Прорыв! ${damage} чистого урона!`, type: 'player_attack' as const, damage },
        ],
      };
    },
  },
  poem_9: {
    poemId: 'poem_9',
    name: 'Мост Между Мирами',
    description: 'Двойная атака. Атакует дважды за этот ход.',
    cooldown: 4,
    execute: (state) => {
      const store = getGameStore();
      const playerAttack = store.playerState.skills.coding + store.playerState.skills.logic;
      const enemyDef = Math.max(0, state.enemy.defense * (1 - getEnemyDefenseReduction(state)));
      const dmg1 = Math.max(1, Math.floor((playerAttack - enemyDef) * (0.9 + Math.random() * 0.2)));
      const dmg2 = Math.max(1, Math.floor((playerAttack - enemyDef) * (0.9 + Math.random() * 0.2)));
      const totalDmg = dmg1 + dmg2;
      const newEnemyHp = Math.max(0, state.enemy.hp - totalDmg);
      return {
        ...state,
        enemy: { ...state.enemy, hp: newEnemyHp },
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Мост Между Мирами! Двойной удар: ${dmg1} + ${dmg2} = ${totalDmg} урона!`, type: 'player_attack' as const, damage: totalDmg },
        ],
      };
    },
  },
  poem_10: {
    poemId: 'poem_10',
    name: 'Каменная Кожа',
    description: 'Укрепить защиту. Получаемый урон снижен на 50% на 2 хода.',
    cooldown: 4,
    execute: (state) => {
      const buff = createBuff(state, 'Каменная Кожа', 'poem_10', 'buff', 'player', 2, { type: 'damage_reduction', value: 0.5 });
      const s = addBuff(state, buff);
      return {
        ...s,
        playerDefending: true, // backward compat for this turn
        log: [
          ...s.log,
          { turn: state.turn, text: '✦ Каменная Кожа! Получаемый урон снижен на 50% на 2 хода!', type: 'player_power' as const },
        ],
      };
    },
  },
  poem_11: {
    poemId: 'poem_11',
    name: 'Голос Улиц',
    description: 'Отнять энергию врага. Враг теряет 25% HP, вы получаете 15 энергии.',
    cooldown: 3,
    execute: (state) => {
      const drainAmount = Math.floor(state.enemy.maxHp * 0.25);
      const newEnemyHp = Math.max(0, state.enemy.hp - drainAmount);
      return {
        ...state,
        enemy: { ...state.enemy, hp: newEnemyHp },
        _sideEffects: [{ type: 'addEnergy', value: 15 } as SideEffect],
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Голос Улиц! Враг теряет ${drainAmount} HP, +15 энергии!`, type: 'player_attack' as const, damage: drainAmount },
        ],
      };
    },
  },
  poem_12: {
    poemId: 'poem_12',
    name: 'Звездный Путь',
    description: 'Космический удар. Наносит урон, зависящий от кармы.',
    cooldown: 3,
    execute: (state) => {
      const store = getGameStore();
      const karmaBonus = Math.floor(store.playerState.karma / 10);
      const playerAttack = store.playerState.skills.coding + store.playerState.skills.logic;
      const enemyDef = Math.max(0, state.enemy.defense * (1 - getEnemyDefenseReduction(state)));
      const damage = Math.max(1, Math.floor((playerAttack + karmaBonus * 2 - enemyDef) * (0.9 + Math.random() * 0.2)));
      const newEnemyHp = Math.max(0, state.enemy.hp - damage);
      return {
        ...state,
        enemy: { ...state.enemy, hp: newEnemyHp },
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Звездный Путь! ${damage} урона (карма-бонус: +${karmaBonus * 2})!`, type: 'player_attack' as const, damage },
        ],
      };
    },
  },
  poem_13: {
    poemId: 'poem_13',
    name: 'Последнее Слово',
    description: 'Финальный удар. +8 кармы, мощная атака.',
    cooldown: 4,
    execute: (state) => {
      const store = getGameStore();
      const playerAttack = store.playerState.skills.coding + store.playerState.skills.logic;
      const enemyDef = Math.max(0, state.enemy.defense * (1 - getEnemyDefenseReduction(state)));
      const damage = Math.max(1, Math.floor((playerAttack * 1.8 - enemyDef) * (0.9 + Math.random() * 0.2)));
      const newEnemyHp = Math.max(0, state.enemy.hp - damage);
      return {
        ...state,
        enemy: { ...state.enemy, hp: newEnemyHp },
        _sideEffects: [{ type: 'addKarma', value: 8 } as SideEffect],
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Последнее Слово! ${damage} урона, +8 кармы!`, type: 'player_attack' as const, damage },
        ],
      };
    },
  },
  poem_14: {
    poemId: 'poem_14',
    name: 'Молчание Глубин',
    description: 'Полностью восстанавливает HP, но +15 стресса.',
    cooldown: 5,
    execute: (state) => {
      return {
        ...state,
        playerHp: state.playerMaxHp,
        _sideEffects: [{ type: 'addStress', value: 15 } as SideEffect],
        log: [
          ...state.log,
          { turn: state.turn, text: '✦ Молчание Глубин! Полное исцеление, +15 стресса', type: 'player_power' as const },
        ],
      };
    },
  },
  poem_15: {
    poemId: 'poem_15',
    name: 'Тихий Шёпот',
    description: 'Враг теряет ход и получает 20% урона от замешательства.',
    cooldown: 3,
    execute: (state) => {
      const confusionDmg = Math.floor(state.enemy.maxHp * 0.2);
      const newEnemyHp = Math.max(0, state.enemy.hp - confusionDmg);
      const buff = createBuff(state, 'Тихий Шёпот', 'poem_15', 'debuff', 'enemy', 1, { type: 'skip_turn' });
      const s = addBuff({ ...state, enemy: { ...state.enemy, hp: newEnemyHp } }, buff);
      return {
        ...s,
        enemyDefending: true, // backward compat
        log: [
          ...s.log,
          { turn: state.turn, text: `✦ Тихий Шёпот! Враг в замешательстве, ${confusionDmg} урона!`, type: 'player_power' as const, damage: confusionDmg },
        ],
      };
    },
  },
  poem_16: {
    poemId: 'poem_16',
    name: 'Эхо Памяти',
    description: 'Повторяет последнее использованное стихотворение. Без дополнительного кулдауна.',
    cooldown: 5,
    execute: (state) => {
      // Find last used poem from cooldowns (highest remaining = most recently used)
      const cooldownEntries = Object.entries(state.powerCooldowns)
        .filter(([id, cd]) => cd > 0 && id !== 'poem_16');
      if (cooldownEntries.length > 0) {
        // Use the one with highest cooldown (most recently used)
        const lastUsed = cooldownEntries.sort((a, b) => b[1] - a[1])[0][0];
        const ability = POEM_COMBAT_ABILITIES[lastUsed];
        if (ability) {
          const result = ability.execute(state);
          return {
            ...result,
            log: [
              ...result.log.slice(0, -1), // remove last log entry from nested ability
              { turn: state.turn, text: `✦ Эхо Памяти повторяет: ${ability.name}!`, type: 'player_power' as const },
              ...result.log.slice(-1), // keep the actual effect log
            ],
          };
        }
      }
      return {
        ...state,
        log: [
          ...state.log,
          { turn: state.turn, text: '✦ Эхо Памяти... но нечего повторять.', type: 'info' as const },
        ],
      };
    },
  },
  poem_17: {
    poemId: 'poem_17',
    name: 'Невидимая Нить',
    description: 'Крадёт 30% максимального HP врага и восстанавливает ваше здоровье.',
    cooldown: 4,
    execute: (state) => {
      const stealAmount = Math.floor(state.enemy.maxHp * 0.3);
      const newEnemyHp = Math.max(0, state.enemy.hp - stealAmount);
      const newPlayerHp = Math.min(state.playerMaxHp, state.playerHp + stealAmount);
      return {
        ...state,
        enemy: { ...state.enemy, hp: newEnemyHp },
        playerHp: newPlayerHp,
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Невидимая Нить! Крадёт ${stealAmount} HP у врага!`, type: 'player_attack' as const, damage: stealAmount },
        ],
      };
    },
  },
  poem_18: {
    poemId: 'poem_18',
    name: 'Финальный Аккорд',
    description: 'Мощнейшая атака. Урон = (атака + карма×0.5) × 1.5. Трата 50% HP и 30 энергии.',
    cooldown: 6,
    execute: (state) => {
      const store = getGameStore();
      const playerAttack = store.playerState.skills.coding + store.playerState.skills.logic;
      const karmaBonus = Math.floor(store.playerState.karma * 0.5);
      const damage = Math.max(1, Math.floor((playerAttack + karmaBonus) * 1.5 * (0.9 + Math.random() * 0.2)));
      const newEnemyHp = Math.max(0, state.enemy.hp - damage);
      // Side effect: player sacrifices 50% of current HP
      const hpCost = Math.floor(state.playerHp * 0.5);
      const newPlayerHp = Math.max(1, state.playerHp - hpCost);
      return {
        ...state,
        enemy: { ...state.enemy, hp: newEnemyHp },
        playerHp: newPlayerHp,
        _sideEffects: [{ type: 'addEnergy', value: -30 } as SideEffect],
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Финальный Аккорд! ${damage} урона! Но цена: -${hpCost} HP, -30 энергии`, type: 'player_attack' as const, damage },
        ],
      };
    },
  },
  poem_19: {
    poemId: 'poem_19',
    name: 'Неоновая Панихида',
    description: 'Боевой гимн. Союзники получают +3 к атаке на 2 хода.',
    cooldown: 4,
    execute: (state) => {
      const buff = createBuff(state, 'Неоновая Панихида', 'poem_19', 'buff', 'player', 2, { type: 'attack_boost', value: 3 });
      const s = addBuff(state, buff);
      return {
        ...s,
        _sideEffects: [{ type: 'addKarma', value: 8 } as SideEffect],
        log: [
          ...s.log,
          { turn: state.turn, text: '✦ Неоновая Панихида! Боевой гимн воодушевляет! +8 кармы, +3 к атаке на 2 хода!', type: 'player_power' as const },
        ],
      };
    },
  },
  poem_20: {
    poemId: 'poem_20',
    name: 'Чип в затылке',
    description: 'Открывает скрытый путь. Пропускает ход врага и снижает его защиту на 30%.',
    cooldown: 4,
    execute: (state) => {
      const buff1 = createBuff(state, 'Чип в затылке: паралич', 'poem_20', 'debuff', 'enemy', 1, { type: 'skip_turn' });
      let s = addBuff(state, buff1);
      const buff2 = createBuff(s, 'Чип в затылке: слабость', 'poem_20_def', 'debuff', 'enemy', 2, { type: 'defense_reduction', value: 0.3 });
      s = addBuff(s, buff2);
      return {
        ...s,
        enemyDefending: true,
        _sideEffects: [
          { type: 'addStress', value: -15 } as SideEffect,
          { type: 'addSkill', skill: 'intuition', value: 5 } as SideEffect,
        ],
        log: [
          ...s.log,
          { turn: state.turn, text: '✦ Чип в затылке! Враг парализован, защита -30% на 2 хода! -15 стресса, +5 интуиции!', type: 'player_power' as const },
        ],
      };
    },
  },
  poem_21: {
    poemId: 'poem_21',
    name: 'Белая Река, Чёрный Кабель',
    description: 'Перегрузка системы. Наносит чистый урон, игнорируя всю защиту.',
    cooldown: 5,
    execute: (state) => {
      const store = getGameStore();
      // Note: +5 coding and +5 logic are pending as _sideEffects below;
      // account for them in the damage calculation since they haven't been applied yet.
      const playerAttack = store.playerState.skills.coding + store.playerState.skills.logic + 10;
      const damage = Math.max(1, Math.floor(playerAttack * 2.0 * (0.9 + Math.random() * 0.2)));
      const newEnemyHp = Math.max(0, state.enemy.hp - damage);
      return {
        ...state,
        enemy: { ...state.enemy, hp: newEnemyHp },
        _sideEffects: [
          { type: 'addSkill', skill: 'coding', value: 5 } as SideEffect,
          { type: 'addSkill', skill: 'logic', value: 5 } as SideEffect,
        ],
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Белая Река, Чёрный Кабель! Системная перегрузка: ${damage} чистого урона! +5 кодинг, +5 логика!`, type: 'player_attack' as const, damage },
        ],
      };
    },
  },
  poem_22: {
    poemId: 'poem_22',
    name: 'Бесконечный Коридор',
    description: 'Затягивает врага в бесконечный коридор. Пропускает ход врага и снижает его защиту на 25% на 2 хода.',
    cooldown: 4,
    execute: (state) => {
      const buff1 = createBuff(state, 'Бесконечный Коридор: потеря', 'poem_22', 'debuff', 'enemy', 1, { type: 'skip_turn' });
      let s = addBuff(state, buff1);
      const buff2 = createBuff(s, 'Бесконечный Коридор: слабость', 'poem_22_def', 'debuff', 'enemy', 2, { type: 'defense_reduction', value: 0.25 });
      s = addBuff(s, buff2);
      return {
        ...s,
        enemyDefending: true,
        _sideEffects: [
          { type: 'addStress', value: -12 } as SideEffect,
          { type: 'addSkill', skill: 'intuition', value: 3 } as SideEffect,
        ],
        log: [
          ...s.log,
          { turn: state.turn, text: '✦ Бесконечный Коридор! Враг затерян в коридоре, защита -25% на 2 хода! -12 стресса, +3 интуиции!', type: 'player_power' as const },
        ],
      };
    },
  },
  poem_23: {
    poemId: 'poem_23',
    name: 'Ветер Высот',
    description: 'Ветер свободы обрушивается на врага. Наносит 180% урона и +4 к интуиции.',
    cooldown: 4,
    execute: (state) => {
      const store = getGameStore();
      const playerAttack = store.playerState.skills.coding + store.playerState.skills.logic;
      const enemyDef = Math.max(0, state.enemy.defense * (1 - getEnemyDefenseReduction(state)));
      const damage = Math.max(1, Math.floor((playerAttack * 1.8 - enemyDef) * (0.9 + Math.random() * 0.2)));
      const newEnemyHp = Math.max(0, state.enemy.hp - damage);
      return {
        ...state,
        enemy: { ...state.enemy, hp: newEnemyHp },
        _sideEffects: [{ type: 'addSkill', skill: 'intuition', value: 4 } as SideEffect],
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Ветер Высот! ${damage} урона! +4 интуиции!`, type: 'player_attack' as const, damage },
        ],
      };
    },
  },
};

/* ═══════════════════════════════════════════════════════════════
   §3.5 — SIDE-EFFECT APPLICATION (P0-2.6)
   ═══════════════════════════════════════════════════════════════ */

/** Apply deferred side effects to the Zustand store.
 *  Called by the combat system's orchestration layer after execute()
 *  returns a CombatState with _sideEffects. */
export function applyCombatSideEffects(effects: SideEffect[] | undefined): void {
  if (!effects || effects.length === 0) return;
  const store = getGameStore();
  for (const eff of effects) {
    switch (eff.type) {
      case 'addEnergy': store.addEnergy(eff.value); break;
      case 'addKarma': store.addKarma(eff.value); break;
      case 'addStress': store.addStress(eff.value); break;
      case 'addSkill': store.addSkill(eff.skill as import('@/shared/types/game').TrainablePlayerSkill, eff.value); break;
      case 'addXp': store.addXp(eff.value); break;
      case 'setMode': store.setMode(eff.mode as any); break;
      case 'addPoemPower': store.activatePoemPower(eff.poemId); break;
    }
  }
}

/** Extract and apply side effects from a CombatState, returning the state
 *  with _sideEffects cleared so they never persist in stored combat state. */
function consumeSideEffects(state: CombatState): CombatState {
  applyCombatSideEffects(state._sideEffects);
  // Return state without _sideEffects so they don't accumulate
  const { _sideEffects, ...clean } = state;
  return clean;
}

/* ═══════════════════════════════════════════════════════════════
   §3.6 — POEM POWER COMBOS (Task 8)
   ═══════════════════════════════════════════════════════════════ */

/** Poem power combos: using certain powers in sequence creates combined effects.
 *  Returns null if no combo detected, otherwise returns the combo result. */
function checkPoemPowerCombo(
  firstPoemId: string,
  secondPoemId: string,
  state: CombatState,
): { state: CombatState; logEntry: CombatLogEntry } | null {
  const comboKey = [firstPoemId, secondPoemId].sort().join('+');

  const COMBOS: Record<string, {
    name: string;
    description: string;
    execute: (s: CombatState) => CombatState;
  }> = {
    'poem_1+poem_5': {
      name: 'Истина и Шторм',
      description: 'Правда Глас + Штормовой Ветер = обнажение + сокрушительный удар',
      execute: (s) => {
        const store = getGameStore();
        const playerAttack = store.playerState.skills.coding + store.playerState.skills.logic;
        const enemyDef = Math.max(0, s.enemy.defense * (1 - getEnemyDefenseReduction(s)) * 0.5);
        const damage = Math.max(1, Math.floor((playerAttack * 2.5 - enemyDef) * (0.9 + Math.random() * 0.2)));
        const newEnemyHp = Math.max(0, s.enemy.hp - damage);
        return { ...s, enemy: { ...s.enemy, hp: newEnemyHp }, log: [...s.log, { turn: s.turn, text: `✦✦ Истина и Шторм! ${damage} колоссального урона!`, type: 'poem_combo' as const, damage, isCritical: true }] };
      },
    },
    'poem_3+poem_10': {
      name: 'Звёздная Крепость',
      description: 'Путеводная Звезда + Каменная Кожа = неприступная защита',
      execute: (s) => {
        const buff1 = createBuff(s, 'Звёздная Крепость', 'poem_combo_fortress', 'buff', 'player', 3, { type: 'damage_reduction', value: 0.6 });
        let ns = addBuff(s, buff1);
        const buff2 = createBuff(ns, 'Звёздная Крепость: молитва', 'poem_combo_fortress2', 'buff', 'player', 3, { type: 'defensive_verse' });
        ns = addBuff(ns, buff2);
        return { ...ns, log: [...ns.log, { turn: s.turn, text: '✦✦ Звёздная Крепость! Неприступная защита на 3 хода!', type: 'poem_combo' as const }] };
      },
    },
    'poem_5+poem_13': {
      name: 'Последний Шторм',
      description: 'Штормовой Ветер + Последнее Слово = финальная буря',
      execute: (s) => {
        const store = getGameStore();
        const playerAttack = store.playerState.skills.coding + store.playerState.skills.logic;
        const karmaBonus = Math.floor(store.playerState.karma * 0.3);
        const damage = Math.max(1, Math.floor((playerAttack * 2.5 + karmaBonus) * (0.9 + Math.random() * 0.2)));
        const newEnemyHp = Math.max(0, s.enemy.hp - damage);
        return { ...s, enemy: { ...s.enemy, hp: newEnemyHp }, _sideEffects: [{ type: 'addKarma', value: 12 } as SideEffect], log: [...s.log, { turn: s.turn, text: `✦✦ Последний Шторм! ${damage} урона, +12 кармы!`, type: 'poem_combo' as const, damage, isCritical: true }] };
      },
    },
    'poem_2+poem_4': {
      name: 'Дыхание Сердец',
      description: 'Второе Дыхание + Память Сердец = тотальное исцеление',
      execute: (s) => {
        const healAmount = Math.floor(s.playerMaxHp * 0.7);
        const newPlayerHp = Math.min(s.playerMaxHp, s.playerHp + healAmount);
        return { ...s, playerHp: newPlayerHp, _sideEffects: [{ type: 'addKarma', value: 8 }, { type: 'addStress', value: -10 }] as SideEffect[], log: [...s.log, { turn: s.turn, text: `✦✦ Дыхание Сердец! +${healAmount} HP, +8 кармы, -10 стресса!`, type: 'poem_combo' as const }] };
      },
    },
  };

  const combo = COMBOS[comboKey];
  if (!combo) return null;

  const resultState = combo.execute(state);
  return {
    state: resultState,
    logEntry: { turn: state.turn, text: `💫 КОМБО СТИХОВ: ${combo.name}! ${combo.description}`, type: 'poem_combo' as const },
  };
}

/* ═══════════════════════════════════════════════════════════════
   §4 — COMBAT SYSTEM SINGLETON
   ═══════════════════════════════════════════════════════════════ */

let currentCombat: CombatState | null = null;
let combatListeners: Set<(state: CombatState) => void> = new Set();
/** Track the enemy-turn setTimeout so it can be cancelled on combat end/reset */
let enemyTurnTimer: ReturnType<typeof setTimeout> | null = null;
/** G12: Stack of storyNode IDs to return to after combat ends */
let combatReturnStack: string[] = [];

/** Cancel any pending enemy turn timer (call before resetting or ending combat) */
function clearEnemyTurnTimer(): void {
  if (enemyTurnTimer !== null) {
    clearTimeout(enemyTurnTimer);
    enemyTurnTimer = null;
  }
}

function notifyListeners() {
  if (currentCombat) {
    combatListeners.forEach((fn) => fn(currentCombat!));
  }
}

/** Subscribe to combat state changes. Returns unsubscribe function. */
export function subscribeToCombat(listener: (state: CombatState) => void): () => void {
  combatListeners.add(listener);
  if (currentCombat) listener(currentCombat);
  return () => combatListeners.delete(listener);
}

/** Get current combat state (read-only snapshot) */
export function getCombatState(): CombatState | null {
  return currentCombat;
}

/* ─── Derived Buff Calculations ─── */

/** Get total enemy defense reduction from buffs (0–1) */
function getEnemyDefenseReduction(state: CombatState): number {
  return Math.min(1, sumBuffEffect(state, 'enemy', 'defense_reduction') + state.enemyDefenseReduction);
}

/** Get player damage multiplier from buffs */
function getPlayerDamageMultiplier(state: CombatState): number {
  const fromBuffs = sumBuffEffect(state, 'player', 'damage_multiplier');
  return state.doubleAttack ? Math.max(fromBuffs, 1.5) : Math.max(fromBuffs, 1);
}

/** Get player damage reduction from buffs (0–1). Includes defensive_verse (30% flat). */
function getPlayerDamageReduction(state: CombatState): number {
  const fromBuffs = sumBuffEffect(state, 'player', 'damage_reduction');
  const hasDefensiveVerse = hasBuffEffect(state, 'player', 'defensive_verse');
  const verseReduction = hasDefensiveVerse ? 0.3 : 0;
  return Math.min(0.8, Math.max(0, fromBuffs + verseReduction));
}

/** Get player vulnerability from defense_reduction debuffs (0–1).
 *  When an enemy applies defense_reduction to the player, it means the player
 *  takes MORE damage — this function returns the additional damage fraction. */
function getPlayerVulnerability(state: CombatState): number {
  const fromDebuffs = sumBuffEffect(state, 'player', 'defense_reduction');
  return Math.min(0.6, Math.max(0, fromDebuffs));
}

/** Get enemy damage multiplier from buffs */
function getEnemyDamageMultiplier(state: CombatState): number {
  return Math.max(1, sumBuffEffect(state, 'enemy', 'damage_multiplier'));
}

/** Get enemy attack boost from buffs (flat bonus) */
function getEnemyAttackBoost(state: CombatState): number {
  return sumBuffEffect(state, 'enemy', 'attack_boost');
}

/** Get player attack boost from buffs (flat bonus) */
function getPlayerAttackBoost(state: CombatState): number {
  return sumBuffEffect(state, 'player', 'attack_boost');
}

/** Get player defense boost from buffs (flat bonus) */
function getPlayerDefenseBoost(state: CombatState): number {
  return sumBuffEffect(state, 'player', 'defense_boost');
}

/* ─── Player Stats from Game Store ─── */

function getPlayerAttack(): number {
  const store = getGameStore();
  return store.playerState.skills.coding + store.playerState.skills.logic;
}

function getPlayerDefense(): number {
  const store = getGameStore();
  return store.playerState.skills.empathy + Math.floor(store.playerState.energy / 10);
}

function getPlayerMaxHp(): number {
  const store = getGameStore();
  return store.playerState.energy * 2;
}

/* ─── Poem Power Cooldown Helpers ─── */

/** Tick all power cooldowns by 1. Returns updated cooldowns map. */
function tickPowerCooldowns(cooldowns: Record<string, number>): Record<string, number> {
  const updated: Record<string, number> = {};
  for (const [id, cd] of Object.entries(cooldowns)) {
    updated[id] = Math.max(0, cd - 1);
  }
  return updated;
}

/** Check if a poem power is available (collected + cooldown = 0) */
function isPowerAvailable(poemId: string, state: CombatState): boolean {
  const store = getGameStore();
  if (!store.collectedPoems.includes(poemId)) return false;
  if ((state.powerCooldowns[poemId] ?? 0) > 0) return false;
  return true;
}

/* ═══════════════════════════════════════════════════════════════
   §5 — START COMBAT
   ═══════════════════════════════════════════════════════════════ */

/** G13: Phase-based enemy availability.
 *  Early game (Act 1): system_daemon, corporate_golem
 *  Mid game (Act 1+, level 3+): +shadow_agent
 *  Late game (Act 2): +data_phantom, code_inquisitor
 *  If an enemy type is not available for the current phase, a fallback is used. */
function resolveEnemyType(requestedType: EnemyType): EnemyType {
  const store = getGameStore();
  const playerLevel = store.playerState.progression?.level ?? 1;
  const currentAct = store.playerState.progression?.currentAct ?? 1;

  // Phase restrictions by act and level
  const PHASE_UNLOCKS: Partial<Record<EnemyType, { minLevel: number; minAct: number }>> = {
    system_daemon: { minLevel: 1, minAct: 1 },
    corporate_golem: { minLevel: 1, minAct: 1 },
    shadow_agent: { minLevel: 3, minAct: 1 },
    data_phantom: { minLevel: 1, minAct: 2 },
    code_inquisitor: { minLevel: 1, minAct: 2 },
    guild_enforcer: { minLevel: 3, minAct: 1 },
    data_wraith: { minLevel: 1, minAct: 2 },
    censor_drone: { minLevel: 2, minAct: 1 },
    poetry_hunter: { minLevel: 5, minAct: 2 },
  };

  const unlock = PHASE_UNLOCKS[requestedType];
  if (!unlock) return requestedType; // Unknown types pass through

  if (playerLevel >= unlock.minLevel && currentAct >= unlock.minAct) {
    return requestedType; // Player meets requirements
  }

  // Fallback: pick the strongest available enemy type
  const fallbacks: EnemyType[] = ['system_daemon', 'corporate_golem'];
  if (playerLevel >= 2) fallbacks.push('censor_drone');
  if (playerLevel >= 3) fallbacks.push('shadow_agent', 'guild_enforcer');
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

export function startCombat(enemyType: EnemyType): CombatState {
  // Clear any stale timer from a previous combat
  clearEnemyTurnTimer();

  // G13: Resolve enemy type based on current act/level
  const resolvedType = resolveEnemyType(enemyType);

  const template = ENEMY_TEMPLATES[resolvedType];
  const store = getGameStore();

  // G12: Save current story node for return after combat
  const currentNodeId = store.currentNodeId;
  if (currentNodeId && store.mode === 'visual-novel') {
    combatReturnStack.push(currentNodeId);
  }

  // Scale enemy to player level
  const playerLevel = store.playerState.progression?.level ?? 1;
  const scaleFactor = 1 + (playerLevel - 1) * 0.12; // +12% per level

  const enemy: CombatEnemy = {
    type: template.type,
    name: template.name,
    emoji: template.emoji,
    maxHp: Math.floor(template.baseHp * scaleFactor),
    hp: Math.floor(template.baseHp * scaleFactor),
    attack: Math.floor(template.baseAttack * scaleFactor),
    defense: Math.floor(template.baseDefense * scaleFactor),
    speed: Math.floor(template.baseSpeed * scaleFactor),
    targetsStat: template.targetsStat,
    lootTable: template.lootTable,
    xpReward: Math.floor(template.xpReward * scaleFactor),
    specialCooldown: 0,
  };

  const playerMaxHp = getPlayerMaxHp();

  currentCombat = {
    enemy,
    playerHp: playerMaxHp,
    playerMaxHp,
    turn: 1,
    isPlayerTurn: true,
    playerDefending: false,
    enemyDefending: false,
    log: [
      { turn: 0, text: `${enemy.emoji} ${enemy.name} появляется!`, type: 'info' },
    ],
    status: 'active',
    powerCooldowns: {},
    enemyDefenseReduction: 0,
    doubleAttack: false,
    buffs: [],
    fleeAttempts: 0,
    _nextBuffId: 1,
    /* ── Enhanced Combat ── */
    comboCount: 0,
    maxCombo: 0,
    lastCritical: false,
    lastPoemPowersUsed: [null, null],
  };

  store.setMode('combat');
  eventBus.emit('combat:start', { enemyType });

  notifyListeners();
  return currentCombat;
}

/* ═══════════════════════════════════════════════════════════════
   §6 — PLAYER ACTIONS
   ═══════════════════════════════════════════════════════════════ */

export function playerAttack(): CombatState | null {
  if (!currentCombat || !currentCombat.isPlayerTurn || currentCombat.status !== 'active') return null;

  // Apply attack_boost buff to player
  const pAtk = getPlayerAttack() + getPlayerAttackBoost(currentCombat);
  const enemyDef = Math.max(0, currentCombat.enemy.defense * (1 - getEnemyDefenseReduction(currentCombat)));

  // Apply buff-based defense boost to enemy
  const enemyDefBoost = sumBuffEffect(currentCombat, 'enemy', 'defense_boost');
  const effectiveEnemyDef = enemyDef + enemyDefBoost;

  const multiplier = getPlayerDamageMultiplier(currentCombat);
  let damage = Math.max(1, Math.floor((pAtk * multiplier - effectiveEnemyDef) * (0.85 + Math.random() * 0.3)));

  /* ── Combo System: consecutive attacks increase damage ── */
  const newComboCount = currentCombat.comboCount + 1;
  let comboMultiplier = 1.0;
  if (newComboCount >= 3) comboMultiplier = 2.0;
  else if (newComboCount >= 2) comboMultiplier = 1.5;
  else if (newComboCount >= 1) comboMultiplier = 1.2;
  damage = Math.floor(damage * comboMultiplier);

  /* ── Critical Hit: 10% base + (writing skill * 2%) bonus, 1.8x damage ── */
  const store = getGameStore();
  const critChance = 0.10 + store.playerState.skills.writing * 0.02;
  const isCritical = Math.random() < Math.min(0.5, critChance);
  if (isCritical) {
    damage = Math.floor(damage * 1.8);
  }

  const newEnemyHp = Math.max(0, currentCombat.enemy.hp - damage);

  const logEntry: CombatLogEntry = {
    turn: currentCombat.turn,
    text: isCritical
      ? `⚔️💥 КРИТИЧЕСКИЙ УДАР! ${damage} урона!`
      : comboMultiplier > 1.0
        ? `⚔️🔥 Комбо x${newComboCount}! ${damage} урона!`
        : `⚔️ Атака! ${damage} урона!`,
    type: isCritical ? 'critical_hit' : comboMultiplier > 1.0 ? 'combo_hit' : 'player_attack',
    damage,
    isCritical,
    comboCount: newComboCount,
  };

  const newMaxCombo = Math.max(currentCombat.maxCombo, newComboCount);

  currentCombat = {
    ...currentCombat,
    enemy: { ...currentCombat.enemy, hp: newEnemyHp },
    doubleAttack: false,
    enemyDefenseReduction: getEnemyDefenseReduction(currentCombat),
    log: appendLog(currentCombat.log, logEntry),
    comboCount: newComboCount,
    maxCombo: newMaxCombo,
    lastCritical: isCritical,
  };

  eventBus.emit('combat:action', { action: 'attack', damage });
  eventBus.emit('camera:combat_impact', { intensity: isCritical ? 0.6 : 0.3 });

  // Check victory
  if (newEnemyHp <= 0) {
    return handleVictory();
  }

  // Enemy turn
  return endPlayerTurn();
}

export function playerDefend(): CombatState | null {
  if (!currentCombat || !currentCombat.isPlayerTurn || currentCombat.status !== 'active') return null;

  // Add a short-duration damage reduction buff
  const buff = createBuff(currentCombat, 'Защита', 'player_defend', 'buff', 'player', 1, { type: 'damage_reduction', value: 0.3 });
  const s = addBuff(currentCombat, buff);

  currentCombat = {
    ...s,
    playerDefending: true,
    comboCount: 0, // Defending resets combo
    log: appendLog(s.log, { turn: currentCombat.turn, text: '🛡️ Защита! Входящий урон снижен на 1 ход.', type: 'player_defend' }),
  };

  eventBus.emit('combat:action', { action: 'defend' });
  return endPlayerTurn();
}

export function playerUsePoemPower(poemId: string): CombatState | null {
  if (!currentCombat || !currentCombat.isPlayerTurn || currentCombat.status !== 'active') return null;

  // Check if silenced (censor_drone's silence_specials)
  if (hasBuffEffect(currentCombat, 'player', 'silence_specials')) return null;

  // Check if poem is collected and not on cooldown
  if (!isPowerAvailable(poemId, currentCombat)) return null;

  const ability = POEM_COMBAT_ABILITIES[poemId];
  if (!ability) return null;

  // Set cooldown
  const newCooldowns = { ...currentCombat.powerCooldowns, [poemId]: ability.cooldown };

  // Activate global cooldown in game store (for between-combat tracking)
  const store = getGameStore();
  store.activatePoemPower(poemId);

  // Track poem power usage for combo detection
  const lastPowers: [string | null, string | null] = [currentCombat.lastPoemPowersUsed[1], poemId];

  // Apply ability
  const abilityResult = ability.execute(currentCombat);

  // Check for poem power combos
  let comboLog: CombatLogEntry[] = [];
  if (lastPowers[0] && lastPowers[1]) {
    const comboResult = checkPoemPowerCombo(lastPowers[0], lastPowers[1], abilityResult);
    if (comboResult) {
      comboLog = [comboResult.logEntry];
      currentCombat = {
        ...consumeSideEffects(comboResult.state),
        powerCooldowns: newCooldowns,
        lastPoemPowersUsed: lastPowers,
        comboCount: currentCombat.comboCount + 1, // Poem powers maintain combo
      };
      currentCombat = { ...currentCombat, log: appendLog(currentCombat.log, ...comboLog) };
    } else {
      currentCombat = {
        ...consumeSideEffects(abilityResult),
        powerCooldowns: newCooldowns,
        lastPoemPowersUsed: lastPowers,
        comboCount: currentCombat.comboCount + 1,
      };
    }
  } else {
    currentCombat = {
      ...consumeSideEffects(abilityResult),
      powerCooldowns: newCooldowns,
      lastPoemPowersUsed: lastPowers,
      comboCount: currentCombat.comboCount + 1,
    };
  }

  eventBus.emit('combat:action', { action: 'poem_power' });
  eventBus.emit('poem:power_used', { poemId, powerName: ability.name });

  // Check if enemy died from the ability
  if (currentCombat.enemy.hp <= 0) {
    return handleVictory();
  }

  return endPlayerTurn();
}

/* ═══════════════════════════════════════════════════════════════
   §7 — FLEE MECHANIC (cumulative + skill influence)
   ═══════════════════════════════════════════════════════════════ */

export function playerFlee(): CombatState | null {
  if (!currentCombat || !currentCombat.isPlayerTurn || currentCombat.status !== 'active') return null;

  const store = getGameStore();
  const playerSpeed = store.playerState.skills.intuition + store.playerState.skills.logic;
  const enemySpeed = currentCombat.enemy.speed;

  // Base flee chance from speed comparison
  let fleeChance = 0.35 + (playerSpeed - enemySpeed) * 0.04;

  // Cumulative bonus: +15% per failed attempt
  fleeChance += currentCombat.fleeAttempts * 0.15;

  // Skill tree bonuses
  const unlockedSkills = store.playerState.progression?.unlockedSkills ?? [];
  // tech_4a "Цифровой Призрак" gives +20% flee chance
  if (unlockedSkills.includes('tech_4a')) fleeChance += 0.2;
  // social_2a "Дипломатия" gives +15% flee chance
  if (unlockedSkills.includes('social_2a')) fleeChance += 0.15;

  // Karma bonus: high karma gives slight advantage
  const karma = store.playerState.karma;
  if (karma >= 70) fleeChance += 0.05;

  // Clamp to [0.15, 0.95]
  const clampedChance = Math.max(0.15, Math.min(0.95, fleeChance));
  const fled = Math.random() < clampedChance;

  if (fled) {
    currentCombat = {
      ...currentCombat,
      status: 'fled',
      log: [
        ...currentCombat.log,
        { turn: currentCombat.turn, text: '🏃 Побег успешен! Вы вырвались из боя.', type: 'player_flee' },
      ],
    };

    eventBus.emit('combat:fled', { enemyType: currentCombat.enemy.type });
    eventBus.emit('combat:action', { action: 'flee' });

    // Return to exploration after a brief delay
    setTimeout(() => {
      getGameStore().setMode('exploration');
      clearEnemyTurnTimer();
      currentCombat = null;
      notifyListeners();
      eventBus.emit('combat:end', {});
    }, 1500);

    notifyListeners();
    return currentCombat;
  }

  // Failed flee — increment attempt counter
  currentCombat = {
    ...currentCombat,
    fleeAttempts: currentCombat.fleeAttempts + 1,
    log: [
      ...currentCombat.log,
      { turn: currentCombat.turn, text: `🏃 Побег не удался! (Шанс: ${Math.round(clampedChance * 100)}%, след. попытка: +15%)`, type: 'info' },
    ],
  };

  return endPlayerTurn();
}

/* ═══════════════════════════════════════════════════════════════
   §8 — ENEMY TURN (with special attacks & buff processing)
   ═══════════════════════════════════════════════════════════════ */

function endPlayerTurn(): CombatState {
  if (!currentCombat) return currentCombat!;

  // Tick player power cooldowns
  currentCombat = {
    ...currentCombat,
    isPlayerTurn: false,
    powerCooldowns: tickPowerCooldowns(currentCombat.powerCooldowns),
  };

  eventBus.emit('combat:turn', { turn: currentCombat.turn, isPlayerTurn: false });
  notifyListeners();

  // Enemy acts after a brief delay for visual feedback
  enemyTurnTimer = setTimeout(() => {
    enemyTurnTimer = null;
    executeEnemyTurn();
  }, 800);

  return currentCombat;
}

/** Transition to the player's turn.
 *  Processes player buffs at turn start (tick durations, stat drain, skip_turn check).
 *  If the player has a skip_turn debuff, auto-skips and transitions to enemy turn. */
function transitionToPlayerTurn(state: CombatState): void {
  if (!currentCombat) return;

  // ── Tick player buffs ──
  const { state: afterBuffTick, expiredLog } = tickBuffs(state, 'player');

  // ── Process stat drain debuffs on player ──
  const store = getGameStore();
  const drainLog: CombatLogEntry[] = [];
  for (const buff of afterBuffTick.buffs) {
    if (buff.target === 'player' && buff.effect.type === 'stat_drain') {
      const eff = buff.effect as { type: 'stat_drain'; stat: 'logic' | 'energy' | 'karma'; value: number };
      if (eff.stat === 'energy') {
        store.addEnergy(-eff.value);
        drainLog.push({ turn: afterBuffTick.turn, text: `💀 ${buff.name}: Энергия -${eff.value}`, type: 'info' });
      } else if (eff.stat === 'karma') {
        store.addKarma(-eff.value);
        drainLog.push({ turn: afterBuffTick.turn, text: `💀 ${buff.name}: Карма -${eff.value}`, type: 'info' });
      } else if (eff.stat === 'logic') {
        store.addSkill('logic', -eff.value);
        drainLog.push({ turn: afterBuffTick.turn, text: `💀 ${buff.name}: Логика -${eff.value}`, type: 'info' });
      }
    }
    /* ── Enhanced: Process hp_drain_percent (Цифровая лихорадка) ── */
    if (buff.target === 'player' && buff.effect.type === 'hp_drain_percent') {
      const eff = buff.effect as { type: 'hp_drain_percent'; value: number };
      const drainDmg = Math.max(1, Math.floor(state.playerMaxHp * eff.value));
      afterBuffTick.playerHp = Math.max(1, afterBuffTick.playerHp - drainDmg);
      drainLog.push({ turn: afterBuffTick.turn, text: `🦠 ${buff.name}: -${drainDmg} HP`, type: 'status_effect', damage: drainDmg });
    }
  }

  let workingState: CombatState = {
    ...afterBuffTick,
    turn: afterBuffTick.turn + 1,
    log: [...afterBuffTick.log, ...expiredLog, ...drainLog],
  };

  // ── Check if player is stunned (skip_turn debuff) ──
  if (hasBuffEffect(workingState, 'player', 'skip_turn')) {
    // Remove the skip_turn buff since it's been consumed
    const remaining = workingState.buffs.filter(
      (b) => !(b.target === 'player' && b.effect.type === 'skip_turn'),
    );
    workingState = {
      ...workingState,
      buffs: remaining,
      log: [
        ...workingState.log,
        { turn: workingState.turn, text: '😵 Вы оглушены и пропускаете ход!', type: 'info' },
      ],
    };

    // Set state and auto-skip after a brief delay for visual feedback
    currentCombat = {
      ...workingState,
      isPlayerTurn: true, // Briefly show it's "your turn" before skipping
    };

    eventBus.emit('combat:turn', { turn: currentCombat.turn, isPlayerTurn: true });
    notifyListeners();

    // Auto-skip after a brief delay
    enemyTurnTimer = setTimeout(() => {
      enemyTurnTimer = null;
      if (currentCombat && currentCombat.status === 'active') {
        endPlayerTurn();
      }
    }, 800);

    return;
  }

  // Normal: enable player turn
  currentCombat = {
    ...workingState,
    isPlayerTurn: true,
  };

  eventBus.emit('combat:turn', { turn: currentCombat.turn, isPlayerTurn: true });
  notifyListeners();
}

function executeEnemyTurn() {
  if (!currentCombat || currentCombat.status !== 'active') return;

  // ── Tick enemy buffs ──
  const { state: afterBuffTick, expiredLog } = tickBuffs(currentCombat, 'enemy');

  // ── Check if enemy is stunned (skip_turn debuff on enemy) ──
  if (hasBuffEffect(afterBuffTick, 'enemy', 'skip_turn') || afterBuffTick.enemyDefending) {
    // Remove the skip_turn buff since it's been consumed
    const remaining = afterBuffTick.buffs.filter(
      (b) => !(b.target === 'enemy' && b.effect.type === 'skip_turn'),
    );
    currentCombat = {
      ...afterBuffTick,
      enemyDefending: false,
      buffs: remaining,
      log: [
        ...afterBuffTick.log,
        ...expiredLog,
        { turn: afterBuffTick.turn, text: `${afterBuffTick.enemy.emoji} ${afterBuffTick.enemy.name} дезориентирован и пропускает ход!`, type: 'info' },
      ],
    };

    // Transition to player turn (handles buff processing and skip_turn check)
    transitionToPlayerTurn(currentCombat);
    return;
  }

  // Player buffs and stat drain are now processed at the start of the player's turn (see transitionToPlayerTurn)

  const store = getGameStore();

  let workingState: CombatState = {
    ...afterBuffTick,
    log: [...afterBuffTick.log, ...expiredLog],
  };

  // ── Enemy special attack check ──
  const template = ENEMY_TEMPLATES[workingState.enemy.type];
  const enemySpecialCooldown = workingState.enemy.specialCooldown;

  if (enemySpecialCooldown <= 0 && template.specialAttacks.length > 0) {
    // Try special attacks (check each, use first that procs)
    for (const special of template.specialAttacks) {
      if (Math.random() < special.chance) {
        const specialResult = special.execute(workingState, workingState.enemy);
        workingState = consumeSideEffects(specialResult);
        workingState = {
          ...workingState,
          enemy: { ...workingState.enemy, specialCooldown: special.cooldown },
        };
        // Skip basic attack this turn
        gotoEnemyTurnEnd(workingState);
        return;
      }
    }
  }

  // ── Enemy basic attack ──
  // Apply enemy attack_boost buff (flat bonus)
  const enemyAtkBoost = getEnemyAttackBoost(workingState);
  const effectiveEnemyAttack = workingState.enemy.attack + enemyAtkBoost;

  // Apply enemy damage_multiplier buff
  const enemyDmgMultiplier = getEnemyDamageMultiplier(workingState);

  let enemyDamage = Math.max(1, Math.floor(effectiveEnemyAttack * enemyDmgMultiplier * (0.85 + Math.random() * 0.3)));

  // Player defense reduces damage
  if (workingState.playerDefending) {
    const playerDef = getPlayerDefense();
    enemyDamage = Math.max(1, Math.floor(enemyDamage * 0.5 - playerDef * 0.3));
  }

  // Apply player defense_boost buff (flat damage reduction)
  const playerDefBoost = getPlayerDefenseBoost(workingState);
  if (playerDefBoost > 0) {
    enemyDamage = Math.max(1, enemyDamage - playerDefBoost);
  }

  // Apply buff-based damage reduction
  const playerDmgReduction = getPlayerDamageReduction(workingState);
  if (playerDmgReduction > 0) {
    enemyDamage = Math.max(1, Math.floor(enemyDamage * (1 - playerDmgReduction)));
  }

  // Apply player vulnerability from defense_reduction debuffs (e.g. Цифровая Тюрьма)
  const playerVulnerability = getPlayerVulnerability(workingState);
  if (playerVulnerability > 0) {
    enemyDamage = Math.max(1, Math.floor(enemyDamage * (1 + playerVulnerability)));
  }

  // Apply spiritual branch bonus (resilience)
  const spiritualLevel = store.playerState.progression?.unlockedSkills?.filter(
    (id) => id.startsWith('spiritual_'),
  ).length ?? 0;
  if (spiritualLevel > 0) {
    enemyDamage = Math.max(1, Math.floor(enemyDamage * (1 - spiritualLevel * 0.05)));
  }

  const newPlayerHp = Math.max(0, workingState.playerHp - enemyDamage);

  // Enemy also targets a specific stat (basic attack debuff)
  const targetedStat = workingState.enemy.targetsStat;
  let statEffectText = '';
  if (targetedStat === 'logic') {
    if (Math.random() < 0.3) {
      store.addSkill('logic', -1);
      statEffectText = ' Логика -1!';
    }
  } else if (targetedStat === 'energy') {
    if (Math.random() < 0.4) {
      store.addEnergy(-5);
      statEffectText = ' Энергия -5!';
    }
  } else if (targetedStat === 'karma') {
    if (Math.random() < 0.3) {
      store.addKarma(-3);
      statEffectText = ' Карма -3!';
    }
  }

  currentCombat = {
    ...workingState,
    playerHp: newPlayerHp,
    playerDefending: false,
    comboCount: 0, // Taking damage resets combo
    enemy: {
      ...workingState.enemy,
      specialCooldown: Math.max(0, workingState.enemy.specialCooldown - 1),
    },
    log: [
      ...workingState.log,
      {
        turn: workingState.turn,
        text: `${workingState.enemy.emoji} ${workingState.enemy.name} атакует! -${enemyDamage} HP${statEffectText}`,
        type: 'enemy_attack',
        damage: enemyDamage,
      },
    ],
  };

  eventBus.emit('camera:combat_shake', { intensity: 0.2 });

  // Check defeat
  if (newPlayerHp <= 0) {
    handleDefeat();
    return;
  }

  // Transition to player turn (handles buff processing and skip_turn check)
  transitionToPlayerTurn(currentCombat);
}

/** Helper to finalize enemy turn after a special attack */
function gotoEnemyTurnEnd(state: CombatState) {
  // Stat drain is now processed at the start of the player's turn (see transitionToPlayerTurn)

  currentCombat = {
    ...state,
    playerDefending: false,
    enemy: {
      ...state.enemy,
      specialCooldown: Math.max(0, state.enemy.specialCooldown - 1),
    },
  };

  // Check defeat (some specials deal damage directly)
  if (currentCombat.playerHp <= 0) {
    handleDefeat();
    return;
  }

  // Transition to player turn (handles buff processing and skip_turn check)
  transitionToPlayerTurn(currentCombat);
}

/* ═══════════════════════════════════════════════════════════════
   §9 — VICTORY / DEFEAT
   ═══════════════════════════════════════════════════════════════ */

function handleVictory(): CombatState {
  if (!currentCombat) return currentCombat!;

  const store = getGameStore();
  const enemy = currentCombat.enemy;

  // Karma reward (increased with combo)
  const comboBonus = Math.min(currentCombat.maxCombo * 2, 10);
  const karmaGained = 3 + Math.floor(Math.random() * 5) + comboBonus;
  store.addKarma(karmaGained);

  // XP reward
  const xpGained = enemy.xpReward + comboBonus;
  addXp(xpGained);

  // Loot roll (higher combo = better loot chance)
  const lootChance = 0.6 + currentCombat.maxCombo * 0.05;
  const lootItems: string[] = [];
  if (enemy.lootTable.length > 0 && Math.random() < Math.min(0.9, lootChance)) {
    const lootItemId = enemy.lootTable[Math.floor(Math.random() * enemy.lootTable.length)];
    const item = createInventoryItem(lootItemId);
    store.addItem(item);
    lootItems.push(lootItemId);
  }

  // Skill experience
  const skillXp: Partial<Record<import('@/shared/types/game').TrainablePlayerSkill, number>> = {};
  skillXp.coding = Math.floor(xpGained * 0.3);
  skillXp.logic = Math.floor(xpGained * 0.2);
  skillXp.writing = Math.floor(xpGained * 0.1);

  const rewards: import('@/shared/types/game').CombatReward = {
    xp: xpGained,
    karma: karmaGained,
    lootItems,
    skillXp,
  };

  currentCombat = {
    ...currentCombat,
    status: 'victory',
    rewards,
    log: [
      ...currentCombat.log,
      {
        turn: currentCombat.turn,
        text: `🏆 Победа! +${karmaGained} кармы, +${xpGained} опыта${lootItems.length > 0 ? `, найден предмет!` : ''}${currentCombat.maxCombo >= 3 ? ` Макс. комбо: x${currentCombat.maxCombo}!` : ''}`,
        type: 'victory',
      },
    ],
  };

  eventBus.emit('combat:victory', {
    enemyType: enemy.type,
    xpGained,
    karmaGained,
    lootItemId: lootItems[0],
  });

  notifyListeners();

  // Return to story node or exploration after delay (G12)
  setTimeout(() => {
    const returnNodeId = combatReturnStack.pop();
    if (returnNodeId) {
      store.setMode('visual-novel');
      store.setCurrentNodeId(returnNodeId);
      store.setShowStoryOverlay(true);
      eventBus.emit('combat:story_continue', { nodeId: returnNodeId });
    } else {
      store.setMode('exploration');
    }
    clearEnemyTurnTimer();
    currentCombat = null;
    notifyListeners();
    eventBus.emit('combat:end', {});
  }, 3000);

  return currentCombat;
}

function handleDefeat(): void {
  if (!currentCombat) return;

  const store = getGameStore();
  const enemy = currentCombat.enemy;

  // Not game over — just penalties
  const energyLost = 15 + Math.floor(Math.random() * 10);
  const karmaLost = 5 + Math.floor(Math.random() * 5);
  store.addEnergy(-energyLost);
  store.addKarma(-karmaLost);

  currentCombat = {
    ...currentCombat,
    status: 'defeat',
    log: [
      ...currentCombat.log,
      {
        turn: currentCombat.turn,
        text: `💀 Поражение... -${energyLost} энергии, -${karmaLost} кармы. Вы отступаете.`,
        type: 'defeat',
      },
    ],
  };

  eventBus.emit('combat:defeat', {
    enemyType: enemy.type,
    energyLost,
    karmaLost,
  });

  notifyListeners();

  // Return to story node or exploration after defeat (G12)
  setTimeout(() => {
    const returnNodeId = combatReturnStack.pop();
    if (returnNodeId) {
      store.setMode('visual-novel');
      store.setCurrentNodeId(returnNodeId);
      store.setShowStoryOverlay(true);
      eventBus.emit('combat:story_continue', { nodeId: returnNodeId });
    } else {
      store.setMode('exploration');
    }
    clearEnemyTurnTimer();
    currentCombat = null;
    notifyListeners();
    eventBus.emit('combat:end', {});
  }, 3000);
}

/* ═══════════════════════════════════════════════════════════════
   §10 — XP / LEVELING
   ═══════════════════════════════════════════════════════════════ */

function addXp(amount: number): void {
  const store = getGameStore();
  store.addXp(amount);
}

export function calculateXpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.25, level - 1));
}

/* ═══════════════════════════════════════════════════════════════
   §11 — GET AVAILABLE POEM POWERS (cooldown-based)
   ═══════════════════════════════════════════════════════════════ */

export function getAvailableCombatPowers(): Array<{ poemId: string; name: string; description: string; cooldownRemaining: number }> {
  const store = getGameStore();
  const combat = currentCombat;
  if (!combat) return [];

  return store.collectedPoems
    .map((poemId) => {
      const ability = POEM_COMBAT_ABILITIES[poemId];
      if (!ability) return null;
      const cd = combat.powerCooldowns[poemId] ?? 0;
      return { poemId, name: ability.name, description: ability.description, cooldownRemaining: cd };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
}

/* ═══════════════════════════════════════════════════════════════
   §12 — GET ACTIVE BUFFS (for UI display)
   ═══════════════════════════════════════════════════════════════ */

export function getActiveBuffs(target?: 'player' | 'enemy'): CombatBuff[] {
  if (!currentCombat) return [];
  if (target) return currentCombat.buffs.filter((b) => b.target === target);
  return currentCombat.buffs;
}

/* ═══════════════════════════════════════════════════════════════
   §13 — SKILL TREE DEFINITION (unchanged)
   ═══════════════════════════════════════════════════════════════ */

export const SKILL_TREE: import('@/shared/types/game').SkillTreeNode[] = [
  // ═══ ТЕХНИЧЕСКИЙ (Technical) ═══
  { id: 'tech_1a', name: 'Базовый Код', description: 'Основы программирования', branch: 'technical', tier: 1, requires: [], effect: 'coding +2' },
  { id: 'tech_1b', name: 'Системная Логика', description: 'Понимание архитектуры систем', branch: 'technical', tier: 1, requires: [], effect: 'logic +2' },
  { id: 'tech_2a', name: 'Криптография', description: 'Шифрование и дешифровка', branch: 'technical', tier: 2, requires: ['tech_1a'], effect: 'coding +3, attack +2' },
  { id: 'tech_2b', name: 'Терминальный Доступ', description: 'Расширенный доступ к терминалам', branch: 'technical', tier: 2, requires: ['tech_1b'], effect: 'logic +3, terminal access' },
  { id: 'tech_3a', name: 'Взлом Защиты', description: 'Обход фаерволов и замков', branch: 'technical', tier: 3, requires: ['tech_2a'], effect: 'coding +4, attack +3' },
  { id: 'tech_3b', name: 'Анализ Данных', description: 'Поиск паттернов в данных', branch: 'technical', tier: 3, requires: ['tech_2b'], effect: 'logic +4, intuition +2' },
  { id: 'tech_4a', name: 'Цифровой Призрак', description: 'Невидимость в сетях', branch: 'technical', tier: 4, requires: ['tech_3a'], effect: 'coding +5, flee chance +20%' },
  { id: 'tech_4b', name: 'Сетевой Контроль', description: 'Управление удалёнными системами', branch: 'technical', tier: 4, requires: ['tech_3b'], effect: 'logic +5, defense +3' },
  { id: 'tech_5a', name: 'Архитектор Кода', description: 'Мастер программирования', branch: 'technical', tier: 5, requires: ['tech_4a', 'tech_4b'], effect: 'coding +8, poem power +25%' },
  { id: 'tech_5b', name: 'Повелитель Систем', description: 'Полный контроль над цифровой средой', branch: 'technical', tier: 5, requires: ['tech_4a', 'tech_4b'], effect: 'logic +8, combat attack +50%' },

  // ═══ СОЦИАЛЬНЫЙ (Social) ═══
  { id: 'social_1a', name: 'Золотые Слова', description: 'Искусство убеждения', branch: 'social', tier: 1, requires: [], effect: 'persuasion +2' },
  { id: 'social_1b', name: 'Открытое Сердце', description: 'Эмпатия к окружающим', branch: 'social', tier: 1, requires: [], effect: 'empathy +2' },
  { id: 'social_2a', name: 'Дипломатия', description: 'Мирное разрешение конфликтов', branch: 'social', tier: 2, requires: ['social_1a'], effect: 'persuasion +3, flee +15%' },
  { id: 'social_2b', name: 'Сердечная Связь', description: 'Глубокая связь с NPC', branch: 'social', tier: 2, requires: ['social_1b'], effect: 'empathy +3, NPC relations +20%' },
  { id: 'social_3a', name: 'Харизма', description: 'Влияние на людей', branch: 'social', tier: 3, requires: ['social_2a'], effect: 'persuasion +4, dialogue options +1' },
  { id: 'social_3b', name: 'Понимание Душ', description: 'Чтение намерений', branch: 'social', tier: 3, requires: ['social_2b'], effect: 'empathy +4, intuition +2' },
  { id: 'social_4a', name: 'Лидер Сети', description: 'Авторитет в подполье', branch: 'social', tier: 4, requires: ['social_3a'], effect: 'persuasion +5, quest rewards +30%' },
  { id: 'social_4b', name: 'Целитель Душ', description: 'Исцеление чужой боли', branch: 'social', tier: 4, requires: ['social_3b'], effect: 'empathy +5, healing +50%' },
  { id: 'social_5a', name: 'Голос Города', description: 'Слова меняют мир', branch: 'social', tier: 5, requires: ['social_4a', 'social_4b'], effect: 'persuasion +8, all NPC friendly' },
  { id: 'social_5b', name: 'Легенда Улиц', description: 'Твоё имя знает каждый', branch: 'social', tier: 5, requires: ['social_4a', 'social_4b'], effect: 'empathy +8, defense +50%' },

  // ═══ ДУХОВНЫЙ (Spiritual) ═══
  { id: 'spiritual_1a', name: 'Внутренний Голос', description: 'Интуитивное понимание', branch: 'spiritual', tier: 1, requires: [], effect: 'intuition +2' },
  { id: 'spiritual_1b', name: 'Творческая Искра', description: 'Поэтическое вдохновение', branch: 'spiritual', tier: 1, requires: [], effect: 'writing +2' },
  { id: 'spiritual_2a', name: 'Шёпот Муз', description: 'Глубокая интуиция', branch: 'spiritual', tier: 2, requires: ['spiritual_1a'], effect: 'intuition +3, karma sensitivity' },
  { id: 'spiritual_2b', name: 'Слово И Меч', description: 'Перо сильнее меча', branch: 'spiritual', tier: 2, requires: ['spiritual_1b'], effect: 'writing +3, poem power +10%' },
  { id: 'spiritual_3a', name: 'Кармическое Зрение', description: 'Видение последствий', branch: 'spiritual', tier: 3, requires: ['spiritual_2a'], effect: 'intuition +4, karma +5 per combat' },
  { id: 'spiritual_3b', name: 'Поэтический Транс', description: 'Стихи как медитация', branch: 'spiritual', tier: 3, requires: ['spiritual_2b'], effect: 'writing +4, stress -20%' },
  { id: 'spiritual_4a', name: 'Связь С Предками', description: 'Мудрость поколений', branch: 'spiritual', tier: 4, requires: ['spiritual_3a'], effect: 'intuition +5, hidden poems revealed' },
  { id: 'spiritual_4b', name: 'Живое Слово', description: 'Стихи меняют реальность', branch: 'spiritual', tier: 4, requires: ['spiritual_3b'], effect: 'writing +5, poem cooldown -25%' },
  { id: 'spiritual_5a', name: 'Пророк', description: 'Видение всех путей', branch: 'spiritual', tier: 5, requires: ['spiritual_4a', 'spiritual_4b'], effect: 'intuition +8, all choices visible' },
  { id: 'spiritual_5b', name: 'Творец Стихов', description: 'Стихотворение — это реальность', branch: 'spiritual', tier: 5, requires: ['spiritual_4a', 'spiritual_4b'], effect: 'writing +8, poem powers 2x effective' },
];

/** Check if a skill tree node can be unlocked */
export function canUnlockSkill(skillId: string): boolean {
  const store = getGameStore();
  const prog = store.playerState.progression;
  if (prog.skillPoints <= 0) return false;
  if (prog.unlockedSkills.includes(skillId)) return false;

  const node = SKILL_TREE.find((n) => n.id === skillId);
  if (!node) return false;

  // Check requirements
  for (const req of node.requires) {
    if (!prog.unlockedSkills.includes(req)) return false;
  }

  return true;
}

/** Unlock a skill tree node */
export function unlockSkill(skillId: string): boolean {
  if (!canUnlockSkill(skillId)) return false;

  const store = getGameStore();
  const node = SKILL_TREE.find((n) => n.id === skillId);
  if (!node) return false;

  // Apply the effect
  applySkillEffect(node.effect);

  // Update progression through the store action
  store.unlockSkillTreeNode(skillId);

  store.pushNotification('skill', `Способность разблокирована: ${node.name}`);
  return true;
}

/** Parse and apply skill effect string */
function applySkillEffect(effect: string): void {
  const store = getGameStore();
  // Parse simple effect strings like "coding +2, attack +3"
  const parts = effect.split(', ');
  for (const part of parts) {
    const match = part.match(/^(\w+)\s*\+(\d+)(%)?$/);
    if (match) {
      const stat = match[1];
      const value = parseInt(match[2]);
      const isPercent = !!match[3];

      if (!isPercent && stat in store.playerState.skills) {
        store.addSkill(stat as import('@/shared/types/game').TrainablePlayerSkill, value);
      }
      // Percent-based effects are checked at runtime in combat/interaction code
    }
  }
}
