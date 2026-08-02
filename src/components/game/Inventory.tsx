/* ─── Volodka RPG – Inventory panel ─── */

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Package, Search, X } from 'lucide-react';
import { PanelWrapper } from '@/components/game/PanelWrapper';
import { EquipmentPanel } from '@/components/game/inventory/EquipmentPanel';
import { InventoryDetailPanel } from '@/components/game/inventory/InventoryDetailPanel';
import { InventoryGrid } from '@/components/game/inventory/InventoryGrid';
import { InventoryCraftingPanel } from '@/components/game/inventory/CraftingPanel';
import {
  INVENTORY_CATEGORY_FILTER_OPTIONS,
  INVENTORY_SORT_OPTIONS,
} from '@/components/game/inventory/inventoryConstants';
import { useInventoryPanel } from '@/components/game/inventory/useInventoryPanel';
import type { InventoryFilterCategory } from '@/engine/inventory/inventoryPresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface InventoryProps {
  open: boolean;
  onClose: () => void;
  onOpenPoetryBook?: () => void;
}

type InventoryTab = 'items' | 'craft';

export function Inventory({ open, onClose, onOpenPoetryBook }: InventoryProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const [activeTab, setActiveTab] = useState<InventoryTab>('items');
  const {
    resetPanelState,
    inventory,
    maxSlots,
    capacityPct,
    categoryFilter,
    categoryCounts,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    sortDropdownOpen,
    setSortDropdownOpen,
    setCategoryFilter,
    equippedItems,
    selectedSlot,
    selectEquippedSlot,
    filteredViews,
    selectedItem,
    selectedView,
    selectedItemId,
    focusedIndex,
    setFocusedIndex,
    gridContainerRef,
    selectItemById,
    clearSelection,
    useFeedback,
    pendingActionKey,
    canUseItem,
    canEquipItem,
    canDropItem,
    handleUseItem,
    handleEquipItem,
    handleUnequipItem,
    handleDropItem,
    selectedEquipItem: isEquippedSelection,
  } = useInventoryPanel(open, onOpenPoetryBook);

  const handleClose = useCallback(() => {
    resetPanelState();
    onClose();
  }, [onClose, resetPanelState]);

  const handleConfirmItem = useCallback(
    (view: { item: { id: string } }) => {
      selectItemById(view.item.id);
    },
    [selectItemById],
  );

  const _activeFilterLabel = INVENTORY_CATEGORY_FILTER_OPTIONS.find(
    (option) => option.value === categoryFilter,
  )?.label ?? categoryFilter;

  const totalCount = inventory.length;
  const filteredCount = filteredViews.length;
  const isFiltered = categoryFilter !== 'all' || searchQuery.trim().length > 0;

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
      icon={<Package className="size-5 text-cyan-400" aria-hidden />}
      shortcutLabel="I"
      closeAriaLabel="Закрыть инвентарь"
      headerExtra={(
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" aria-hidden />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              aria-label="Поиск предметов"
              className="w-28 sm:w-36 h-7 pl-7 pr-2 text-[11px] font-mono bg-slate-900/60 border border-slate-700/40 rounded-md text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Очистить поиск"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-2 w-20 bg-slate-800/60 rounded-full overflow-hidden inv-bar-shimmer">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${capacityPct}%`,
                  background: inventory.length >= maxSlots
                    ? 'linear-gradient(90deg, #9f1239, #f43f5e)'
                    : inventory.length >= maxSlots * 0.75
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
          <span className="text-xs text-slate-400 font-mono">
            {totalCount}/{maxSlots}
          </span>
        </div>
      )}
      footer={(
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-600 font-mono">volodka://inventory</span>
          <span className="text-[10px] text-slate-600 font-mono">
            {activeTab === 'craft'
              ? 'Крафт'
              : isFiltered
                ? `${filteredCount} из ${totalCount} предметов`
                : `Все предметы (${totalCount})`}
          </span>
        </div>
      )}
    >
      <div className="inv-scrollable h-full">
        <div className="p-4">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {INVENTORY_CATEGORY_FILTER_OPTIONS.map((option) => {
              const count = option.value === 'all'
                ? inventory.length
                : (categoryCounts[option.value] ?? 0);
              if (option.value !== 'all' && count === 0) return null;
              const isActive = categoryFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => { setCategoryFilter(option.value as InventoryFilterCategory); setActiveTab('items'); }}
                  className={`
                    inv-cat-tab px-3 py-1.5 rounded-md text-[11px] font-mono border transition-all duration-200 relative
                    ${isActive && activeTab === 'items'
                      ? 'inv-cat-tab-active border-cyan-500/50 bg-cyan-950/50 text-cyan-300 shadow-[0_0_10px_rgb(var(--cyber-cyan-rgb) / 0.15)]'
                      : 'border-slate-700/30 bg-slate-900/30 text-slate-500 hover:text-slate-300 hover:border-slate-600/40 hover:bg-slate-800/30'
                    }
                  `}
                >
                  <span className="mr-1" aria-hidden>{option.icon}</span>
                  {option.label}
                  <span className={`ml-1.5 ${isActive && activeTab === 'items' ? 'text-cyan-400' : 'text-slate-600'}`}>{count}</span>
                  {isActive && activeTab === 'items' && !reducedMotion && (
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

            {/* Крафт tab */}
            <button
              type="button"
              aria-pressed={activeTab === 'craft'}
              onClick={() => setActiveTab('craft')}
              className={`
                px-3 py-1.5 rounded-md text-[11px] font-mono border transition-all duration-200 relative
                ${activeTab === 'craft'
                  ? 'border-amber-500/50 bg-amber-950/50 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.15)]'
                  : 'border-slate-700/30 bg-slate-900/30 text-slate-500 hover:text-slate-300 hover:border-slate-600/40 hover:bg-slate-800/30'
                }
              `}
            >
              <span className="mr-1" aria-hidden>🔧</span>
              Крафт
              {activeTab === 'craft' && !reducedMotion && (
                <motion.div
                  layoutId="inv-tab-indicator"
                  className="absolute bottom-0 left-1 right-1 h-[2px] bg-amber-400/60 rounded-full"
                  style={{ boxShadow: '0 0 6px rgba(251,191,36,0.4)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>

            <div className="relative ml-auto">
              <button
                type="button"
                aria-expanded={sortDropdownOpen}
                aria-haspopup="listbox"
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-mono border border-slate-700/30 bg-slate-900/30 text-slate-500 hover:text-slate-300 hover:border-slate-600/40 transition-all"
              >
                {INVENTORY_SORT_OPTIONS.find((option) => option.value === sortOption)?.label}
                <ChevronDown className={`size-3 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {sortDropdownOpen && (
                  <motion.div
                    initial={reducedMotion ? false : { opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reducedMotion ? undefined : { opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: reducedMotion ? 0 : 0.12 }}
                    role="listbox"
                    aria-label="Сортировка"
                    className="absolute right-0 top-full mt-1 z-30 border border-slate-700/40 rounded-md bg-slate-900/95 backdrop-blur-md shadow-xl overflow-hidden min-w-[140px]"
                  >
                    {INVENTORY_SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={sortOption === option.value}
                        onClick={() => {
                          setSortOption(option.value);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-[11px] font-mono transition-colors ${
                          sortOption === option.value
                            ? 'text-cyan-400 bg-cyan-950/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {activeTab === 'items' && (
            <>
              <EquipmentPanel
                equippedItems={equippedItems}
                selectedSlot={selectedSlot}
                onSelectSlot={selectEquippedSlot}
              />

              <div className="flex gap-4">
                <div className={`flex-1 min-w-0 ${selectedItem ? 'hidden sm:block' : ''}`}>
                  <InventoryGrid
                    open={open}
                    views={filteredViews}
                    selectedItemId={selectedItemId}
                    focusedIndex={focusedIndex}
                    setFocusedIndex={setFocusedIndex}
                    reducedMotion={reducedMotion}
                    searchQuery={searchQuery}
                    maxSlots={maxSlots}
                    gridContainerRef={gridContainerRef}
                    equippedItems={equippedItems}
                    onSelectItem={selectItemById}
                    onConfirmItem={handleConfirmItem}
                    onCloseDetail={clearSelection}
                  />
                </div>

                <AnimatePresence>
                  {selectedItem && selectedView && (
                    <InventoryDetailPanel
                      view={selectedView}
                      isEquipped={isEquippedSelection}
                      equippedSlot={selectedSlot}
                      feedback={useFeedback}
                      pendingActionKey={pendingActionKey}
                      canUse={canUseItem}
                      canEquip={canEquipItem}
                      canDrop={canDropItem}
                      reducedMotion={reducedMotion}
                      onUse={() => handleUseItem(selectedItem)}
                      onEquip={() => handleEquipItem(selectedItem)}
                      onUnequip={() => selectedSlot && handleUnequipItem(selectedSlot)}
                      onDrop={() => handleDropItem(selectedItem)}
                      onClose={clearSelection}
                    />
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {activeTab === 'craft' && (
            <InventoryCraftingPanel />
          )}

          <AnimatePresence>
            {useFeedback && (
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-sm text-cyan-300 font-mono shadow-xl backdrop-blur-md"
                aria-live="polite"
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
