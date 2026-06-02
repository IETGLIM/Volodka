import { useCallback, useMemo } from 'react';
import type { GameMode } from '@/data/rpgTypes';
import type { SaveGameOptions } from '@/state';
import { explorationNarrativeTeleport } from '@/lib/explorationNarrativeTeleport';
import {
  INTRO_OPENING_DESK_CHAIR,
  INTRO_OPENING_SCENE_ID,
} from '@/lib/introVolodkaOpeningCutscene';
import { useGamePhaseStore } from '@/state/gamePhaseStore';
import { useSessionPresetStore } from '@/state/sessionPresetStore';
import { useArcadeScoreStore } from '@/state/arcadeScoreStore';
import type { AppPhase } from '@/state/appStore';
import {
  FULL_STORY_SAVE_KEY,
  hasSaveForPreset,
  type ResetGameOptions,
} from '@/state/saveManager';
import type { SessionGamePreset } from '@/config/gameModePresets';
import { getActiveSessionPreset } from '@/state/sessionPresetStore';

interface UseGameSessionFlowParams {
  setPhase: (phase: AppPhase) => void;
  /** Оставлены для совместимости с `useActionHandler`; сброс режима/узла делает `resetGameStore`. */
  setGameMode?: (mode: GameMode) => void;
  setCurrentNode?: (nodeId: string) => void;
  saveGameToStore: (options?: SaveGameOptions) => void;
  loadGameFromStore: (options?: { preset?: SessionGamePreset }) => boolean;
  resetGameStore: (options?: ResetGameOptions) => void;
}

export function useGameSessionFlow({
  setPhase,
  saveGameToStore,
  loadGameFromStore,
  resetGameStore,
}: UseGameSessionFlowParams) {
  const hasSavedGame = useMemo(() => hasSaveForPreset('fullStory'), []);
  const hasDemoSave = useMemo(() => hasSaveForPreset('arcadeSlice'), []);

  const handleLoadingReady = useCallback(() => {
    setPhase('menu');
  }, [setPhase]);

  const handleSaveGame = useCallback(() => {
    saveGameToStore({ source: 'manual' });
  }, [saveGameToStore]);

  const startGameWithPreset = useCallback(
    (preset: SessionGamePreset) => {
      resetGameStore({ preset });
      useSessionPresetStore.getState().setPreset(preset);
      if (preset === 'arcadeSlice') {
        useArcadeScoreStore.getState().reset();
      }
      useGamePhaseStore.getState().completeIntroCutscene();
      setPhase('intro');
    },
    [resetGameStore, setPhase],
  );

  const handleStartNewGame = useCallback(() => {
    startGameWithPreset('fullStory');
  }, [startGameWithPreset]);

  const handleStartArcadeDemo = useCallback(() => {
    startGameWithPreset('arcadeSlice');
  }, [startGameWithPreset]);

  const handleLoadGame = useCallback(() => {
    useSessionPresetStore.getState().setPreset('fullStory');
    if (loadGameFromStore({ preset: 'fullStory' })) setPhase('game');
  }, [loadGameFromStore, setPhase]);

  const handleLoadDemoGame = useCallback(() => {
    useSessionPresetStore.getState().setPreset('arcadeSlice');
    if (loadGameFromStore({ preset: 'arcadeSlice' })) setPhase('game');
  }, [loadGameFromStore, setPhase]);

  const handleIntroComplete = useCallback(() => {
    /** Сразу комната + стол; в демо без 14-сек. кат-сцены до Заремы — квест стойки в `volodka_room`. */
    explorationNarrativeTeleport(INTRO_OPENING_SCENE_ID, { ...INTRO_OPENING_DESK_CHAIR });
    if (getActiveSessionPreset() === 'arcadeSlice') {
      useGamePhaseStore.getState().completeIntroCutscene();
    } else {
      useGamePhaseStore.getState().beginOpeningCutsceneAfterTextIntro();
    }
    setPhase('game');
  }, [setPhase]);

  return {
    hasSavedGame,
    hasDemoSave,
    handleLoadingReady,
    handleSaveGame,
    handleStartNewGame,
    handleStartArcadeDemo,
    handleLoadGame,
    handleLoadDemoGame,
    handleIntroComplete,
  };
}

export { FULL_STORY_SAVE_KEY };
