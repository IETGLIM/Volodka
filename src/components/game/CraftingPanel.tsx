
/* ─── Volodka RPG – Crafting Panel (Polished) ─── */

import { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hammer,
  Check,
  AlertCircle,
  Package,
  Search,
} from 'lucide-react';
import { toastManager } from '@/engine/ToastManager';
import { ItemIcon } from './shared/ItemIcon';
import { useCraftingPanelState } from '@/store/selectors';
import {
  getItemDefinition,
  getRarityColor,
  getRarityBg,
  getRarityLabel,
} from '@/data/items';
import {
  CRAFTING_RECIPES,
  getRecipeById,
  type CraftingRecipe,
  type CraftingCategory,
} from '@/data/craftingRecipes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PanelWrapper } from '@/components/game/PanelWrapper';



/* ─── Category visual config ─── */
const CATEGORY_VISUAL: Record<CraftingCategory, { emoji: string; color: string; glowColor: string; bgGradient: string }> = {
  equipment: {
    emoji: '⚙️',
    color: 'var(--cyber-cyan)',
    glowColor: 'rgb(var(--cyber-cyan-rgb) / 0.25)',
    bgGradient: 'linear-gradient(135deg, rgb(var(--cyber-cyan-rgb) / 0.06) 0%, rgba(15,23,42,0.4) 60%)',
  },
  consumable: {
    emoji: '🧪',
    color: '#34d399',
    glowColor: 'rgba(52,211,153,0.25)',
    bgGradient: 'linear-gradient(135deg, rgba(52,211,153,0.06) 0%, rgba(15,23,42,0.4) 60%)',
  },
  quest: {
    emoji: '📜',
    color: '#fbbf24',
    glowColor: 'rgba(251,191,36,0.25)',
    bgGradient: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(15,23,42,0.4) 60%)',
  },
};

/* ─── Category tabs (with emojis) ─── */
const CATEGORY_TABS: { value: CraftingCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'Все', emoji: '🔧' },
  { value: 'equipment', label: 'Экипировка', emoji: '⚙️' },
  { value: 'consumable', label: 'Расходуемые', emoji: '🧪' },
  { value: 'quest', label: 'Квестовые', emoji: '📜' },
];

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

/* ─── Category label ─── */
const CATEGORY_LABELS: Record<CraftingCategory, string> = {
  equipment: 'Экипировка',
  consumable: 'Расходуемое',
  quest: 'Квестовый',
};

/* ─── Props ─── */
interface CraftingPanelProps {
  open: boolean;
  onClose: () => void;
}

