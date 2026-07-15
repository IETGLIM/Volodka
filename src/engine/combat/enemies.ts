/* ─── Combat System — Enemy Templates & Special Attacks ─── */

import type { EnemyType, EnemySpecialAttack, SideEffect } from './types';
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
import {
  COMBAT_CONSTANTS,
  scaleDamageByFraction,
} from './formulas';
import { getPlayerRngSeed, pickIndexFromSeed, rollEnemyDamage } from './combatRng';

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
      // Player-targeted defense_reduction → getPlayerVulnerability (+30% incoming damage for 2 turns).
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
      const rolled = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: enemyDmgMultiplier });
      let damage = rolled.damage * COMBAT_CONSTANTS.STEALTH_CRIT_MULTIPLIER;
      const nextState = rolled.state;

      // Apply player defense_boost buff
      const playerDefBoost = getPlayerDefenseBoost(state);
      if (playerDefBoost > 0) {
        damage = Math.max(1, damage - playerDefBoost);
      }

      // Apply buff-based damage reduction
      const playerDmgReduction = getPlayerDamageReduction(state);
      if (playerDmgReduction > 0) {
        damage = scaleDamageByFraction(damage, playerDmgReduction, 'reduction');
      }

      // Apply player vulnerability from defense_reduction debuffs
      const playerVulnerability = getPlayerVulnerability(state);
      if (playerVulnerability > 0) {
        damage = scaleDamageByFraction(damage, playerVulnerability, 'vulnerability');
      }

      const newPlayerHp = Math.max(0, nextState.playerHp - damage);
      return {
        ...nextState,
        playerHp: newPlayerHp,
        log: [
          ...nextState.log,
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

/** Корпоративный Дрон — balanced, standard corporate enemy */
const DRONE_SPECIALS: EnemySpecialAttack[] = [
  {
    id: 'drone_protocol_override',
    name: 'Перезапуск Протокола',
    description: 'Усиливает атаку и снижает карму',
    chance: 0.3,
    cooldown: 3,
    execute: (state, enemy) => {
      const buff = createBuff(state, 'Перезапуск Протокола', 'drone_protocol_override', 'buff', 'enemy', 2, { type: 'attack_boost', value: 5 });
      const s = addBuff(state, buff);
      return {
        ...s,
        _sideEffects: [{ type: 'addKarma', value: -3 } as SideEffect],
        log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Перезапуск Протокола! Атака усилена, карма -3!`, type: 'enemy_special' as const }],
      };
    },
  },
  {
    id: 'drone_compliance_beam',
    name: 'Луч Подчинения',
    description: 'Оглушает игрока на 1 ход',
    chance: 0.25,
    cooldown: 4,
    execute: (state, enemy) => {
      const buff = createBuff(state, 'Луч Подчинения', 'drone_compliance_beam', 'debuff', 'player', 1, { type: 'skip_turn' });
      const s = addBuff(state, buff);
      return {
        ...s,
        log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Луч Подчинения! Вы парализованы на 1 ход!`, type: 'enemy_special' as const }],
      };
    },
  },
];

