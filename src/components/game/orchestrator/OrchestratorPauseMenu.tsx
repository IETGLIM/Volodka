import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useGameStore } from '@/store/gameStore';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import type { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { FilmGrain, CinematicBars } from '@/components/game/cinematic';
import { PanelStackSlot, usePanelStack } from './PanelStackContext';
import { useOrchestratorShell } from '@/store/selectors';
import type { PanelCoordinatorResult } from './usePanelCoordinator';
import type { PanelCloseHandlers } from './useStablePanelClosers';

type Props = {
  pauseDialog: ReturnType<typeof usePanelDialog>;
  panels: Pick<PanelCoordinatorResult, 'dispatchPanel' | 'closeAllPanels' | 'closePanelByType'>;
  onClose: PanelCloseHandlers;
};

const PAUSE_ACTIONS: Array<{
  id: string;
  label: string;
  tone?: 'danger' | 'muted';
  run: (ctx: {
    dispatchPanel: PanelCoordinatorResult['dispatchPanel'];
    closeAllPanels: PanelCoordinatorResult['closeAllPanels'];
    closePanelByType: PanelCoordinatorResult['closePanelByType'];
  }) => void;
}> = [
  {
    id: 'quick-save',
    label: 'Быстрое сохранение',
    run: ({ closeAllPanels }) => {
      useGameStore.getState().saveGame({ source: 'manual' });
      closeAllPanels();
    },
  },
  {
    id: 'saves',
    label: 'Управление сохранениями',
    run: ({ dispatchPanel }) => dispatchPanel('saveSlot'),
  },
  {
    id: 'load',
    label: 'Загрузить',
    run: ({ closeAllPanels }) => {
      useGameStore.getState().loadGame();
      closeAllPanels();
    },
  },
  {
    id: 'profile',
    label: 'Профиль персонажа',
    run: ({ dispatchPanel }) => dispatchPanel('characterProfile'),
  },
  {
    id: 'relations',
    label: 'Отношения',
    run: ({ dispatchPanel }) => dispatchPanel('npcRelation'),
  },
  {
    id: 'settings',
    label: 'Настройки',
    run: ({ dispatchPanel }) => dispatchPanel('settings'),
  },
  {
    id: 'main-menu',
    label: 'В главное меню',
    tone: 'danger',
    run: ({ closeAllPanels }) => {
      closeAllPanels();
      // WS23: Direct synchronous calls — requestAnimationFrame introduced a race
      // where resetGame's patch (mainMenuOpen:false via skipIntro) could clobber
      // the subsequent setMainMenuOpen(true) if React reconciled between them.
      // Now both happen in the same synchronous tick; setMainMenuOpen(true) wins.
      useGameStore.getState().resetGame();
      useGameStore.getState().setMainMenuOpen(true);
    },
  },
];

export function OrchestratorPauseMenu({ pauseDialog, panels, onClose }: Props) {
  const { isPanelOpen } = usePanelStack();
  const { dispatchPanel, closeAllPanels, closePanelByType } = panels;
  const { mode } = useOrchestratorShell();

  // Auto-close the pause menu when leaving gameplay modes (e.g. resetGame → intro → menu).
  // This prevents the "ghost menu" bug where the AnimatePresence exit DOM persists
  // across mode transitions and blocks interactions with the main menu.
  useEffect(() => {
    const isGameplay = mode === 'exploration' || mode === 'cutscene' || mode === 'combat';
    if (isPanelOpen('menu') && !isGameplay) {
      closeAllPanels();
    }
  }, [mode, isPanelOpen, closeAllPanels]);

  // Only render the pause menu during gameplay modes.
  const menuVisible = isPanelOpen('menu') && (mode === 'exploration' || mode === 'cutscene' || mode === 'combat');

  return (
    <AnimatePresence mode="wait" initial={false}>
      {menuVisible && (
        <PanelStackSlot panelId="menu">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="fixed inset-0 flex items-center justify-center cinematic-menu-shell"
            style={{ zIndex: UI_LAYERS.MENU }}
            data-testid="pause-menu-root"
          >
            <div
              className="absolute inset-0 bg-black/78"
              onClick={onClose.menu}
              aria-hidden="true"
            />
            {/* Filmic grade — matches title plate / exploration diegetic, not modal chrome */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(18,28,48,0.35) 0%, transparent 68%), linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 28%, transparent 72%, rgba(0,0,0,0.7) 100%)',
              }}
              aria-hidden="true"
            />
            <CinematicBars />
            <FilmGrain opacity={0.028} zIndex={1} />

            <FocusTrap initialFocusRef={pauseDialog.closeButtonRef}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-sm px-6"
                {...pauseDialog.dialogProps}
                data-testid="pause-menu"
              >
                <div className="flex flex-col items-center text-center">
                  <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-stone-400/55 mb-2">
                    Между сценами
                  </p>
                  <h2
                    {...pauseDialog.titleProps}
                    className="font-serif text-3xl tracking-[0.2em] text-stone-100/95 mb-8"
                  >
                    Пауза
                  </h2>

                  <div className="w-full flex flex-col gap-1" role="menu" aria-label="Меню паузы">
                    {PAUSE_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        role="menuitem"
                        onClick={() =>
                          action.run({ dispatchPanel, closeAllPanels, closePanelByType })
                        }
                        className={`cinematic-menu-item ${
                          action.tone === 'danger' ? 'cinematic-menu-item--danger' : ''
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}

                    <div className="h-px w-16 mx-auto my-3 bg-gradient-to-r from-transparent via-stone-400/25 to-transparent" />

                    <button
                      ref={pauseDialog.closeButtonRef}
                      type="button"
                      role="menuitem"
                      onClick={() => closePanelByType('menu')}
                      className="cinematic-menu-item cinematic-menu-item--muted"
                    >
                      Продолжить
                    </button>
                  </div>

                  <span className="mt-5 font-serif text-[10px] tracking-[0.2em] text-stone-500/60">
                    ESC — закрыть
                  </span>
                </div>
              </motion.div>
            </FocusTrap>
          </motion.div>
        </PanelStackSlot>
      )}
    </AnimatePresence>
  );
}
