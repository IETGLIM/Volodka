import { useCallback, useState } from 'react';

export interface GamePanelsState {
  skills: boolean;
  quests: boolean;
  factions: boolean;
  inventory: boolean;
  achievements: boolean;
  poetry: boolean;
  terminal: boolean;
  journal: boolean;
}

const INITIAL_PANELS: GamePanelsState = {
  skills: false,
  quests: false,
  factions: false,
  inventory: false,
  achievements: false,
  poetry: false,
  terminal: false,
  journal: false,
};

export function useGamePanels(initialState: Partial<GamePanelsState> = {}) {
  const [panels, setPanels] = useState<GamePanelsState>({
    ...INITIAL_PANELS,
    ...initialState,
  });

  const togglePanel = useCallback((key: keyof GamePanelsState) => {
    setPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const closePanel = useCallback((key: keyof GamePanelsState) => {
    setPanels((prev) => ({ ...prev, [key]: false }));
  }, []);

  const closeAllPanels = useCallback(() => {
    setPanels(INITIAL_PANELS);
  }, []);

  return {
    panels,
    togglePanel,
    closePanel,
    closeAllPanels,
  };
}
