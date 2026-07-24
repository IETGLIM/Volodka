/* ─── Combat Consumables — Use Inventory Items During Combat ───
 *  Phase 11: Players can now use items from their inventory during combat.
 *  This adds strategic depth (like Persona/Disco Elysium consumables) and
 *  makes inventory management matter during encounters.
 *
 *  Each combat consumable has:
 *  - itemId: matches an item definition in src/data/items.ts
 *  - name: Russian display name
 *  - description: what it does
 *  - effect: function that modifies CombatState
 *  - consumesItem: whether the item is removed from inventory on use
 *
 *  Combat consumables are a separate turn action (use_item) — they take
 *  the player's turn (just like defend or poem_power), then the enemy acts.
 */

import type { CombatState, CombatLogEntry } from '@/shared/types/definitions/combat';
import { appendLog } from '@/engine/combat/types';
import { createBuff, addBuff } from '@/engine/combat/buffSystem';
import { getPlayerMaxHp } from '@/engine/combat/formulas';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';

export interface CombatConsumableEffect {
  /** Item ID matching inventory item definition */
  readonly itemId: string;
  /** Russian display name */
  readonly name: string;
  /** Description shown in combat UI */
  readonly description: string;
  /** Emoji icon for UI display */
  readonly emoji: string;
  /** Whether the item is consumed (removed from inventory) on use */
  readonly consumes: boolean;
  /** Execute the consumable effect, returning updated CombatState */
  readonly execute: (state: CombatState) => CombatState;
}

/* ═══════════════════════════════════════════════════════════════
   COMBAT CONSUMABLE DEFINITIONS
   Items that can be used during combat turns. Each corresponds
   to an inventory item the player must possess.
   ═══════════════════════════════════════════════════════════════ */

