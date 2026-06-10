import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import type { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { PanelStackSlot, usePanelStack } from './PanelStackContext';
import type { PanelCoordinatorResult } from './usePanelCoordinator';
import type { PanelCloseHandlers } from './useStablePanelClosers';

type Props = {
  pauseDialog: ReturnType<typeof usePanelDialog>;
  panels: Pick<PanelCoordinatorResult, 'dispatchPanel' | 'closeAllPanels' | 'closePanelByType'>;
  onClose: PanelCloseHandlers;
};

export function OrchestratorPauseMenu({ pauseDialog, panels, onClose }: Props) {
  const { isPanelOpen } = usePanelStack();
  const { dispatchPanel, closeAllPanels, closePanelByType } = panels;

  return (
    <AnimatePresence initial={false}>
      {isPanelOpen('menu') && (
        <PanelStackSlot panelId="menu">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center"
            style={{ position: 'relative' }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={onClose.menu}
              aria-hidden="true"
            />
            <FocusTrap initialFocusRef={pauseDialog.closeButtonRef}>
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-80 bg-slate-950/95 border border-cyan-500/20 p-0 backdrop-blur-md overflow-hidden"
                {...pauseDialog.dialogProps}
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                  boxShadow:
                    '0 0 40px rgba(0, 255, 255, 0.06), 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
              >
                <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-4 py-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                  <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                  <span className="h-2 w-2 rounded-full bg-red-500/80" />
                  <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/30">
                    volodka://pause
                  </span>
                </div>

                <div className="p-5 flex flex-col gap-2.5">
                  <h2
                    {...pauseDialog.titleProps}
                    className="text-lg font-semibold text-slate-100 mb-1 font-mono tracking-wide"
                  >
                    ПАУЗА
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      useGameStore.getState().saveGame({ source: 'manual' });
                      closeAllPanels();
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-cyan-800/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/30 hover:border-cyan-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                  >
                    <span className="text-cyan-500">💾</span> Быстрое сохранение
                  </button>
                  <button
                    type="button"
                    data-testid="pause-save-slots"
                    onClick={() => dispatchPanel('saveSlot')}
                    className="w-full px-4 py-2.5 rounded-lg border border-cyan-800/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/30 hover:border-cyan-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                  >
                    <span className="text-cyan-500">📂</span> Управление сохранениями
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      useGameStore.getState().loadGame();
                      closeAllPanels();
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700/40 bg-slate-900/30 text-slate-300 hover:bg-slate-800/30 hover:border-slate-600/50 text-sm transition-all flex items-center gap-2 font-mono"
                  >
                    <span className="text-slate-400">📂</span> Загрузить
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatchPanel('characterProfile')}
                    className="w-full px-4 py-2.5 rounded-lg border border-emerald-800/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/30 hover:border-emerald-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                  >
                    <span className="text-emerald-500">👤</span> Профиль персонажа
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatchPanel('npcRelation')}
                    className="w-full px-4 py-2.5 rounded-lg border border-violet-800/40 bg-violet-950/30 text-violet-300 hover:bg-violet-900/30 hover:border-violet-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                  >
                    <span className="text-violet-500">👥</span> Отношения
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatchPanel('settings')}
                    className="w-full px-4 py-2.5 rounded-lg border border-amber-800/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/30 hover:border-amber-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                  >
                    <span className="text-amber-500">⚙</span> Настройки
                  </button>
                  <div className="h-px bg-slate-800/50 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      useGameStore.getState().resetGame();
                      closeAllPanels();
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-rose-800/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/30 hover:border-rose-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                  >
                    <span className="text-rose-500">⏻</span> В главное меню
                  </button>
                  <button
                    ref={pauseDialog.closeButtonRef}
                    type="button"
                    onClick={() => closePanelByType('menu')}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700/30 bg-slate-900/20 text-slate-500 hover:bg-slate-800/30 hover:text-slate-300 text-sm transition-all flex items-center gap-2 font-mono"
                  >
                    <span className="text-slate-600">✕</span> Закрыть
                  </button>
                  <span className="text-[10px] text-slate-600 font-mono mt-1 text-center">ESC — закрыть</span>
                </div>
              </motion.div>
            </FocusTrap>
          </motion.div>
        </PanelStackSlot>
      )}
    </AnimatePresence>
  );
}
