import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

  /* v4.48 «Разворот тетради»: пункт «Продолжить» существует ТОЛЬКО при
     наличии сохранения — на первом запуске меню из трёх строк честнее
     и тише, чем список с мёртвой строкой «нет сохранения». */
  const visibleMenuItems = useMemo(
    () => menu.menuItems.filter((item) => item.id !== 'continue' || menu.hasSave),
    [menu.menuItems, menu.hasSave],
  );

  useMenuNavigation({
    items: visibleMenuItems,
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

      {/* v4.45.0: нижний скрим — отделяет землю от неба, даёт глубину кадру. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38vh] pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(5,7,12,0.62) 0%, rgba(5,7,12,0.28) 46%, transparent 100%)' }}
        aria-hidden
      />

      {/* ─── v4.48 «Разворот тетради» ───
          Две страницы разворота на фоне ночного города:
          левая — титр, подзаголовок, посвящение (тихая зона);
          правая — «наборные строки» меню (зона действий).
          Один герой-акцент: янтарная нить выбранной строки.
          Вся остальная типографика молчит. */}
      <div className="relative z-10 h-[100dvh] w-full overflow-y-auto overscroll-contain">
        <div className="menu-notebook-grid mx-auto grid min-h-full w-full max-w-6xl grid-cols-1 content-center items-center gap-10 px-5 py-[10vh] sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-14">
          {/* Левая страница: бренд-зона */}
          <div className="cinematic-menu-brand-stage flex flex-col items-center lg:items-start lg:text-left">
            <AaaLuxTitle text={MENU_TITLE} animate={contentMotion} visited={visited} />
            <MenuTypewriterSubtitle text={MENU_SUBTITLE} delay={d(0.5, visited)} enabled={contentMotion} />

            {/* Теглайн + автор стихов — единый тихий блок */}
            <motion.div
              initial={contentMotion ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: d(0.8, visited), duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 flex flex-col items-center gap-1.5 lg:items-start"
            >
              <p className="menu-compact-hide max-w-[30rem] text-center font-serif text-[15px] md:text-base tracking-[0.22em] leading-relaxed lg:text-left" style={{ color: 'rgba(210,205,192,0.72)' }}>
                {MENU_TAGLINE}
              </p>
              <p
                className="font-serif text-xs md:text-[13px] tracking-[0.22em] italic"
                style={{ color: 'var(--hud-filmic-ink-meta)' }}
              >
                {MENU_POET_CREDIT}
              </p>
            </motion.div>

            {/* Посвящение — сердце игры. Тихая янтарная нить над строкой. */}
            <motion.div
              initial={contentMotion ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: d(1.1, visited), duration: 0.9 }}
              className="menu-compact-tight mt-10 flex flex-col items-center gap-2 lg:mt-20 lg:items-start"
            >
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-[rgba(226,168,75,0.35)] to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[rgba(226,168,75,0.35)] lg:to-[rgba(226,168,75,0.1)]" />
              <p className="font-serif text-xs sm:text-sm md:text-[15px] tracking-[0.16em] italic dedication-glow text-center max-w-[28rem] leading-relaxed lg:text-left" style={{ color: 'rgba(234,228,214,0.78)' }}>
                {MENU_DEDICATION}
              </p>
            </motion.div>
          </div>

          {/* Правая страница: строки-действия */}
          <motion.div
            ref={menuRef}
            initial={contentMotion ? { opacity: 0, y: 16, filter: 'blur(4px)' } : false}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: d(0.7, visited), ease: [0.16, 1, 0.3, 1] }}
            className="menu-compact-tight w-full max-w-[23rem] justify-self-center lg:justify-self-end"
          >
            <div className="relative overflow-hidden cinematic-menu-panel cinematic-menu-primary-nav py-4">
              <MenuNavigationList
                items={visibleMenuItems}
                selectedIndex={menu.selectedIndex}
                setSelectedIndex={menu.setSelectedIndex}
                onSelect={wrappedHandleMenuAction}
                savePreview={savePreview}
                contentMotion={contentMotion}
                fastAnimation={visited}
              />
            </div>

            {/* Единственная строка управления — вместо колонки из трёх подсказок */}
            <motion.p
              initial={contentMotion ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ delay: d(1.3, visited), duration: 0.7 }}
              className="mt-4 hidden text-center text-[10px] tracking-[0.3em] uppercase md:block menu-compact-hide lg:text-left"
              style={{ color: 'rgba(169,166,152,0.4)' }}
              aria-hidden="true"
            >
              ↑↓ · Enter · Esc
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Билд-метка — единственный чип меню (музыка переехала в настройки:
          v4.48 убирает дубль управления) */}
      <motion.div
        initial={contentMotion ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: d(1.2, visited) }}
        className="absolute bottom-6 left-6 z-30 px-2.5 py-1"
        aria-hidden="true"
      >
        <span className="text-[10px] tracking-[0.18em]" style={{ color: 'rgba(169,166,152,0.38)' }}>v{APP_BUILD}</span>
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
