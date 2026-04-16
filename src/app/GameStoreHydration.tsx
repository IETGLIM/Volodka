'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

/** Applies localStorage snapshot after mount so SSR and first client paint stay aligned. */
export function GameStoreHydration() {
  useEffect(() => {
    useGameStore.getState().hydrateFromLocalStorage();
  }, []);
  return null;
}