export const COMBAT_CONSUMABLES: CombatConsumableEffect[] = [
  {
    itemId: 'energy_drink',
    name: 'Энергетический Напиток',
    description: 'Восстанавливает 20 HP и +5 энергии на 2 хода',
    emoji: '☕',
    consumes: true,
    execute: (state) => {
      const maxHp = getPlayerMaxHp();
      const healAmount = Math.min(20, maxHp - state.playerHp);
      const newPlayerHp = Math.min(maxHp, state.playerHp + healAmount);
      const buff = createBuff(state, 'Энергетик: энергия', 'energy_drink_combat', 'buff', 'player', 2, { type: 'attack_boost', value: 5 });
      const s = addBuff(state, buff);
      const log: CombatLogEntry = {
        turn: state.turn,
        text: `☕ Энергетический Напиток! +${healAmount} HP, +5 атака на 2 хода!`,
        type: 'player_item' as const,
        itemId: 'energy_drink',
      };
      return { ...s, playerHp: newPlayerHp, log: appendLog(s.log, log) };
    },
  },
  {
    itemId: 'combat_stim',
    name: 'Боевой Стимулятор',
    description: 'Увеличивает атаку +8 на 3 хода, но +5 стресса',
    emoji: '💉',
    consumes: true,
    execute: (state) => {
      const buff = createBuff(state, 'Стимулятор: атака', 'combat_stim_atk', 'buff', 'player', 3, { type: 'attack_boost', value: 8 });
      let s = addBuff(state, buff);
      const log: CombatLogEntry = {
        turn: state.turn,
        text: `💉 Боевой Стимулятор! +8 атака на 3 хода, стресс +5!`,
        type: 'player_item' as const,
        itemId: 'combat_stim',
      };
      return { ...s, _sideEffects: [{ type: 'addStress', value: 5 }], log: appendLog(s.log, log) };
    },
  },
  {
    itemId: 'nano_patch',
    name: 'Нано-Пластырь',
    description: 'Восстанавливает 15 HP и снимает 1 дебафф',
    emoji: '🩹',
    consumes: true,
    execute: (state) => {
      const maxHp = getPlayerMaxHp();
      const healAmount = Math.min(15, maxHp - state.playerHp);
      const newPlayerHp = Math.min(maxHp, state.playerHp + healAmount);
      // Remove the most harmful debuff (first player debuff found)
      const playerDebuffs = state.buffs.filter(b => b.target === 'player' && b.kind === 'debuff');
      const removedDebuff = playerDebuffs.length > 0 ? playerDebuffs[0] : null;
      const newBuffs = removedDebuff
        ? state.buffs.filter(b => b.id !== removedDebuff.id)
        : state.buffs;
      const log: CombatLogEntry = {
        turn: state.turn,
        text: `🩹 Нано-Пластырь! +${healAmount} HP${removedDebuff ? `, снят: ${removedDebuff.name}` : ''}!`,
        type: 'player_item' as const,
        itemId: 'nano_patch',
      };
      return { ...state, playerHp: newPlayerHp, buffs: newBuffs, log: appendLog(state.log, log) };
    },
  },
  {
    itemId: 'herbal_tea',
    name: 'Травяной Чай',
    description: 'Восстанавливает 10 HP, -8 стресса, +3 эмпатия на 2 хода',
    emoji: '🍵',
    consumes: true,
    execute: (state) => {
      const maxHp = getPlayerMaxHp();
      const healAmount = Math.min(10, maxHp - state.playerHp);
      const newPlayerHp = Math.min(maxHp, state.playerHp + healAmount);
      const buff = createBuff(state, 'Чай: защита', 'herbal_tea_combat', 'buff', 'player', 2, { type: 'defense_boost', value: 3 });
      const s = addBuff(state, buff);
      const log: CombatLogEntry = {
        turn: state.turn,
        text: `🍵 Травяной Чай! +${healAmount} HP, -8 стресса, +3 защита на 2 хода!`,
        type: 'player_item' as const,
        itemId: 'herbal_tea',
      };
      return { ...s, playerHp: newPlayerHp, _sideEffects: [{ type: 'addStress', value: -8 }], log: appendLog(s.log, log) };
    },
  },
  {
    itemId: 'coffee',
    name: 'Кофе из Автомата',
    description: '+4 кодинг на 2 хода, но +3 стресса. Дешёвый, но эффективный.',
    emoji: '☕',
    consumes: true,
    execute: (state) => {
      const buff = createBuff(state, 'Кофе: атака', 'coffee_combat', 'buff', 'player', 2, { type: 'attack_boost', value: 4 });
      const s = addBuff(state, buff);
      const log: CombatLogEntry = {
        turn: state.turn,
        text: `☕ Кофе из Автомата! +4 атака на 2 хода, стресс +3!`,
        type: 'player_item' as const,
        itemId: 'coffee',
      };
      return { ...s, _sideEffects: [{ type: 'addStress', value: 3 }], log: appendLog(s.log, log) };
    },
  },
];

/* ═══════════════════════════════════════════════════════════════
   API — find consumable by item ID, check availability
   ═══════════════════════════════════════════════════════════════ */

/** Find a combat consumable definition by its item ID. */
export function findCombatConsumable(itemId: string): CombatConsumableEffect | undefined {
  return COMBAT_CONSUMABLES.find(c => c.itemId === itemId);
}

/** Check if the player has the required item in their inventory. */
export function hasItemForCombat(itemId: string): boolean {
  const snap = getGameSnapshot();
  const inventory = snap.inventory ?? [];
  return inventory.some(item => item.id === itemId && item.quantity > 0);
}

/** Get all consumables the player currently has in their inventory. */
export function getAvailableCombatConsumables(): CombatConsumableEffect[] {
  const snap = getGameSnapshot();
  const inventory = snap.inventory ?? [];
  const availableIds = new Set(inventory.filter(i => i.quantity > 0).map(i => i.id));
  return COMBAT_CONSUMABLES.filter(c => availableIds.has(c.itemId));
}

/** Remove a consumed item from the player's inventory.
 *  Dispatches the appropriate game action to decrement quantity. */
export function consumeCombatItem(itemId: string): void {
  // Use the existing dispatcher to handle inventory changes
  dispatchGameAction({ type: 'inventory/removeItem', itemId, quantity: 1 });
}
