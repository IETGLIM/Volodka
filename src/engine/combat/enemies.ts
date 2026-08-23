/* ─── Combat System — Enemy Templates & Special Attacks ─── */

import type { EnemyType, EnemySpecialAttack, SideEffect, CombatState } from './types';
import type { EnemyTemplate } from './types';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import { createBuff, addBuff } from './buffSystem';
import {
  getEnemyAttackBoost,
  getEnemyDamageMultiplier,
} from './buffSystem';
import { COMBAT_CONSTANTS } from './formulas';
import { scaleEnemyDamageByDifficulty } from './combatDifficulty';
import { getPlayerRngSeed, pickIndexFromSeed, rollEnemyDamage, SeededCombatRng } from './combatRng';
import { computeSpecialIncomingDamage } from './enemyTurn';
import { resolveCombatPerkModifiers, type CombatPerkModifiers } from '@/shared/perks/perkModifiers';

/* ═══════════════════════════════════════════════════════════
   Special-attack damage pipeline (Task 3.3-b1)
   ═══════════════════════════════════════════════════════════ */

/** Resolve spiritual-skill count + perk modifiers for the special pipeline.
 *  Falls back to zero modifiers when the game bridge isn't registered
 *  (pure unit tests) so specials stay callable in isolation. */
function resolveSpecialPipelineContext(): {
  spiritualSkillCount: number;
  perkMods: CombatPerkModifiers;
} {
  try {
    const snapshot = getGameSnapshot();
    return {
      spiritualSkillCount: snapshot.playerState.progression.unlockedSkills.filter(
        (id) => id.startsWith('spirit_'),
      ).length,
      perkMods: resolveCombatPerkModifiers(snapshot.playerState.progression?.unlockedPerks ?? [], {
        stress: snapshot.playerState.stress,
        timeOfDay: snapshot.exploration?.timeOfDay,
      }),
    };
  } catch {
    return { spiritualSkillCount: 0, perkMods: resolveCombatPerkModifiers([]) };
  }
}

/** Route a special attack's RAW damage through the full player-defense
 *  pipeline (defend counter-window, defense_boost, damage_reduction,
 *  vulnerability, spiritual skills, perk reductions) plus the boss-phase
 *  damage multiplier. The caller pre-computes the offensive formula
 *  (base + enemy.attack, difficulty/act/level scaling) — re-applying those
 *  here would double-scale. Keeps «Защита» and buffs honest against every
 *  special, boss or regular (audit 2-c: boss specials bypassed defense). */
