import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MAX_INVENTORY_SLOTS } from '@/data/constants';
import {
  buildCategoryCounts,
  canDropInventoryItem,
  canEquipInventoryItem,
  canUseInventoryItem,
  filterAndSortInventoryViews,
  resolveInventoryItemView,
  type InventoryFilterCategory,
} from '@/engine/inventory/inventoryPresentation';
import { inventoryTelemetry } from '@/engine/inventory/inventoryTelemetry';
import type { InventorySortOption } from '@/components/game/inventory/inventoryConstants';
import {
  useAddLoreEntry,
  useConsumableActions,
  useEquipItem,
  useEquippedItems,
  usePlayerInventory,
  useUnequipItem,
} from '@/store/selectors';
import {
  useInventorySortPreference,
  useInventoryFilterPreference,
} from '@/store/selectors/uiSelectors';
import { getGameStore } from '@/store/gameStore';
import type { EquipmentSlot, InventoryItem } from '@/shared/types/game';

export function useInventoryPanel(
  open: boolean,
  onOpenPoetryBook?: () => void,
) {
  const inventory = usePlayerInventory();
  const equippedItems = useEquippedItems();
  const { removeItem, addEnergy, addStress, addKarma, addSkill, pushNotification } = useConsumableActions();
  const equipItem = useEquipItem();
  const unequipItem = useUnequipItem();
  const addLoreEntry = useAddLoreEntry();

  // Use persisted sort/filter preferences
  const persistedSortOption = useInventorySortPreference();
  const persistedFilterCategory = useInventoryFilterPreference();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [useFeedback, setUseFeedback] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilterLocal] = useState<InventoryFilterCategory>(
    (persistedFilterCategory as InventoryFilterCategory) ?? 'all',
  );
  const [sortOption, setSortOptionLocal] = useState<InventorySortOption>(
    (persistedSortOption as InventorySortOption) ?? 'name',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const inventoryViews = useMemo(
    () => inventory.map((item) => resolveInventoryItemView(item)),
    [inventory],
  );

  const categoryCounts = useMemo(() => buildCategoryCounts(inventoryViews), [inventoryViews]);

  const filteredViews = useMemo(
    () => filterAndSortInventoryViews(inventoryViews, categoryFilter, searchQuery, sortOption),
    [inventoryViews, categoryFilter, searchQuery, sortOption],
  );

  const selectedInventoryItem = useMemo(() => {
    if (!selectedItemId) return null;
    return filteredViews.find((view) => view.item.id === selectedItemId)?.item ?? null;
  }, [filteredViews, selectedItemId]);

  const selectedEquipItem = selectedSlot !== null ? equippedItems[selectedSlot] : null;
  const selectedItem = selectedInventoryItem ?? selectedEquipItem ?? null;

  const selectedView = useMemo(() => {
    if (selectedInventoryItem) {
      return filteredViews.find((view) => view.item.id === selectedInventoryItem.id) ?? resolveInventoryItemView(selectedInventoryItem);
    }
    if (selectedEquipItem) return resolveInventoryItemView(selectedEquipItem);
    return null;
  }, [filteredViews, selectedInventoryItem, selectedEquipItem]);

  useEffect(() => {
    if (!open) return;
    inventoryTelemetry.track({ action: 'open' });
  }, [open]);

  useEffect(() => {
    if (selectedItemId && !selectedInventoryItem && !selectedSlot) {
      setSelectedItemId(null);
    }
  }, [selectedItemId, selectedInventoryItem, selectedSlot]);

  useEffect(() => {
    if (focusedIndex >= filteredViews.length) {
      setFocusedIndex(Math.max(0, filteredViews.length - 1));
    }
  }, [filteredViews.length, focusedIndex]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItemId(null);
    setSelectedSlot(null);
  }, []);

  const resetPanelState = useCallback(() => {
    clearSelection();
    setUseFeedback(null);
    setSearchQuery('');
    setFocusedIndex(0);
  }, [clearSelection]);

  const setCategoryFilterTracked = useCallback((value: InventoryFilterCategory) => {
    setCategoryFilterLocal(value);
    // Persist to store
    getGameStore().setInventoryFilterCategory(value);
    clearSelection();
    inventoryTelemetry.track({ action: 'filter', filter: value });
  }, [clearSelection]);

  const setSortOptionTracked = useCallback((value: InventorySortOption) => {
    setSortOptionLocal(value);
    // Persist to store
    getGameStore().setInventorySortOption(value);
  }, []);

  const setSearchQueryTracked = useCallback((value: string) => {
    setSearchQuery(value);
    clearSelection();
    if (value.trim()) {
      inventoryTelemetry.track({ action: 'search', queryLength: value.trim().length });
    }
  }, [clearSelection]);

  const selectItemById = useCallback((itemId: string, index?: number) => {
    setSelectedItemId(itemId);
    setSelectedSlot(null);
    if (index !== undefined) setFocusedIndex(index);
  }, []);

  const selectEquippedSlot = useCallback((slot: EquipmentSlot | null) => {
    setSelectedSlot(slot);
    setSelectedItemId(null);
  }, []);

  const runPendingAction = useCallback(async (key: string, action: () => void | Promise<void>) => {
    if (pendingActionKey) return;
    setPendingActionKey(key);
    try {
      await action();
    } finally {
      setPendingActionKey(null);
    }
  }, [pendingActionKey]);

  const showFeedback = useCallback((message: string) => {
    setUseFeedback(message);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setUseFeedback(null), 2000);
  }, []);

  const focusNextAfterRemoval = useCallback((removedItemId: string) => {
    const removedIndex = filteredViews.findIndex((view) => view.item.id === removedItemId);
    const nextView = filteredViews[removedIndex + 1] ?? filteredViews[removedIndex - 1];
    if (nextView) {
      setSelectedItemId(nextView.item.id);
      setFocusedIndex(Math.max(0, removedIndex));
    } else {
      clearSelection();
    }
    gridContainerRef.current?.focus();
  }, [filteredViews, clearSelection]);

  const handleUseItem = useCallback(
    (item: InventoryItem) => {
      void runPendingAction(`use:${item.id}`, () => {
        const view = resolveInventoryItemView(item);
        const def = view.def;
        if (!def) return;
        if (def.category !== 'consumable' && def.category !== 'book' && def.category !== 'poem_fragment') return;

        for (const effect of def.effects) {
          if (effect.stat === 'energy') addEnergy(effect.value);
          else if (effect.stat === 'stress') addStress(effect.value);
          else if (effect.stat === 'karma') addKarma(effect.value);
          else if (effect.skill) addSkill(effect.skill, effect.value);
        }

        const isConsumed = def.category === 'consumable';
        if (isConsumed) removeItem(item.id, 1);

        if (def.linkedContent) {
          if (def.linkedContent.type === 'poem') {
            getGameStore().collectPoem(def.linkedContent.id);
            onOpenPoetryBook?.();
          } else if (def.linkedContent.type === 'lore') {
            addLoreEntry({
              id: def.linkedContent.id,
              title: item.name,
              category: 'history',
              body: view.displayDescription,
              sceneId: 'volodka_room',
              rarity: 'common',
              discovered: true,
            });
          }
        }

        /* Push item-specific toast notification */
        if (def.useMessage) {
          const toastType = def.effects[0]?.stat === 'stress' ? 'stress' as const : 'energy' as const;
          pushNotification(toastType, def.useMessage);
          showFeedback(def.useMessage);
        } else {
          const effectText = def.effects
            .map((effect) => {
              if (effect.stat === 'energy') return `Энергия ${effect.value > 0 ? '+' : ''}${effect.value}`;
              if (effect.stat === 'stress') return `Стресс ${effect.value > 0 ? '+' : ''}${effect.value}`;
              if (effect.stat === 'karma') return `Карма ${effect.value > 0 ? '+' : ''}${effect.value}`;
              if (effect.skill) return `${effect.skill} +${effect.value}`;
              return '';
            })
            .filter(Boolean)
            .join(', ');

          let feedbackMsg = isConsumed
            ? effectText || 'Использовано'
            : `Изучено: ${effectText || 'Прочитано'}`;

          if (def.linkedContent?.type === 'poem') feedbackMsg += ' → Стихотворение открыто';
          else if (def.linkedContent?.type === 'lore') feedbackMsg += ' → Запись в журнале';

          showFeedback(feedbackMsg);
        }

        inventoryTelemetry.track({ action: 'use', itemId: item.id });

        if (isConsumed && item.quantity <= 1) {
          focusNextAfterRemoval(item.id);
        } else {
          gridContainerRef.current?.focus();
        }
      });
    },
    [
      addEnergy,
      addStress,
      addKarma,
      addSkill,
      removeItem,
      onOpenPoetryBook,
      addLoreEntry,
      pushNotification,
      showFeedback,
      runPendingAction,
      focusNextAfterRemoval,
    ],
  );

  const handleEquipItem = useCallback(
    (item: InventoryItem) => {
      void runPendingAction(`equip:${item.id}`, () => {
        equipItem(item.id);
        clearSelection();
        inventoryTelemetry.track({ action: 'equip', itemId: item.id });
        gridContainerRef.current?.focus();
      });
    },
    [equipItem, clearSelection, runPendingAction],
  );

  const handleUnequipItem = useCallback(
    (slot: EquipmentSlot) => {
      void runPendingAction(`unequip:${slot}`, () => {
        unequipItem(slot);
        clearSelection();
        inventoryTelemetry.track({ action: 'unequip', itemId: equippedItems[slot]?.id });
        gridContainerRef.current?.focus();
      });
    },
    [unequipItem, clearSelection, runPendingAction, equippedItems],
  );

  const handleDropItem = useCallback(
    (item: InventoryItem) => {
      void runPendingAction(`drop:${item.id}`, () => {
        const view = resolveInventoryItemView(item);
        if (!canDropInventoryItem(view, false)) return;
        removeItem(item.id, 1);
        inventoryTelemetry.track({ action: 'drop', itemId: item.id });
        focusNextAfterRemoval(item.id);
      });
    },
    [removeItem, runPendingAction, focusNextAfterRemoval],
  );

  const capacityPct = Math.round((inventory.length / MAX_INVENTORY_SLOTS) * 100);

  return {
    inventory,
    equippedItems,
    inventoryViews,
    filteredViews,
    categoryCounts,
    selectedItem,
    selectedView,
    selectedItemId,
    selectedSlot,
    selectedEquipItem: !!selectedEquipItem,
    focusedIndex,
    setFocusedIndex,
    useFeedback,
    categoryFilter,
    setCategoryFilter: setCategoryFilterTracked,
    sortOption,
    setSortOption: setSortOptionTracked,
    searchQuery,
    setSearchQuery: setSearchQueryTracked,
    sortDropdownOpen,
    setSortDropdownOpen,
    pendingActionKey,
    capacityPct,
    maxSlots: MAX_INVENTORY_SLOTS,
    gridContainerRef,
    clearSelection,
    resetPanelState,
    selectItemById,
    selectEquippedSlot,
    handleUseItem,
    handleEquipItem,
    handleUnequipItem,
    handleDropItem,
    canUseItem: selectedView ? canUseInventoryItem(selectedView) : false,
    canEquipItem: selectedView ? canEquipInventoryItem(selectedView) : false,
    canDropItem: selectedView ? canDropInventoryItem(selectedView, !!selectedEquipItem) : false,
  };
}

export type InventoryPanelState = ReturnType<typeof useInventoryPanel>;
