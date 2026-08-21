/* ─── Volodka RPG – Crafting Panel ───
 * Full-screen overlay crafting interface with category tabs,
 * ingredient checklist, and craft button.
 * Uses the existing panel stack system (open/onClose props) and
 * the store's craftItem/canCraft actions from PlayerEconomySlice. */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Check, AlertCircle, Search } from 'lucide-react';
import { PanelWrapper } from '@/components/game/PanelWrapper';
import { useGameSelector } from '@/store/selectors';
import {
  CRAFTING_RECIPES,
  type CraftingRecipe,
  type CraftingCategory,
} from '@/data/craftingRecipes';
import { getItemDefinition, getRarityColor, getRarityLabel } from '@/data/items';
import { INVENTORY_CATEGORY_ICONS } from '@/components/game/inventory/inventoryConstants';
import type { PlayerSkills } from '@/shared/types/definitions/skills';

/* ─── Category configuration ─── */

const CATEGORY_TABS: { value: CraftingCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'Все', emoji: '🔧' },
  { value: 'equipment', label: 'Экипировка', emoji: '⚙️' },
  { value: 'consumable', label: 'Медицина', emoji: '🧪' },
  { value: 'quest', label: 'Поэзия', emoji: '📜' },
];

const CATEGORY_LABELS: Record<CraftingCategory, string> = {
  equipment: 'Экипировка',
  consumable: 'Медицина',
  quest: 'Квестовые',
};

/* ─── Skill name mapping ─── */

const SKILL_NAMES: Record<string, string> = {
  logic: 'Логика',
  coding: 'Код',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Письмо',
  rhythm: 'Ритм',
};

/* ─── Helpers ─── */

function buildInventoryMap(inventory: { id: string; quantity: number }[]) {
  const map = new Map<string, number>();
  for (const item of inventory) {
    map.set(item.id, (map.get(item.id) ?? 0) + item.quantity);
  }
  return map;
}

interface CraftCheckResult {
  canCraft: boolean;
  missingMaterials: boolean;
  missingSkills: boolean;
}

