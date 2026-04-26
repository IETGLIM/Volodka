'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/state';

/**
 * Фасад над действиями с инвентарём.
 * Пока делегирует в gameStore, после распила — напрямую в inventoryStore.
 */
export function useInventoryActions() {
  const addItem = useCallback((itemId: string, quantity?: number) => {
    useGameStore.getState().addItem(itemId, quantity);
  }, []);

  const removeItem = useCallback((itemId: string, quantity?: number) => {
    useGameStore.getState().removeItem(itemId, quantity);
  }, []);

  const hasItem = useCallback((itemId: string): boolean => {
    return useGameStore.getState().hasItem(itemId);
  }, []);

  return { addItem, removeItem, hasItem };
}
