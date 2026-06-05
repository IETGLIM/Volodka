/* ─── Combat System — Enemy Templates & Special Attacks ─── */

import type { EnemyType, CombatState, EnemySpecialAttack, SideEffect } from './types';
import type { EnemyTemplate } from './types';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import { createBuff, addBuff } from './buffSystem';
import {
  getEnemyAttackBoost,
  getEnemyDamageMultiplier,
  getPlayerDefenseBoost,
  getPlayerDamageReduction,
  getPlayerVulnerability,
} from './buffSystem';

/* ═══════════════════════════════════════════════════════════════
   Enemy Special Attacks (extracted for clarity)
   ═══════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════
   Enemy Templates
   ═══════════════════════════════════════════════════════════════ */

export const ENEMY_TEMPLATES: Record<EnemyType, EnemyTemplate> = {
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
          const karma = getGameSnapshot().playerState.karma;
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
          const poemCount = getGameSnapshot().collectedPoems.length;
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
   Phase-based Enemy Availability (G13)
   ═══════════════════════════════════════════════════════════════ */

/** G13: Phase-based enemy availability.
 *  Early game (Act 1): system_daemon, corporate_golem
 *  Mid game (Act 1+, level 3+): +shadow_agent
 *  Late game (Act 2): +data_phantom, code_inquisitor
 *  If an enemy type is not available for the current phase, a fallback is used. */
export function resolveEnemyType(requestedType: EnemyType): EnemyType {
  const snapshot = getGameSnapshot();
  const playerLevel = snapshot.playerState.progression.level;
  const currentAct = snapshot.playerState.progression.currentAct;

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