/* ─── Component ─── */
export function CraftingPanel({ open, onClose }: CraftingPanelProps) {
  const { inventory, skills, craftItem, canCraft } = useCraftingPanelState();

  const [categoryFilter, setCategoryFilter] = useState<CraftingCategory | 'all'>('all');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [craftingAnim, setCraftingAnim] = useState<string | null>(null);
  const [craftSuccess, setCraftSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [craftingAll, setCraftingAll] = useState(false);
  const craftingAllRef = useRef(false);

  const selectedRecipe = selectedRecipeId ? getRecipeById(selectedRecipeId) : null;

  // Build inventory lookup for fast checks
  const inventoryMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of inventory) {
      map.set(item.id, (map.get(item.id) ?? 0) + item.quantity);
    }
    return map;
  }, [inventory]);

  // Filter recipes by category and search query
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

  // Count available recipes per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: CRAFTING_RECIPES.length };
    for (const recipe of CRAFTING_RECIPES) {
      counts[recipe.category] = (counts[recipe.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  // Check if player has enough of a specific item
  const hasItem = useCallback((itemId: string, quantity: number) => {
    return (inventoryMap.get(itemId) ?? 0) >= quantity;
  }, [inventoryMap]);

  // Check if player meets skill requirements
  const meetsSkillReq = useCallback((skill: string, level: number) => {
    return (skills[skill as keyof typeof skills] ?? 0) >= level;
  }, [skills]);

  const handleClose = useCallback(() => {
    setSelectedRecipeId(null);
    setCraftingAnim(null);
    setCraftSuccess(null);
    onClose();
  }, [onClose]);

  const handleCraft = useCallback((recipeId: string) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return;
    if (!canCraft(recipeId)) return;

    // Start crafting animation
    setCraftingAnim(recipeId);
    setCraftSuccess(null);

    // After animation delay, actually craft
    setTimeout(() => {
      try {
        craftItem(recipeId);
        setCraftSuccess(recipeId);
        setTimeout(() => setCraftSuccess(null), 2000);
      } catch {
        setCraftSuccess(null);
      } finally {
        setCraftingAnim(null);
      }
    }, recipe.craftingTime);
  }, [canCraft, craftItem]);

  // Count craftable consumable recipes
  const craftableConsumables = useMemo(() => {
    return CRAFTING_RECIPES.filter(
      (r) => r.category === 'consumable' && canCraft(r.id),
    );
  }, [canCraft]);

  // Craft all available consumables
  const handleCraftAllConsumables = useCallback(async () => {
    if (craftingAllRef.current) return;
    craftingAllRef.current = true;
    setCraftingAll(true);

    let craftedCount = 0;
    for (const recipe of [...craftableConsumables]) {
      if (!canCraft(recipe.id)) continue;
      craftItem(recipe.id);
      craftedCount++;
      await new Promise((r) => setTimeout(r, 500));
    }

    if (craftedCount > 0) {
      toastManager.addToast('crafting', `Создано ${craftedCount} предметов`);
    }

    craftingAllRef.current = false;
    setCraftingAll(false);
  }, [canCraft, craftItem, craftableConsumables]);

  return (
    <PanelWrapper
      open={open}
      onClose={handleClose}
      title="Крафт"
      urlPath="volodka://crafting"
      accentColor="cyan"
      layout="centered"
      maxWidth="max-w-2xl"
      icon={<Hammer className="size-5 text-cyan-400" />}
      shortcutLabel="G"
      headerExtra={(
        <span className="text-xs text-slate-500 font-normal">
          {CRAFTING_RECIPES.length} рецептов
        </span>
      )}
      footer={(
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-600 font-mono">volodka://crafting</span>
          <span className="text-[10px] text-slate-600 font-mono">{categoryFilter !== 'all' ? `Фильтр: ${CATEGORY_TABS.find(t => t.value === categoryFilter)?.label ?? ''}` : 'Все рецепты'}</span>
        </div>
      )}
    >
      <div className="scanline-overlay p-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {CATEGORY_TABS.map((tab) => {
            const count = categoryCounts[tab.value] ?? 0;
            const isActive = categoryFilter === tab.value;
            const catColor = tab.value !== 'all' ? CATEGORY_VISUAL[tab.value].color : 'var(--cyber-cyan)';
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setCategoryFilter(tab.value);
                  setSelectedRecipeId(null);
                }}
                className={`
                  px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all duration-150
                  ${isActive
                    ? 'text-slate-100'
                    : 'border-slate-700/30 bg-slate-900/30 text-slate-500 hover:text-slate-300 hover:border-slate-600/40'
                  }
                `}
                style={isActive ? {
                  borderColor: `${catColor}50`,
                  background: `${catColor}15`,
                  boxShadow: `0 0 10px ${catColor}15, inset 0 0 6px ${catColor}08`,
                } : undefined}
              >
                <span className="mr-1">{tab.emoji}</span>
                {tab.label}
                <span className={`ml-1 ${isActive ? '' : 'text-slate-600'}`} style={isActive ? { color: catColor } : undefined}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="neon-divider mb-3" />

        {/* Search input */}
        <div className="mb-3 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск рецептов..."
            className="cyber-input-field w-full pl-8 pr-3 py-1.5 text-xs rounded-md font-mono"
          />
        </div>

        {/* Craft All button for consumable category */}
        <AnimatePresence>
          {(categoryFilter === 'all' || categoryFilter === 'consumable') && craftableConsumables.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex items-center justify-between"
            >
              <span className="text-[10px] text-slate-500 font-mono">
                🧪 Доступно: {craftableConsumables.length}
              </span>
              <button
                onClick={handleCraftAllConsumables}
                disabled={craftingAll}
                className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {craftingAll ? (
                  <>
                    <span className="inline-block fm-spin">
                      ⚙
                    </span>
                    Создание...
                  </>
                ) : (
                  <>
                    <Hammer className="size-3" />
                    Создать всё
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="neon-divider mb-3" />

        {/* Main layout: recipe list + detail */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recipe list */}
          <div className="flex-1 max-h-96 overflow-y-auto custom-scrollbar">
            {filteredRecipes.length === 0 ? (
              <div className="cyber-empty-state py-8">
                <span className="empty-state-icon">🔨</span>
                <span className="empty-state-text">
                  {searchQuery.trim() ? 'Рецепты не найдены' : 'Нет рецептов в этой категории'}
                </span>
                {searchQuery.trim() && (
                  <span className="empty-state-hint">Попробуйте другой запрос</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filteredRecipes.map((recipe) => {
                  const outputDef = getItemDefinition(recipe.output.itemId);
                  const isSelected = selectedRecipeId === recipe.id;
                  const isCraftable = canCraft(recipe.id);
                  const isCrafting = craftingAnim === recipe.id;
                  const isJustCrafted = craftSuccess === recipe.id;
                  const catVis = CATEGORY_VISUAL[recipe.category];

                  // Count how many ingredients the player has
                  const ownedInputs = recipe.inputs.filter((i) => hasItem(i.itemId, i.quantity)).length;
                  const totalInputs = recipe.inputs.length;
                  const hasAllInputs = ownedInputs === totalInputs;

                  // Count skill requirements met
                  const metSkills = recipe.skillRequirements.filter((r) => meetsSkillReq(r.skill, r.level)).length;
                  const totalSkills = recipe.skillRequirements.length;
                  const hasAllSkills = metSkills === totalSkills;

                  return (
                    <motion.button
                      key={recipe.id}
                      onClick={() => setSelectedRecipeId(recipe.id)}
                      className={`
                        craft-card craft-card-glass craft-card-hover w-full text-left rounded-md border p-2.5 transition-all duration-200
                        ${isSelected
                          ? 'ring-1'
                          : ''
                        }
                      `}
                      style={{
                        borderColor: isSelected ? `${catVis.color}60` : 'rgba(100,116,139,0.25)',
                        background: isSelected
                          ? `${catVis.color}10`
                          : catVis.bgGradient,
                        boxShadow: isSelected
                          ? `0 0 12px ${catVis.glowColor}, inset 0 0 8px ${catVis.color}05`
                          : undefined,
                      }}
                      whileHover={!isSelected ? { scale: 1.01 } : {}}
                      whileTap={{ scale: 0.99 }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLElement).style.borderColor = `${catVis.color}40`;
                          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${catVis.glowColor}, inset 0 0 6px ${catVis.color}05`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(100,116,139,0.25)';
                          (e.currentTarget as HTMLElement).style.boxShadow = '';
                        }
                      }}
                    >
                      {/* Corner bracket decorations */}
                      <span className="craft-card-corner craft-card-corner-tl" style={{ borderColor: `${catVis.color}60`, borderTopColor: `${catVis.color}60`, borderLeftColor: `${catVis.color}60` }} />
                      <span className="craft-card-corner craft-card-corner-tr" style={{ borderColor: `${catVis.color}60`, borderTopColor: `${catVis.color}60`, borderRightColor: `${catVis.color}60` }} />
                      <span className="craft-card-corner craft-card-corner-bl" style={{ borderColor: `${catVis.color}60`, borderBottomColor: `${catVis.color}60`, borderLeftColor: `${catVis.color}60` }} />
                      <span className="craft-card-corner craft-card-corner-br" style={{ borderColor: `${catVis.color}60`, borderBottomColor: `${catVis.color}60`, borderRightColor: `${catVis.color}60` }} />
                      {/* Top accent line */}
                      <span className="craft-card-accent" style={{ background: `linear-gradient(90deg, transparent 0%, ${catVis.color}80 20%, ${catVis.color}B0 50%, ${catVis.color}80 80%, transparent 100%)` }} />
                      <div className="flex items-center gap-2.5">
                        {/* Output item icon */}
                        <div
                          className={`w-9 h-9 rounded-md border flex items-center justify-center shrink-0 ${getRarityBg(recipe.outputRarity)}`}
                          style={{ borderColor: `${catVis.color}20` }}
                        >
                          <ItemIcon icon={outputDef?.icon} className="size-4 text-slate-100" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-slate-200 font-medium truncate">{recipe.name}</span>
                            <Badge variant="outline" className={`text-[9px] px-1 py-0 ${getRarityColor(recipe.outputRarity)}`}>
                              {getRarityLabel(recipe.outputRarity)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {/* Ingredient status dots */}
                            <div className="flex items-center gap-0.5">
                              {recipe.inputs.map((input) => {
                                const has = hasItem(input.itemId, input.quantity);
                                return (
                                  <span
                                    key={input.itemId}
                                    className={`inline-block text-[8px] leading-none ${has ? 'ingredient-check' : 'ingredient-cross'}`}
                                    title={`${getItemDefinition(input.itemId)?.name ?? input.itemId}: ${has ? '✓' : '✗'}`}
                                  >
                                    {has ? '✓' : '✗'}
                                  </span>
                                );
                              })}
                            </div>
                            <span className={`text-[10px] font-mono flex items-center gap-0.5 ${hasAllInputs ? 'ingredient-count-available' : 'ingredient-count-missing'}`}>
                              {hasAllInputs ? <Check className="size-2.5" /> : <Package className="size-2.5" />}
                              {ownedInputs}/{totalInputs}
                            </span>
                            {/* Skill status */}
                            {totalSkills > 0 && (
                              <span className={`text-[10px] font-mono flex items-center gap-0.5 ${hasAllSkills ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {hasAllSkills ? <Check className="size-2.5" /> : <AlertCircle className="size-2.5" />}
                                {metSkills}/{totalSkills}
                              </span>
                            )}
                            {/* Category badge */}
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0"
                              style={{ borderColor: `${catVis.color}25`, color: `${catVis.color}99` }}
                            >
                              {CATEGORY_LABELS[recipe.category]}
                            </Badge>
                          </div>
                        </div>

                        {/* Material availability text */}
                        <span className={`text-[9px] font-mono shrink-0 ${isCraftable ? 'text-emerald-400/70' : 'text-rose-400/60'}`}>
                          {isCraftable ? 'Можно создать' : `Не хватает: ${totalInputs - ownedInputs}`}
                        </span>

                        {/* Craft button indicator */}
                        {isCrafting ? (
                          <div className="w-6 h-6 rounded-full border-2 border-cyan-400 border-t-transparent fm-spin" />
                        ) : isJustCrafted ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center"
                          >
                            <Check className="size-3.5 text-emerald-400" />
                          </motion.div>
                        ) : (
                          <div
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCraftable ? '' : 'bg-slate-600'}`}
                            style={isCraftable ? {
                              backgroundColor: catVis.color,
                              boxShadow: `0 0 8px ${catVis.glowColor}, 0 0 3px ${catVis.color}`,
                            } : undefined}
                          />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="w-full sm:w-56 shrink-0">
            {selectedRecipe ? (
              <RecipeDetail
                recipe={selectedRecipe}
                inventoryMap={inventoryMap}
                skills={skills}
                isCraftable={canCraft(selectedRecipe.id)}
                isCrafting={craftingAnim === selectedRecipe.id}
                isJustCrafted={craftSuccess === selectedRecipe.id}
                onCraft={() => handleCraft(selectedRecipe.id)}
                hasItem={hasItem}
                meetsSkillReq={meetsSkillReq}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500 py-6">
                <Hammer className="size-4 mr-1.5" />
                Выберите рецепт
              </div>
            )}
          </div>
        </div>
      </div>
    </PanelWrapper>
  );
}

/* ─── Recipe Detail ─── */
function RecipeDetail({
  recipe,
  inventoryMap,
  skills,
  isCraftable,
  isCrafting,
  isJustCrafted,
  onCraft,
  hasItem,
  meetsSkillReq,
}: {
  recipe: CraftingRecipe;
  inventoryMap: Map<string, number>;
  skills: Record<string, number> | { logic: number; coding: number; empathy: number; persuasion: number; intuition: number; writing: number; };
  isCraftable: boolean;
  isCrafting: boolean;
  isJustCrafted: boolean;
  onCraft: () => void;
  hasItem: (itemId: string, quantity: number) => boolean;
  meetsSkillReq: (skill: string, level: number) => boolean;
}) {
  const outputDef = getItemDefinition(recipe.output.itemId);
  const catVis = CATEGORY_VISUAL[recipe.category];

  return (
    <div className="flex flex-col gap-3">
      {/* Output item preview with shimmer */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <motion.div
            className={`w-16 h-16 rounded-md border mx-auto flex items-center justify-center relative overflow-hidden ${getRarityBg(recipe.outputRarity)}`}
            style={{ borderColor: `${catVis.color}30` }}
            animate={isCrafting ? {
              boxShadow: [
                `0 0 0px ${catVis.color}00`,
                `0 0 24px ${catVis.color}50`,
                `0 0 0px ${catVis.color}00`,
              ],
            } : {
              boxShadow: `0 0 12px ${catVis.glowColor}`,
            }}
            transition={isCrafting ? { duration: 1, repeat: Infinity } : {}}
          >
            <ItemIcon icon={outputDef?.icon} className="size-6 text-slate-100 relative z-10" />
            {/* Shimmer overlay on result item */}
            <div
              className="absolute inset-0 shimmer pointer-events-none z-20"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${catVis.color}10 25%, ${catVis.color}20 50%, ${catVis.color}10 75%, transparent 100%)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 2.5s ease-in-out infinite',
              }}
            />
          </motion.div>
        </div>

        {/* Name */}
        <div className="text-center mt-2">
          <div
            className="text-sm font-medium"
            style={{ color: catVis.color, textShadow: `0 0 8px ${catVis.glowColor}` }}
          >
            {recipe.name}
          </div>
          <Badge variant="outline" className={`text-[10px] mt-1 ${getRarityColor(recipe.outputRarity)}`}>
            {getRarityLabel(recipe.outputRarity)}
          </Badge>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 leading-relaxed">{recipe.description}</p>

      {/* Output item effects */}
      {outputDef && outputDef.effects.length > 0 && (
        <div className="text-xs text-slate-500 space-y-0.5">
          <div className="text-[10px] text-slate-600 uppercase tracking-wider font-mono mb-1">Эффекты</div>
          {outputDef.effects.map((e, i) => {
            let label = '';
            if (e.stat === 'energy') label = `Энергия ${e.value > 0 ? '+' : ''}${e.value}`;
            else if (e.stat === 'stress') label = `Стресс ${e.value > 0 ? '+' : ''}${e.value}`;
            else if (e.stat === 'karma') label = `Карма ${e.value > 0 ? '+' : ''}${e.value}`;
            else if (e.skill) label = `${SKILL_NAMES[e.skill] ?? e.skill} +${e.value}`;
            return (
              <div key={i} className={e.value > 0 && e.stat !== 'stress' ? 'text-emerald-400' : e.value < 0 ? 'text-rose-400' : ''}>
                {label}
              </div>
            );
          })}
        </div>
      )}

      {/* Divider */}
      <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${catVis.color}20, transparent)` }} />

      {/* Required ingredients */}
      <div>
        <div className="text-[10px] text-slate-600 uppercase tracking-wider font-mono mb-1.5">Ингредиенты</div>
        <div className="space-y-1.5">
          {recipe.inputs.map((input) => {
            const inputDef = getItemDefinition(input.itemId);
            const owned = inventoryMap.get(input.itemId) ?? 0;
            const hasEnough = hasItem(input.itemId, input.quantity);
            return (
              <div
                key={input.itemId}
                className="flex items-center gap-2 text-xs py-1 px-2 rounded-md"
                style={{
                  background: hasEnough ? 'rgba(52,211,153,0.05)' : 'rgba(251,113,133,0.05)',
                  border: `1px solid ${hasEnough ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.1)'}`,
                }}
              >
                {/* Checkmark or cross icon */}
                {hasEnough
                  ? <span className="ingredient-check shrink-0">✓</span>
                  : <span className="ingredient-cross shrink-0">✗</span>
                }
                <span className={`size-3.5 shrink-0 ${hasEnough ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <ItemIcon icon={inputDef?.icon} className="size-3.5" />
                </span>
                <span className={`flex-1 truncate ${hasEnough ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {inputDef?.name ?? input.itemId}
                </span>
                <span className={`font-mono text-[10px] ${hasEnough ? 'ingredient-count-available' : 'ingredient-count-missing'}`}>
                  {owned}/{input.quantity}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skill requirements */}
      {recipe.skillRequirements.length > 0 && (
        <div>
          <div className="text-[10px] text-slate-600 uppercase tracking-wider font-mono mb-1.5">Требуемые навыки</div>
          <div className="space-y-1">
            {recipe.skillRequirements.map((req) => {
              const met = meetsSkillReq(req.skill, req.level);
              const currentLevel = skills[req.skill as keyof typeof skills] ?? 0;
              return (
                <div
                  key={req.skill}
                  className="flex items-center gap-2 text-xs py-1 px-2 rounded-md"
                  style={{
                    background: met ? 'rgba(52,211,153,0.05)' : 'rgba(251,113,133,0.05)',
                    border: `1px solid ${met ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.1)'}`,
                    color: met ? '#34d399' : '#fb7185',
                  }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: met ? '#34d399' : '#fb7185',
                      boxShadow: met ? '0 0 6px rgba(52,211,153,0.5)' : '0 0 4px rgba(251,113,133,0.3)',
                    }}
                  />
                  <span className="flex-1">{SKILL_NAMES[req.skill] ?? req.skill}</span>
                  <span className="font-mono text-[10px]">
                    {currentLevel}/{req.level}
                  </span>
                  {met ? <Check className="size-3 shrink-0" /> : <AlertCircle className="size-3 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Craft success feedback */}
      <AnimatePresence>
        {isJustCrafted && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-center font-medium"
            style={{ color: catVis.color, textShadow: `0 0 8px ${catVis.glowColor}` }}
          >
            ✓ Скрафчено!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Craft button — more prominent with glow */}
      <Button
        size="sm"
        variant="outline"
        className={`w-full transition-all duration-200 craft-btn-anim ${isCraftable ? 'craft-btn-craftable' : 'craft-btn-dimmed'} ${isCrafting ? 'animate-pulse' : ''}`}
        style={{
          borderColor: isCraftable ? `${catVis.color}50` : 'rgba(100,116,139,0.2)',
          color: isCraftable ? catVis.color : '#64748b',
          background: isCraftable
            ? `linear-gradient(135deg, ${catVis.color}15, ${catVis.color}08)`
            : 'rgba(15,23,42,0.4)',
          boxShadow: isCraftable
            ? `0 0 16px ${catVis.glowColor}, 0 0 4px ${catVis.color}15, inset 0 0 8px ${catVis.color}08`
            : 'none',
        }}
        onClick={onCraft}
        disabled={!isCraftable || isCrafting}
      >
        {isCrafting ? (
          <>
            <span className="inline-block mr-1.5 fm-spin">
              ⚙
            </span>
            Создание...
          </>
        ) : (
          <>
            <Hammer className="size-3.5 mr-1.5" />
            Создать
          </>
        )}
      </Button>
    </div>
  );
}
