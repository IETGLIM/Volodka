/* ─── Volodka RPG – Inventory Crafting Tab ─── */

import { useMemo, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { usePlayerInventory, usePlayerSkills } from '@/store/selectors/playerSelectors';
import type { PlayerSkills } from '@/shared/types/definitions/skills';
import { CRAFTING_RECIPES, type CraftingRecipe } from '@/data/craftingRecipes';
import { getItemDefinition, getRarityColor, getRarityLabel } from '@/data/items';
import { createInventoryItem } from '@/data/gameDataLoader';
import { INVENTORY_CATEGORY_ICONS } from '@/components/game/inventory/inventoryConstants';

/* ─── Helpers ─── */

const SKILL_NAMES: Record<string, string> = {
  logic: 'Логика',
  coding: 'Код',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Письмо',
  rhythm: 'Ритм',
};

function buildInventoryMap(inventory: { id: string; quantity: number }[]) {
  const map = new Map<string, number>();
  for (const item of inventory) {
    map.set(item.id, (map.get(item.id) ?? 0) + item.quantity);
  }
  return map;
}

function canCraftRecipe(
  recipe: CraftingRecipe,
  inventoryMap: Map<string, number>,
  skills: PlayerSkills,
): { canCraft: boolean; missingMaterials: boolean; missingSkills: boolean } {
  let missingMaterials = false;
  let missingSkills = false;

  for (const req of recipe.skillRequirements) {
    if ((skills[req.skill] ?? 0) < req.level) {
      missingSkills = true;
    }
  }

  for (const input of recipe.inputs) {
    const have = inventoryMap.get(input.itemId) ?? 0;
    if (have < input.quantity) {
      missingMaterials = true;
    }
  }

  return { canCraft: !missingMaterials && !missingSkills, missingMaterials, missingSkills };
}

/* ─── Component ─── */

export function InventoryCraftingPanel() {
  const inventory = usePlayerInventory();
  const skills = usePlayerSkills();
  const addItem = useGameStore((s) => s.addItem);
  const removeItem = useGameStore((s) => s.removeItem);
  const pushNotification = useGameStore((s) => s.pushNotification);

  const [craftingId, setCraftingId] = useState<string | null>(null);

  const inventoryMap = useMemo(() => buildInventoryMap(inventory), [inventory]);

  const recipes = useMemo(
    () => CRAFTING_RECIPES.map((recipe) => ({
      recipe,
      ...canCraftRecipe(recipe, inventoryMap, skills),
    })),
    [inventoryMap, skills],
  );

  const handleCraft = useCallback(
    (recipe: CraftingRecipe) => {
      if (craftingId) return;
      setCraftingId(recipe.id);

      // Remove materials
      for (const input of recipe.inputs) {
        removeItem(input.itemId, input.quantity);
      }

      // Add result
      const outputItem = createInventoryItem(recipe.output.itemId, recipe.output.quantity);
      const added = addItem(outputItem);
      if (!added) {
        // Refund materials if inventory is full
        for (const input of recipe.inputs) {
          const refundItem = createInventoryItem(input.itemId, input.quantity);
          addItem(refundItem);
        }
        pushNotification('stress', 'Инвентарь полон — крафт невозможен');
      } else {
        pushNotification('skill', `Скрафчено: ${recipe.name}!`);
      }

      setCraftingId(null);
    },
    [craftingId, addItem, removeItem, pushNotification],
  );

  return (
    <div className="scrollbar-cyber overflow-y-auto max-h-[calc(100vh-22rem)] pr-1">
      <div className="space-y-3">
        {recipes.map(({ recipe, canCraft, missingMaterials, missingSkills }) => {
          const outputDef = getItemDefinition(recipe.output.itemId);
          const outputEmoji = outputDef
            ? INVENTORY_CATEGORY_ICONS[outputDef.category] ?? '📦'
            : '📦';
          const rarityColorClass = getRarityColor(recipe.outputRarity);
          const rarityLabel = getRarityLabel(recipe.outputRarity);
          const isCrafting = craftingId === recipe.id;

          return (
            <div
              key={recipe.id}
              className={`glass-panel rounded-lg p-3 transition-all duration-200 ${
                canCraft ? 'cyber-hover-lift cursor-pointer' : 'opacity-70'
              }`}
            >
              {/* Header: result item */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl flex-shrink-0" aria-hidden>{outputEmoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${rarityColorClass.split(' ')[0]}`}>{
                        outputDef?.name ?? recipe.output.itemId
                      }</span>
                      <span className={`data-badge text-[9px] ${rarityColorClass.split(' ')[1]}`}>{
                        rarityLabel
                      }</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{
                      recipe.description
                    }</p>
                  </div>
                </div>

                {/* Craft button */}
                <button
                  type="button"
                  disabled={!canCraft || isCrafting}
                  onClick={() => handleCraft(recipe)}
                  className={`
                    flex-shrink-0 px-3 py-1.5 rounded-md text-[11px] font-mono border transition-all duration-200
                    ${canCraft && !isCrafting
                      ? 'border-cyan-500/50 bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/50 hover:shadow-[0_0_12px_rgb(var(--cyber-cyan-rgb)/0.2)]'
                      : 'border-slate-700/30 bg-slate-900/30 text-slate-600 cursor-not-allowed'
                    }
                  `}
                >
                  {isCrafting ? '⏳' : 'Создать'}
                </button>
              </div>

              {/* Skill requirements */}
              {recipe.skillRequirements.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {recipe.skillRequirements.map((req) => {
                    const have = skills[req.skill] ?? 0;
                    const met = have >= req.level;
                    return (
                      <span
                        key={`${req.skill}-${req.level}`}
                        className={`data-badge text-[9px] ${met ? 'data-badge-success' : 'data-badge-danger'}`}
                      >
                        {SKILL_NAMES[req.skill] ?? req.skill} {have}/{req.level}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Material requirements */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {recipe.inputs.map((input) => {
                  const inputDef = getItemDefinition(input.itemId);
                  const have = inventoryMap.get(input.itemId) ?? 0;
                  const met = have >= input.quantity;
                  const inputEmoji = inputDef
                    ? INVENTORY_CATEGORY_ICONS[inputDef.category] ?? '📦'
                    : '📦';
                  return (
                    <span
                      key={input.itemId}
                      className={`data-badge text-[9px] ${met ? 'data-badge-success' : 'data-badge-danger'}`}
                      title={`${inputDef?.name ?? input.itemId}`}
                    >
                      {inputEmoji} {have}/{input.quantity}
                    </span>
                  );
                })}
              </div>

              {/* Status hints */}
              {missingSkills && (
                <p className="text-[9px] text-rose-400/70 mt-1.5 font-mono">Недостаточный уровень навыков</p>
              )}
              {missingMaterials && !missingSkills && (
                <p className="text-[9px] text-rose-400/70 mt-1.5 font-mono">Не хватает материалов</p>
              )}
            </div>
          );
        })}

        {recipes.length === 0 && (
          <div className="text-center text-slate-600 text-sm py-8 font-mono">
            Нет доступных рецептов
          </div>
        )}
      </div>
    </div>
  );
}
