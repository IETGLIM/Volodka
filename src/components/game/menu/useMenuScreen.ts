import { useCallback, useMemo, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { audioEngine } from '@/engine/AudioEngine';
import { NEW_GAME_FADE_MS } from '@/engine/menu/menuConstants';
import { buildMenuItems, safePlayMenuSfx } from '@/engine/menu/menuPresentation';
import { useGameStore } from '@/store/gameStore';
import { getSavePresence, subscribeSavePresence } from '@/store/slices/saveStorage';

type MenuScreenActions = {
  loadGame: () => void;
  resetGame: () => void;
  musicEnabled: boolean;
  toggleMusic: () => void;
};

export function useMenuScreen({ loadGame, resetGame, musicEnabled, toggleMusic }: MenuScreenActions) {
  const hasSave = useSyncExternalStore(subscribeSavePresence, getSavePresence, () => false);

  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const menuItems = useMemo(() => buildMenuItems(hasSave), [hasSave]);

  const handleNewGame = useCallback((skipPrologue = false) => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'confirm');

    window.setTimeout(() => {
      try {
        // resetGame already leaves introActive=false / introSeen=true (no matrix poem).
        resetGame();
      } catch (error) {
        console.error('[MenuScreen] resetGame failed:', error);
        setIsFadingOut(false);
        return;
      }

      const store = useGameStore.getState();
      store.setMainMenuOpen(false);

      if (!skipPrologue) {
        // Prologue path: spawn in bed, play cinematic, then open 'start' node
        store.setCurrentNodeId('start');
        store.setPlayerPosition([0.5, 0.01, 2.4]);
        store.setPlayerRotation(Math.PI);
        store.setCutscene('intro_wakeup', []);
        // Canvas stays mounted under the menu (CSS-hidden). CinematicTimelineRunner
        // watches the live cutscene slice + canvas:first-frame / scene:loaded.
      } else {
        // Skip-prologue path: spawn at room center, show narrative intro
        store.openNarrativeOverlay('skip_prologue_intro', 'story');
      }
    }, NEW_GAME_FADE_MS);
  }, [isFadingOut, resetGame]);

  const handleContinue = useCallback(() => {
    if (!hasSave) return;
    safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'confirm');
    loadGame();
  }, [hasSave, loadGame]);

  const handleSettings = useCallback(() => {
    safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'ui_open');
    setShowSettings(true);
  }, []);

  const handleAbout = useCallback(() => {
    safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'ui_open');
    setShowAbout(true);
  }, []);

  const handleMenuAction = useCallback(
    (id: string) => {
      switch (id) {
        case 'new':
          handleNewGame();
          break;
        case 'continue':
          handleContinue();
          break;
        case 'settings':
          handleSettings();
          break;
        case 'about':
          handleAbout();
          break;
        default:
          break;
      }
    },
    [handleAbout, handleContinue, handleNewGame, handleSettings],
  );

  const closeAbout = useCallback(() => {
    setShowAbout(false);
    safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'ui_close');
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
    safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'ui_close');
  }, []);

  const navigationEnabled = !showAbout && !showSettings && !isFadingOut;

  return {
    hasSave,
    menuItems,
    showAbout,
    showSettings,
    isFadingOut,
    selectedIndex,
    setSelectedIndex,
    musicEnabled,
    toggleMusic,
    handleMenuAction,
    handleNewGame,
    closeAbout,
    closeSettings,
    navigationEnabled,
  };
}
