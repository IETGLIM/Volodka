
/* ─── Volodka RPG – Inventory panel (Task 6: Grid-based visual redesign) ─── */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Trash2,
  Hand,
  Lock,
  Shield,
  Search,
  ChevronDown,
  X,
} from 'lucide-react';
import { ItemIcon } from './shared/ItemIcon';
import {
  useAddLoreEntry,
  useConsumableActions,
  useEquipItem,
  useEquippedItems,
  usePlayerInventory,
  useUnequipItem,
} from '@/store/selectors';
import { MAX_INVENTORY_SLOTS } from '@/data/constants';
import {
  getItemDefinition,
  getRarityColor,
  getRarityBg,
  getRarityLabel,
} from '@/data/items';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PanelWrapper } from '@/components/game/PanelWrapper';
import type { InventoryItem, EquipmentSlot } from '@/shared/types/game';
import type { ItemRarity } from '@/data/items';



interface InventoryProps {
  open: boolean;
  onClose: () => void;
  onOpenPoetryBook?: () => void;
}

/* ─── Category icons (emoji) for grid cards ─── */
const CATEGORY_ICONS: Record<string, string> = {
  consumable: '💊',
  equipment: '⚔️',
  key: '🔑',
  quest: '📜',
  book: '📖',
  misc: '🔧',
  poem_fragment: '📖',
};

/* ─── Rarity text glow colors (for item name) ─── */
const RARITY_TEXT_CLASS: Record<ItemRarity, string> = {
  common: 'text-slate-200',
  uncommon: 'text-emerald-300 inv-glow-uncommon',
  rare: 'text-cyan-300 inv-glow-rare',
  legendary: 'text-amber-300 inv-glow-legendary',
};

/* ─── Rarity border glow for cards ─── */
const RARITY_BORDER_CLASS: Record<ItemRarity, string> = {
  common: 'border-slate-600/40',
  uncommon: 'border-emerald-500/40 inv-border-glow-uncommon',
  rare: 'border-cyan-500/40 inv-border-glow-rare',
  legendary: 'border-amber-500/40 inv-border-glow-legendary',
};

/* ─── Rarity hover shadow (inline style) ─── */
function getRarityHoverShadow(rarity: ItemRarity): string {
  switch (rarity) {
    case 'common':
      return '0 0 10px rgba(148, 163, 184, 0.15), 0 4px 12px rgba(0,0,0,0.3)';
    case 'uncommon':
      return '0 0 12px rgba(52, 211, 153, 0.3), 0 0 24px rgba(52, 211, 153, 0.1), 0 4px 12px rgba(0,0,0,0.3)';
    case 'rare':
      return '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.35), 0 0 24px rgb(var(--cyber-cyan-rgb) / 0.12), 0 4px 12px rgba(0,0,0,0.3)';
    case 'legendary':
      return '0 0 16px rgba(251, 191, 36, 0.4), 0 0 32px rgba(251, 191, 36, 0.15), 0 4px 12px rgba(0,0,0,0.3)';
    default:
      return '';
  }
}

/* ─── Rarity glow for detail panel icon ─── */
const RARITY_ICON_SHADOW: Record<ItemRarity, string> = {
  common: '0 0 8px rgba(148, 163, 184, 0.15)',
  uncommon: '0 0 12px rgba(52, 211, 153, 0.3), 0 0 24px rgba(52, 211, 153, 0.1)',
  rare: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.3), 0 0 24px rgb(var(--cyber-cyan-rgb) / 0.1)',
  legendary: '0 0 16px rgba(251, 191, 36, 0.4), 0 0 32px rgba(251, 191, 36, 0.15)',
};

/* ─── Detail panel rarity gradient ─── */
const RARITY_DETAIL_BG: Record<ItemRarity, string> = {
  common: 'inv-detail-common',
  uncommon: 'inv-detail-uncommon',
  rare: 'inv-detail-rare',
  legendary: 'inv-detail-legendary',
};

/* ─── Stat icons for effect display ─── */
const STAT_ICONS: Record<string, string> = {
  energy: '⚡',
  stress: '😰',
  karma: '☯',
};

