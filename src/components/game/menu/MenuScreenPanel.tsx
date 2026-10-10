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
import { ProloguePerfectionOverlay } from '@/components/game/prologue/ProloguePerfectionOverlay';
import { useMenuSavePreview } from '@/components/game/menu/useMenuSavePreview';
import { useMenuScreen } from '@/components/game/menu/useMenuScreen';
import {
  APP_BUILD,
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

/* ── Filmic title — «Ночная тетрадь»: тёплая бумага + фонарь-янтарь, лёгкий параллакс ──
 * v4.45.0: циановое свечение титра → тёплый фонарь; вес 500 (Cormorant самохостится). */
function AaaLuxTitle({ text, animate, visited }: { text: string; animate: boolean; visited: boolean }) {
  const reducedMotion = useEffectiveReducedMotion();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setParallax({
        x: ((e.clientX - cx) / cx) * 8,
        y: ((e.clientY - cy) / cy) * 5,
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [reducedMotion]);

  return (
    <div className="relative">
      <div
        className="absolute inset-0 blur-[52px] pointer-events-none opacity-50"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(226,168,75,0.10) 0%, rgba(157,179,200,0.07) 42%, transparent 74%)',
          transform: `translate(${parallax.x * 0.35}px, ${parallax.y * 0.35}px)`,
        }}
        aria-hidden
      />
      <motion.h1
        initial={animate && !reducedMotion ? { opacity: 0, y: 18, filter: 'blur(12px)', letterSpacing: '0.22em' } : { opacity: 1 }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)', letterSpacing: '0.12em' }}
        transition={{ duration: 0.9, delay: d(0.1, visited), ease: [0.16, 1, 0.3, 1] }}
        className="menu-lux-title relative font-serif text-[3.2rem] md:text-[5.6rem] lg:text-[7rem] font-medium tracking-[0.12em] leading-none select-none"
        style={{
          transform: `translate(${parallax.x}px, ${parallax.y}px)`,
          textShadow: '0 0 46px rgba(226,168,75,0.18), 0 0 120px rgba(157,179,200,0.10), 0 2px 0 rgba(0,0,0,0.75), 0 12px 28px rgba(0,0,0,0.55)',
          color: 'var(--vk-ink-hero, #f8f4eb)',
        }}
      >
        <span className="relative inline-block">
          {text}
          <span
            className="absolute inset-0 bg-gradient-to-b from-white/12 via-transparent to-transparent bg-clip-text text-transparent pointer-events-none"
            aria-hidden
          >
            {text}
          </span>
        </span>
      </motion.h1>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        transition={{ delay: d(0.7, visited), duration: 1.1 }}
        className="menu-lux-title-reflection pointer-events-none select-none font-serif text-[3.2rem] md:text-[5.6rem] lg:text-[7rem] font-medium tracking-[0.12em] leading-none scale-y-[-0.58] -mt-4 blur-[0.7px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.42)_0%,transparent_58%)]"
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
      className="game-critical-motion fixed inset-0 h-[100dvh] min-h-[100dvh] w-full bg-black overflow-hidden overscroll-none"
      style={{ zIndex: UI_LAYERS.LOADING }}
      data-testid="menu-screen"
    >
      <MenuBackgroundEffects fx={fx} tier={deviceTier} matrixRainEnabled={matrixRainEnabled} contentMotion={contentMotion} />

      {/* v4.45.0: нижний скрим — отделяет землю от неба, даёт глубину кадру
          (арт-ревью: «низ сливается в чёрную массу»). */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38vh] pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(5,7,12,0.62) 0%, rgba(5,7,12,0.28) 46%, transparent 100%)' }}
        aria-hidden
      />

      {/* v4.45.0: композиция «воздуха» — титр в верхней трети, панель ниже,
          низ экрана дышит ночным небом. m-auto заменён на поток с верхним
          отступом; на низких вьюпортах остаётся прокрутка. */}
      <div className="relative z-10 flex h-[100dvh] w-full flex-col items-center overflow-y-auto overscroll-contain px-4 pt-[9vh] pb-24 md:pt-[11vh]">
        <div className="flex w-full flex-col items-center">
          <div className="cinematic-menu-brand-stage flex flex-col items-center px-4">
            <AaaLuxTitle text={MENU_TITLE} animate={contentMotion} visited={visited} />
            <MenuTypewriterSubtitle text={MENU_SUBTITLE} delay={d(0.5, visited)} enabled={contentMotion} />

            {/* Теглайн + автор стихов — единый тихий блок (было два
                разрозненных motion.p с задержками 1.9/2.6с). */}
            <motion.div
              initial={contentMotion ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: d(0.8, visited), duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mt-4 flex flex-col items-center gap-1.5"
            >
              <p className="menu-compact-hide max-w-[34rem] text-center font-serif text-[15px] md:text-base tracking-[0.26em] leading-relaxed" style={{ color: 'rgba(210,205,192,0.78)' }}>
                {MENU_TAGLINE}
              </p>
              <p
                className="font-serif text-xs md:text-[13px] tracking-[0.24em] italic"
                style={{ color: 'var(--hud-filmic-ink-meta)' }}
              >
                {MENU_POET_CREDIT}
              </p>
            </motion.div>
          </div>

          <motion.div
            ref={menuRef}
            initial={contentMotion ? { opacity: 0, y: 16, filter: 'blur(4px)' } : false}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: d(0.7, visited), ease: [0.16, 1, 0.3, 1] }}
            className="menu-compact-tight mt-12 w-full max-w-[21rem]"
          >
            {/* Панель — материал «мутного стекла» задаётся единым скином
                (cinematic-menu-panel); янтарная нить по кромке — в ::before. */}
            <div className="relative overflow-hidden cinematic-menu-panel cinematic-menu-primary-nav py-3">
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

          {/* Посвящение — сердце игры, сразу под меню, тихой янтарной нитью */}
          <motion.div
            initial={contentMotion ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: d(1.1, visited), duration: 0.9 }}
            className="menu-compact-tight mt-10 flex flex-col items-center gap-2"
          >
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[rgba(226,168,75,0.35)] to-transparent" />
            <p className="font-serif text-xs sm:text-sm md:text-[15px] tracking-[0.18em] italic dedication-glow text-center max-w-[30rem] leading-relaxed px-4" style={{ color: 'rgba(234,228,214,0.82)' }}>
              {MENU_DEDICATION}
            </p>
          </motion.div>

          <motion.div
            initial={contentMotion ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: d(1.3, visited), duration: 0.7 }}
            className="mt-5 hidden md:flex menu-compact-hide flex-wrap items-center justify-center gap-x-5 gap-y-1.5"
            aria-hidden="true"
          >
            <span className="text-[10px] tracking-[0.24em] uppercase" style={{ color: 'rgba(169,166,152,0.55)' }}>↑↓ Навигация</span>
            <span className="w-px h-3 bg-white/10" />
            <span className="text-[10px] tracking-[0.24em] uppercase" style={{ color: 'rgba(169,166,152,0.55)' }}>Enter Выбрать</span>
            <span className="w-px h-3 bg-white/10 hidden md:block" />
            <span className="text-[10px] tracking-[0.24em] uppercase hidden md:block" style={{ color: 'rgba(169,166,152,0.4)' }}>Esc Назад</span>
          </motion.div>
        </div>
      </div>

      {/* v4.43.0: чипы живут в зоне единых CinematicBars (6vh/min 24px) —
          без пиксельной арифметики calc(max(7vh,36px)+12px) из v4.39.0,
          которая поднимала их над УДАЛЁННЫМ жёстким леттербоксом z-[60]. */}
      <motion.button
        type="button"
        initial={contentMotion ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: d(1.0, visited) }}
        onClick={() => {
          menu.toggleMusic();
          safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'click');
        }}
        className="absolute right-6 bottom-8 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 hover:border-[rgba(226,168,75,0.4)] hover:bg-black/50 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(226,168,75,0.5)]"
        style={{ color: 'rgba(169,166,152,0.8)' }}
        aria-label={menu.musicEnabled ? 'Выключить музыку' : 'Включить музыку'}
      >
        {menu.musicEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        <span className="text-[10px] font-medium tracking-[0.22em] uppercase hover:text-[rgba(234,228,214,0.95)]">
          {menu.musicEnabled ? 'Музыка' : 'Тишина'}
        </span>
      </motion.button>

      <motion.div
        initial={contentMotion ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: d(1.2, visited) }}
        className="absolute bottom-8 left-6 z-30 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/[0.07]"
        aria-hidden="true"
      >
        {/* v4.36.1: билд-метка «версия · sha» — видно, какой коммит играет. */}
        <span className="text-[10px] tracking-[0.18em]" style={{ color: 'rgba(169,166,152,0.55)' }}>v{APP_BUILD}</span>
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
              <div className="relative overflow-hidden rounded-[16px] border border-white/10 bg-gradient-to-b from-[rgba(18,22,31,0.92)] to-[rgba(10,12,18,0.94)] backdrop-blur-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(234,228,214,0.06)] px-6 py-6 text-center">
                <div className="absolute inset-x-[15%] top-0 h-px bg-gradient-to-r from-transparent via-[rgba(226,168,75,0.5)] to-transparent" aria-hidden />
                <p className="text-[11px] tracking-[0.34em] uppercase mb-3" style={{ color: 'rgba(169,166,152,0.7)' }}>Начало</p>
                <p className="font-serif text-2xl tracking-[0.12em] mb-3" style={{ color: 'rgba(234,228,214,0.95)' }}>Новая игра</p>
                <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(169,166,152,0.8)' }}>Пройти вступление с пробуждением и первыми шагами или сразу выйти в город?</p>
                <div className="flex flex-col gap-2">
                  <button type="button" data-testid="menu-start-prologue" onClick={handleDialogStartPrologue} className="group relative overflow-hidden rounded-[10px] border border-[rgba(226,168,75,0.35)] hover:border-[rgba(226,168,75,0.6)] hover:bg-[rgba(226,168,75,0.08)] py-3 px-4 text-[13px] font-medium tracking-[0.14em] transition-all duration-300" style={{ color: 'rgba(234,228,214,0.95)' }}>
                    Начать с пролога
                  </button>
                  <button type="button" data-testid="menu-skip-prologue" onClick={handleDialogSkipPrologue} className="rounded-[10px] border border-white/10 hover:border-white/20 hover:bg-white/[0.04] py-3 px-4 text-[13px] tracking-[0.14em] transition-all duration-300" style={{ color: 'rgba(169,166,152,0.85)' }}>
                    Пропустить пролог
                  </button>
                  <button type="button" onClick={handleDialogClose} className="rounded-[10px] border border-transparent hover:border-white/10 py-2.5 px-4 text-[12px] tracking-[0.16em] transition-all duration-300 mt-1" style={{ color: 'rgba(130,128,118,0.75)' }}>
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
