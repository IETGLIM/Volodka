/* ─── Volodka RPG – Player Slice ─── */
/* Player state, skills, karma, energy, stress, inventory, flags,
 * progression, and notifications. */

import type { StateCreator } from 'zustand';
import type {
  PlayerState,
  InventoryItem,
  TrainablePlayerSkill,
  EquipmentSlot,
} from '@/shared/types/game';
import type { PerkEffect } from '@/data/perks';
import type { GiftPreference } from '@/data/npcGifts';
import type { StoryEffect, QuestType } from '@/shared/types/game';
import { MAX_INVENTORY_SLOTS } from '@/data/constants';
import { getItemDefinition, getEquipmentSlot, createInventoryItem } from '@/data/items';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { getRecipeById } from '@/data/craftingRecipes';
import {
  getMerchantInventory,
  getBuyPrice,
  getSellPrice,
  getBasePriceByRarity,
  merchantBuysItem,
} from '@/data/tradingData';
import {
  clamp,
  createDefaultPlayerState,
  pushNotification,
  type GameNotification,
} from '../shared';
import { eventBus } from '@/engine/EventBus';
import { SKILL_TREE_MAP, SKILL_EFFECT_MAP } from '@/data/skillTree';
import { PERKS_MAP } from '@/data/perks';
import { getItemPreference, getAffinityChange, getGiftXpReward, getGiftReactionText } from '@/data/npcGifts';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';

/* ─── Slice types ─── */

export interface PlayerSliceState {
  playerState: PlayerState;
  notifications: GameNotification[];
  /** TTL-based active flags with expiry timestamps (survives save/load) */
  activeTTLFlags: Array<{ key: string; poemId: string; expiryTimestamp: number }>;
}

export interface PlayerSliceActions {
  visitNode: (id: string) => void;
  addSkill: (skill: TrainablePlayerSkill, amount: number) => void;
  addKarma: (amount: number) => void;
  addStress: (amount: number) => void;
  addEnergy: (amount: number) => void;
  setFlag: (key: string, value: boolean) => void;
  addItem: (item: InventoryItem) => void;
  removeItem: (itemId: string, quantity: number) => void;
  pushNotification: (type: GameNotification['type'], text: string) => void;
  dismissNotification: (id: string) => void;
  addXp: (amount: number) => void;
  unlockSkillTreeNode: (skillId: string) => void;
  canUnlockSkill: (nodeId: string) => boolean;
  equipItem: (itemId: string) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  restAtHome: () => void;
  autoRegenBetweenScenes: () => void;
  /** Set the TTL flags array (used by PoemPowerSystem for save-safe expiry) */
  setActiveTTLFlags: (flags: Array<{ key: string; poemId: string; expiryTimestamp: number }>) => void;
  /** Advance to the next act (1 → 2). No-op if already at max act. */
  advanceAct: () => void;
  /** Craft an item using a recipe. Checks requirements, removes inputs, adds output. */
  craftItem: (recipeId: string) => void;
  /** Check if a recipe can be crafted (has items + skill requirements) */
  canCraft: (recipeId: string) => boolean;
  /** Buy an item from a merchant NPC. Deducts credits, adds item to inventory. */
  buyItem: (npcId: string, itemId: string) => void;
  /** Sell an item to a merchant NPC. Removes item from inventory, adds credits. */
  sellItem: (npcId: string, itemId: string) => void;
  /** Check if the player can buy an item from a merchant */
  canBuyItem: (npcId: string, itemId: string) => boolean;
  /** Check if the player can sell an item to a merchant */
  canSellItem: (npcId: string, itemId: string) => boolean;
  /** Add credits to the player */
  addCredits: (amount: number) => void;
  /** Acquire a perk by ID (deducts a perk point) */
  acquirePerk: (perkId: string) => void;
  /** Check if the player can acquire a specific perk */
  canAcquirePerk: (perkId: string) => boolean;
  /** Get all active perk effects from acquired perks */
  getActivePerkEffects: () => PerkEffect[];
  /** Gift an item to an NPC. Determines preference, adjusts affinity, removes item, emits event. */
  giftItemToNPC: (itemId: string, npcId: string) => GiftPreference | null;
  /** Complete a quest and auto-apply its rewards (skills, karma, XP, items, flags). */
  completeQuestAndApplyRewards: (questId: string) => void;
}

