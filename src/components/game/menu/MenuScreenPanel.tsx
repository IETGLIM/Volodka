import { useCallback, useEffect, useRef, useState, startTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MenuAboutPanel } from '@/components/game/menu/MenuAboutPanel';
import { MenuBackgroundEffects } from '@/components/game/menu/MenuBackgroundEffects';
import { MenuNavigationList } from '@/components/game/menu/MenuNavigationList';
import { MenuSettingsPanel } from '@/components/game/menu/MenuSettingsPanel';
import { MenuTypewriterSubtitle } from '@/components/game/menu/MenuTypewriterSubtitle';
import { SkipPrologueOverlay } from '@/components/game/menu/SkipPrologueOverlay';
import { MenuAaaPoemSpotlight } from '@/components/game/menu/MenuAaaPoemSpotlight';
import { ProloguePerfectionOverlay } from '@/components/game/prologue/ProloguePerfectionOverlay';
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

/* ── AAA Lux Title — filmi serif with light bleed, volumetric glow ── */
function AaaLuxTitle({ text, animate, visited }: { text: string; animate: boolean; visited: boolean }) {
  const reducedMotion = useEffectiveReducedMotion();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setParallax({
        x: ((e.clientX - cx) / cx) * 10,
        y: ((e.clientY - cy) / cy) * 6,
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [reducedMotion]);

  return (
    <div className="relative">
      <div
        className="absolute inset-0 blur-[52px] pointer-events-none opacity-70"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,255,255,0.16) 0%, rgba(255,180,80,0.08) 38%, transparent 72%)',
          transform: `translate(${parallax.x * 0.35}px, ${parallax.y * 0.35}px)`,
        }}
        aria-hidden
      />
      <motion.h1
        initial={animate && !reducedMotion ? { opacity: 0, y: 22, filter: 'blur(14px)', letterSpacing: '0.3em' } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)', letterSpacing: '0.18em' }}
        transition={{ duration: 2.4, delay: d(0.15, visited), ease: [0.16, 1, 0.3, 1] }}
        className="relative font-serif text-[3.2rem] md:text-[5.6rem] lg:text-[7.2rem] font-[280] tracking-[0.18em] leading-none select-none"
        style={{
          transform: `translate(${parallax.x}px, ${parallax.y}px)`,
          textShadow: '0 0 44px rgba(0,255,255,0.26), 0 0 140px rgba(255,200,100,0.14), 0 2px 0 rgba(0,0,0,0.75), 0 12px 28px rgba(0,0,0,0.55)',
          color: 'rgb(236, 239, 237)',
        }}
      >
        <span className="relative inline-block">
          {text}
          <span
            className="absolute inset-0 bg-gradient-to-b from-white/14 via-transparent to-transparent bg-clip-text text-transparent pointer-events-none"
            aria-hidden
          >
            {text}
          </span>
        </span>
      </motion.h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.11 }}
        transition={{ delay: d(1.5, visited), duration: 1.4 }}
        className="pointer-events-none select-none font-serif text-[3.2rem] md:text-[5.6rem] lg:text-[7.2rem] font-[280] tracking-[0.18em] leading-none scale-y-[-0.58] -mt-4 blur-[0.7px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.42)_0%,transparent_58%)]"
        aria-hidden
      >
        {text}
      </motion.div>
    </div>
  );
}

