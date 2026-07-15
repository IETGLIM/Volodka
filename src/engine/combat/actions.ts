/* ─── Combat System — Poem Combat Abilities, Combos, Side Effects ─── */

import type { CombatState, CombatLogEntry, SideEffect } from './types';
import type { PoemCombatAbility } from './types';
import {
  dispatchGameAction,
  getGameSnapshot,
  tryActivatePoemPower,
} from '@/engine/GameActionDispatcher';
import { isTrainablePlayerSkill, warnInvalidValue } from '@/shared/validation/typeGuards';
import { createBuff, addBuff, getEnemyDefenseReduction } from './buffSystem';
import { getComboDamageMultiplier, getPlayerAttack } from './formulas';
import { COMBAT_CONSTANTS } from './formulas';
import { rollPlayerDamage } from './combatRng';
import { enrichPoemMechanicsRecord } from '@/data/unifiedPoemRegistry';

function snap() {
  return getGameSnapshot();
}

function getSnapshotAttack(): number {
  const { skills } = snap().playerState;
  return skills.coding + skills.logic;
}

/* ═══════════════════════════════════════════════════════════════
   §3 — POEM COMBAT ABILITIES (with cooldowns)
   ═══════════════════════════════════════════════════════════════ */

const RAW_POEM_COMBAT_ABILITIES: Record<string, PoemCombatAbility> = {
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
      const playerAttack = getSnapshotAttack();
      const enemyDef = Math.max(0, state.enemy.defense * (1 - getEnemyDefenseReduction(state)));
      const { damage, state: afterRng } = rollPlayerDamage(state, { attack: playerAttack, defense: enemyDef, multiplier: 2 });
      const comboMult = getComboDamageMultiplier(state.comboCount + 1);
      const finalDamage = Math.floor(damage * comboMult);
      const newEnemyHp = Math.max(0, afterRng.enemy.hp - finalDamage);
      return {
        ...afterRng,
        enemy: { ...afterRng.enemy, hp: newEnemyHp },
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Штормовой Ветер! ${finalDamage} урона!`, type: 'player_attack' as const, damage: finalDamage },
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
      const playerAttack = getSnapshotAttack();
      const { damage, state: afterRng } = rollPlayerDamage(state, { attack: playerAttack, multiplier: 1.5 });
      const comboMult = getComboDamageMultiplier(state.comboCount + 1);
      const finalDamage = Math.floor(damage * comboMult);
      const newEnemyHp = Math.max(0, afterRng.enemy.hp - finalDamage);
      return {
        ...afterRng,
        enemy: { ...afterRng.enemy, hp: newEnemyHp },
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Прорыв! ${finalDamage} чистого урона!`, type: 'player_attack' as const, damage: finalDamage },
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
      const playerAttack = getSnapshotAttack();
      const enemyDef = Math.max(0, state.enemy.defense * (1 - getEnemyDefenseReduction(state)));
      const roll1 = rollPlayerDamage(state, { attack: playerAttack, defense: enemyDef });
      const roll2 = rollPlayerDamage(roll1.state, { attack: playerAttack, defense: enemyDef });
      const comboMult = getComboDamageMultiplier(state.comboCount + 1);
      const dmg1 = Math.floor(roll1.damage * comboMult);
      const dmg2 = Math.floor(roll2.damage * comboMult);
      const totalDmg = dmg1 + dmg2;
      const newEnemyHp = Math.max(0, roll2.state.enemy.hp - totalDmg);
      return {
        ...roll2.state,
        enemy: { ...roll2.state.enemy, hp: newEnemyHp },
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
      const rawDamage = Math.min(Math.floor(state.enemy.maxHp * 0.25), Math.floor(getPlayerAttack() * 3));
      const reduction = getEnemyDefenseReduction(state);
      const baseDamage = Math.floor(rawDamage * (1 - reduction));
      const comboMult = getComboDamageMultiplier(state.comboCount + 1);
      const drainAmount = Math.floor(baseDamage * comboMult);
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
      const karmaBonus = Math.floor(snap().playerState.karma / 10);
      const playerAttack = getSnapshotAttack();
      const enemyDef = Math.max(0, state.enemy.defense * (1 - getEnemyDefenseReduction(state)));
      const { damage, state: afterRng } = rollPlayerDamage(state, { attack: playerAttack, defense: enemyDef, attackBonus: karmaBonus * 2 });
      const comboMult = getComboDamageMultiplier(state.comboCount + 1);
      const finalDamage = Math.floor(damage * comboMult);
      const newEnemyHp = Math.max(0, afterRng.enemy.hp - finalDamage);
      return {
        ...afterRng,
        enemy: { ...afterRng.enemy, hp: newEnemyHp },
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Звездный Путь! ${finalDamage} урона (карма-бонус: +${karmaBonus * 2})!`, type: 'player_attack' as const, damage: finalDamage },
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
      const playerAttack = getSnapshotAttack();
      const enemyDef = Math.max(0, state.enemy.defense * (1 - getEnemyDefenseReduction(state)));
      const { damage, state: afterRng } = rollPlayerDamage(state, { attack: playerAttack, defense: enemyDef, multiplier: 1.8 });
      const comboMult = getComboDamageMultiplier(state.comboCount + 1);
      const finalDamage = Math.floor(damage * comboMult);
      const newEnemyHp = Math.max(0, afterRng.enemy.hp - finalDamage);
      return {
        ...afterRng,
        enemy: { ...afterRng.enemy, hp: newEnemyHp },
        _sideEffects: [{ type: 'addKarma', value: 8 } as SideEffect],
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Последнее Слово! ${finalDamage} урона, +8 кармы!`, type: 'player_attack' as const, damage: finalDamage },
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
      // Cap % damage like poem_11/17 to prevent degenerate true-damage strategy
      const rawDamage = Math.min(Math.floor(state.enemy.maxHp * 0.2), Math.floor(getPlayerAttack() * 2.5));
      const reduction = getEnemyDefenseReduction(state);
      const baseDamage = Math.floor(rawDamage * (1 - reduction));
      const comboMult = getComboDamageMultiplier(state.comboCount + 1);
      const confusionDmg = Math.floor(baseDamage * comboMult);
      const newEnemyHp = Math.max(0, state.enemy.hp - confusionDmg);
      const buff = createBuff(state, 'Тихий Шёпот', 'poem_15', 'debuff', 'enemy', 1, { type: 'skip_turn' });
      const s = addBuff({ ...state, enemy: { ...state.enemy, hp: newEnemyHp } }, buff);
      return {
        ...s,
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
      const lastUsed = state.lastUsedPoemId;
      if (lastUsed && lastUsed !== 'poem_16') {
        const ability = POEM_COMBAT_ABILITIES[lastUsed];
        if (ability) {
          const result = ability.execute(state);
          // Merge nested side effects: consume them from the inner result
          // so they aren't lost when the outer consumeSideEffects runs.
          const nestedSideEffects = result._sideEffects ?? [];
          const outerSideEffects = state._sideEffects ?? [];
          return {
            ...result,
            _sideEffects: [...outerSideEffects, ...nestedSideEffects],
            // Safety: if the echoed ability would drop player HP below 1
            // (e.g. poem_18 Финальный Аккорд costs 50% HP), clamp to 1
            playerHp: Math.max(1, result.playerHp),
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
      const rawDamage = Math.min(Math.floor(state.enemy.maxHp * 0.3), Math.floor(getPlayerAttack() * 3.5));
      const reduction = getEnemyDefenseReduction(state);
      const baseDamage = Math.floor(rawDamage * (1 - reduction));
      const comboMult = getComboDamageMultiplier(state.comboCount + 1);
      const stealAmount = Math.floor(baseDamage * comboMult);
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
      const playerAttack = getSnapshotAttack();
      const karmaBonus = Math.floor(snap().playerState.karma * 0.5);
      const { damage, state: afterRng } = rollPlayerDamage(state, { attack: playerAttack, multiplier: 1.5, attackBonus: karmaBonus * 1.5 });
      const comboMult = getComboDamageMultiplier(state.comboCount + 1);
      const finalDamage = Math.floor(damage * comboMult);
      const newEnemyHp = Math.max(0, afterRng.enemy.hp - finalDamage);
      // Side effect: player sacrifices 50% of current HP
      const hpCost = Math.floor(state.playerHp * 0.5);
      const newPlayerHp = Math.max(1, state.playerHp - hpCost);
      return {
        ...afterRng,
        enemy: { ...afterRng.enemy, hp: newEnemyHp },
        playerHp: newPlayerHp,
        _sideEffects: [{ type: 'addEnergy', value: -30 } as SideEffect],
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Финальный Аккорд! ${finalDamage} урона! Но цена: -${hpCost} HP, -30 энергии`, type: 'player_attack' as const, damage: finalDamage },
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
      const playerAttack = getSnapshotAttack() + 10;
      const { damage, state: afterRng } = rollPlayerDamage(state, { attack: playerAttack, multiplier: 2 });
      const comboMult = getComboDamageMultiplier(state.comboCount + 1);
      const finalDamage = Math.floor(damage * comboMult);
      const newEnemyHp = Math.max(0, afterRng.enemy.hp - finalDamage);
      return {
        ...afterRng,
        enemy: { ...afterRng.enemy, hp: newEnemyHp },
        _sideEffects: [
          { type: 'addSkill', skill: 'coding', value: 5 } as SideEffect,
          { type: 'addSkill', skill: 'logic', value: 5 } as SideEffect,
        ],
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Белая Река, Чёрный Кабель! Системная перегрузка: ${finalDamage} чистого урона! +5 кодинг, +5 логика!`, type: 'player_attack' as const, damage: finalDamage },
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
      const playerAttack = getSnapshotAttack();
      const enemyDef = Math.max(0, state.enemy.defense * (1 - getEnemyDefenseReduction(state)));
      const { damage, state: afterRng } = rollPlayerDamage(state, { attack: playerAttack, defense: enemyDef, multiplier: 1.8 });
      const comboMult = getComboDamageMultiplier(state.comboCount + 1);
      const finalDamage = Math.floor(damage * comboMult);
      const newEnemyHp = Math.max(0, afterRng.enemy.hp - finalDamage);
      return {
        ...afterRng,
        enemy: { ...afterRng.enemy, hp: newEnemyHp },
        _sideEffects: [{ type: 'addSkill', skill: 'intuition', value: 4 } as SideEffect],
        log: [
          ...state.log,
          { turn: state.turn, text: `✦ Ветер Высот! ${finalDamage} урона! +4 интуиции!`, type: 'player_attack' as const, damage: finalDamage },
        ],
      };
    },
  },
};

export const POEM_COMBAT_ABILITIES = enrichPoemMechanicsRecord(
  RAW_POEM_COMBAT_ABILITIES,
  'combat',
);

/* ═══════════════════════════════════════════════════════════════
   §3.5 — SIDE-EFFECT APPLICATION (P0-2.6)
   ═══════════════════════════════════════════════════════════════ */

/** Apply deferred side effects via the game action bridge. */
export function applyCombatSideEffects(effects: SideEffect[] | undefined): void {
  if (!effects || effects.length === 0) return;
  for (const eff of effects) {
    switch (eff.type) {
      case 'addEnergy':
        dispatchGameAction({ type: 'player/addEnergy', amount: eff.value });
        break;
      case 'addKarma':
        dispatchGameAction({ type: 'player/addKarma', amount: eff.value });
        break;
      case 'addStress':
        dispatchGameAction({ type: 'player/addStress', amount: eff.value });
        break;
      case 'addSkill':
        if (isTrainablePlayerSkill(eff.skill)) {
          dispatchGameAction({ type: 'player/addSkill', skill: eff.skill, amount: eff.value });
        } else {
          warnInvalidValue('combat side effect skill', eff.skill);
        }
        break;
      case 'addXp':
        dispatchGameAction({ type: 'player/addXp', amount: eff.value });
        break;
      case 'setCombatActive':
        dispatchGameAction({ type: 'story/setCombatActive', active: eff.active });
        break;
      case 'addPoemPower':
        tryActivatePoemPower(eff.poemId);
        break;
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
        const playerAttack = getSnapshotAttack();
        const enemyDef = Math.max(0, s.enemy.defense * (1 - getEnemyDefenseReduction(s)) * COMBAT_CONSTANTS.COMBO_ISTINA_DEFENSE_FACTOR);
        const { damage, state: afterRng } = rollPlayerDamage(s, { attack: playerAttack, defense: enemyDef, multiplier: 2.5 });
        const comboMult = getComboDamageMultiplier(s.comboCount + 1);
        const finalDamage = Math.floor(damage * comboMult);
        const newEnemyHp = Math.max(0, afterRng.enemy.hp - finalDamage);
        return { ...afterRng, enemy: { ...afterRng.enemy, hp: newEnemyHp }, log: [...afterRng.log, { turn: s.turn, text: `✦✦ Истина и Шторм! ${finalDamage} колоссального урона!`, type: 'poem_combo' as const, damage: finalDamage, isCritical: true }] };
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
        const playerAttack = getSnapshotAttack();
        const karmaBonus = Math.floor(snap().playerState.karma * 0.3);
        const { damage, state: afterRng } = rollPlayerDamage(s, { attack: playerAttack, multiplier: 2.5, attackBonus: karmaBonus });
        const comboMult = getComboDamageMultiplier(s.comboCount + 1);
        const finalDamage = Math.floor(damage * comboMult);
        const newEnemyHp = Math.max(0, afterRng.enemy.hp - finalDamage);
        return { ...afterRng, enemy: { ...afterRng.enemy, hp: newEnemyHp }, _sideEffects: [{ type: 'addKarma', value: 12 } as SideEffect], log: [...afterRng.log, { turn: s.turn, text: `✦✦ Последний Шторм! ${finalDamage} урона, +12 кармы!`, type: 'poem_combo' as const, damage: finalDamage, isCritical: true }] };
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