/** Призрак Памяти — deals stress damage instead of HP */
const MEMORY_WRAITH_SPECIALS: EnemySpecialAttack[] = [
  {
    id: 'wraith_trauma_echo',
    name: 'Эхо Травмы',
    description: 'Наносит психический урон — +20 стресса',
    chance: 0.35,
    cooldown: 3,
    execute: (state, enemy) => {
      return {
        ...state,
        _sideEffects: [{ type: 'addStress', value: 20 } as SideEffect],
        log: [...state.log, { turn: state.turn, text: `${enemy.emoji} Эхо Травмы! Поток болезненных воспоминаний: +20 стресса!`, type: 'enemy_special' as const }],
      };
    },
  },
  {
    id: 'wraith_memory_decay',
    name: 'Гниение Памяти',
    description: 'Снижает логику и усиливает уязвимость',
    chance: 0.3,
    cooldown: 4,
    execute: (state, enemy) => {
      const buff1 = createBuff(state, 'Гниение Памяти: слабость', 'wraith_memory_decay_vuln', 'debuff', 'player', 2, { type: 'defense_reduction', value: 0.2 });
      let s = addBuff(state, buff1);
      const buff2 = createBuff(s, 'Гниение Памяти: туман', 'wraith_memory_decay_logic', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'logic', value: 2 });
      s = addBuff(s, buff2);
      return {
        ...s,
        _sideEffects: [{ type: 'addStress', value: 10 } as SideEffect],
        log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Гниение Памяти! Разум затуманен, защита -20%, логика -2, +10 стресса!`, type: 'enemy_special' as const }],
      };
    },
  },
];

/** Страж Межсетевого Экрана — tanky, high defense, appears in factory/tech scenes */
const FIREWALL_SPECIALS: EnemySpecialAttack[] = [
  {
    id: 'firewall_throttle',
    name: 'Дросселирование',
    description: 'Снижает атаку игрока и усиливает свою защиту',
    chance: 0.3,
    cooldown: 3,
    execute: (state, enemy) => {
      const buff1 = createBuff(state, 'Дросселирование: стена', 'firewall_throttle_def', 'buff', 'enemy', 2, { type: 'defense_boost', value: 10 });
      let s = addBuff(state, buff1);
      const buff2 = createBuff(s, 'Дросселирование: слабость', 'firewall_throttle_atk', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'logic', value: 3 });
      s = addBuff(s, buff2);
      return {
        ...s,
        log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Дросселирование! Защита врага +10, ваша логика -3 на 2 хода!`, type: 'enemy_special' as const }],
      };
    },
  },
  {
    id: 'firewall_packet_storm',
    name: 'Шторм Пакетов',
    description: 'Обрушивает поток данных — множественный урон',
    chance: 0.25,
    cooldown: 4,
    execute: (state, enemy) => {
      const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
      const rolled = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: 1.3 });
      let damage = rolled.damage;
      const nextState = rolled.state;
      const playerDmgReduction = getPlayerDamageReduction(nextState);
      if (playerDmgReduction > 0) damage = scaleDamageByFraction(damage, playerDmgReduction, 'reduction');
      const playerVulnerability = getPlayerVulnerability(nextState);
      if (playerVulnerability > 0) damage = scaleDamageByFraction(damage, playerVulnerability, 'vulnerability');
      const newPlayerHp = Math.max(0, nextState.playerHp - damage);
      return {
        ...nextState,
        playerHp: newPlayerHp,
        _sideEffects: [{ type: 'addStress', value: 8 } as SideEffect],
        log: [...nextState.log, { turn: state.turn, text: `${enemy.emoji} Шторм Пакетов! Поток данных обрушивается: -${damage} HP, +8 стресса!`, type: 'enemy_special' as const, damage }],
      };
    },
  },
];

