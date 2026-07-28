import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MenuAboutPanel } from '@/components/game/menu/MenuAboutPanel';
import { MenuBackgroundEffects } from '@/components/game/menu/MenuBackgroundEffects';
import { MenuGlitchTitle } from '@/components/game/menu/MenuGlitchTitle';
import { MenuNavigationList } from '@/components/game/menu/MenuNavigationList';
import { MenuSettingsPanel } from '@/components/game/menu/MenuSettingsPanel';
import { MenuTypewriterSubtitle } from '@/components/game/menu/MenuTypewriterSubtitle';
import { useMenuSavePreview } from '@/components/game/menu/useMenuSavePreview';
import { useMenuScreen } from '@/components/game/menu/useMenuScreen';
import {
  APP_VERSION,
  MENU_DEDICATION,
  MENU_POET_CREDIT,
  MENU_SUBTITLE,
  MENU_TAGLINE,
  MENU_TITLE,
} from '@/engine/menu/menuConstants';
import { getMenuScreenFx } from '@/engine/menu/menuFxTier';
import { safePlayMenuSfx } from '@/engine/menu/menuPresentation';
import { audioEngine } from '@/engine/AudioEngine';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { useMenuNavigation } from '@/hooks/useMenuNavigation';
import { useMenuScreenActions, useMenuVisualToggles } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ── Visit tracking ── */
const MENU_VISITED_KEY = 'volodka_menu_visited';

function checkHasVisitedBefore(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MENU_VISITED_KEY) === 'true';
}

function markMenuVisited(): void {
  try { localStorage.setItem(MENU_VISITED_KEY, 'true'); } catch { /* ignore */ }
}

/** Reduce animation delays by 60% on repeat visits */
function d(baseDelay: number, visited: boolean): number {
  return visited ? baseDelay * 0.4 : baseDelay;
}