function checkRecipe(
  recipe: CraftingRecipe,
  inventoryMap: Map<string, number>,
  skills: PlayerSkills,
): CraftCheckResult {
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

/* ─── Props ─── */

interface CraftingPanelProps {
  open: boolean;
  onClose: () => void;
}

/* ─── Component ─── */

export function CraftingPanel({ open, onClose }: CraftingPanelProps) {
  const inventory = useGameSelector((s) => s.playerState.inventory);
  const skills = useGameSelector((s) => s.playerState.skills);
  const craftItem = useGameSelector((s) => s.craftItem);

  const [categoryFilter, setCategoryFilter] = useState<CraftingCategory | 'all'>('all');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [craftingId, setCraftingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const inventoryMap = useMemo(() => buildInventoryMap(inventory), [inventory]);

  const filteredRecipes = useMemo(() => {
    let recipes = CRAFTING_RECIPES;
    if (categoryFilter !== 'all') {
      recipes = recipes.filter((r) => r.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      recipes = recipes.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q),
      );
    }
    return recipes;
  }, [categoryFilter, searchQuery]);

  const recipeChecks = useMemo(() => {
    const map = new Map<string, CraftCheckResult>();
    for (const recipe of filteredRecipes) {
      map.set(recipe.id, checkRecipe(recipe, inventoryMap, skills));
    }
    return map;
  }, [filteredRecipes, inventoryMap, skills]);

  const selectedRecipe = selectedRecipeId
    ? CRAFTING_RECIPES.find((r) => r.id === selectedRecipeId) ?? null
    : null;

  const selectedCheck = selectedRecipe
    ? checkRecipe(selectedRecipe, inventoryMap, skills)
    : null;

  const handleCraft = useCallback(
    (recipe: CraftingRecipe) => {
      if (craftingId) return;
      setCraftingId(recipe.id);

      // Use store action which handles notifications, inventory ops, effects
      craftItem(recipe.id);

      // Clear selection after short delay for visual feedback
      setTimeout(() => {
        setCraftingId(null);
      }, 300);
    },
    [craftingId, craftItem],
  );

  const handleSelectRecipe = useCallback((recipeId: string) => {
    setSelectedRecipeId((prev) => (prev === recipeId ? null : recipeId));
  }, []);

  return (
    <PanelWrapper
      open={open}
      onClose={onClose}
      title="Крафт"
      urlPath="volodka://crafting"
      accentColor="emerald"
      shortcutLabel="G"
      closeAriaLabel="Закрыть крафт"
      testId="crafting-panel"
    >
      <div className="flex flex-col h-full">
        {/* Category tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-emerald-500/15 shrink-0">
          {CATEGORY_TABS.map((tab) => {
            const isActive = categoryFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setCategoryFilter(tab.value);
                  setSelectedRecipeId(null);
                }}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono
                  transition-all duration-200 border
                  ${isActive
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                  }
                `}
              >
                <span aria-hidden="true">{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Search */}
          <div className="ml-auto relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-slate-600" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="
                bg-slate-900/60 border border-slate-700/40 rounded-md
                pl-7 pr-3 py-1.5 text-xs font-mono text-slate-200
                placeholder:text-slate-600 focus:outline-none
                focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20
                w-36 transition-colors duration-200
              "
            />
          </div>
        </div>

        {/* Main content: left recipe list + right detail */}
        <div className="flex flex-1 min-h-0">
          {/* Left: recipe list */}
          <div className="w-72 border-r border-emerald-500/10 flex flex-col min-h-0 shrink-0">
            <div className="px-3 py-1.5 text-[10px] font-mono text-slate-600 uppercase tracking-wider border-b border-slate-800/60">
              Рецепты ({filteredRecipes.length})
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredRecipes.length === 0 && (
                <div className="text-center text-slate-600 text-xs py-8 font-mono">
                  Нет рецептов
                </div>
              )}
              {filteredRecipes.map((recipe) => {
                const check = recipeChecks.get(recipe.id);
                const isSelected = selectedRecipeId === recipe.id;
                const isCrafting = craftingId === recipe.id;
                const outputDef = getItemDefinition(recipe.output.itemId);
                const outputEmoji = outputDef
                  ? INVENTORY_CATEGORY_ICONS[outputDef.category] ?? '📦'
                  : '📦';
                const rarityClass = getRarityColor(recipe.outputRarity);

                return (
                  <button
                    key={recipe.id}
                    type="button"
                    onClick={() => handleSelectRecipe(recipe.id)}
                    disabled={isCrafting}
                    className={`
                      w-full text-left px-3 py-2.5 border-b border-slate-800/40
                      transition-all duration-150 group
                      ${isSelected
                        ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500'
                        : 'border-l-2 border-l-transparent hover:bg-slate-800/30'
                      }
                      ${isCrafting ? 'opacity-60 pointer-events-none' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base flex-shrink-0" aria-hidden="true">
                        {isCrafting ? '⏳' : outputEmoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium truncate ${rarityClass.split(' ')[0]}`}>
                            {recipe.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] text-slate-600">
                            {CATEGORY_LABELS[recipe.category]}
                          </span>
                          {check && !check.canCraft && (
                            <AlertCircle className="size-2.5 text-rose-400/60" aria-hidden="true" />
                          )}
                          {check && check.canCraft && (
                            <Check className="size-2.5 text-emerald-400/70" aria-hidden="true" />
                          )}
                        </div>
                      </div>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        check?.canCraft
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-slate-800/60 text-slate-600'
                      }`}>
                        x{recipe.output.quantity}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: selected recipe details */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {selectedRecipe && selectedCheck ? (
                <motion.div
                  key={selectedRecipe.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="p-4"
                >
                  {/* Recipe header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className={`text-base font-semibold font-mono ${getRarityColor(selectedRecipe.outputRarity).split(' ')[0]}`}>
                        {selectedRecipe.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-md">
                        {selectedRecipe.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
                          {CATEGORY_LABELS[selectedRecipe.category]}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${getRarityColor(selectedRecipe.outputRarity).split(' ')[1] ?? 'bg-slate-800/40 text-slate-500'}`}>
                          {getRarityLabel(selectedRecipe.outputRarity)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Output item */}
                  <div className="glass-panel rounded-lg p-3 mb-4">
                    <div className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-2">
                      Результат
                    </div>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const def = getItemDefinition(selectedRecipe.output.itemId);
                        const emoji = def
                          ? INVENTORY_CATEGORY_ICONS[def.category] ?? '📦'
                          : '📦';
                        return (
                          <>
                            <span className="text-2xl" aria-hidden="true">{emoji}</span>
                            <div>
                              <div className={`text-sm font-medium ${getRarityColor(selectedRecipe.outputRarity).split(' ')[0]}`}>
                                {def?.name ?? selectedRecipe.output.itemId}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Количество: {selectedRecipe.output.quantity}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Skill requirements */}
                  {selectedRecipe.skillRequirements.length > 0 && (
                    <div className="glass-panel rounded-lg p-3 mb-4">
                      <div className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-2">
                        Навыки
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecipe.skillRequirements.map((req) => {
                          const have = skills[req.skill] ?? 0;
                          const met = have >= req.level;
                          return (
                            <div
                              key={`${req.skill}-${req.level}`}
                              className={`
                                flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono
                                border transition-colors duration-200
                                ${met
                                  ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-400'
                                  : 'border-rose-500/30 bg-rose-500/8 text-rose-400'
                                }
                              `}
                            >
                              {met ? (
                                <Check className="size-3" aria-hidden="true" />
                              ) : (
                                <AlertCircle className="size-3" aria-hidden="true" />
                              )}
                              <span>{SKILL_NAMES[req.skill] ?? req.skill}</span>
                              <span className="text-slate-500">
                                {have}/{req.level}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ingredient requirements */}
                  <div className="glass-panel rounded-lg p-3 mb-4">
                    <div className="text-[10px] font-mono text-slate-600 uppercase tracking-wider mb-2">
                      Ингредиенты
                    </div>
                    <div className="space-y-1.5">
                      {selectedRecipe.inputs.map((input) => {
                        const inputDef = getItemDefinition(input.itemId);
                        const have = inventoryMap.get(input.itemId) ?? 0;
                        const met = have >= input.quantity;
                        const emoji = inputDef
                          ? INVENTORY_CATEGORY_ICONS[inputDef.category] ?? '📦'
                          : '📦';
                        return (
                          <div
                            key={input.itemId}
                            className={`
                              flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs
                              border transition-colors duration-200
                              ${met
                                ? 'border-emerald-500/20 bg-emerald-500/5'
                                : 'border-rose-500/20 bg-rose-500/5'
                              }
                            `}
                          >
                            <span className="text-sm" aria-hidden="true">{emoji}</span>
                            <span className={`flex-1 ${met ? 'text-slate-200' : 'text-slate-400'}`}>
                              {inputDef?.name ?? input.itemId}
                            </span>
                            <span className={`font-mono text-[11px] ${
                              met ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {have}/{input.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status message */}
                  {selectedCheck.missingSkills && (
                    <p className="text-[11px] text-rose-400/80 font-mono mb-3 flex items-center gap-1.5">
                      <AlertCircle className="size-3" aria-hidden="true" />
                      Недостаточный уровень навыков
                    </p>
                  )}
                  {selectedCheck.missingMaterials && !selectedCheck.missingSkills && (
                    <p className="text-[11px] text-rose-400/80 font-mono mb-3 flex items-center gap-1.5">
                      <AlertCircle className="size-3" aria-hidden="true" />
                      Не хватает материалов
                    </p>
                  )}

                  {/* Craft button */}
                  <button
                    type="button"
                    disabled={!selectedCheck.canCraft || craftingId === selectedRecipe.id}
                    onClick={() => handleCraft(selectedRecipe)}
                    className={`
                      w-full flex items-center justify-center gap-2
                      px-4 py-3 rounded-lg text-sm font-mono font-semibold
                      border transition-all duration-200
                      ${selectedCheck.canCraft && craftingId !== selectedRecipe.id
                        ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/50 hover:shadow-[0_0_20px_rgba(52,211,153,0.15)] cursor-pointer'
                        : 'border-slate-700/30 bg-slate-900/30 text-slate-600 cursor-not-allowed'
                      }
                    `}
                  >
                    <Hammer className="size-4" aria-hidden="true" />
                    <span>
                      {craftingId === selectedRecipe.id
                        ? 'Создание...'
                        : 'Создать'
                      }
                    </span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full text-slate-600"
                >
                  <Hammer className="size-10 mb-3 opacity-30" aria-hidden="true" />
                  <p className="text-sm font-mono">Выберите рецепт</p>
                  <p className="text-[10px] text-slate-700 mt-1 font-mono">Нажмите на рецепт слева</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </PanelWrapper>
  );
}