/** Страж Нексуса — focusses on system control and lockdown */
const NEXUS_GUARDIAN_SPECIALS: EnemySpecialAttack[] = [
  {
    id: 'nexus_system_capture',
    name: 'Системный Захват',
    description: 'Блокирует спецприёмы игрока на 2 хода',
    chance: 0.35,
    cooldown: 4,
    execute: (state, enemy) => {
      const buff = createBuff(state, 'Системный Захват', 'nexus_system_capture', 'debuff', 'player', 2, { type: 'silence_specials' });
      const s = addBuff(state, buff);
      const effectiveAttack = enemy.attack + getEnemyAttackBoost(s);
      const rolled = rollEnemyDamage(s, { attack: effectiveAttack, multiplier: 0.8 });
      let damage = rolled.damage;
      const nextState = rolled.state;
      const playerDmgReduction = getPlayerDamageReduction(nextState);
      if (playerDmgReduction > 0) damage = scaleDamageByFraction(damage, playerDmgReduction, 'reduction');
      const newPlayerHp = Math.max(0, nextState.playerHp - damage);
      return {
        ...nextState,
        playerHp: newPlayerHp,
        log: [...nextState.log, { turn: state.turn, text: `${enemy.emoji} Системный Захват! Спецприёмы заблокированы на 2 хода, -${damage} HP!`, type: 'enemy_special' as const, damage }],
      };
    },
  },
  {
    id: 'nexus_process_cancel',
    name: 'Отмена Процесса',
    description: 'Снижает все навыки игрока и усиливает свою атаку',
    chance: 0.25,
    cooldown: 5,
    execute: (state, enemy) => {
      const buff1 = createBuff(state, 'Отмена Процесса: подавление', 'nexus_cancel_drain', 'debuff', 'player', 3, { type: 'stat_drain', stat: 'logic', value: 4 });
      let s = addBuff(state, buff1);
      const buff2 = createBuff(s, 'Отмена Процесса: ярость', 'nexus_cancel_atk', 'buff', 'enemy', 3, { type: 'attack_boost', value: 8 });
      s = addBuff(s, buff2);
      return {
        ...s,
        _sideEffects: [{ type: 'addStress', value: 10 } as SideEffect],
        log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Отмена Процесса! Логика -4, атака врага +8 на 3 хода, +10 стресса!`, type: 'enemy_special' as const }],
      };
    },
  },
];

/** Эхо Пустоты — focusses on speed, evasion, and empathy manipulation */
const VOID_ECHO_SPECIALS: EnemySpecialAttack[] = [
  {
    id: 'void_absorption',
    name: 'Поглощение Пустоты',
    description: 'Вытягивает карму и восстанавливает HP',
    chance: 0.35,
    cooldown: 3,
    execute: (state, enemy) => {
      const buff = createBuff(state, 'Поглощение Пустоты', 'void_absorption', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'karma', value: 4 });
      const s = addBuff(state, buff);
      const healAmount = Math.min(15, enemy.maxHp - enemy.hp);
      return {
        ...s,
        enemy: { ...s.enemy, hp: s.enemy.hp + healAmount },
        _sideEffects: [{ type: 'addStress', value: 6 } as SideEffect],
        log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Поглощение Пустоты! Карма -4 на 2 хода, враг восстанавливает ${healAmount} HP!`, type: 'enemy_special' as const }],
      };
    },
  },
  {
    id: 'void_resonance',
    name: 'Резонанс',
    description: 'Мощный удар с шансом оглушения',
    chance: 0.3,
    cooldown: 4,
    execute: (state, enemy) => {
      const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
      const rolled = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: 1.5 });
      let damage = rolled.damage;
      const nextState = rolled.state;
      const playerDmgReduction = getPlayerDamageReduction(nextState);
      if (playerDmgReduction > 0) damage = scaleDamageByFraction(damage, playerDmgReduction, 'reduction');
      const playerVulnerability = getPlayerVulnerability(nextState);
      if (playerVulnerability > 0) damage = scaleDamageByFraction(damage, playerVulnerability, 'vulnerability');
      const newPlayerHp = Math.max(0, nextState.playerHp - damage);
      // 30% chance to skip player's next turn (stun) — deterministic from turn + combo count
      const stunRoll = (state.turn * 7 + state.comboCount * 13) % 10;
      let s = { ...nextState, playerHp: newPlayerHp } as typeof nextState;
      if (stunRoll < 3) {
        const stunBuff = createBuff(s, 'Резонанс: оглушение', 'void_resonance_stun', 'debuff', 'player', 1, { type: 'skip_turn' });
        s = addBuff(s, stunBuff);
      }
      const stunText = stunRoll < 3 ? ' Вы оглушены — пропускаете ход!' : '';
      return {
        ...s,
        log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Резонанс! Удар пустоты: -${damage} HP!${stunText}`, type: 'enemy_special' as const, damage }],
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
    description: 'Демон системных сбоев — порождение ошибок в коде города',
    baseHp: 40,
    baseAttack: 12,
    baseDefense: 4,
    baseSpeed: 8,
    targetsStat: 'logic',
    lootTable: ['daemon_core', 'code_fragment', 'energy_drink'],
    xpReward: 25,
    specialAttacks: DAEMON_SPECIALS,
    attackBarks: [
      'Системный сбой — ваш разум зависает!',
      'Код ошибки 0xDEAD: критическое повреждение!',
    ],
    defeatBarks: [
      'Демон рассеивается в потоке данных...',
      'Системный сбой устранён. Код стабилен.',
    ],
  },
  corporate_golem: {
    type: 'corporate_golem',
    name: 'Корпоративный Голем',
    emoji: '🤖',
    description: 'Бесчувственный конструкт корпорации — стена протоколов',
    baseHp: 80,
    baseAttack: 8,
    baseDefense: 10,
    baseSpeed: 3,
    targetsStat: 'energy',
    lootTable: ['corporate_badge', 'encrypted_usb', 'coffee'],
    xpReward: 40,
    specialAttacks: GOLEM_SPECIALS,
    attackBarks: [
      'Протокол подавления активирован.',
      'Списываю ваши ресурсы в пользу корпорации.',
    ],
    defeatBarks: [
      'Корпоративный конструкт рассыпается на фрагменты...',
      'Системы голема обесточены. Протокол завершён.',
    ],
  },
  shadow_agent: {
    type: 'shadow_agent',
    name: 'Теневой Агент',
    emoji: '🥷',
    description: 'Невидимый оперативник из подполья — мастер манипуляций',
    baseHp: 55,
    baseAttack: 10,
    baseDefense: 6,
    baseSpeed: 6,
    targetsStat: 'karma',
    lootTable: ['shadow_cloak', 'poem_fragment', 'painkiller'],
    xpReward: 35,
    specialAttacks: AGENT_SPECIALS,
    attackBarks: [
      'Тень поглощает ваш свет...',
      'Вы не видите меня, но я уже здесь.',
    ],
    defeatBarks: [
      'Агент растворяется во тьме...',
      'Миссия провалена... отступление.',
    ],
  },
  /* ─── G13: New enemy types for variety ─── */
  data_phantom: {
    type: 'data_phantom',
    name: 'Фантом Данных',
    emoji: '👻',
    description: 'Эфирная сущность в потоке данных — неуловима и опасна',
    baseHp: 30,
    baseAttack: 7,
    baseDefense: 2,
    baseSpeed: 14,
    targetsStat: 'logic',
    lootTable: ['code_fragment', 'energy_drink', 'poem_fragment'],
    xpReward: 28,
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
        chance: 0.35,
        cooldown: 3,
        execute: (state, enemy) => {
          const buff = createBuff(state, 'Фазовый Сдвиг', 'phantom_phase_shift', 'buff', 'enemy', 1, { type: 'defense_boost', value: 25 });
          const s = addBuff(state, buff);
          return {
            ...s,
            log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Фазовый Сдвиг! Враг становится неуловимым!`, type: 'enemy_special' as const }],
          };
        },
      },
    ],
    attackBarks: [
      'Ваши данные... уже мои...',
      'Я — сбой в вашей реальности!',
    ],
    defeatBarks: [
      'Фантом рассеивается в цифровом шуме...',
      'Данные... теряют... форму...',
    ],
  },
  code_inquisitor: {
    type: 'code_inquisitor',
    name: 'Инквизитор Кода',
    emoji: '⚖️',
    description: 'Жестокий аудитор правосудия — карает за добрые дела',
    baseHp: 70,
    baseAttack: 9,
    baseDefense: 8,
    baseSpeed: 4,
    targetsStat: 'empathy',
    lootTable: ['corporate_badge', 'guild_access_badge', 'herbal_tea'],
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
          if (playerDmgReduction > 0) damage = scaleDamageByFraction(damage, playerDmgReduction, 'reduction');
          const playerVulnerability = getPlayerVulnerability(state);
          if (playerVulnerability > 0) damage = scaleDamageByFraction(damage, playerVulnerability, 'vulnerability');
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
    attackBarks: [
      'Ваша совесть — приговор!',
      'Правосудие кода не знает пощады.',
    ],
    defeatBarks: [
      'Код... не может... судить...',
      'Инквизиция откладывается. До следующего раза.',
    ],
  },
  /* ─── Task 8: New enemy types ─── */
  guild_enforcer: {
    type: 'guild_enforcer',
    name: 'Каратель Гильдии',
    emoji: '🛡️',
    description: 'Тяжеловооружённый боец гильдии — стальная стена',
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
          const rolled = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: 1.5 });
          let damage = rolled.damage;
          const nextState = rolled.state;
          const playerDmgReduction = getPlayerDamageReduction(nextState);
          if (playerDmgReduction > 0) damage = scaleDamageByFraction(damage, playerDmgReduction, 'reduction');
          const playerVulnerability = getPlayerVulnerability(nextState);
          if (playerVulnerability > 0) damage = scaleDamageByFraction(damage, playerVulnerability, 'vulnerability');
          const buff = createBuff(nextState, 'Оглушение', 'enforcer_shield_bash', 'debuff', 'player', 1, { type: 'skip_turn' });
          const s = addBuff(nextState, buff);
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
    attackBarks: [
      'Гильдия не прощает нарушителей!',
      'Щит и кара — мой ответ!',
    ],
    defeatBarks: [
      'Каратель падает... гильдия будет мстить...',
      'Мой щит... расколот...',
    ],
  },
  data_wraith: {
    type: 'data_wraith',
    name: 'Призрак Данных',
    emoji: '👁️',
    description: 'Хищная сущность цифровой бездны — крадёт жизненную силу',
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
          const rolled = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: 1.2 });
          let damage = rolled.damage;
          const nextState = rolled.state;
          const playerDmgReduction = getPlayerDamageReduction(nextState);
          if (playerDmgReduction > 0) damage = scaleDamageByFraction(damage, playerDmgReduction, 'reduction');
          const newPlayerHp = Math.max(0, nextState.playerHp - damage);
          const healAmount = Math.floor(damage * 0.5);
          const newEnemyHp = Math.min(enemy.maxHp, enemy.hp + healAmount);
          return { ...nextState, playerHp: newPlayerHp, enemy: { ...enemy, hp: newEnemyHp }, log: [...nextState.log, { turn: state.turn, text: `${enemy.emoji} Похищение Души! -${damage} HP, враг исцеляется на ${healAmount}!`, type: 'enemy_special' as const, damage }] };
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
    attackBarks: [
      'Ваша жизненная сила... питает меня!',
      'Глаза бездны видят ваш страх!',
    ],
    defeatBarks: [
      'Призрак растворяется в потоке данных...',
      'Бездна... отпускает... меня...',
    ],
  },
  censor_drone: {
    type: 'censor_drone',
    name: 'Дрон-Цензор',
    emoji: '📡',
    description: 'Летающий надзиратель цензуры — подавляет свободу',
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
    attackBarks: [
      'Цензура — это порядок. Подчиняйтесь.',
      'Свобода слова — ошибка в системе.',
    ],
    defeatBarks: [
      'Сигнал дрона... потерян...',
      'Цензура... не... вечна...',
    ],
  },
  poetry_hunter: {
    type: 'poetry_hunter',
    name: 'Охотник за Стихами',
    emoji: '🗡️',
    description: 'Безжалостный убийца поэтов — питается силой стихов',
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
        description: 'Крадёт силу стихов — снижает навык письма и карму',
        chance: 0.3,
        cooldown: 3,
        execute: (state, enemy) => {
          const buff = createBuff(state, 'Кража Стиха', 'hunter_verse_steal', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'karma', value: 3 });
          const s = addBuff(state, buff);
          return { ...s, _sideEffects: [{ type: 'addSkill', skill: 'writing', value: -2 } as SideEffect], log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Кража Стиха! Ваше писательство ослаблено, карма -3 на 2 хода!`, type: 'enemy_special' as const }] };
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
          const rolled = rollEnemyDamage(state, {
            attack: effectiveAttack,
            multiplier: COMBAT_CONSTANTS.POEM_HUNTER_DAMAGE_BASE_MULTIPLIER + poemCount * COMBAT_CONSTANTS.POEM_HUNTER_DAMAGE_PER_POEM,
          });
          let damage = rolled.damage;
          const nextState = rolled.state;
          const playerDmgReduction = getPlayerDamageReduction(nextState);
          if (playerDmgReduction > 0) damage = scaleDamageByFraction(damage, playerDmgReduction, 'reduction');
          const playerVulnerability = getPlayerVulnerability(nextState);
          if (playerVulnerability > 0) damage = scaleDamageByFraction(damage, playerVulnerability, 'vulnerability');
          const newPlayerHp = Math.max(0, nextState.playerHp - damage);
          return { ...nextState, playerHp: newPlayerHp, log: [...nextState.log, { turn: state.turn, text: `${enemy.emoji} Казнь Стихотворца! -${damage} HP! (бонус от ${poemCount} стихов)`, type: 'enemy_special' as const, damage }] };
        },
      },
    ],
    attackBarks: [
      'Твои стихи — моё оружие против тебя!',
      'Поэзия — это болезнь. Я — лекарство.',
    ],
    defeatBarks: [
      'Охотник падает, сжимая обрывок стиха...',
      'Слова... сильнее... клинка...',
    ],
  },
  nexus_guardian: {
    type: 'nexus_guardian',
    name: 'Хранитель «Надзора»',
    emoji: '🛡️',
    description: 'Элитный страж системы «Надзор» — непробиваемая защита',
    baseHp: 80,
    baseAttack: 18,
    baseDefense: 10,
    baseSpeed: 8,
    targetsStat: 'logic',
    lootTable: ['data_chip', 'nadzor_key_fragment', 'energy_drink'],
    xpReward: 60,
    specialAttacks: NEXUS_GUARDIAN_SPECIALS,
    attackBarks: [
      'Надзор видит всё. Сопротивление бессмысленно.',
      'Вы — аномалия. Подлежите устранению.',
    ],
    defeatBarks: [
      'Система... Надзор... даёт сбой...',
      'Невозможно... аномалия... преодолела...',
    ],
  },
  void_echo: {
    type: 'void_echo',
    name: 'Эхо Пустоты',
    emoji: '🌑',
    description: 'Остаток вычеркнутой реальности — быстрый и смертоносный',
    baseHp: 65,
    baseAttack: 20,
    baseDefense: 6,
    baseSpeed: 14,
    targetsStat: 'empathy',
    lootTable: ['shadow_cloak', 'code_fragment', 'nano_patch'],
    xpReward: 55,
    specialAttacks: VOID_ECHO_SPECIALS,
    attackBarks: [
      'Пустота... отражает... ваш страх...',
      'Вас не существует. Вы — эхо.',
    ],
    defeatBarks: [
      'Эхо... замолкает... навсегда...',
      'Пустота... поглощает... сама себя...',
    ],
  },
  /* ─── Task 4-b: New enemy types for act/level variety ─── */
  corporate_drone: {
    type: 'corporate_drone',
    name: 'Корпоративный Дрон',
    emoji: '🔲',
    description: 'Стандартный рабочий юнит корпорации — исправен и безжалостен',
    baseHp: 50,
    baseAttack: 9,
    baseDefense: 7,
    baseSpeed: 5,
    targetsStat: 'energy',
    lootTable: ['corporate_badge', 'coffee', 'circuit_board'],
    xpReward: 30,
    specialAttacks: DRONE_SPECIALS,
    attackBarks: [
      'Приказ получен. Исполнение неизбежно.',
      'Отклонение от протокола карается.',
    ],
    defeatBarks: [
      'Системы... отключены... протокол... прерван...',
      'Дрон возвращается в режим ожидания...',
    ],
  },
  memory_wraith: {
    type: 'memory_wraith',
    name: 'Призрак Памяти',
    emoji: '🧠',
    description: 'Психическая сущность из забытых воспоминаний — питается стрессом',
    baseHp: 40,
    baseAttack: 5,
    baseDefense: 4,
    baseSpeed: 9,
    targetsStat: 'empathy',
    lootTable: ['herbal_tea', 'nano_patch', 'poem_fragment'],
    xpReward: 35,
    specialAttacks: MEMORY_WRAITH_SPECIALS,
    attackBarks: [
      'Помнишь... ту боль? Я верну её!',
      'Ваши воспоминания — мой пир.',
    ],
    defeatBarks: [
      'Воспоминания... растворяются... в тишине...',
      'Память... наконец... покой...',
    ],
  },
  firewall_guardian: {
    type: 'firewall_guardian',
    name: 'Страж Межсетевого Экрана',
    emoji: '🔥',
    description: 'Тяжёлый страж цифровой крепости — почти непробиваем',
    baseHp: 100,
    baseAttack: 10,
    baseDefense: 15,
    baseSpeed: 2,
    targetsStat: 'logic',
    lootTable: ['data_chip', 'guild_access_badge', 'combat_stim'],
    xpReward: 50,
    specialAttacks: FIREWALL_SPECIALS,
    attackBarks: [
      'Межсетевой экран — ваш барьер и ваш гроб.',
      'Доступ запрещён. Соединение разорвано.',
    ],
    defeatBarks: [
      'Экран... пробит... брешь... в системе...',
      'Страж деактивирован. Периметр нарушен.',
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════
   Phase-based Enemy Availability (G13 + Task 4-b)
   ═══════════════════════════════════════════════════════════════ */

/** Phase-based enemy availability.
 *  Early game (Act 1): system_daemon, corporate_golem, corporate_drone
 *  Mid game (Act 1+, level 3+): +shadow_agent, censor_drone
 *  Late game (Act 2+): +data_phantom, code_inquisitor, memory_wraith
 *  Act 3+: +firewall_guardian, guild_enforcer
 *  Act 6+: +nexus_guardian, void_echo
 *  If an enemy type is not available for the current phase, a fallback is used. */
export function resolveEnemyType(requestedType: EnemyType): EnemyType {
  const snapshot = getGameSnapshot();
  const playerLevel = snapshot.playerState.progression.level;
  const currentAct = snapshot.playerState.progression.currentAct;

  // Phase restrictions by act and level
  const PHASE_UNLOCKS: Partial<Record<EnemyType, { minLevel: number; minAct: number }>> = {
    system_daemon: { minLevel: 1, minAct: 1 },
    corporate_golem: { minLevel: 1, minAct: 1 },
    corporate_drone: { minLevel: 1, minAct: 1 },
    shadow_agent: { minLevel: 3, minAct: 1 },
    censor_drone: { minLevel: 2, minAct: 1 },
    data_phantom: { minLevel: 1, minAct: 2 },
    code_inquisitor: { minLevel: 1, minAct: 2 },
    memory_wraith: { minLevel: 1, minAct: 2 },
    guild_enforcer: { minLevel: 3, minAct: 3 },
    firewall_guardian: { minLevel: 3, minAct: 3 },
    data_wraith: { minLevel: 1, minAct: 2 },
    poetry_hunter: { minLevel: 5, minAct: 2 },
    nexus_guardian: { minLevel: 8, minAct: 6 },
    void_echo: { minLevel: 7, minAct: 6 },
  };

  const unlock = PHASE_UNLOCKS[requestedType];
  if (!unlock) return requestedType; // Unknown types pass through

  if (playerLevel >= unlock.minLevel && currentAct >= unlock.minAct) {
    return requestedType; // Player meets requirements
  }

  // Fallback: pick the strongest available enemy type
  const fallbacks: EnemyType[] = ['system_daemon', 'corporate_golem', 'corporate_drone'];
  if (playerLevel >= 2) fallbacks.push('censor_drone');
  if (playerLevel >= 3) fallbacks.push('shadow_agent');
  if (currentAct >= 2) fallbacks.push('data_phantom', 'memory_wraith');
  if (playerLevel >= 3 && currentAct >= 3) fallbacks.push('guild_enforcer', 'firewall_guardian');
  const fallbackSeed = getPlayerRngSeed(snapshot.playerState) ^ requestedType.length;
  return fallbacks[pickIndexFromSeed(fallbackSeed, fallbacks.length)];
}

/* ═══════════════════════════════════════════════════════════════
   Act-aware Enemy Selection (Task 4-b)
   ═══════════════════════════════════════════════════════════════ */

/** Pick a random enemy type appropriate for the current game state.
 *  Considers both karma (behavioural alignment) AND act progression,
 *  so later acts feature tougher and more varied enemies. */
export function pickEnemyForCurrentState(): EnemyType {
  const snapshot = getGameSnapshot();
  const karma = snapshot.playerState.karma;
  const level = snapshot.playerState.progression.level;
  const act = snapshot.playerState.progression.currentAct;

  // Base pool — always available
  const pool: EnemyType[] = ['system_daemon', 'corporate_golem', 'corporate_drone'];

  // Act 1+ level 2+
  if (level >= 2) pool.push('censor_drone');

  // Act 1+ level 3+
  if (level >= 3) pool.push('shadow_agent');

  // Act 2+ enemies
  if (act >= 2) {
    pool.push('data_phantom', 'code_inquisitor', 'data_wraith', 'memory_wraith');
    if (level >= 5) pool.push('poetry_hunter');
  }

  // Act 3+ enemies
  if (act >= 3) {
    if (level >= 3) pool.push('guild_enforcer', 'firewall_guardian');
  }

  // Late-game enemies
  if (act >= 6) {
    if (level >= 7) pool.push('void_echo');
    if (level >= 8) pool.push('nexus_guardian');
  }

  // Karma-weighted selection: high karma enemies more likely if karma is high
  // Shadow agents and poetry hunters are attracted to high-karma players
  if (karma > 65 && pool.includes('shadow_agent')) {
    pool.push('shadow_agent'); // double-weight
  }
  if (karma > 50 && pool.includes('poetry_hunter')) {
    pool.push('poetry_hunter'); // double-weight
  }

  // Low-karma players face more corporate/censor enemies
  if (karma < 35) {
    pool.push('corporate_drone', 'censor_drone');
  }

  // Deterministic-ish random from pool
  const seed = getPlayerRngSeed(snapshot.playerState) ^ (act * 17 + level * 31);
  return pool[pickIndexFromSeed(seed, pool.length)];
}