function MenuScreenPanelInner() {
  const actions = useMenuScreenActions();
  const { matrixRainEnabled } = useMenuVisualToggles();
  const reducedMotion = useEffectiveReducedMotion();
  const deviceTier = useDeviceTier();
  const fx = getMenuScreenFx(deviceTier, reducedMotion);
  const menuRef = useRef<HTMLDivElement>(null);

  // Track repeat visits to reduce animation delays
  const [visited] = useState(checkHasVisitedBefore);

  // New Game confirmation dialog
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);

  // Mark this visit on mount
  useEffect(() => {
    markMenuVisited();
  }, []);

  const menu = useMenuScreen(actions);
  const savePreview = useMenuSavePreview(menu.hasSave);

  useMenuNavigation({
    items: menu.menuItems,
    selectedIndex: menu.selectedIndex,
    setSelectedIndex: menu.setSelectedIndex,
    onSelect: menu.handleMenuAction,
    enabled: menu.navigationEnabled && !showNewGameDialog,
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showNewGameDialog) {
        setShowNewGameDialog(false);
        safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'ui_close');
        return;
      }
      if (event.key !== 'Escape') return;
      if (menu.showAbout) menu.closeAbout();
      else if (menu.showSettings) menu.closeSettings();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [menu.showAbout, menu.showSettings, menu.closeAbout, menu.closeSettings, showNewGameDialog]);

  const contentMotion = fx.contentMotion && !reducedMotion;

  const wrappedHandleMenuAction = useCallback(
    (id: string) => {
      if (showNewGameDialog) return;
      if (id === 'new') {
        setShowNewGameDialog(true);
        safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'ui_open');
        return;
      }
      menu.handleMenuAction(id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- method refs already in deps
    [showNewGameDialog, menu.handleMenuAction],
  );

  const handleDialogStartPrologue = useCallback(() => {
    setShowNewGameDialog(false);
    menu.handleNewGame(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- method refs already in deps
  }, [menu.handleNewGame]);

  const handleDialogSkipPrologue = useCallback(() => {
    setShowNewGameDialog(false);
    menu.handleNewGame(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- method refs already in deps
  }, [menu.handleNewGame]);

  const handleDialogClose = useCallback(() => {
    setShowNewGameDialog(false);
    safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'ui_close');
  }, []);

  return (
    <div
      className="game-critical-motion digital-noise fixed inset-0 h-[100dvh] min-h-[100dvh] w-full bg-black overflow-hidden overscroll-none"
      style={{ zIndex: UI_LAYERS.LOADING }}
      data-testid="menu-screen"
    >
      <MenuBackgroundEffects
        fx={fx}
        tier={deviceTier}
        matrixRainEnabled={matrixRainEnabled}
        contentMotion={contentMotion}
      />

      <div className="relative z-10 flex min-h-[100dvh] w-full flex-col items-center justify-center p-4">
        <MenuGlitchTitle text={MENU_TITLE} animate={fx.titleGlitch} parallax={fx.titleParallax} />
        <MenuTypewriterSubtitle text={MENU_SUBTITLE} delay={d(1, visited)} enabled={contentMotion} />

        <motion.p
          initial={contentMotion ? { opacity: 0, y: 5 } : false}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ delay: d(1.8, visited), duration: 1.2 }}
          className="mt-1 font-serif text-sm md:text-base tracking-[0.15em] text-slate-300/70"
        >
          {MENU_TAGLINE}
        </motion.p>

        <motion.p
          initial={contentMotion ? { opacity: 0, y: 5 } : false}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ delay: d(2.5, visited), duration: 1.2 }}
          className="mt-2 font-serif text-xs md:text-sm tracking-[0.2em] italic text-slate-400/60"
        >
          {MENU_POET_CREDIT}
        </motion.p>

        <motion.div
          initial={contentMotion ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: d(3, visited), duration: 1.8 }}
          className="mt-4 flex flex-col items-center gap-2"
        >
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-stone-400/30 to-transparent" />
          <p className="font-serif text-xs sm:text-sm md:text-base tracking-[0.15em] italic dedication-glow text-stone-300/75">
            {MENU_DEDICATION}
          </p>
        </motion.div>

        <motion.div
          ref={menuRef}
          initial={contentMotion ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: d(1.8, visited) }}
          className="mt-8 w-full max-w-xs"
        >
          <div
            className="relative border border-cyan-500/20 bg-black/60 backdrop-blur-md overflow-hidden hex-grid-bg menu-corner-brackets"
            style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
          >
            <div className="menu-corner-bracket-pair" aria-hidden="true" />
            <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-3 py-2">
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-500/30">volodka://main</span>
            </div>
            <MenuNavigationList
              items={menu.menuItems}
              selectedIndex={menu.selectedIndex}
              setSelectedIndex={menu.setSelectedIndex}
              onSelect={wrappedHandleMenuAction}
              savePreview={savePreview}
              contentMotion={contentMotion}
              fastAnimation={visited}
            />
          </div>
        </motion.div>

        <motion.div
          initial={contentMotion ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: d(3.5, visited), duration: 1 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5"
          aria-hidden="true"
        >
          <span className="text-[10px] text-slate-400/70 font-mono">↑↓ Навигация</span>
          <span className="text-[10px] text-slate-400/70 font-mono">Enter Выбрать</span>
        </motion.div>
      </div>

      <motion.button
        type="button"
        initial={contentMotion ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: d(2, visited) }}
        onClick={() => {
          menu.toggleMusic();
          safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'click');
        }}
        className="absolute bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-sm border border-cyan-500/30 bg-black/50 backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/70"
        aria-label={menu.musicEnabled ? 'Выключить музыку' : 'Включить музыку'}
      >
        {menu.musicEnabled ? (
          <Volume2 className="w-4 h-4 text-cyan-400/70" />
        ) : (
          <VolumeX className="w-4 h-4 text-slate-500/60" />
        )}
        <span className="font-mono text-[9px] uppercase tracking-widest text-cyan-500/50">
          {menu.musicEnabled ? 'ON' : 'OFF'}
        </span>
      </motion.button>

      <motion.div
        initial={contentMotion ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: d(2.5, visited) }}
        className="absolute bottom-6 right-6 z-30"
        aria-hidden="true"
      >
        <span className="font-mono text-[10px] text-cyan-400/50">v{APP_VERSION}</span>
      </motion.div>

      <AnimatePresence>
        {menu.showAbout ? <MenuAboutPanel onClose={menu.closeAbout} /> : null}
      </AnimatePresence>

      <AnimatePresence>
        {menu.showSettings ? (
          <MenuSettingsPanel
            musicEnabled={menu.musicEnabled}
            onToggleMusic={menu.toggleMusic}
            onClose={menu.closeSettings}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showNewGameDialog ? (
          <motion.div
            key="new-game-dialog-backdrop"
            className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            style={{ zIndex: UI_LAYERS.MENU }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleDialogClose}
          >
            <motion.div
              key="new-game-dialog"
              className="w-full max-w-xs mx-4"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="relative border border-cyan-500/30 bg-black/80 backdrop-blur-md overflow-hidden"
                style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}
              >
                {/* Header */}
                <div className="flex items-center gap-2 border-b border-cyan-500/20 bg-black/50 px-3 py-2">
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-500/40">volodka://new-game</span>
                </div>

                {/* Body */}
                <div className="px-4 pt-4 pb-2">
                  <p className="font-mono text-sm text-cyan-200/90 tracking-wide mb-1">
                    Новая игра
                  </p>
                  <p className="font-mono text-xs text-slate-400/80 leading-relaxed">
                    Запустить пролог с cinematic-вступлением или перейти сразу к gameplay?
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2 px-4 pt-2 pb-4">
                  <button
                    type="button"
                    onClick={handleDialogStartPrologue}
                    className="w-full px-4 py-2.5 font-mono text-xs tracking-[0.15em] uppercase
                               text-cyan-200/90 border border-cyan-500/30 bg-cyan-500/5
                               hover:bg-cyan-500/15 hover:border-cyan-400/50
                               rounded-sm transition-all duration-200
                               active:bg-cyan-400/20 active:scale-[0.98]
                               touch-manipulation select-none"
                  >
                    Начать с пролога
                  </button>
                  <button
                    type="button"
                    onClick={handleDialogSkipPrologue}
                    className="w-full px-4 py-2.5 font-mono text-xs tracking-[0.15em] uppercase
                               text-slate-400/80 border border-slate-500/20 bg-transparent
                               hover:bg-slate-500/10 hover:border-slate-400/40 hover:text-slate-300/90
                               rounded-sm transition-all duration-200
                               active:bg-slate-400/15 active:scale-[0.98]
                               touch-manipulation select-none"
                  >
                    Пропустить пролог
                  </button>
                  <button
                    type="button"
                    onClick={handleDialogClose}
                    className="w-full px-4 py-1.5 font-mono text-[10px] tracking-wider uppercase
                               text-slate-500/60 hover:text-slate-400/80
                               transition-colors duration-200
                               touch-manipulation select-none"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {menu.isFadingOut ? (
          <motion.div
            key="menu-fadeout"
            className="fixed inset-0 bg-black"
            style={{ zIndex: UI_LAYERS.PANEL }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function MenuScreenPanel() {
  return (
    <ErrorBoundary name="menu-screen" fallback={null}>
      <MenuScreenPanelInner />
    </ErrorBoundary>
  );
}