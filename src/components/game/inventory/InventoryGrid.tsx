import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';
import { InventoryCard } from '@/components/game/inventory/InventoryCard';
import {
  INVENTORY_GRID_ROW_HEIGHT,
  INVENTORY_VIRTUALIZE_THRESHOLD,
} from '@/components/game/inventory/inventoryConstants';
import { useInventoryDnd } from '@/components/game/inventory/inventoryDnd';
import {
  useInventoryGridColumns,
  useInventoryGridNavigation,
} from '@/components/game/inventory/useInventoryGridNavigation';
import type { InventoryItemView } from '@/engine/inventory/inventoryPresentation';
import type { EquipmentSlot, InventoryItem } from '@/shared/types/game';

interface InventoryGridProps {
  open: boolean;
  views: InventoryItemView[];
  selectedItemId: string | null;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  reducedMotion: boolean;
  searchQuery: string;
  maxSlots: number;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
  equippedItems: Record<EquipmentSlot, InventoryItem | null>;
  onSelectItem: (itemId: string, index: number) => void;
  onConfirmItem: (item: InventoryItemView) => void;
  onCloseDetail: () => void;
}

export function InventoryGrid({
  open,
  views,
  selectedItemId,
  focusedIndex,
  setFocusedIndex,
  reducedMotion,
  searchQuery,
  maxSlots,
  gridContainerRef,
  equippedItems,
  onSelectItem,
  onConfirmItem,
  onCloseDetail,
}: InventoryGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnCount = useInventoryGridColumns(gridContainerRef);
  const useVirtual = views.length >= INVENTORY_VIRTUALIZE_THRESHOLD;
  const rowCount = Math.ceil(views.length / columnCount);
  // Зона дропа надетого предмета (снять) — подсветка dashed-контуром.
  const { dragPayload, dropTarget } = useInventoryDnd();
  const unequipHover =
    !!dragPayload?.fromSlot && dropTarget?.kind === 'inventory';

  const rowVirtualizer = useVirtualizer({
    count: useVirtual ? rowCount : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => INVENTORY_GRID_ROW_HEIGHT,
    overscan: 2,
  });

  useInventoryGridNavigation({
    enabled: open && views.length > 0,
    itemCount: views.length,
    columnCount,
    focusedIndex,
    setFocusedIndex,
    selectedItemId,
    onSelectIndex: (index) => {
      const view = views[index];
      if (view) onSelectItem(view.item.id, index);
    },
    onConfirm: () => {
      const view = views[focusedIndex];
      if (view) onConfirmItem(view);
    },
    onCloseDetail,
    gridContainerRef,
  });

  if (views.length === 0) {
    return (
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
    );
  }

  const renderCard = (view: InventoryItemView, index: number) => (
    <InventoryCard
      key={view.item.id}
      view={view}
      index={index}
      isSelected={selectedItemId === view.item.id}
      isFocused={focusedIndex === index}
      reducedMotion={reducedMotion}
      onSelect={onSelectItem}
      equippedItems={equippedItems}
    />
  );

  const emptySlots = Math.max(0, Math.min(8, maxSlots - views.length));

  return (
    <div
      ref={gridContainerRef}
      tabIndex={-1}
      role="listbox"
      aria-label="Предметы инвентаря"
      data-dnd-inventory="true"
      className={`outline-none min-w-0 ${unequipHover ? 'inv-grid-drop-ok' : ''}`}
    >
      {useVirtual ? (
        <div ref={scrollRef} className="inv-grid-scroll max-h-[420px] overflow-y-auto pr-1">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const rowStart = virtualRow.index * columnCount;
              const rowViews = views.slice(rowStart, rowStart + columnCount);
              return (
                <div
                  key={virtualRow.key}
                  className="grid gap-2 sm:gap-2.5 absolute left-0 w-full px-0.5"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                  }}
                >
                  {rowViews.map((view, colIdx) => renderCard(view, rowStart + colIdx))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 inv-grid-scroll"
        >
          <AnimatePresence mode="popLayout">
            {views.map((view, index) => renderCard(view, index))}
          </AnimatePresence>
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="inv-empty-slot rounded-lg border flex items-center justify-center min-h-[80px]"
            >
              <span className="inv-empty-slot-plus">+</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