function MenuScreenPanelInner() {
  const actions = useMenuScreenActions();
  const { matrixRainEnabled } = useMenuVisualToggles();
  const reducedMotion = useEffectiveReducedMotion();
  const deviceTier = useDeviceTier();
  const fx = getMenuScreenFx(deviceTier, reducedMotion);
  const menuRef = useRef<HTMLDivElement>(null);

  const [visited] = useState(checkHasVisitedBefore);
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);

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
  }, [menu.showAbout, menu.showSettings, menu.closeAbout, menu.closeSettings, showNewGameDialog]);

  const contentMotion = fx.contentMotion && !reducedMotion;

  const wrappedHandleMenuAction = useCallback(
    (id: string) => {
      if (showNewGameDialog) return;
      if (id === 'new') {
        // startTransition: the dialog mounts a motion.div with backdrop-blur +
        // blur filter animation (very expensive — forces re-rasterize per frame).
        // Marking it non-urgent lets the browser paint the menu click feedback
        // first, then mount the dialog without blocking the pointer event's INP.
        startTransition(() => {
          setShowNewGameDialog(true);
        });
        safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'ui_open');
        return;
      }
      menu.handleMenuAction(id);
    },
    [showNewGameDialog, menu.handleMenuAction],
  );

  const handleDialogStartPrologue = useCallback(() => {
    setShowNewGameDialog(false);
    menu.handleNewGame(false);
  }, [menu.handleNewGame]);

  const handleDialogSkipPrologue = useCallback(() => {
    setShowNewGameDialog(false);
    menu.handleNewGame(true);
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
      <MenuBackgroundEffects fx={fx} tier={deviceTier} matrixRainEnabled={matrixRainEnabled} contentMotion={contentMotion} />

      {/* AAA layered vignette + film grain */}
      <div className="absolute inset-0 pointer-events-none z-[5] opacity-[0.06] mix-blend-soft-light" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} aria-hidden />
      <div className="absolute inset-0 pointer-events-none z-[6] bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.55)_100%)]" aria-hidden />

      <div className="relative z-10 flex min-h-[100dvh] w-full flex-col items-center justify-center p-4">
        <div className="cinematic-menu-brand-stage flex flex-col items-center px-4">
          <AaaLuxTitle text={MENU_TITLE} animate={contentMotion} visited={visited} />
          <MenuTypewriterSubtitle text={MENU_SUBTITLE} delay={d(1, visited)} enabled={contentMotion} />

          <motion.p
            initial={contentMotion ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 0.76, y: 0 }}
            transition={{ delay: d(1.9, visited), duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 max-w-[32rem] text-center font-serif text-sm md:text-[15px] tracking-[0.22em] text-stone-300/70 leading-relaxed"
          >
            {MENU_TAGLINE}
          </motion.p>

          <motion.p
            initial={contentMotion ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 0.62, y: 0 }}
            transition={{ delay: d(2.6, visited), duration: 1.2 }}
            className="mt-3 font-serif text-xs md:text-[13px] tracking-[0.24em] italic"
            style={{ color: 'var(--hud-filmic-ink-meta)' }}
          >
            {MENU_POET_CREDIT}
          </motion.p>
        </div>

        <motion.div
          initial={contentMotion ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: d(3, visited), duration: 1.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 flex flex-col items-center gap-2"
        >
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-200/30 to-transparent" />
          <p className="font-serif text-xs sm:text-sm md:text-[15px] tracking-[0.18em] italic dedication-glow text-stone-200/85 text-center max-w-[30rem] leading-relaxed px-4">
            {MENU_DEDICATION}
          </p>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-200/22 to-transparent" />
        </motion.div>

        <div className="hud-filmic-divider mt-3" aria-hidden style={{ width: '20rem', opacity: 0.7 }} />

        <motion.div
          ref={menuRef}
          initial={contentMotion ? { opacity: 0, y: 22, filter: 'blur(6px)' } : false}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: d(2.0, visited), ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 w-full max-w-[24rem]"
        >
          <div className="relative overflow-hidden cinematic-menu-panel cinematic-menu-primary-nav hud-filmic-menu backdrop-blur-[20px] bg-gradient-to-b from-black/45 to-black/60 border border-stone-600/20 shadow-[0_12px_48px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.6)] rounded-[14px]">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.05] via-transparent to-transparent" aria-hidden />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />
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
          transition={{ delay: d(3.8, visited), duration: 1 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5"
          aria-hidden="true"
        >
          <span className="font-serif text-[10px] tracking-[0.24em] text-stone-500/70">↑↓ Навигация</span>
          <span className="w-px h-3 bg-stone-700/30" />
          <span className="font-serif text-[10px] tracking-[0.24em] text-stone-500/70">Enter Выбрать</span>
          <span className="w-px h-3 bg-stone-700/30 hidden md:block" />
          <span className="font-serif text-[10px] tracking-[0.24em] text-stone-500/50 hidden md:block">Esc Назад</span>
        </motion.div>
      </div>

      <MenuAaaPoemSpotlight enabled={contentMotion} />

      <motion.button
        type="button"
        initial={contentMotion ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: d(2.2, visited) }}
        onClick={() => {
          menu.toggleMusic();
          safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'click');
        }}
        className="absolute bottom-8 right-6 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-stone-700/20 text-stone-400/70 hover:text-stone-100/90 hover:bg-black/50 hover:border-stone-600/30 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-300/50"
        aria-label={menu.musicEnabled ? 'Выключить музыку' : 'Включить музыку'}
      >
        {menu.musicEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        <span className="font-serif text-[10px] tracking-[0.2em] uppercase">
          {menu.musicEnabled ? 'Музыка' : 'Тишина'}
        </span>
      </motion.button>

      <motion.div
        initial={contentMotion ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: d(2.6, visited) }}
        className="absolute bottom-8 left-6 z-30 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-md border border-stone-800/30"
        aria-hidden="true"
      >
        <span className="font-serif text-[10px] tracking-[0.18em] text-stone-500/70">v{APP_VERSION}</span>
      </motion.div>

      <AnimatePresence>{menu.showAbout ? <MenuAboutPanel onClose={menu.closeAbout} /> : null}</AnimatePresence>
      <AnimatePresence>
        {menu.showSettings ? (
          <MenuSettingsPanel musicEnabled={menu.musicEnabled} onToggleMusic={menu.toggleMusic} onClose={menu.closeSettings} />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showNewGameDialog ? (
          <motion.div
            key="new-game-dialog-backdrop"
            className="fixed inset-0 flex items-center justify-center bg-black/75 backdrop-blur-[12px]"
            style={{ zIndex: UI_LAYERS.MENU }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleDialogClose}
          >
            <motion.div
              key="new-game-dialog"
              className="w-full max-w-[22rem] mx-4"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative overflow-hidden rounded-[16px] border border-stone-600/20 bg-gradient-to-b from-zinc-900/90 to-black/90 backdrop-blur-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.07)] px-6 py-6 text-center">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06)_0%,transparent_60%)]" aria-hidden />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />
                <p className="font-serif text-[11px] tracking-[0.34em] uppercase mb-3 text-stone-500/80">Начало</p>
                <p className="font-serif text-2xl tracking-[0.14em] text-stone-100/90 mb-3">Новая игра</p>
                <p className="font-serif text-sm text-stone-400/70 leading-relaxed mb-6">Пройти вступление с пробуждением и первыми шагами или сразу выйти в город?</p>
                <div className="flex flex-col gap-2">
                  <button type="button" data-testid="menu-start-prologue" onClick={handleDialogStartPrologue} className="group relative overflow-hidden rounded-[10px] bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 hover:border-white/15 py-3 px-4 text-stone-100/90 font-serif text-[13px] tracking-[0.12em] transition-all duration-300">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden />
                    Начать с пролога
                  </button>
                  <button type="button" data-testid="menu-skip-prologue" onClick={handleDialogSkipPrologue} className="rounded-[10px] bg-black/30 hover:bg-white/[0.04] border border-stone-700/30 hover:border-stone-600/40 py-3 px-4 text-stone-300/80 font-serif text-[13px] tracking-[0.12em] transition-all duration-300">
                    Пропустить пролог
                  </button>
                  <button type="button" onClick={handleDialogClose} className="rounded-[10px] bg-transparent hover:bg-white/[0.03] border border-transparent hover:border-stone-800/40 py-2.5 px-4 text-stone-500/70 hover:text-stone-400/80 font-serif text-[12px] tracking-[0.16em] transition-all duration-300 mt-1">
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
          <motion.div key="menu-fadeout" className="fixed inset-0 bg-black" style={{ zIndex: UI_LAYERS.PANEL }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} aria-hidden="true" />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>{menu.showSkipPrologueOverlay ? <SkipPrologueOverlay onComplete={menu.handleSkipPrologueComplete} /> : null}</AnimatePresence>
      <AnimatePresence>
        {menu.showProloguePerfection ? (
          <ProloguePerfectionOverlay onComplete={menu.handleProloguePerfectionComplete} />
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
