import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createUISlice, type UISlice } from '../slices/uiSlice';
import { bindSliceCreator } from './bindSliceCreator';
import { getGamePhase, type GamePhase } from '@/shared/gamePhase';
import { getActiveCutsceneId } from './cutsceneStore';

export const useUIStore = create<UISlice>()(subscribeWithSelector(bindSliceCreator(createUISlice)));
export function getUIStoreState(): UISlice { return useUIStore.getState(); }

/** Live phase — prefer over `readGamePhase(useGameStore.getState())` (facade can lag one rAF). */
export function getLiveGamePhase(): GamePhase {
  const ui = useUIStore.getState();
  return getGamePhase({
    mainMenuOpen: ui.mainMenuOpen,
    introActive: ui.introActive,
    combatActive: ui.combatActive,
    activeCutsceneId: getActiveCutsceneId(),
  });
}
