/* ─── Combat System — Poem Combat Abilities, Combos, Side Effects, Skill Tree ─── */

import type { CombatState, CombatLogEntry, SideEffect } from './types';
import type { PoemCombatAbility } from './types';
import { getGameStore } from '@/store/gameStore';
import { isGameMode, isTrainablePlayerSkill, warnInvalidValue } from '@/shared/validation/typeGuards';
import { createBuff, addBuff } from './buffSystem';
import { getEnemyDefenseReduction } from './buffSystem';

/* ═══════════════════════════════════════════════════════════════
   §3 — POEM COMBAT ABILITIES (with cooldowns)
   ═══════════════════════════════════════════════════════════════ */

export const POEM_COMBAT_ABILITIES: Record<string, PoemCombatAbility> = {
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
      case 'addSkill':
        if (isTrainablePlayerSkill(eff.skill)) {
          store.addSkill(eff.skill, eff.value);
        } else {
          warnInvalidValue('combat side effect skill', eff.skill);
        }
        break;
      case 'addXp': store.addXp(eff.value); break;
      case 'setMode':
        if (isGameMode(eff.mode)) {
          store.setMode(eff.mode);
        } else {
          warnInvalidValue('combat side effect mode', eff.mode);
        }
        break;
      case 'addPoemPower': store.activatePoemPower(eff.poemId); break;
    }
  }
}

/** Extract and apply side effects from a CombatState, returning the state
 *  with _sideEffects cleared so they never persist in stored combat state. */
export function consumeSideEffects(state: CombatState): CombatState {
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
export function checkPoemPowerCombo(
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
   §13 — SKILL TREE DEFINITION
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
export function applySkillEffect(effect: string): void {
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