/* ─── Category labels ─── */
const CATEGORY_LABELS: Record<string, string> = {
  key: 'Ключевой',
  consumable: 'Расходуемый',
  misc: 'Разное',
  quest: 'Задание',
  equipment: 'Экипировка',
  book: 'Книга',
  poem_fragment: 'Фрагмент',
};

/* ─── Equipment slot labels ─── */
const SLOT_LABELS: Record<string, string> = {
  head: 'Голова',
  body: 'Тело',
  accessory: 'Аксессуар',
};

/* ─── Slot icons (emoji) ─── */
const SLOT_ICONS: Record<string, string> = {
  head: '🧠',
  body: '🛡️',
  accessory: '💍',
};

/* ─── Slot border colors ─── */
const SLOT_BORDER_COLORS: Record<string, string> = {
  head: 'border-cyan-500/40',
  body: 'border-emerald-500/40',
  accessory: 'border-amber-500/40',
};

/* ─── Sort options ─── */
type SortOption = 'name' | 'rarity' | 'type' | 'quantity';
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name', label: 'По имени' },
  { value: 'rarity', label: 'По редкости' },
  { value: 'type', label: 'По типу' },
  { value: 'quantity', label: 'По количеству' },
];

/* ─── Category filter tabs ─── */
const CATEGORY_FILTER_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'all', label: 'Все', icon: '📦' },
  { value: 'equipment', label: 'Оружие', icon: '⚔️' },
  { value: 'consumable', label: 'Расходуемые', icon: '💊' },
  { value: 'misc', label: 'Материалы', icon: '🔧' },
  { value: 'book', label: 'Книги', icon: '📖' },
  { value: 'key', label: 'Инструменты', icon: '🔑' },
  { value: 'quest', label: 'Задания', icon: '📜' },
];

/* ─── Rarity sort weight ─── */
const RARITY_WEIGHT: Record<ItemRarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  legendary: 3,
};

/* ─── Animation variants ─── */
const cardVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};