export type PlayerSlice = PlayerSliceState & PlayerSliceActions;

/* ─── Slice creator ─── */

/* ─── Cross-slice reads needed by this slice ─── */
interface CrossSliceReads {
  exploration: { currentSceneId: string; timeOfDay: number };
  advanceTime: (hours: number) => void;
  npcRelations: Array<{ npcId: string; value: number }>;
  npcAffinity: Record<string, number>;
  adjustNpcAffinity: (npcId: string, delta: number) => void;
}

export const createPlayerSlice: StateCreator<
  PlayerSlice & CrossSliceReads,
  [],
  [],
  PlayerSlice
> = (set, get) => ({
  /* ── Initial state ── */
  playerState: createDefaultPlayerState(),
  notifications: [],
  activeTTLFlags: [],

  /* ── Actions ── */

  visitNode: (id) =>
    set((state) => {
      if (state.playerState.visitedNodes.includes(id)) return state;
      return {
        playerState: {
          ...state.playerState,
          visitedNodes: [...state.playerState.visitedNodes, id],
        },
      };
    }),

  addSkill: (skill, amount) =>
    set((state) => {
      const newSkillValue = Math.max(0, state.playerState.skills[skill] + amount);
      return {
        playerState: {
          ...state.playerState,
          skills: {
            ...state.playerState.skills,
            [skill]: newSkillValue,
          },
        },
        notifications: amount > 0
          ? pushNotification(state.notifications, 'skill', `Способность разблокирована: ${skill} +${amount}`)
          : state.notifications,
      };
    }),

  addKarma: (amount) => {
    set((state) => ({
      playerState: {
        ...state.playerState,
        karma: clamp(state.playerState.karma + amount, 0, 100),
      },
      notifications: pushNotification(state.notifications, 'karma', `${amount > 0 ? '+' : ''}${amount} Карма`),
    }));

    // Emit visual feedback for significant karma changes
    if (Math.abs(amount) >= 5) {
      eventBus.emit('choice:made', { karmaChange: amount });
    }
  },

  addStress: (amount) =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        stress: clamp(state.playerState.stress + amount, 0, 100),
      },
      notifications: amount !== 0
        ? pushNotification(state.notifications, 'stress', `${amount > 0 ? '+' : ''}${amount} Стресс`)
        : state.notifications,
    })),

  addEnergy: (amount) =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        energy: clamp(state.playerState.energy + amount, 0, 100),
      },
      notifications: amount !== 0
        ? pushNotification(state.notifications, 'energy', `${amount > 0 ? '+' : ''}${amount} Энергия`)
        : state.notifications,
    })),

  setFlag: (key, value) =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        flags: { ...state.playerState.flags, [key]: value },
      },
    })),

  addItem: (item) =>
    set((state) => {
      const inventory = [...state.playerState.inventory];
      const existingIdx = inventory.findIndex((i) => i.id === item.id);

      if (existingIdx >= 0 && inventory[existingIdx].stackable) {
        const updated = { ...inventory[existingIdx] };
        updated.quantity = updated.quantity + (item.quantity ?? 1);
        inventory[existingIdx] = updated;
      } else if (inventory.length < MAX_INVENTORY_SLOTS) {
        inventory.push({ ...item, quantity: item.quantity ?? 1 });
      } else {
        // Inventory full — notify the player instead of silently dropping
        const updatedNotifications = pushNotification(
          state.notifications,
          'quest',
          `Инвентарь полон! Предмет «${item.id}» не помещается (${MAX_INVENTORY_SLOTS}/${MAX_INVENTORY_SLOTS})`,
        );
        return {
          notifications: updatedNotifications,
          playerState: state.playerState,
        };
      }

      return {
        playerState: { ...state.playerState, inventory },
      };
    }),

  removeItem: (itemId, quantity) =>
    set((state) => {
      const inventory = [...state.playerState.inventory];
      const idx = inventory.findIndex((i) => i.id === itemId);
      if (idx < 0) return state;

      const item = { ...inventory[idx] };
      item.quantity -= quantity;

      if (item.quantity <= 0) {
        inventory.splice(idx, 1);
      } else {
        inventory[idx] = item;
      }

      return {
        playerState: { ...state.playerState, inventory },
      };
    }),

  pushNotification: (type, text) =>
    set((state) => ({
      notifications: pushNotification(state.notifications, type, text),
    })),

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  addXp: (amount) =>
    set((state) => {
      const prog = state.playerState.progression;
      let newXp = prog.xp + amount;
      let newLevel = prog.level;
      let newXpToNext = prog.xpToNextLevel;
      let newSkillPoints = prog.skillPoints;
      let newPerkPoints = prog.perkPoints;
      let perkPointGained = false;

      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel += 1;
        newSkillPoints += 1;
        // Grant a perk point every 3 levels (3, 6, 9, etc.)
        if (newLevel % 3 === 0) {
          newPerkPoints += 1;
          perkPointGained = true;
        }
        newXpToNext = Math.floor(100 * Math.pow(1.25, newLevel - 1));
      }

      const notifications = newLevel > prog.level
        ? pushNotification(
            state.notifications,
            'skill',
            perkPointGained
              ? `Уровень ${newLevel}! +1 очко навыка +1 очко черты!`
              : `Уровень ${newLevel}! +1 очко навыка`,
          )
        : state.notifications;

      // Emit level-up event for UI effects (LevelUpEffect component)
      if (newLevel > prog.level) {
        // Use queueMicrotask to avoid emitting during Zustand set() which can cause issues
        queueMicrotask(() => {
          eventBus.emit('player:levelup', { newLevel, prevLevel: prog.level, perkPointGained });
        });
      }

      return {
        playerState: {
          ...state.playerState,
          progression: {
            ...prog,
            level: newLevel,
            xp: newXp,
            xpToNextLevel: newXpToNext,
            skillPoints: newSkillPoints,
            perkPoints: newPerkPoints,
          },
        },
        notifications,
      };
    }),

  unlockSkillTreeNode: (skillId) =>
    set((state) => {
      const prog = state.playerState.progression;
      if (prog.skillPoints <= 0) return state;
      if (prog.unlockedSkills.includes(skillId)) return state;

      // Check prerequisites
      const nodeDef = SKILL_TREE_MAP[skillId];
      if (nodeDef) {
        const prereqsMet = nodeDef.requires.every((req) =>
          prog.unlockedSkills.includes(req),
        );
        if (!prereqsMet) return state;
      }

      // Apply skill bonus if this node has one
      const effect = SKILL_EFFECT_MAP[skillId];
      const newSkills = { ...state.playerState.skills };
      if (effect) {
        newSkills[effect.skill] = Math.max(0, newSkills[effect.skill] + effect.value);
      }

      const nodeName = nodeDef?.name ?? skillId;

      return {
        playerState: {
          ...state.playerState,
          skills: newSkills,
          progression: {
            ...prog,
            skillPoints: prog.skillPoints - 1,
            unlockedSkills: [...prog.unlockedSkills, skillId],
          },
        },
        notifications: pushNotification(state.notifications, 'skill', `Навык разблокирован: ${nodeName}`),
      };
    }),

  canUnlockSkill: (nodeId) => {
    const state = get();
    const prog = state.playerState.progression;
    if (prog.skillPoints <= 0) return false;
    if (prog.unlockedSkills.includes(nodeId)) return false;
    const nodeDef = SKILL_TREE_MAP[nodeId];
    if (!nodeDef) return false;
    return nodeDef.requires.every((req) => prog.unlockedSkills.includes(req));
  },

  equipItem: (itemId) =>
    set((state) => {
      // Find the item in inventory
      const invIdx = state.playerState.inventory.findIndex((i) => i.id === itemId);
      if (invIdx < 0) return state;

      // Determine equipment slot
      const slot = getEquipmentSlot(itemId) as EquipmentSlot | undefined;
      if (!slot) return state; // Not equippable

      const item = state.playerState.inventory[invIdx];
      const def = getItemDefinition(itemId);
      if (!def || def.category !== 'equipment') return state;

      // If something is already equipped in that slot, unequip it first
      const currentEquipped = state.playerState.equippedItems[slot];
      const newInventory = [...state.playerState.inventory];

      // Remove the item we're equipping from inventory
      newInventory.splice(invIdx, 1);

      // If there was a previously equipped item, add it back to inventory
      if (currentEquipped) {
        // Remove the previously equipped item's effects
        const prevDef = getItemDefinition(currentEquipped.id);
        newInventory.push(currentEquipped);
      }

      // Apply new equipment effects
      const skillChanges: Partial<Record<TrainablePlayerSkill, number>> = {};
      let energyChange = 0;
      let stressChange = 0;
      let karmaChange = 0;

      // Remove old equipped item effects
      if (currentEquipped) {
        const prevDef = getItemDefinition(currentEquipped.id);
        if (prevDef) {
          for (const effect of prevDef.effects) {
            if (effect.skill) {
              skillChanges[effect.skill] = (skillChanges[effect.skill] ?? 0) - effect.value;
            } else if (effect.stat === 'energy') energyChange -= effect.value;
            else if (effect.stat === 'stress') stressChange -= effect.value;
            else if (effect.stat === 'karma') karmaChange -= effect.value;
          }
        }
      }

      // Apply new equipped item effects
      for (const effect of def.effects) {
        if (effect.skill) {
          skillChanges[effect.skill] = (skillChanges[effect.skill] ?? 0) + effect.value;
        } else if (effect.stat === 'energy') energyChange += effect.value;
        else if (effect.stat === 'stress') stressChange += effect.value;
        else if (effect.stat === 'karma') karmaChange += effect.value;
      }

      // Build new skills
      const newSkills = { ...state.playerState.skills };
      for (const [skill, delta] of Object.entries(skillChanges)) {
        newSkills[skill as TrainablePlayerSkill] = Math.max(0, newSkills[skill as TrainablePlayerSkill] + (delta ?? 0));
      }

      return {
        playerState: {
          ...state.playerState,
          inventory: newInventory,
          equippedItems: {
            ...state.playerState.equippedItems,
            [slot]: item,
          },
          skills: newSkills,
          energy: clamp(state.playerState.energy + energyChange, 0, 100),
          stress: clamp(state.playerState.stress + stressChange, 0, 100),
          karma: clamp(state.playerState.karma + karmaChange, 0, 100),
        },
        notifications: pushNotification(state.notifications, 'skill', `Экипировано: ${item.name}`),
      };
    }),

  unequipItem: (slot) =>
    set((state) => {
      const equipped = state.playerState.equippedItems[slot];
      if (!equipped) return state;

      // Check inventory capacity
      if (state.playerState.inventory.length >= MAX_INVENTORY_SLOTS) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Инвентарь полон — нельзя снять экипировку'),
        };
      }

      // Remove equipment effects
      const def = getItemDefinition(equipped.id);
      const newSkills = { ...state.playerState.skills };
      let energyChange = 0;
      let stressChange = 0;
      let karmaChange = 0;

      if (def) {
        for (const effect of def.effects) {
          if (effect.skill) {
            newSkills[effect.skill] = Math.max(0, newSkills[effect.skill] - effect.value);
          } else if (effect.stat === 'energy') energyChange -= effect.value;
          else if (effect.stat === 'stress') stressChange -= effect.value;
          else if (effect.stat === 'karma') karmaChange -= effect.value;
        }
      }

      return {
        playerState: {
          ...state.playerState,
          inventory: [...state.playerState.inventory, equipped],
          equippedItems: {
            ...state.playerState.equippedItems,
            [slot]: null,
          },
          skills: newSkills,
          energy: clamp(state.playerState.energy + energyChange, 0, 100),
          stress: clamp(state.playerState.stress + stressChange, 0, 100),
          karma: clamp(state.playerState.karma + karmaChange, 0, 100),
        },
        notifications: pushNotification(state.notifications, 'skill', `Снято: ${equipped.name}`),
      };
    }),

  restAtHome: () => {
    const store = get() as unknown as CrossSliceReads;
    const currentScene = store.exploration.currentSceneId;

    // Only allow resting in volodka_room or home_evening
    if (currentScene !== 'volodka_room' && currentScene !== 'home_evening') return;

    // Advance time by 8 hours
    store.advanceTime(8);

    set((state) => ({
      playerState: {
        ...state.playerState,
        energy: 100,
        stress: clamp(state.playerState.stress - 30, 0, 100),
      },
      notifications: pushNotification(state.notifications, 'energy', 'Отдых: Энергия +100, Стресс -30'),
    }));
  },

  autoRegenBetweenScenes: () =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        energy: clamp(state.playerState.energy + 5, 0, 100),
        stress: clamp(state.playerState.stress - 3, 0, 100),
      },
    })),

  setActiveTTLFlags: (flags) => set({ activeTTLFlags: flags }),

  advanceAct: () =>
    set((state) => {
      const currentAct = state.playerState.progression.currentAct;
      if (currentAct >= 5) return state; // Game has 5 acts — don't advance past 5
      return {
        playerState: {
          ...state.playerState,
          progression: {
            ...state.playerState.progression,
            currentAct: currentAct + 1,
          },
        },
        notifications: pushNotification(state.notifications, 'quest', `Акт ${currentAct + 1} начинается!`),
      };
    }),

  canCraft: (recipeId) => {
    const state = get() as PlayerSlice;
    const recipe = getRecipeById(recipeId);
    if (!recipe) return false;

    // Check skill requirements
    for (const req of recipe.skillRequirements) {
      if ((state.playerState.skills[req.skill] ?? 0) < req.level) return false;
    }

    // Check inventory for inputs
    for (const input of recipe.inputs) {
      const invItem = state.playerState.inventory.find((i) => i.id === input.itemId);
      if (!invItem || invItem.quantity < input.quantity) return false;
    }

    // Check inventory has room for output
    const outputDef = getItemDefinition(recipe.output.itemId);
    const existingOutput = state.playerState.inventory.find((i) => i.id === recipe.output.itemId);
    if (!existingOutput && outputDef && !outputDef.stackable && state.playerState.inventory.length >= MAX_INVENTORY_SLOTS) {
      return false;
    }
    if (!existingOutput && !outputDef && state.playerState.inventory.length >= MAX_INVENTORY_SLOTS) {
      return false;
    }

    return true;
  },

  craftItem: (recipeId) =>
    set((state) => {
      const recipe = getRecipeById(recipeId);
      if (!recipe) return state;

      // Verify skill requirements
      for (const req of recipe.skillRequirements) {
        if ((state.playerState.skills[req.skill] ?? 0) < req.level) {
          return {
            notifications: pushNotification(state.notifications, 'stress', `Недостаточный уровень навыка: ${req.skill} (нужно ${req.level})`),
          };
        }
      }

      // Verify and remove inputs
      const newInventory = [...state.playerState.inventory];
      for (const input of recipe.inputs) {
        const idx = newInventory.findIndex((i) => i.id === input.itemId);
        if (idx < 0 || newInventory[idx].quantity < input.quantity) {
          return {
            notifications: pushNotification(state.notifications, 'stress', `Не хватает ингредиентов для: ${recipe.name}`),
          };
        }
        const updated = { ...newInventory[idx] };
        updated.quantity -= input.quantity;
        if (updated.quantity <= 0) {
          newInventory.splice(idx, 1);
        } else {
          newInventory[idx] = updated;
        }
      }

      // Check inventory capacity for output
      const outputItem = createInventoryItem(recipe.output.itemId, recipe.output.quantity);
      const existingOutputIdx = newInventory.findIndex((i) => i.id === outputItem.id);
      if (existingOutputIdx >= 0 && outputItem.stackable) {
        const updated = { ...newInventory[existingOutputIdx] };
        updated.quantity += outputItem.quantity;
        newInventory[existingOutputIdx] = updated;
      } else if (newInventory.length < MAX_INVENTORY_SLOTS) {
        newInventory.push(outputItem);
      } else {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Инвентарь полон — крафт невозможен'),
        };
      }

      // Emit crafting:discovered event for UI toast (outside Zustand set via queueMicrotask)
      queueMicrotask(() => {
        eventBus.emit('crafting:discovered', {
          recipeId,
          recipeName: recipe.name,
          rarity: recipe.outputRarity,
        });
      });

      return {
        playerState: {
          ...state.playerState,
          inventory: newInventory,
        },
        notifications: pushNotification(state.notifications, 'skill', `Скрафчено: ${recipe.name}!`),
      };
    }),

  /* ── Trading actions ── */

  buyItem: (npcId, itemId) =>
    set((state) => {
      const merchant = getMerchantInventory(npcId);
      if (!merchant) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Этот персонаж не торгует'),
        };
      }

      // Get relation value
      const store = get() as unknown as CrossSliceReads;
      const relation = store.npcRelations.find((r) => r.npcId === npcId);
      const relationValue = relation?.value ?? 50;

      // Calculate price with relationship discount
      const price = getBuyPrice(merchant, itemId, relationValue);

      // Check if player has enough credits
      if (state.playerState.credits < price) {
        return {
          notifications: pushNotification(state.notifications, 'stress', `Недостаточно кредитов (нужно ${price}₴)`),
        };
      }

      // Check if item exists in merchant's sell list
      const sellEntry = merchant.sells.find((s) => s.itemId === itemId);
      if (!sellEntry) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'У торговца нет этого товара'),
        };
      }

      // Check relation gate
      if (sellEntry.minRelation && relationValue < sellEntry.minRelation) {
        return {
          notifications: pushNotification(state.notifications, 'stress', `Недостаточный уровень отношений (нужно ${sellEntry.minRelation})`),
        };
      }

      // Add item to inventory
      const inventory = [...state.playerState.inventory];
      const itemDef = getItemDefinition(itemId);
      const existingIdx = inventory.findIndex((i) => i.id === itemId);

      if (existingIdx >= 0 && inventory[existingIdx].stackable) {
        const updated = { ...inventory[existingIdx] };
        updated.quantity += 1;
        inventory[existingIdx] = updated;
      } else if (inventory.length < MAX_INVENTORY_SLOTS) {
        inventory.push(createInventoryItem(itemId, 1));
      } else {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Инвентарь полон — покупка невозможна'),
        };
      }

      const itemName = itemDef?.name ?? itemId;

      return {
        playerState: {
          ...state.playerState,
          credits: state.playerState.credits - price,
          inventory,
        },
        notifications: pushNotification(state.notifications, 'skill', `Куплено: ${itemName} (-${price}₴)`),
      };
    }),

  sellItem: (npcId, itemId) =>
    set((state) => {
      const merchant = getMerchantInventory(npcId);
      if (!merchant) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Этот персонаж не торгует'),
        };
      }

      // Get relation value
      const store = get() as unknown as CrossSliceReads;
      const relation = store.npcRelations.find((r) => r.npcId === npcId);
      const relationValue = relation?.value ?? 50;

      // Check if NPC buys this item
      if (!merchantBuysItem(npcId, itemId, relationValue)) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Этот торговец не покупает данный предмет'),
        };
      }

      // Check if player has the item
      const invIdx = state.playerState.inventory.findIndex((i) => i.id === itemId);
      if (invIdx < 0) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'У вас нет этого предмета'),
        };
      }

      // Check if item is quest-related
      const itemDef = getItemDefinition(itemId);
      if (itemDef?.questRelated) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Нельзя продать сюжетный предмет'),
        };
      }

      // Calculate sell price
      const basePrice = itemDef
        ? getBasePriceByRarity(itemDef.rarity)
        : 5;
      // Try to find a merchant sell entry for this item to get the base price
      const merchantSellEntry = merchant.sells.find((s) => s.itemId === itemId);
      const effectiveBasePrice = merchantSellEntry?.basePrice ?? basePrice;
      const price = getSellPrice(merchant, itemId, effectiveBasePrice, relationValue);

      // Remove item from inventory
      const inventory = [...state.playerState.inventory];
      const item = { ...inventory[invIdx] };
      item.quantity -= 1;
      if (item.quantity <= 0) {
        inventory.splice(invIdx, 1);
      } else {
        inventory[invIdx] = item;
      }

      const itemName = itemDef?.name ?? itemId;

      return {
        playerState: {
          ...state.playerState,
          credits: state.playerState.credits + price,
          inventory,
        },
        notifications: pushNotification(state.notifications, 'skill', `Продано: ${itemName} (+${price}₴)`),
      };
    }),

  canBuyItem: (npcId, itemId) => {
    const state = get() as PlayerSlice & CrossSliceReads;
    const merchant = getMerchantInventory(npcId);
    if (!merchant) return false;

    const relation = state.npcRelations.find((r) => r.npcId === npcId);
    const relationValue = relation?.value ?? 50;
    const price = getBuyPrice(merchant, itemId, relationValue);

    if (state.playerState.credits < price) return false;

    const sellEntry = merchant.sells.find((s) => s.itemId === itemId);
    if (!sellEntry) return false;
    if (sellEntry.minRelation && relationValue < sellEntry.minRelation) return false;

    // Check inventory space
    const existingItem = state.playerState.inventory.find((i) => i.id === itemId);
    const itemDef = getItemDefinition(itemId);
    if (!existingItem && itemDef && !itemDef.stackable && state.playerState.inventory.length >= MAX_INVENTORY_SLOTS) {
      return false;
    }

    return true;
  },

  canSellItem: (npcId, itemId) => {
    const state = get() as PlayerSlice & CrossSliceReads;
    const merchant = getMerchantInventory(npcId);
    if (!merchant) return false;

    const relation = state.npcRelations.find((r) => r.npcId === npcId);
    const relationValue = relation?.value ?? 50;

    // Check if NPC buys this item
    if (!merchantBuysItem(npcId, itemId, relationValue)) return false;

    // Check if player has the item
    const hasItem = state.playerState.inventory.some((i) => i.id === itemId);
    if (!hasItem) return false;

    // Check if quest item
    const itemDef = getItemDefinition(itemId);
    if (itemDef?.questRelated) return false;

    return true;
  },

  addCredits: (amount) =>
    set((state) => ({
      playerState: {
        ...state.playerState,
        credits: Math.max(0, state.playerState.credits + amount),
      },
      notifications: amount !== 0
        ? pushNotification(state.notifications, 'skill', `${amount > 0 ? '+' : ''}${amount} кредитов`)
        : state.notifications,
    })),

  /* ── Perk actions ── */

  acquirePerk: (perkId) =>
    set((state) => {
      const prog = state.playerState.progression;
      if (prog.perkPoints <= 0) return state;
      if (prog.unlockedPerks.includes(perkId)) return state;

      const perkDef = PERKS_MAP[perkId];
      if (!perkDef) return state;

      // Check level requirement
      if (prog.level < perkDef.minLevel) return state;

      // Check prerequisite perks
      const prereqsMet = perkDef.requiredPerks.every((req) =>
        prog.unlockedPerks.includes(req),
      );
      if (!prereqsMet) return state;

      // Check mutual exclusivity
      if (perkDef.mutuallyExclusiveWith) {
        const hasExclusive = perkDef.mutuallyExclusiveWith.some((exId) =>
          prog.unlockedPerks.includes(exId),
        );
        if (hasExclusive) return state;
      }

      // Apply skill bonuses from perk effects
      const newSkills = { ...state.playerState.skills };
      for (const effect of perkDef.effects) {
        if (effect.type === 'skill_bonus' && effect.skill) {
          newSkills[effect.skill as TrainablePlayerSkill] = Math.max(
            0,
            newSkills[effect.skill as TrainablePlayerSkill] + effect.value,
          );
        }
      }

      return {
        playerState: {
          ...state.playerState,
          skills: newSkills,
          progression: {
            ...prog,
            perkPoints: prog.perkPoints - 1,
            unlockedPerks: [...prog.unlockedPerks, perkId],
          },
        },
        notifications: pushNotification(
          state.notifications,
          'skill',
          `Черта получена: ${perkDef.name}`,
        ),
      };
    }),

  canAcquirePerk: (perkId) => {
    const state = get() as PlayerSlice;
    const prog = state.playerState.progression;
    if (prog.perkPoints <= 0) return false;
    if (prog.unlockedPerks.includes(perkId)) return false;

    const perkDef = PERKS_MAP[perkId];
    if (!perkDef) return false;
    if (prog.level < perkDef.minLevel) return false;

    // Check prerequisite perks
    const prereqsMet = perkDef.requiredPerks.every((req) =>
      prog.unlockedPerks.includes(req),
    );
    if (!prereqsMet) return false;

    // Check mutual exclusivity
    if (perkDef.mutuallyExclusiveWith) {
      const hasExclusive = perkDef.mutuallyExclusiveWith.some((exId) =>
        prog.unlockedPerks.includes(exId),
      );
      if (hasExclusive) return false;
    }

    return true;
  },

  getActivePerkEffects: () => {
    const state = get() as PlayerSlice;
    const prog = state.playerState.progression;
    const allEffects: PerkEffect[] = [];
    for (const perkId of prog.unlockedPerks) {
      const perkDef = PERKS_MAP[perkId];
      if (perkDef) {
        allEffects.push(...perkDef.effects);
      }
    }
    return allEffects;
  },

  giftItemToNPC: (itemId, npcId) => {
    const state = get() as PlayerSlice & CrossSliceReads;

    // Check if player has the item
    const invItem = state.playerState.inventory.find((i) => i.id === itemId);
    if (!invItem) return null;

    // Don't allow gifting quest items
    const itemDef = getItemDefinition(itemId);
    if (itemDef?.questRelated) return null;

    // Determine preference level
    const preference = getItemPreference(npcId, itemId);
    const affinityChange = getAffinityChange(preference);
    const xpReward = getGiftXpReward(preference);

    // Get NPC name for reaction text
    const npcDef = NPC_DEFINITIONS.find((n) => n.id === npcId);
    const npcName = npcDef?.name ?? npcId;

    // Remove 1 of the item from inventory
    state.removeItem(itemId, 1);

    // Adjust NPC affinity
    state.adjustNpcAffinity(npcId, affinityChange);

    // Also adjust the existing NPC relation (0-100 scale) for compatibility
    // Map affinity change to a smaller relation delta
    const relationDelta = Math.round(affinityChange * 0.5);
    if (relationDelta !== 0) {
      // Use setNpcRelation via cross-slice if available
      const store = get() as PlayerSlice & CrossSliceReads & { setNpcRelation: (npcId: string, delta: number) => void };
      if (store.setNpcRelation) {
        store.setNpcRelation(npcId, relationDelta);
      }
    }

    // Award XP for positive gifts
    if (xpReward > 0) {
      state.addXp(xpReward);
    }

    // Emit event
    eventBus.emit('npc:gift', {
      npcId,
      itemId,
      preference,
      affinityChange,
    });

    // Show notification with reaction
    const reactionText = getGiftReactionText(npcName, preference);
    state.pushNotification('skill', reactionText);

    return preference;
  },

  /* ── Quest reward auto-application ── */

  completeQuestAndApplyRewards: (questId) => {
    const store = get() as PlayerSlice & CrossSliceReads & {
      completeQuest: (id: string) => void;
      setFlag: (key: string, value: boolean) => void;
      addItem: (item: InventoryItem) => void;
    };

    // Find quest definition
    const questDef = QUEST_DEFINITIONS.find((d) => d.id === questId);
    if (!questDef) return;

    // Mark quest as completed in world slice
    store.completeQuest(questId);

    // Collect applied reward descriptions for the UI toast
    const appliedRewards: string[] = [];

    // Apply each reward from the quest definition
    const rewards = questDef.rewards ?? [];
    for (const reward of rewards) {
      switch (reward.type) {
        case 'addSkill':
          if (reward.skill && reward.value) {
            store.addSkill(reward.skill, reward.value);
            appliedRewards.push(`${reward.skill} +${reward.value}`);
          }
          break;
        case 'addKarma':
          if (reward.value) {
            store.addKarma(reward.value);
            appliedRewards.push(`Карма +${reward.value}`);
          }
          break;
        case 'addXp':
          if (reward.value) {
            store.addXp(reward.value);
            appliedRewards.push(`Опыт +${reward.value}`);
          }
          break;
        case 'addStat':
          if (reward.stat === 'energy' && reward.value) {
            store.addEnergy(reward.value);
            appliedRewards.push(`Энергия +${reward.value}`);
          } else if (reward.stat === 'stress' && reward.value) {
            store.addStress(reward.value);
            appliedRewards.push(`Стресс +${reward.value}`);
          }
          break;
        case 'addItem':
          if (reward.itemId && reward.value) {
            store.addItem(createInventoryItem(reward.itemId, reward.value));
            const itemDef = getItemDefinition(reward.itemId);
            appliedRewards.push(`${itemDef?.name ?? reward.itemId} x${reward.value}`);
          }
          break;
        case 'setFlag':
          if (reward.flag) {
            store.setFlag(reward.flag, reward.flagValue ?? true);
            appliedRewards.push(`Флаг: ${reward.flag}`);
          }
          break;
        default:
          // Other reward types (triggerQuest, collectPoem, etc.) are handled
          // by the story engine — not applied here
          break;
      }
    }

    // Add XP for quest completion based on quest type
    const questTypeXp: Record<QuestType, number> = {
      main: 50,
      side: 25,
      hidden: 75,
      daily: 15,
    };
    const xpGained = questTypeXp[questDef.questType] ?? 25;
    store.addXp(xpGained);
    appliedRewards.push(`Опыт за задание +${xpGained}`);

    // Emit reward_applied event for UI toast notification
    eventBus.emit('quest:reward_applied', {
      questId,
      questTitle: questDef.title,
      xpGained,
      rewards: appliedRewards,
    });
  },
});
