import { useCallback, useMemo, useState, startTransition } from 'react';
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
  // SkipPrologueOverlay — 3-page typewriter before skip_prologue_intro node
  const [showSkipPrologueOverlay, setShowSkipPrologueOverlay] = useState(false);
  // ProloguePerfection — идеальный старт "С пролога": boot console + breath + eye + title + handoff
  const [showProloguePerfection, setShowProloguePerfection] = useState(false);

  const menuItems = useMemo(() => buildMenuItems(hasSave), [hasSave]);

  // Внутренний хелпер — финальный спавн кровати + intro_wakeup cutscene
  const spawnPrologueCinematic = useCallback(() => {
    try {
      resetGame();
    } catch (error) {
      console.error('[MenuScreen] resetGame failed:', error);
      setIsFadingOut(false);
      setShowProloguePerfection(false);
      return;
    }

    const store = useGameStore.getState();
    store.setMainMenuOpen(false);
    store.setCurrentNodeId('start');
    store.setPlayerPosition([1.78, 0.35, 2.05]);
    store.setPlayerRotation(Math.PI);
    store.setCutscene('intro_wakeup', []);
  }, [resetGame]);

  const handleNewGame = useCallback(
    (skipPrologue = false) => {
      if (isFadingOut) return;
      setIsFadingOut(true);
      // FIX S15-MUSIC: явно резюмим AudioContext на user gesture — Chrome требует
      // иначе ambientEngine и AudioEngine остаются suspended и музыка отсутствует
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = (window as any).__VOLODKA_AUDIO_CTX__ as { resume?: () => void } | undefined;
        mod?.resume?.();
      } catch {}
      // Sync SFX on the gesture (cheap) — keep the click responsive.
      safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'confirm');
      // Defer the heavy dynamic imports + AudioContext resume to a microtask so
      // they don't block the pointer event's INP. The browser can paint the
      // fade-out immediately, then we resume audio + preload chunks off the
      // critical interaction path.
      queueMicrotask(() => {
        try {
          import('@/engine/SharedAudioContext').then(({ getSharedAudioContext, whenAudioReady }) => {
            const ctx = getSharedAudioContext();
            ctx?.resume?.();
            whenAudioReady(() => {
              import('@/engine/audio/AudioEngine').then(({ audioEngine }) => {
                audioEngine.playSfx('confirm');
              });
            });
          });
        } catch {}
      });

      window.setTimeout(() => {
        setIsFadingOut(false);

        if (!skipPrologue) {
          // startTransition: the prologue overlay mounts a heavy Suspense +
          // typewriter + audio preload. Marking it non-urgent lets the browser
          // paint the menu fade-out first, then mount the overlay without
          // blocking the original pointer event's INP.
          startTransition(() => {
            setShowProloguePerfection(true);
          });
        } else {
          startTransition(() => {
            setShowSkipPrologueOverlay(true);
          });
        }
      }, NEW_GAME_FADE_MS);
    },
    [isFadingOut],
  );

  const handleProloguePerfectionComplete = useCallback(() => {
    setShowProloguePerfection(false);
    // Небольшая пауза для красивого fade в cinematic — 180ms
    window.setTimeout(() => {
      spawnPrologueCinematic();
    }, 180);
  }, [spawnPrologueCinematic]);

  const handleSkipPrologueComplete = useCallback(() => {
    setShowSkipPrologueOverlay(false);
    try {
      resetGame();
    } catch (e) {
      console.error('[MenuScreen] resetGame failed on skip:', e);
      return;
    }
    const store = useGameStore.getState();
    store.setMainMenuOpen(false);
    store.openNarrativeOverlay('skip_prologue_intro', 'story');
  }, [resetGame]);

  const handleContinue = useCallback(() => {
    if (!hasSave) return;
    safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'confirm');
    loadGame();
  }, [hasSave, loadGame]);

  const handleSettings = useCallback(() => {
    safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'ui_open');
    startTransition(() => {
      setShowSettings(true);
    });
  }, []);

  const handleAbout = useCallback(() => {
    safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'ui_open');
    startTransition(() => {
      setShowAbout(true);
    });
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

  const navigationEnabled =
    !showAbout && !showSettings && !isFadingOut && !showSkipPrologueOverlay && !showProloguePerfection;

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
    showSkipPrologueOverlay,
    handleSkipPrologueComplete,
    showProloguePerfection,
    handleProloguePerfectionComplete,
  };
}