const detailPanelVariants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 200 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export function Inventory({ open, onClose, onOpenPoetryBook }: InventoryProps) {
  const inventory = usePlayerInventory();
  const equippedItems = useEquippedItems();
  const { removeItem, addEnergy, addStress, addKarma, addSkill } = useConsumableActions();
  const equipItem = useEquipItem();
  const unequipItem = useUnequipItem();
  const addLoreEntry = useAddLoreEntry();

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const [useFeedback, setUseFeedback] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Selected item from inventory or equipment
  const selectedInventoryItem = selectedIdx !== null ? inventory[selectedIdx] ?? null : null;
  const selectedEquipItem = selectedSlot !== null ? equippedItems[selectedSlot] : null;
  const selectedItem = selectedInventoryItem ?? selectedEquipItem;

  // Category counts
  const categoryCounts = useMemo(() => {
    return inventory.reduce<Record<string, number>>((acc, item) => {
      const def = getItemDefinition(item.id);
      const cat = def?.category === 'equipment' ? 'equipment'
        : def?.category === 'consumable' ? 'consumable'
        : def?.category === 'book' || def?.category === 'poem_fragment' ? 'book'
        : def?.category === 'quest_item' ? 'quest'
        : def?.category === 'key_item' ? 'key'
        : 'misc';
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {});
  }, [inventory]);

  // Filtered & sorted inventory
  const filteredInventory = useMemo(() => {
    let items = categoryFilter === 'all'
      ? [...inventory]
      : inventory.filter((item) => {
          const def = getItemDefinition(item.id);
          const cat = def?.category;
          if (categoryFilter === 'equipment') return cat === 'equipment';
          if (categoryFilter === 'consumable') return cat === 'consumable';
          if (categoryFilter === 'book') return cat === 'book' || cat === 'poem_fragment';
          if (categoryFilter === 'quest') return cat === 'quest_item';
          if (categoryFilter === 'key') return cat === 'key_item';
          if (categoryFilter === 'misc') return cat === 'misc';
          return true;
        });

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) =>
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }

    // Sort
    items.sort((a, b) => {
      const defA = getItemDefinition(a.id);
      const defB = getItemDefinition(b.id);
      switch (sortOption) {
        case 'name':
          return a.name.localeCompare(b.name, 'ru');
        case 'rarity':
          return (RARITY_WEIGHT[defA?.rarity ?? 'common'] ?? 0) - (RARITY_WEIGHT[defB?.rarity ?? 'common'] ?? 0);
        case 'type': {
          const catA = defA?.category ?? 'misc';
          const catB = defB?.category ?? 'misc';
          return catA.localeCompare(catB);
        }
        case 'quantity':
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });

    return items;
  }, [inventory, categoryFilter, searchQuery, sortOption]);

  // Capacity
  const capacityPct = Math.round((inventory.length / MAX_INVENTORY_SLOTS) * 100);

  const handleClose = useCallback(() => {
    setSelectedIdx(null);
    setSelectedSlot(null);
    setUseFeedback(null);
    setSearchQuery('');
    onClose();
  }, [onClose]);

  /** Use a consumable or book item */
  const handleUseItem = useCallback(
    (item: InventoryItem) => {
      const def = getItemDefinition(item.id);
      if (!def) return;

      if (def.category !== 'consumable' && def.category !== 'book' && def.category !== 'poem_fragment') return;

      for (const effect of def.effects) {
        if (effect.stat === 'energy') addEnergy(effect.value);
        else if (effect.stat === 'stress') addStress(effect.value);
        else if (effect.stat === 'karma') addKarma(effect.value);
        else if (effect.skill) addSkill(effect.skill, effect.value);
      }

      const isConsumed = def.category === 'consumable';
      if (isConsumed) {
        removeItem(item.id, 1);
      }

      if (def.linkedContent) {
        if (def.linkedContent.type === 'poem' && onOpenPoetryBook) {
          onOpenPoetryBook();
        } else if (def.linkedContent.type === 'lore') {
          addLoreEntry({
            id: def.linkedContent.id,
            title: item.name,
            category: 'history',
            body: item.description,
            sceneId: 'volodka_room',
            rarity: 'common',
            discovered: true,
          });
        }
      }

      const effectText = def.effects
        .map((e) => {
          if (e.stat === 'energy') return `Энергия ${e.value > 0 ? '+' : ''}${e.value}`;
          if (e.stat === 'stress') return `Стресс ${e.value > 0 ? '+' : ''}${e.value}`;
          if (e.stat === 'karma') return `Карма ${e.value > 0 ? '+' : ''}${e.value}`;
          if (e.skill) return `${e.skill} +${e.value}`;
          return '';
        })
        .filter(Boolean)
        .join(', ');

      let feedbackMsg = isConsumed
        ? effectText || 'Использовано'
        : `Изучено: ${effectText || 'Прочитано'}`;

      if (def.linkedContent?.type === 'poem') {
        feedbackMsg += ' → Стихотворение открыто';
      } else if (def.linkedContent?.type === 'lore') {
        feedbackMsg += ' → Запись в журнале';
      }

      setUseFeedback(feedbackMsg);
      setTimeout(() => setUseFeedback(null), 2000);

      if (isConsumed && item.quantity <= 1) {
        setSelectedIdx(null);
      }
    },
    [addEnergy, addStress, addKarma, addSkill, removeItem, onOpenPoetryBook, addLoreEntry],
  );

  const handleEquipItem = useCallback(
    (item: InventoryItem) => {
      equipItem(item.id);
      setSelectedIdx(null);
      setSelectedSlot(null);
    },
    [equipItem],
  );

  const handleUnequipItem = useCallback(
    (slot: EquipmentSlot) => {
      unequipItem(slot);
      setSelectedSlot(null);
      setSelectedIdx(null);
    },
    [unequipItem],
  );

  const handleDropItem = useCallback(
    (item: InventoryItem) => {
      const def = getItemDefinition(item.id);
      if (def?.questRelated) return;
      removeItem(item.id, 1);
      setSelectedIdx(null);
    },
    [removeItem],
  );

  const canUseItem = useCallback((item: InventoryItem) => {
    const def = getItemDefinition(item.id);
    if (!def) return false;
    return (def.category === 'consumable' || def.category === 'book' || def.category === 'poem_fragment') && def.effects.length > 0;
  }, []);

  const canEquipItem = useCallback((item: InventoryItem) => {
    const def = getItemDefinition(item.id);
    if (!def) return false;
    return def.category === 'equipment';
  }, []);

  // Handle clicking an item card - find original index
  const handleSelectItem = useCallback((item: InventoryItem) => {
    const originalIdx = inventory.indexOf(item);
    if (originalIdx !== -1) {
      setSelectedIdx(originalIdx);
      setSelectedSlot(null);
    }
  }, [inventory]);

  return (
    <PanelWrapper
      open={open}
      onClose={handleClose}
      title="Инвентарь"
      testId="inventory-panel"
      urlPath="volodka://inventory"
      accentColor="cyan"
      layout="centered"
      maxWidth="max-w-4xl"
      icon={<Package className="size-5 text-cyan-400" />}
      shortcutLabel="I"
      headerExtra={(
        <div className="flex items-center gap-2.5">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="w-28 sm:w-36 h-7 pl-7 pr-2 text-[11px] font-mono bg-slate-900/60 border border-slate-700/40 rounded-md text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          {/* Capacity bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-2 w-20 bg-slate-800/60 rounded-full overflow-hidden inv-bar-shimmer">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${capacityPct}%`,
                  background: inventory.length >= MAX_INVENTORY_SLOTS
                    ? 'linear-gradient(90deg, #9f1239, #f43f5e)'
                    : inventory.length >= MAX_INVENTORY_SLOTS * 0.75
                      ? 'linear-gradient(90deg, #b45309, #f59e0b)'
                      : 'linear-gradient(90deg, #059669, #34d399)',
                }}
              />
            </div>
            <span className={`text-[10px] font-mono font-medium ${
              capacityPct >= 100 ? 'text-rose-400 neon-text-rose'
              : capacityPct >= 75 ? 'text-amber-400'
              : 'text-slate-400'
            }`}>
              {capacityPct}%
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">{inventory.length}/{MAX_INVENTORY_SLOTS}</span>
        </div>
      )}
      footer={(
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-600 font-mono">volodka://inventory</span>
          <span className="text-[10px] text-slate-600 font-mono">
            {categoryFilter !== 'all' ? `Фильтр: ${CATEGORY_FILTER_OPTIONS.find(o => o.value === categoryFilter)?.label ?? categoryFilter}` : 'Все предметы'}
          </span>
        </div>
      )}
    >
      <div className="inv-scrollable h-full">
        <div className="p-4">

          {/* ── Category filter bar ── */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {CATEGORY_FILTER_OPTIONS.map((opt) => {
              const count = opt.value === 'all' ? inventory.length : (categoryCounts[opt.value] ?? 0);
              if (opt.value !== 'all' && count === 0) return null;
              const isActive = categoryFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setCategoryFilter(opt.value);
                    setSelectedIdx(null);
                    setSelectedSlot(null);
                  }}
                  className={`
                    inv-cat-tab px-3 py-1.5 rounded-md text-[11px] font-mono border transition-all duration-200 relative
                    ${isActive
                      ? 'inv-cat-tab-active border-cyan-500/50 bg-cyan-950/50 text-cyan-300 shadow-[0_0_10px_rgb(var(--cyber-cyan-rgb) / 0.15)]'
                      : 'border-slate-700/30 bg-slate-900/30 text-slate-500 hover:text-slate-300 hover:border-slate-600/40 hover:bg-slate-800/30'
                    }
                  `}
                >
                  <span className="mr-1">{opt.icon}</span>
                  {opt.label}
                  <span className={`ml-1.5 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`}>{count}</span>
                  {isActive && (
                    <motion.div
                      layoutId="inv-tab-indicator"
                      className="absolute bottom-0 left-1 right-1 h-[2px] bg-cyan-400/60 rounded-full"
                      style={{ boxShadow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.4)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}

            {/* Sort dropdown */}
            <div className="relative ml-auto">
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-mono border border-slate-700/30 bg-slate-900/30 text-slate-500 hover:text-slate-300 hover:border-slate-600/40 transition-all"
              >
                {SORT_OPTIONS.find(s => s.value === sortOption)?.label}
                <ChevronDown className={`size-3 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {sortDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-1 z-30 border border-slate-700/40 rounded-md bg-slate-900/95 backdrop-blur-md shadow-xl overflow-hidden min-w-[140px]"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortOption(opt.value);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors ${
                          sortOption === opt.value
                            ? 'text-cyan-400 bg-cyan-950/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Equipped items section ── */}
          <div className="mb-4">
            <h3 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Shield className="size-3.5 text-cyan-400" />
              Экипировка
            </h3>
            <div className="flex gap-2">
              {(['head', 'body', 'accessory'] as EquipmentSlot[]).map((slot) => {
                const equipped = equippedItems[slot];
                const equipDef = equipped ? getItemDefinition(equipped.id) : undefined;
                const isSelected = selectedSlot === slot;
                const slotBorderColor = SLOT_BORDER_COLORS[slot];
                return (
                  <button
                    key={slot}
                    onClick={() => {
                      setSelectedSlot(equipped ? slot : null);
                      setSelectedIdx(null);
                    }}
                    className={`
                      flex-1 rounded-md border p-2 transition-all duration-200 relative
                      ${equipped
                        ? isSelected
                          ? `${slotBorderColor} bg-slate-800/50 ring-1 ring-cyan-500/30`
                          : `${slotBorderColor} bg-slate-900/50 hover:bg-slate-800/40`
                        : `inv-slot-empty border-slate-700/20 bg-slate-900/20`
                      }
                    `}
                  >
                    <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                      {equipped ? (
                        <span className="inv-equipped-badge text-[8px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono leading-none">
                          НАДЕТО
                        </span>
                      ) : null}
                      <span>{SLOT_LABELS[slot]}</span>
                    </div>
                    {equipped && equipDef ? (
                      <div className="flex items-center gap-1.5">
                        <ItemIcon icon={equipDef.icon} className="size-4 text-slate-100" />
                        <span className="text-xs text-slate-200 truncate">{equipped.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 opacity-30">
                        <span className="text-sm">{SLOT_ICONS[slot]}</span>
                        <span className="text-[10px] text-slate-500 italic">Пусто</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Main content: grid + detail panel ── */}
          <div className="flex gap-4">
            {/* Item grid */}
            <div className={`flex-1 min-w-0 ${selectedItem ? 'hidden sm:block' : ''}`}>
              {filteredInventory.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 rounded-full border border-slate-700/30 bg-slate-900/30 flex items-center justify-center">
                      <Package className="size-8 text-slate-600" />
                    </div>
                    <div className="absolute -inset-2 rounded-full border border-dashed border-slate-700/20 inv-empty-orbit" />
                    <div className="absolute -inset-4 rounded-full border border-dashed border-slate-700/10 inv-empty-orbit inv-empty-orbit-2" />
                  </div>
                  <span className="text-sm text-slate-500 font-mono mb-1">
                    {searchQuery ? 'Ничего не найдено' : 'Нет предметов'}
                  </span>
                  <span className="text-[11px] text-slate-600 font-mono">
                    {searchQuery ? 'Попробуйте другой запрос' : 'В этой категории пока пусто'}
                  </span>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 inv-grid-scroll"
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredInventory.map((item, filteredIdx) => {
                      const originalIdx = inventory.indexOf(item);
                      const isSelected = selectedIdx === originalIdx;
                      const itemDef = getItemDefinition(item.id);
                      const rarity = itemDef?.rarity ?? 'common';
                      const hasIcon = !!itemDef?.icon;
                      const categoryIcon = CATEGORY_ICONS[item.category] ?? '📦';

                      return (
                        <motion.button
                          key={`${item.id}-${filteredIdx}`}
                          layout
                          variants={cardVariants}
                          custom={filteredIdx}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          onClick={() => handleSelectItem(item)}
                          data-rarity={rarity !== 'common' ? rarity : undefined}
                          className={`
                            inv-item-card inv-cell-hscanline inv-cell-scanline group relative rounded-lg border p-2.5 text-left transition-all duration-200
                            backdrop-blur-md
                            ${RARITY_BORDER_CLASS[rarity]}
                            ${isSelected
                              ? 'bg-slate-800/60 ring-1 ring-cyan-500/30'
                              : 'bg-slate-900/40 hover:bg-slate-800/50'
                            }
                          `}
                          whileHover={{
                            scale: 1.03,
                            boxShadow: getRarityHoverShadow(rarity),
                            transition: { duration: 0.15 },
                          }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {/* Rarity shimmer for legendary */}
                          {rarity === 'legendary' && (
                            <div className="absolute inset-0 rounded-lg inv-legendary-shimmer pointer-events-none" />
                          )}

                          {/* Rare pulse */}
                          {rarity === 'rare' && !isSelected && (
                            <div className="absolute inset-0 rounded-lg inv-rare-pulse pointer-events-none" />
                          )}

                          {/* Top row: category icon + count badge */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[13px] leading-none">{categoryIcon}</span>
                            <div className="flex items-center gap-1">
                              {itemDef?.questRelated && (
                                <Lock className="size-2.5 text-cyan-400 drop-shadow-[0_0_3px_rgb(var(--cyber-cyan-rgb) / 0.5)]" />
                              )}
                              {itemDef?.category === 'equipment' && (
                                <Shield className="size-2.5 text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]" />
                              )}
                              {item.quantity > 1 && (
                                <span className="inv-count-badge-cyber">
                                  {item.quantity}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Item icon */}
                          <div className="flex items-center justify-center h-10 mb-1.5">
                            {hasIcon ? (
                              <ItemIcon icon={itemDef!.icon} className="size-6 text-slate-200 drop-shadow-[0_0_3px_rgba(255,255,255,0.1)]" />
                            ) : (
                              <span className="text-[10px] text-slate-200 font-medium text-center leading-tight px-0.5">
                                {item.name.length > 8 ? item.name.slice(0, 7) + '…' : item.name}
                              </span>
                            )}
                          </div>

                          {/* Item name */}
                          <div className={`text-[11px] font-medium truncate leading-tight ${RARITY_TEXT_CLASS[rarity]}`}>
                            {item.name}
                          </div>

                          {/* Hover description tooltip */}
                          <div className="absolute left-0 right-0 -bottom-1 translate-y-full z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1">
                            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/40 rounded-md p-2 shadow-xl text-[10px] text-slate-400 leading-relaxed max-h-20 overflow-y-auto">
                              {item.description || itemDef?.description || 'Нет описания'}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                  {/* Empty slot placeholders */}
                  {Array.from({ length: Math.max(0, Math.min(8, MAX_INVENTORY_SLOTS - filteredInventory.length)) }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="inv-empty-slot rounded-lg border flex items-center justify-center min-h-[80px]"
                    >
                      <span className="inv-empty-slot-plus">+</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* ── Detail panel (desktop: side panel, mobile: overlay) ── */}
            <AnimatePresence>
              {selectedItem && (
                <motion.div
                  key="detail-panel"
                  variants={detailPanelVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`
                    w-full sm:w-64 shrink-0
                    fixed inset-0 z-40 sm:relative sm:inset-auto sm:z-auto
                    bg-black/80 sm:bg-transparent
                    flex items-end sm:items-start sm:block
                    ${selectedItem ? '' : 'hidden'}
                  `}
                  onClick={(e) => {
                    // On mobile, clicking backdrop closes detail
                    if (e.target === e.currentTarget) {
                      setSelectedIdx(null);
                      setSelectedSlot(null);
                    }
                  }}
                >
                  <div
                    className={`
                      w-full sm:w-auto
                      rounded-t-xl sm:rounded-lg
                      max-h-[60vh] sm:max-h-none
                      overflow-y-auto
                    `}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ItemDetail
                      item={selectedItem}
                      isEquipped={!!selectedEquipItem}
                      equippedSlot={selectedSlot}
                      onUse={() => handleUseItem(selectedItem)}
                      onEquip={() => handleEquipItem(selectedItem)}
                      onUnequip={() => selectedSlot && handleUnequipItem(selectedSlot)}
                      onDrop={() => handleDropItem(selectedItem)}
                      canUse={canUseItem(selectedItem)}
                      canEquip={canEquipItem(selectedItem)}
                      feedback={useFeedback}
                      onClose={() => {
                        setSelectedIdx(null);
                        setSelectedSlot(null);
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Use feedback toast */}
          <AnimatePresence>
            {useFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-sm text-cyan-300 font-mono shadow-xl backdrop-blur-md"
              >
                {useFeedback}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PanelWrapper>
  );
}

/* ══════════════════════════════════════════════════════════════
   ITEM DETAIL COMPONENT
   ══════════════════════════════════════════════════════════════ */
function ItemDetail({
  item,
  isEquipped,
  equippedSlot,
  onUse,
  onEquip,
  onUnequip,
  onDrop,
  canUse,
  canEquip,
  feedback,
  onClose,
}: {
  item: InventoryItem;
  isEquipped: boolean;
  equippedSlot: EquipmentSlot | null;
  onUse: () => void;
  onEquip: () => void;
  onUnequip: () => void;
  onDrop: () => void;
  canUse: boolean;
  canEquip: boolean;
  feedback: string | null;
  onClose: () => void;
}) {
  const def = getItemDefinition(item.id);
  const isConsumable = def?.category === 'consumable';
  const isBook = def?.category === 'book';
  const isPoemFragment = def?.category === 'poem_fragment';
  const isEquipment = def?.category === 'equipment';
  const canDrop = !def?.questRelated && !isEquipped;
  const isQuestItem = def?.questRelated ?? false;

  const rarity = def?.rarity ?? 'common';
  const rarityColor = getRarityColor(rarity);
  const rarityBg = getRarityBg(rarity);
  const rarityLabel = getRarityLabel(rarity);
  const iconName = def?.icon;
  const hasIcon = !!iconName;

  const useLabel = isConsumable ? 'Использовать' : isBook ? 'Прочитать' : isPoemFragment ? 'Изучить' : 'Использовать';
  const detailBg = RARITY_DETAIL_BG[rarity];

  return (
    <div className={`flex flex-col gap-3 rounded-lg border border-slate-700/30 p-3 ${detailBg} backdrop-blur-md`}>
      {/* Close button for mobile */}
      <div className="flex items-center justify-between sm:hidden mb-1">
        <span className="text-xs text-slate-500 font-mono">Детали</span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="size-4" />
        </button>
      </div>

      {/* Icon preview */}
      <div
        className={`w-16 h-16 rounded-md border mx-auto flex items-center justify-center relative ${
          rarityBg
        }`}
        style={{
          boxShadow: RARITY_ICON_SHADOW[rarity],
        }}
      >
        {hasIcon ? (
          <ItemIcon icon={iconName} className="size-7 text-slate-100 drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]" />
        ) : (
          <span className="text-xs text-slate-100 font-medium text-center px-1 leading-tight">
            {item.name}
          </span>
        )}
        {rarity === 'legendary' && (
          <div className="absolute inset-0 rounded-md inv-legendary-shimmer pointer-events-none" />
        )}
      </div>

      {/* Name & badges */}
      <div className="text-center">
        <div className={`text-sm font-medium ${RARITY_TEXT_CLASS[rarity]}`}>
          {item.name}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
          <Badge variant="outline" className={`text-[10px] ${rarityColor}`}>
            {rarityLabel}
          </Badge>
          {isEquipment && (
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
              <Shield className="size-2.5 mr-0.5" />
              Экипировка
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] border-slate-700/40 text-slate-400">
            {CATEGORY_LABELS[item.category] ?? item.category}
          </Badge>
          {isQuestItem && (
            <Badge variant="outline" className="text-[10px] border-cyan-500/40 text-cyan-400">
              <Lock className="size-2.5 mr-0.5" />
              Квест
            </Badge>
          )}
          {isEquipped && equippedSlot && (
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 inv-equipped-badge">
              НАДЕТО: {SLOT_LABELS[equippedSlot]}
            </Badge>
          )}
        </div>
      </div>

      {/* Description */}
      {(item.description || def?.description) && (
        <p className="text-xs text-slate-400 leading-relaxed">
          {item.description || def?.description}
        </p>
      )}

      {/* Effects */}
      {(isConsumable || isBook || isPoemFragment || isEquipment) && def && def.effects.length > 0 && (
        <div className="space-y-1 rounded-md bg-slate-900/40 border border-slate-700/20 p-2">
          {def.effects.map((e, i) => {
            let label = '';
            let statIcon = '';
            let valueClass = '';
            if (e.stat === 'energy') {
              label = `Энергия ${e.value > 0 ? '+' : ''}${e.value}`;
              statIcon = STAT_ICONS.energy;
              valueClass = e.value > 0 ? 'text-emerald-400' : 'text-rose-400';
            } else if (e.stat === 'stress') {
              label = `Стресс ${e.value > 0 ? '+' : ''}${e.value}`;
              statIcon = STAT_ICONS.stress;
              valueClass = e.value > 0 ? 'text-rose-400' : 'text-emerald-400';
            } else if (e.stat === 'karma') {
              label = `Карма ${e.value > 0 ? '+' : ''}${e.value}`;
              statIcon = STAT_ICONS.karma;
              valueClass = e.value > 0 ? 'text-cyan-400' : 'text-rose-400';
            } else if (e.skill) {
              label = `${e.skill} +${e.value}`;
              statIcon = '📈';
              valueClass = 'text-violet-400';
            }
            return (
              <div key={i} className={`text-xs flex items-center gap-1.5 ${valueClass}`}>
                <span className="text-[11px]">{statIcon}</span>
                <span className="font-mono">{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Linked content info for books */}
      {isBook && def?.linkedContent && (
        <div className="text-xs text-cyan-400/70 italic">
          {def.linkedContent.type === 'poem' ? '📖 Откроет стихотворение' : '📜 Добавит запись в журнал'}
        </div>
      )}

      {/* Quantity */}
      {item.stackable && item.quantity > 1 && (
        <div className="text-xs text-slate-500">Количество: {item.quantity}</div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-cyan-400 text-center font-medium neon-text-cyan"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 mt-1">
        {(isConsumable || isBook || isPoemFragment) && (
          <Button
            size="sm"
            variant="outline"
            className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-900/30 hover:shadow-[0_0_12px_rgb(var(--cyber-cyan-rgb) / 0.2)] transition-all duration-200"
            onClick={onUse}
            disabled={!canUse}
          >
            <Hand className="size-3.5 mr-1.5" />
            {useLabel}
          </Button>
        )}

        {isEquipment && !isEquipped && (
          <Button
            size="sm"
            variant="outline"
            className="border-amber-500/40 text-amber-400 hover:bg-amber-900/30 hover:shadow-[0_0_12px_rgba(251,191,36,0.2)] transition-all duration-200"
            onClick={onEquip}
            disabled={!canEquip}
          >
            <Shield className="size-3.5 mr-1.5" />
            Экипировать
          </Button>
        )}

        {isEquipped && (
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/30 hover:shadow-[0_0_12px_rgba(52,211,153,0.2)] transition-all duration-200"
            onClick={onUnequip}
          >
            <Shield className="size-3.5 mr-1.5" />
            Снять
          </Button>
        )}

        {!isEquipped && (
          <Button
            size="sm"
            variant="outline"
            className="border-rose-500/30 text-rose-400 hover:bg-rose-900/30 hover:shadow-[0_0_8px_rgba(251,113,133,0.15)] transition-all duration-200"
            onClick={onDrop}
            disabled={!canDrop}
          >
            <Trash2 className="size-3.5 mr-1.5" />
            {canDrop ? 'Выбросить' : 'Нельзя выбросить'}
          </Button>
        )}
      </div>
    </div>
  );
}
