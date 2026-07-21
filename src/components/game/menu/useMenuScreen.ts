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
        resetGame();
      } catch (error) {
        console.error('[MenuScreen] resetGame failed:', error);
        setIsFadingOut(false);
        return;
      }

      const store = useGameStore.getState();
      store.setCurrentNodeId('start');
      store.setIntroSeen(true);
      store.setPlayerPosition([0.5, 0.01, 2.4]);
      store.setPlayerRotation(Math.PI);
      store.setMainMenuOpen(false);
      store.setIntroActive(false);
      if (!skipPrologue) {
        store.setCutscene('intro_wakeup', []);
        // Don't emit intro:wakeup_sequence here — the 3D canvas hasn't mounted
        // yet. The CinematicTimelineRunner will detect activeCutsceneId ===
        // 'intro_wakeup' after canvas:first-frame and start the timeline then.
        // This fixes the "character flying above the floor" bug where the
        // RigidBody doesn't exist yet when the timeline sets player position.
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