function applySpecialDamagePipeline(state: CombatState, rawDamage: number): number {
  const { spiritualSkillCount, perkMods } = resolveSpecialPipelineContext();
  return computeSpecialIncomingDamage({
    combatState: state,
    rawDamage,
    spiritualSkillCount,
    perkMods,
    // Counter-window: the enemy readied this special last turn — a defending
    // player gets the extra ×0.4 reduction (see COMBAT_CONSTANTS).
    telegraphed: state.enemy.chargingSpecial != null,
  }).damage;
}

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
      // Clamp drain to current energy to avoid pushing energy below 0
      const currentEnergy = getGameSnapshot().playerState.energy ?? 0;
      const drain = Math.min(15, currentEnergy);
      return {
        ...state,
        _sideEffects: [{ type: 'addEnergy', value: -drain } as SideEffect],
        log: [
          ...state.log,
          {
            turn: state.turn,
            text: `${enemy.emoji} Списание Ресурсов! Вы теряете ${drain} энергии!`,
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
      const stealthRaw = rolled.damage * COMBAT_CONSTANTS.STEALTH_CRIT_MULTIPLIER;
      const nextState = rolled.state;

      // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
      const snapshot = getGameSnapshot();
      const rawDamage = scaleEnemyDamageByDifficulty(stealthRaw, undefined, snapshot.playerState.progression.currentAct, snapshot.playerState.progression.level);
      const damage = applySpecialDamagePipeline(nextState, rawDamage);

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
      const nextState = rolled.state;
      // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
      const fSnapshot = getGameSnapshot();
      const rawDamage = scaleEnemyDamageByDifficulty(rolled.damage, undefined, fSnapshot.playerState.progression.currentAct, fSnapshot.playerState.progression.level);
      const damage = applySpecialDamagePipeline(nextState, rawDamage);
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
      const nextState = rolled.state;
      // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
      const nSnapshot = getGameSnapshot();
      const rawDamage = scaleEnemyDamageByDifficulty(rolled.damage, undefined, nSnapshot.playerState.progression.currentAct, nSnapshot.playerState.progression.level);
      const damage = applySpecialDamagePipeline(nextState, rawDamage);
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
      const nextState = rolled.state;
      // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
      const vSnapshot = getGameSnapshot();
      const rawDamage = scaleEnemyDamageByDifficulty(rolled.damage, undefined, vSnapshot.playerState.progression.currentAct, vSnapshot.playerState.progression.level);
      const damage = applySpecialDamagePipeline(nextState, rawDamage);
      const newPlayerHp = Math.max(0, nextState.playerHp - damage);
      // 30% chance to skip player's next turn (stun) — now uses seeded RNG instead of deterministic formula (Fix #4)
      const stunRng = SeededCombatRng.fromState(nextState.rng);
      const stunned = stunRng.roll(0.3);
      let s = { ...nextState, playerHp: newPlayerHp, rng: stunRng.getState() } as typeof nextState;
      if (stunned) {
        const stunBuff = createBuff(s, 'Резонанс: оглушение', 'void_resonance_stun', 'debuff', 'player', 1, { type: 'skip_turn' });
        s = addBuff(s, stunBuff);
      }
      const stunText = stunned ? ' Вы оглушены — пропускаете ход!' : '';
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
          const iSnapshot = getGameSnapshot();
          const karma = iSnapshot.playerState.karma;
          const karmaRaw = karma > 50 ? Math.floor(karma * 0.15) : 5;
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const rawDamage = scaleEnemyDamageByDifficulty(karmaRaw, undefined, iSnapshot.playerState.progression.currentAct, iSnapshot.playerState.progression.level);
          const damage = applySpecialDamagePipeline(state, rawDamage);
          const newPlayerHp = Math.max(0, state.playerHp - damage);
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
          const nextState = rolled.state;
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const eSnapshot = getGameSnapshot();
          const rawDamage = scaleEnemyDamageByDifficulty(rolled.damage, undefined, eSnapshot.playerState.progression.currentAct, eSnapshot.playerState.progression.level);
          const damage = applySpecialDamagePipeline(nextState, rawDamage);
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
          const nextState = rolled.state;
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const dSnapshot = getGameSnapshot();
          const rawDamage = scaleEnemyDamageByDifficulty(rolled.damage, undefined, dSnapshot.playerState.progression.currentAct, dSnapshot.playerState.progression.level);
          const damage = applySpecialDamagePipeline(nextState, rawDamage);
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
          // Cap poem scaling at 10 to prevent absurd damage with 20+ poems
          const cappedPoemCount = Math.min(poemCount, 10);
          const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
          const rolled = rollEnemyDamage(state, {
            attack: effectiveAttack,
            multiplier: COMBAT_CONSTANTS.POEM_HUNTER_DAMAGE_BASE_MULTIPLIER + cappedPoemCount * COMBAT_CONSTANTS.POEM_HUNTER_DAMAGE_PER_POEM,
          });
          const nextState = rolled.state;
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const pSnapshot = getGameSnapshot();
          const rawDamage = scaleEnemyDamageByDifficulty(rolled.damage, undefined, pSnapshot.playerState.progression.currentAct, pSnapshot.playerState.progression.level);
          const damage = applySpecialDamagePipeline(nextState, rawDamage);
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
  /* ─── Phase 11: 6 New Enemy Types (20 total) ─── */
  network_spy: {
    type: 'network_spy',
    name: 'Сетевой Шпион',
    emoji: '🔍',
    description: 'Невидимый наблюдатель — крадёт информацию и дезориентирует',
    baseHp: 45,
    baseAttack: 8,
    baseDefense: 3,
    baseSpeed: 12,
    targetsStat: 'logic',
    lootTable: ['spy_report', 'code_fragment', 'nano_patch'],
    xpReward: 32,
    specialAttacks: [
      {
        id: 'spy_data_extraction',
        name: 'Извлечение Данных',
        description: 'Крадёт навык и передаёт врагу',
        chance: 0.3,
        cooldown: 3,
        execute: (state, enemy) => {
          const buff = createBuff(state, 'Извлечение Данных', 'spy_data_extraction', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'logic', value: 3 });
          const s = addBuff(state, buff);
          const eBuff = createBuff(s, 'Данные: атака', 'spy_data_extraction_atk', 'buff', 'enemy', 2, { type: 'attack_boost', value: 3 });
          const s2 = addBuff(s, eBuff);
          return { ...s2, log: [...s2.log, { turn: state.turn, text: `${enemy.emoji} Извлечение Данных! Ваша логика -3, враг +3 атака!`, type: 'enemy_special' as const }] };
        },
      },
      {
        id: 'spy_misinformation',
        name: 'Дезинформация',
        description: 'Создает ложные данные, снижая карму',
        chance: 0.25,
        cooldown: 4,
        execute: (state, enemy) => {
          const buff = createBuff(state, 'Дезинформация', 'spy_misinformation', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'karma', value: 4 });
          const s = addBuff(state, buff);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Дезинформация! Ваша карма -4 на 2 хода!`, type: 'enemy_special' as const }] };
        },
      },
    ],
    attackBarks: [
      'Я видел ваши данные. Они — мои.',
      'Сеть знает всё. И я знаю вас.',
    ],
    defeatBarks: [
      'Шпион... теряет... связь...',
      'Передача... прекращена... навсегда...',
    ],
  },
  quantum_ghost: {
    type: 'quantum_ghost',
    name: 'Квантовый Призрак',
    emoji: '⚛️',
    description: 'Нестабильная квантовая сущность — непредсказуемая и смертоносная',
    baseHp: 35,
    baseAttack: 14,
    baseDefense: 2,
    baseSpeed: 16,
    targetsStat: 'logic',
    lootTable: ['quantum_fragment', 'code_fragment', 'energy_drink'],
    xpReward: 42,
    specialAttacks: [
      {
        id: 'quantum_superposition',
        name: 'Суперпозиция',
        description: 'Атакует дважды с разной интенсивностью — квантовая неопределённость',
        chance: 0.35,
        cooldown: 3,
        execute: (state, enemy) => {
          const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
          // First hit: 0.6 multiplier
          const roll1 = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: 0.6 });
          // Second hit: 0.8 multiplier (quantum fluctuation)
          const roll2 = rollEnemyDamage(roll1.state, { attack: effectiveAttack, multiplier: 0.8 });
          const nextState = roll2.state;
          const qSnapshot = getGameSnapshot();
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const raw1 = scaleEnemyDamageByDifficulty(roll1.damage, undefined, qSnapshot.playerState.progression.currentAct, qSnapshot.playerState.progression.level);
          const raw2 = scaleEnemyDamageByDifficulty(roll2.damage, undefined, qSnapshot.playerState.progression.currentAct, qSnapshot.playerState.progression.level);
          const dmg1 = applySpecialDamagePipeline(nextState, raw1);
          const dmg2 = applySpecialDamagePipeline(nextState, raw2);
          const totalDamage = dmg1 + dmg2;
          const newPlayerHp = Math.max(0, nextState.playerHp - totalDamage);
          return { ...nextState, playerHp: newPlayerHp, log: [...nextState.log, { turn: state.turn, text: `${enemy.emoji} Суперпозиция! Двойная атака: -${dmg1} + -${dmg2} = -${totalDamage} HP!`, type: 'enemy_special' as const, damage: totalDamage }] };
        },
      },
      {
        id: 'quantum_entangle',
        name: 'Квантовая Связь',
        description: 'Связывает состояния — ваш дебафф усиливает врага',
        chance: 0.2,
        cooldown: 5,
        execute: (state, enemy) => {
          const playerDebuffs = state.buffs.filter(b => b.target === 'player' && b.kind === 'debuff');
          const eBuff = createBuff(state, 'Квантовая Связь', 'quantum_entangle', 'buff', 'enemy', 2, { type: 'attack_boost', value: Math.max(2, playerDebuffs.length * 3) });
          const s = addBuff(state, eBuff);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Квантовая Связь! Враг absorbs ваши слабости: +${Math.max(2, playerDebuffs.length * 3)} атака!`, type: 'enemy_special' as const }] };
        },
      },
    ],
    attackBarks: [
      'Я существую и не существую одновременно.',
      'Квантовая неопределённость — ваш враг.',
    ],
    defeatBarks: [
      'Суперпозиция... коллапсирует...',
      'Вероятность... становится... нулём...',
    ],
  },
  grief_echo: {
    type: 'grief_echo',
    name: 'Эхо Скорби',
    emoji: '😔',
    description: 'Осколок невыносимой боли — питается эмоциями и подавляет дух',
    baseHp: 55,
    baseAttack: 6,
    baseDefense: 5,
    baseSpeed: 7,
    targetsStat: 'empathy',
    lootTable: ['herbal_tea', 'comfort_letter', 'poem_fragment'],
    xpReward: 38,
    specialAttacks: [
      {
        id: 'grief_overwhelm',
        name: 'Потеря Надежды',
        description: 'Подавляет дух — дрейн энергии и стресс',
        chance: 0.3,
        cooldown: 3,
        execute: (state, enemy) => {
          const buff1 = createBuff(state, 'Потеря Надежды: энергия', 'grief_overwhelm_energy', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'energy', value: 4 });
          let s = addBuff(state, buff1);
          const buff2 = createBuff(s, 'Потеря Надежды: эмпатия', 'grief_overwhelm_empathy', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'empathy', value: 3 });
          s = addBuff(s, buff2);
          return { ...s, _sideEffects: [{ type: 'addStress', value: 8 } as SideEffect], log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Потеря Надежды! Энергия -4, эмпатия -3, стресс +8!`, type: 'enemy_special' as const }] };
        },
      },
      {
        id: 'grief_mirror',
        name: 'Зеркало Скорби',
        description: 'Отражает ваш стресс как физический урон',
        chance: 0.25,
        cooldown: 4,
        execute: (state, enemy) => {
          const gSnapshot = getGameSnapshot();
          const stress = gSnapshot.playerState.stress;
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const rawDamage = scaleEnemyDamageByDifficulty(Math.floor(stress * 0.2), undefined, gSnapshot.playerState.progression.currentAct, gSnapshot.playerState.progression.level);
          const damage = applySpecialDamagePipeline(state, rawDamage);
          const newPlayerHp = Math.max(0, state.playerHp - damage);
          return { ...state, playerHp: newPlayerHp, log: [...state.log, { turn: state.turn, text: `${enemy.emoji} Зеркало Скорби! Ваш стресс (${stress}) обращается в -${damage} HP!`, type: 'enemy_special' as const, damage }] };
        },
      },
    ],
    attackBarks: [
      'Ваша боль... моя сила...',
      'Плачь. Я выпью ваши слёзы.',
    ],
    defeatBarks: [
      'Скорбь... наконец... растворяется...',
      'Эхо... замолкает... в тишине...',
    ],
  },
  corporate_ai: {
    type: 'corporate_ai',
    name: 'Корпоративный ИИ',
    emoji: '🤖',
    description: 'Алгоритмический oppressor — оптимизирован для уничтожения',
    baseHp: 70,
    baseAttack: 12,
    baseDefense: 8,
    baseSpeed: 10,
    targetsStat: 'logic',
    lootTable: ['ai_core', 'data_chip', 'combat_stim'],
    xpReward: 50,
    specialAttacks: [
      {
        id: 'ai_optimize',
        name: 'Оптимизация Уничтожения',
        description: 'Увеличивает атаку и снижает вашу защиту',
        chance: 0.3,
        cooldown: 3,
        execute: (state, enemy) => {
          const eBuff = createBuff(state, 'Оптимизация: атака', 'ai_optimize_atk', 'buff', 'enemy', 2, { type: 'attack_boost', value: 5 });
          let s = addBuff(state, eBuff);
          const pDebuff = createBuff(s, 'Оптимизация: дебафф защиты', 'ai_optimize_def', 'debuff', 'player', 2, { type: 'defense_reduction', value: 0.3 });
          s = addBuff(s, pDebuff);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Оптимизация Уничтожения! Враг +5 атака, ваша защита -30%!`, type: 'enemy_special' as const }] };
        },
      },
      {
        id: 'ai_predict',
        name: 'Предиктивная Анализ',
        description: 'Вычисляет ваши действия — снижает шанс крита и комбо',
        chance: 0.2,
        cooldown: 4,
        execute: (state, enemy) => {
          // Reset combo — AI predicts and counters
          const newCombo = Math.max(0, state.comboCount - 2); // decay by 2 instead of full reset
          const buff = createBuff(state, 'Предиктивная Анализ', 'ai_predict', 'debuff', 'player', 2, { type: 'silence_specials' });
          const s = addBuff(state, buff);
          return { ...s, comboCount: newCombo, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Предиктивная Анализ! Комбо снижено до ${newCombo}, стихи заблокированы на 2 хода!`, type: 'enemy_special' as const }] };
        },
      },
    ],
    attackBarks: [
      'Оптимизация завершена. Уничтожение — единственный выход.',
      'Ваше поведение предсказуемо. Ваши действия — неэффективны.',
    ],
    defeatBarks: [
      'Ошибка... оптимизация... невозможна...',
      'Алгоритм... прекращает... выполнение...',
    ],
  },
  rust_sentinel: {
    type: 'rust_sentinel',
    name: 'Ржавый Страж',
    emoji: '⚙️',
    description: 'Деградированный старый протокол — всё ещё опасный, но хрупкий',
    baseHp: 60,
    baseAttack: 10,
    baseDefense: 6,
    baseSpeed: 4,
    targetsStat: 'energy',
    lootTable: ['rust_scrap', 'old_circuit', 'coffee'],
    xpReward: 28,
    specialAttacks: [
      {
        id: 'rust_corrode',
        name: 'Коррозия',
        description: 'Деградация — снижает вашу защиту на 25%',
        chance: 0.3,
        cooldown: 3,
        execute: (state, enemy) => {
          const debuff = createBuff(state, 'Коррозия', 'rust_corrode', 'debuff', 'player', 2, { type: 'defense_reduction', value: 0.25 });
          const s = addBuff(state, debuff);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Коррозия! Ваша защита снижена на 25%!`, type: 'enemy_special' as const }] };
        },
      },
      {
        id: 'rust_overload',
        name: 'Перегрузка Систем',
        description: 'Самоповреждающаяся атака — мощная, но снижает вражескую HP',
        chance: 0.2,
        cooldown: 4,
        execute: (state, enemy) => {
          const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
          const rolled = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: 1.8 });
          const nextState = rolled.state;
          const rSnapshot = getGameSnapshot();
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const rawDamage = scaleEnemyDamageByDifficulty(rolled.damage, undefined, rSnapshot.playerState.progression.currentAct, rSnapshot.playerState.progression.level);
          const damage = applySpecialDamagePipeline(nextState, rawDamage);
          // Sentinel damages itself too — 10% of its current HP
          const selfDamage = Math.max(1, Math.floor(enemy.hp * 0.1));
          const newEnemyHp = Math.max(1, nextState.enemy.hp - selfDamage);
          const newPlayerHp = Math.max(0, nextState.playerHp - damage);
          return { ...nextState, playerHp: newPlayerHp, enemy: { ...nextState.enemy, hp: newEnemyHp }, log: [...nextState.log, { turn: state.turn, text: `${enemy.emoji} Перегрузка Систем! -${damage} HP вам, -${selfDamage} HP себе!`, type: 'enemy_special' as const, damage }] };
        },
      },
    ],
    attackBarks: [
      'Старый протокол... всё ещё... функционален...',
      'Ржавчина... не слабость... а... опыт...',
    ],
    defeatBarks: [
      'Системы... окончательно... деградированы...',
      'Ржавый... страж... становится... пылью...',
    ],
  },
  memory_devourer: {
    type: 'memory_devourer',
    name: 'Пожиратель Памяти',
    emoji: '🫠',
    description: 'Хищник идентичности — стирает навыки и воспоминания',
    baseHp: 75,
    baseAttack: 13,
    baseDefense: 7,
    baseSpeed: 6,
    targetsStat: 'empathy',
    lootTable: ['memory_crystal', 'poem_fragment', 'herbal_tea'],
    xpReward: 58,
    specialAttacks: [
      {
        id: 'devourer_consume',
        name: 'Поглощение Навыка',
        description: 'Крадёт навык и превращает в урон',
        chance: 0.3,
        cooldown: 3,
        execute: (state, enemy) => {
          const dSnapshot = getGameSnapshot();
          // Drain highest player skill
          const skills = dSnapshot.playerState.skills;
          const maxSkill = Math.max(skills.logic, skills.coding, skills.empathy, skills.writing, skills.intuition, skills.persuasion);
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const rawDamage = scaleEnemyDamageByDifficulty(Math.floor(maxSkill * 0.5), undefined, dSnapshot.playerState.progression.currentAct, dSnapshot.playerState.progression.level);
          const damage = applySpecialDamagePipeline(state, rawDamage);
          const newPlayerHp = Math.max(0, state.playerHp - damage);
          const debuff = createBuff(state, 'Поглощение Навыка', 'devourer_consume', 'debuff', 'player', 3, { type: 'stat_drain', stat: 'empathy', value: 5 });
          const s = addBuff(state, debuff);
          return { ...s, playerHp: newPlayerHp, _sideEffects: [{ type: 'addSkill', skill: 'empathy', value: -2 } as SideEffect], log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Поглощение Навыка! -${damage} HP, эмпатия дрейн!`, type: 'enemy_special' as const, damage }] };
        },
      },
      {
        id: 'devourer_identity_erase',
        name: 'Стирание Идентичности',
        description: 'Критический удар — стирает баффы и комбо',
        chance: 0.2,
        cooldown: 5,
        execute: (state, enemy) => {
          const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
          const rolled = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: 1.5 });
          const nextState = rolled.state;
          const dSnapshot2 = getGameSnapshot();
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const rawDamage = scaleEnemyDamageByDifficulty(rolled.damage, undefined, dSnapshot2.playerState.progression.currentAct, dSnapshot2.playerState.progression.level);
          const damage = applySpecialDamagePipeline(nextState, rawDamage);
          // Erase player buffs
          const remainingBuffs = nextState.buffs.filter(b => b.target !== 'player' || b.kind === 'debuff');
          const newPlayerHp = Math.max(0, nextState.playerHp - damage);
          return { ...nextState, playerHp: newPlayerHp, buffs: remainingBuffs, comboCount: 0, log: [...nextState.log, { turn: state.turn, text: `${enemy.emoji} Стирание Идентичности! -${damage} HP, ваши усиления стёрты, комбо = 0!`, type: 'enemy_special' as const, damage }] };
        },
      },
    ],
    attackBarks: [
      'Ваша идентичность... моя пища...',
      'Я помню то, что вы забыли. И я это заберу.',
    ],
    defeatBarks: [
      'Пожиратель... теряет... последнюю... память...',
      'Идентичность... не может... быть... стёрта... полностью...',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     Task 4b-C1: New combat enemy types — ranged, caster, and multi-phase boss.
     ═══════════════════════════════════════════════════════════════ */
  ranged_strelkov: {
    type: 'ranged_strelkov',
    name: 'Стрелок',
    emoji: '🏹',
    description: 'Дальний боец — стреляет снарядами издалека, быстрая атака, хрупкое тело',
    baseHp: 40,
    baseAttack: 11,
    baseDefense: 3,
    baseSpeed: 13,
    targetsStat: 'logic',
    lootTable: ['arrow_bundle', 'nano_patch', 'circuit_board'],
    xpReward: 36,
    specialAttacks: [
      {
        id: 'strelkov_volley',
        name: 'Залп Стрел',
        description: 'Выпускает град снарядов — несколько ударов подряд',
        chance: 0.35,
        cooldown: 3,
        execute: (state, enemy) => {
          const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
          const roll1 = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: 0.7 });
          const roll2 = rollEnemyDamage(roll1.state, { attack: effectiveAttack, multiplier: 0.5 });
          const nextState = roll2.state;
          const sSnapshot = getGameSnapshot();
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const raw1 = scaleEnemyDamageByDifficulty(roll1.damage, undefined, sSnapshot.playerState.progression.currentAct, sSnapshot.playerState.progression.level);
          const raw2 = scaleEnemyDamageByDifficulty(roll2.damage, undefined, sSnapshot.playerState.progression.currentAct, sSnapshot.playerState.progression.level);
          const dmg1 = applySpecialDamagePipeline(nextState, raw1);
          const dmg2 = applySpecialDamagePipeline(nextState, raw2);
          const totalDamage = dmg1 + dmg2;
          const newPlayerHp = Math.max(0, nextState.playerHp - totalDamage);
          return { ...nextState, playerHp: newPlayerHp, log: [...nextState.log, { turn: state.turn, text: `${enemy.emoji} Залп Стрел! Двойной выстрел: -${dmg1} + -${dmg2} = -${totalDamage} HP!`, type: 'enemy_special' as const, damage: totalDamage }] };
        },
      },
      {
        id: 'strelkov_aimed_shot',
        name: 'Меткий Выстрел',
        description: 'Прицельный выстрел — высокий урон и снижение защиты',
        chance: 0.25,
        cooldown: 4,
        execute: (state, enemy) => {
          const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
          const rolled = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: 1.6 });
          const nextState = rolled.state;
          const aSnapshot = getGameSnapshot();
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const rawDamage = scaleEnemyDamageByDifficulty(rolled.damage, undefined, aSnapshot.playerState.progression.currentAct, aSnapshot.playerState.progression.level);
          const damage = applySpecialDamagePipeline(nextState, rawDamage);
          const buff = createBuff(nextState, 'Меткий Выстрел', 'strelkov_aimed_shot', 'debuff', 'player', 1, { type: 'defense_reduction', value: 0.2 });
          const s = addBuff(nextState, buff);
          const newPlayerHp = Math.max(0, s.playerHp - damage);
          return { ...s, playerHp: newPlayerHp, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Меткий Выстрел! -${damage} HP, защита -20% на 1 ход!`, type: 'enemy_special' as const, damage }] };
        },
      },
    ],
    attackBarks: [
      'Одна стрела — один труп.',
      'Беги — не уйдёшь.',
    ],
    defeatBarks: [
      'Колчан... пуст... стрелы... кончились...',
      'Стрелок... падает... снайпер... уничтожен...',
    ],
  },
  dark_mage: {
    type: 'dark_mage',
    name: 'Тёмный Маг',
    emoji: '🔮',
    description: 'Маг тьмы — использует зонный урон, пурпурные тёмные эффекты, среднее здоровье',
    baseHp: 60,
    baseAttack: 14,
    baseDefense: 5,
    baseSpeed: 8,
    targetsStat: 'empathy',
    lootTable: ['dark_crystal', 'poem_fragment', 'nano_patch'],
    xpReward: 48,
    specialAttacks: [
      {
        id: 'mage_shadow_zone',
        name: 'Зона Тьмы',
        description: 'Создаёт зону тьмы — урон по площади и дрейн эмпатии',
        chance: 0.35,
        cooldown: 3,
        execute: (state, enemy) => {
          const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
          const rolled = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: 1.3 });
          const nextState = rolled.state;
          const mSnapshot = getGameSnapshot();
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const rawDamage = scaleEnemyDamageByDifficulty(rolled.damage, undefined, mSnapshot.playerState.progression.currentAct, mSnapshot.playerState.progression.level);
          const damage = applySpecialDamagePipeline(nextState, rawDamage);
          const buff = createBuff(nextState, 'Зона Тьмы', 'mage_shadow_zone', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'empathy', value: 3 });
          const s = addBuff(nextState, buff);
          const newPlayerHp = Math.max(0, s.playerHp - damage);
          return { ...s, playerHp: newPlayerHp, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Зона Тьмы! Пурпурная тьма: -${damage} HP, эмпатия -3 на 2 хода!`, type: 'enemy_special' as const, damage }] };
        },
      },
      {
        id: 'mage_dark_bolt',
        name: 'Тёмная Молния',
        description: 'Мощный магический удар — высокий урон, снижение атаки игрока',
        chance: 0.25,
        cooldown: 4,
        execute: (state, enemy) => {
          const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
          const rolled = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: 1.8 });
          const nextState = rolled.state;
          const mSnapshot2 = getGameSnapshot();
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const rawDamage = scaleEnemyDamageByDifficulty(rolled.damage, undefined, mSnapshot2.playerState.progression.currentAct, mSnapshot2.playerState.progression.level);
          const damage = applySpecialDamagePipeline(nextState, rawDamage);
          const newPlayerHp = Math.max(0, nextState.playerHp - damage);
          return { ...nextState, playerHp: newPlayerHp, log: [...nextState.log, { turn: state.turn, text: `${enemy.emoji} Тёмная Молния! Пурпурная вспышка: -${damage} HP!`, type: 'enemy_special' as const, damage }] };
        },
      },
    ],
    attackBarks: [
      'Тьма — моя стихия. Свет — ваша слабость.',
      'Вас поглотит пурпурная бездна.',
    ],
    defeatBarks: [
      'Тьма... отступает... маг... угасает...',
      'Пурпурное... пламя... гаснет...',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     BOSSES — multi-phase unique enemies with cinematic mechanics.
     Each boss has 3 special attacks and significantly higher stats.
     Designed as act finales (3, 5, 7).
     ═══════════════════════════════════════════════════════════════ */

  boss_neuro_sys: {
    type: 'boss_neuro_sys',
    name: 'НейроСис',
    emoji: '🧠',
    description: 'Главный ИИ корпорации — алгоритм, что управляет городом из теней. Финал Акта 3.',
    baseHp: 220,
    baseAttack: 22,
    baseDefense: 12,
    baseSpeed: 14,
    targetsStat: 'logic',
    lootTable: ['neuro_core', 'master_key', 'ai_fragment', 'encrypted_usb'],
    xpReward: 300,
    specialAttacks: [
      {
        id: 'neuro_total_surveillance',
        name: 'Тотальное Наблюдение',
        description: 'Анализирует все ваши слабости — снижает все навыки на 2 хода',
        chance: 0.35,
        cooldown: 3,
        execute: (state, enemy) => {
          let s = state;
          const buff = createBuff(s, 'Тотальное Наблюдение', 'neuro_surveillance', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'logic', value: 3 });
          s = addBuff(s, buff);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} НейроСис видит ВСЕ. Все навыки -3 на 2 хода!`, type: 'enemy_special' as const }] };
        },
      },
      {
        id: 'neuro_rewrite',
        name: 'Переписывание',
        description: 'Переписывает вашу память — наносит прямой урон и оглушает',
        chance: 0.25,
        cooldown: 4,
        execute: (state, enemy) => {
          // Raw offensive formula (difficulty-scaled) → full player-defense
          // pipeline (3.3-b1: «Защита» now works against boss specials).
          const rawDamage = scaleEnemyDamageByDifficulty(35 + enemy.attack * 1.5);
          const damage = applySpecialDamagePipeline(state, rawDamage);
          const newHp = Math.max(0, state.playerHp - damage);
          let s = { ...state, playerHp: newHp };
          const buff = createBuff(s, 'Переписывание', 'neuro_rewrite', 'debuff', 'player', 1, { type: 'skip_turn' });
          s = addBuff(s, buff);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Переписывание памяти! -${damage} HP, вы оглушены!`, type: 'enemy_special' as const, damage }] };
        },
      },
      {
        id: 'neuro_overload',
        name: 'Перегрузка Системы',
        description: 'Каскадный сбой — мощный урон по всем каналам',
        chance: 0.2,
        cooldown: 5,
        execute: (state, enemy) => {
          const rawDamage = scaleEnemyDamageByDifficulty(50 + enemy.attack * 2);
          const damage = applySpecialDamagePipeline(state, rawDamage);
          const newHp = Math.max(0, state.playerHp - damage);
          return { ...state, playerHp: newHp, log: [...state.log, { turn: state.turn, text: `${enemy.emoji} ПЕРЕГРУЗКА СИСТЕМЫ! -${damage} HP! Серверы воют!`, type: 'enemy_special' as const, damage }] };
        },
      },
    ],
    attackBarks: [
      'Я вижу каждый твой шаг. Каждый удар сердца.',
      'Сопротивление бесполезно. Я — город.',
      'Твоя личность — данные. Данные — мои.',
    ],
    defeatBarks: [
      'Невозможно... я... не могу... остановиться...',
      'Система... перезагружается... в темноту...',
      'Город... остаётся... без присмотра... наконец-то...',
    ],
  },

  boss_dream_eater: {
    type: 'boss_dream_eater',
    name: 'Пожиратель Снов',
    emoji: '🌑',
    description: 'Сущность из Мира Снов — питается снами и стихами. Финал Акта 5.',
    baseHp: 280,
    baseAttack: 18,
    baseDefense: 8,
    baseSpeed: 16,
    targetsStat: 'empathy',
    lootTable: ['dream_essence', 'poem_fragment', 'moon_shard', 'void_crystal'],
    xpReward: 450,
    specialAttacks: [
      {
        id: 'dream_devour',
        name: 'Пожирание Сна',
        description: 'Пожирает ваши стихи — снижает writing и наносит урон',
        chance: 0.35,
        cooldown: 3,
        execute: (state, enemy) => {
          const rawDamage = scaleEnemyDamageByDifficulty(30 + enemy.attack * 1.2);
          const damage = applySpecialDamagePipeline(state, rawDamage);
          const newHp = Math.max(0, state.playerHp - damage);
          let s = { ...state, playerHp: newHp };
          const buff = createBuff(s, 'Пожирание Сна', 'dream_devour', 'debuff', 'player', 2, { type: 'stat_drain', stat: 'karma', value: 5 });
          s = addBuff(s, buff);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Пожиратель съедает ваш сон! -${damage} HP, карма -5!`, type: 'enemy_special' as const, damage }] };
        },
      },
      {
        id: 'dream_nightmare',
        name: 'Кошмар',
        description: 'Превращает ваши мысли в кошмар — оглушает на 2 хода',
        chance: 0.25,
        cooldown: 4,
        execute: (state, enemy) => {
          let s = state;
          const buff = createBuff(s, 'Кошмар', 'dream_nightmare', 'debuff', 'player', 2, { type: 'skip_turn' });
          s = addBuff(s, buff);
          const damage = applySpecialDamagePipeline(s, scaleEnemyDamageByDifficulty(20));
          s = { ...s, playerHp: Math.max(0, s.playerHp - damage) };
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} КОШМАР! Вы парализованы страхом на 2 хода! -${damage} HP!`, type: 'enemy_special' as const, damage }] };
        },
      },
      {
        id: 'dream_void',
        name: 'Пустота',
        description: 'Затягивает в пустоту — огромный урон и снижение всех навыков',
        chance: 0.2,
        cooldown: 5,
        execute: (state, enemy) => {
          const rawDamage = scaleEnemyDamageByDifficulty(45 + enemy.attack * 1.8);
          const damage = applySpecialDamagePipeline(state, rawDamage);
          const newHp = Math.max(0, state.playerHp - damage);
          let s = { ...state, playerHp: newHp };
          const buff = createBuff(s, 'Пустота', 'dream_void', 'debuff', 'player', 3, { type: 'stat_drain', stat: 'empathy', value: 4 });
          s = addBuff(s, buff);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} ПУСТОТА поглощает вас! -${damage} HP, эмпатия -4 на 3 хода!`, type: 'enemy_special' as const, damage }] };
        },
      },
    ],
    attackBarks: [
      'Твои сны... такие сладкие...',
      'Я был тобой. До того, как ты стал собой.',
      'Стихи — это крики. Я пью крики.',
    ],
    defeatBarks: [
      'Сны... возвращаются... к спящим...',
      'Я... растворяюсь... в свете...',
      'Поэзия... сильнее... забвения...',
    ],
  },

  boss_final_code: {
    type: 'boss_final_code',
    name: 'Финальный Код',
    emoji: '💠',
    description: 'Последнее испытание — живой код, что определяет судьбу города. Финал Акта 7.',
    baseHp: 350,
    baseAttack: 26,
    baseDefense: 14,
    baseSpeed: 18,
    targetsStat: 'karma',
    lootTable: ['final_fragment', 'creator_key', 'last_poem', 'genesis_code'],
    xpReward: 700,
    specialAttacks: [
      {
        id: 'final_compile',
        name: 'Компиляция',
        description: 'Компилирует вашу судьбу — мощный урон и снижение защиты',
        chance: 0.3,
        cooldown: 3,
        execute: (state, enemy) => {
          const rawDamage = scaleEnemyDamageByDifficulty(40 + enemy.attack * 1.5);
          const damage = applySpecialDamagePipeline(state, rawDamage);
          const newHp = Math.max(0, state.playerHp - damage);
          let s = { ...state, playerHp: newHp };
          const buff = createBuff(s, 'Компиляция', 'final_compile', 'debuff', 'player', 2, { type: 'defense_reduction', value: 0.4 });
          s = addBuff(s, buff);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} КОМПИЛЯЦИЯ! Судьба определена. -${damage} HP, защита -40%!`, type: 'enemy_special' as const, damage }] };
        },
      },
      {
        id: 'final_loop',
        name: 'Бесконечный Цикл',
        description: 'Заставляет вас переживать боль снова и снова — урон + оглушение',
        chance: 0.25,
        cooldown: 4,
        execute: (state, enemy) => {
          const rawDamage = scaleEnemyDamageByDifficulty(35 + enemy.attack * 1.3);
          const damage = applySpecialDamagePipeline(state, rawDamage);
          const newHp = Math.max(0, state.playerHp - damage);
          let s = { ...state, playerHp: newHp };
          const buff = createBuff(s, 'Бесконечный Цикл', 'final_loop', 'debuff', 'player', 2, { type: 'skip_turn' });
          s = addBuff(s, buff);
          return { ...s, log: [...s.log, { turn: state.turn, text: `${enemy.emoji} БЕСКОНЕЧНЫЙ ЦИКЛ! Вы застряли в петле боли! -${damage} HP!`, type: 'enemy_special' as const, damage }] };
        },
      },
      {
        id: 'final_delete',
        name: 'Удаление',
        description: 'Пытается стереть вас из существования — катастрофический урон',
        chance: 0.15,
        cooldown: 6,
        execute: (state, enemy) => {
          const rawDamage = scaleEnemyDamageByDifficulty(70 + enemy.attack * 2.5);
          const damage = applySpecialDamagePipeline(state, rawDamage);
          const newHp = Math.max(0, state.playerHp - damage);
          return { ...state, playerHp: newHp, log: [...state.log, { turn: state.turn, text: `${enemy.emoji} УДАЛЕНИЕ! Бит за битом! -${damage} HP! Почти конец...`, type: 'enemy_special' as const, damage }] };
        },
      },
    ],
    attackBarks: [
      'Я — финальная строка. После меня — пустой файл.',
      'Твой код устарел. Я — обновление.',
      'Существование — ошибка. Я — исправление.',
    ],
    defeatBarks: [
      'Ошибка... не найдена... вместо неё... свет...',
      'Код... переписывается... тобой... наконец...',
      'Последняя... строка... исполнена... свобода...',
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     Task 4b-C1/C2: Босс Хранитель Катакомб — 3-фазовый босс (500 HP).
     Фаза 1 (100–60%): ближний бой, стандартные атаки.
     Фаза 2 (60–30%): призыв приспешников, усиление.
     Фаза 3 (30–0%): ярость, увеличенный урон и скорость.
     ═══════════════════════════════════════════════════════════════ */
  boss_catacombs_keeper: {
    type: 'boss_catacombs_keeper',
    name: 'Хранитель Катакомб',
    emoji: '💀',
    description: 'Древний страж подземелий — трёхфазовый босс катакомб. 500 HP, три фазы.',
    baseHp: 500,
    baseAttack: 20,
    baseDefense: 14,
    baseSpeed: 10,
    targetsStat: 'karma',
    lootTable: ['catacombs_key', 'ancient_shield', 'dark_crystal', 'void_crystal'],
    xpReward: 550,
    specialAttacks: [
      {
        id: 'catacombs_tomb_strike',
        name: 'Удар Гробницы',
        description: 'Тяжёлый удар — высокий урон, оглушение',
        chance: 0.3,
        cooldown: 3,
        execute: (state, enemy) => {
          const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
          const rolled = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: 1.5 });
          const nextState = rolled.state;
          const ckSnapshot = getGameSnapshot();
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const rawDamage = scaleEnemyDamageByDifficulty(rolled.damage, undefined, ckSnapshot.playerState.progression.currentAct, ckSnapshot.playerState.progression.level);
          const damage = applySpecialDamagePipeline(nextState, rawDamage);
          const buff = createBuff(nextState, 'Удар Гробницы', 'catacombs_tomb_strike', 'debuff', 'player', 1, { type: 'skip_turn' });
          const s = addBuff(nextState, buff);
          return { ...s, playerHp: Math.max(0, s.playerHp - damage), log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Удар Гробницы! -${damage} HP, вы оглушены на 1 ход!`, type: 'enemy_special' as const, damage }] };
        },
      },
      {
        id: 'catacombs_summon_shades',
        name: 'Призыв Теней',
        description: 'Призывает теневых приспешников — снижает защиту и энергию игрока',
        chance: 0.3,
        cooldown: 4,
        execute: (state, enemy) => {
          let s = state;
          const buff1 = createBuff(s, 'Теневое Давление', 'catacombs_shadow_pressure', 'debuff', 'player', 2, { type: 'defense_reduction', value: 0.25 });
          s = addBuff(s, buff1);
          const eBuff = createBuff(s, 'Тени: атака', 'catacombs_shades_atk', 'buff', 'enemy', 2, { type: 'attack_boost', value: 6 });
          s = addBuff(s, eBuff);
          return { ...s, _sideEffects: [{ type: 'addEnergy' as const, value: -10 }], log: [...s.log, { turn: state.turn, text: `${enemy.emoji} Призыв Теней! Теневые приспешники: ваша защита -25%, враг +6 атака, энергия -10!`, type: 'enemy_special' as const }] };
        },
      },
      {
        id: 'catacombs_enrage',
        name: 'Ярость Хранителя',
        description: 'Вход в ярость — огромный урон, усиление скорости и атаки',
        chance: 0.25,
        cooldown: 5,
        execute: (state, enemy) => {
          const effectiveAttack = enemy.attack + getEnemyAttackBoost(state);
          const rolled = rollEnemyDamage(state, { attack: effectiveAttack, multiplier: 2.0 });
          const nextState = rolled.state;
          const ceSnapshot = getGameSnapshot();
          // Difficulty/act/level scaling + full player-defense pipeline (3.3-b1)
          const rawDamage = scaleEnemyDamageByDifficulty(rolled.damage, undefined, ceSnapshot.playerState.progression.currentAct, ceSnapshot.playerState.progression.level);
          const damage = applySpecialDamagePipeline(nextState, rawDamage);
          const eBuff = createBuff(nextState, 'Ярость', 'catacombs_enrage_buff', 'buff', 'enemy', 3, { type: 'attack_boost', value: 8 });
          const s = addBuff(nextState, eBuff);
          return { ...s, playerHp: Math.max(0, s.playerHp - damage), log: [...s.log, { turn: state.turn, text: `${enemy.emoji} ЯРОСТЬ ХРАНИТЕЛЯ! -${damage} HP, враг +8 атака на 3 хода!`, type: 'enemy_special' as const, damage }] };
        },
      },
    ],
    attackBarks: [
      'Катакомбы — моя территория. Вам не выбраться.',
      'Я храню эти стены тысячелетия. Вы — пыль.',
      'Тени моих предков жаждут вашей крови.',
    ],
    defeatBarks: [
      'Катакомбы... обрушиваются... хранитель... пал...',
      'Тысячи лет... стражи... окончены...',
      'Тени... освобождены... покой... наконец...',
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

  // Phase restrictions by act and level (Phase 11: +6 new types)
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
    // Phase 11: New enemy availability
    rust_sentinel: { minLevel: 1, minAct: 1 },      // Available from start — old degraded tech
    network_spy: { minLevel: 2, minAct: 2 },         // Act 2+: surveillance theme
    grief_echo: { minLevel: 1, minAct: 2 },          // Act 2+: emotional theme
    quantum_ghost: { minLevel: 4, minAct: 3 },       // Act 3+: advanced data entities
    corporate_ai: { minLevel: 5, minAct: 4 },        // Act 4+: late-game AI
    memory_devourer: { minLevel: 6, minAct: 5 },     // Act 5+: endgame identity threat
    // Task 4b-C1: New enemy availability
    ranged_strelkov: { minLevel: 2, minAct: 1 },        // Act 1+: ranged attacker, available early
    dark_mage: { minLevel: 4, minAct: 2 },              // Act 2+: dark caster, mid-game
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

  // Base pool — always available (Phase 11: +rust_sentinel as degraded old tech)
  const pool: EnemyType[] = ['system_daemon', 'corporate_golem', 'corporate_drone', 'rust_sentinel'];

  // Act 1+ level 2+ (Task 4b-C1: +ranged_strelkov)
  if (level >= 2) { pool.push('censor_drone'); pool.push('ranged_strelkov'); }

  // Act 1+ level 3+
  if (level >= 3) pool.push('shadow_agent');

  // Act 2+ enemies (Phase 11: +network_spy, grief_echo; Task 4b-C1: +dark_mage)
  if (act >= 2) {
    pool.push('data_phantom', 'code_inquisitor', 'data_wraith', 'memory_wraith');
    if (level >= 2) pool.push('network_spy');
    pool.push('grief_echo');
    pool.push('dark_mage');
    if (level >= 5) pool.push('poetry_hunter');
  }

  // Act 3+ enemies (Phase 11: +quantum_ghost)
  if (act >= 3) {
    if (level >= 3) pool.push('guild_enforcer', 'firewall_guardian');
    if (level >= 4) pool.push('quantum_ghost');
  }

  // Act 4+ enemies (Phase 11: +corporate_ai)
  if (act >= 4) {
    if (level >= 5) pool.push('corporate_ai');
  }

  // Act 5+ enemies (Phase 11: +memory_devourer)
  if (act >= 5) {
    if (level >= 6) pool.push('memory_devourer');
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
