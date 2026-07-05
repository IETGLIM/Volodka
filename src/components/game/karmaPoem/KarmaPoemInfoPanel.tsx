/* ─── Volodka RPG – KarmaPoemInfoPanel ─── */

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { KarmaTab } from '@/components/game/karmaPoem/KarmaTab';
import { KarmaPoemTabButton } from '@/components/game/karmaPoem/KarmaPoemTabButton';
import { PoemsTab } from '@/components/game/karmaPoem/PoemsTab';
import { useKarmaPoemPanel } from '@/components/game/karmaPoem/useKarmaPoemPanel';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface KarmaPoemInfoPanelProps {
  open: boolean;
  onClose: () => void;
}

export function KarmaPoemInfoPanel({ open, onClose }: KarmaPoemInfoPanelProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const { view, activeTab, handleTabChange, handleClose } = useKarmaPoemPanel(open, onClose);

  if (!open) return null;

  const motionDuration = reducedMotion ? 0 : 0.3;
  const panelId = `karma-poem-tabpanel-${activeTab}`;

  if (!view.dataReady) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/85"
        style={{ zIndex: UI_LAYERS.PANEL }}
        role="alertdialog"
        aria-labelledby="karma-poem-error-title"
      >
        <div className="max-w-md px-6 py-5 rounded-lg border border-rose-900/40 bg-slate-950/95 text-center">
          <h2 id="karma-poem-error-title" className="text-sm font-mono text-rose-300 mb-2">
            Ошибка загрузки данных
          </h2>
          <p className="text-xs font-mono text-slate-500 mb-4">
            Не удалось загрузить информацию о карме и стихах.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-mono rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reducedMotion ? undefined : { opacity: 0 }}
        transition={{ duration: motionDuration }}
        className="fixed inset-0 flex items-center justify-center bg-black/85"
        style={{ zIndex: UI_LAYERS.PANEL }}
        onClick={(event) => {
          if (event.target === event.currentTarget) handleClose();
        }}
      >
        <FocusTrap initialFocusRef={closeButtonRef}>
          <motion.div
            initial={reducedMotion ? false : { scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reducedMotion ? undefined : { scale: 0.95, opacity: 0 }}
            transition={{ duration: motionDuration }}
            className="relative w-[95vw] max-w-[700px] max-h-[85vh] flex flex-col overflow-hidden rounded-lg border border-cyan-500/25 bg-gradient-to-br from-slate-950/95 to-slate-900/95 shadow-[0_0_20px_rgb(var(--cyber-cyan-rgb)/0.08)]"
            {...dialogProps}
          >
            <h2 {...titleProps} className="sr-only">Карма и стихи</h2>

            <div
              role="tablist"
              aria-label="Разделы панели кармы и стихов"
              className="flex border-b border-cyan-900/20"
            >
              <KarmaPoemTabButton
                tab="karma"
                active={activeTab === 'karma'}
                label="⚖️ Карма"
                panelId={panelId}
                onClick={handleTabChange}
              />
              <KarmaPoemTabButton
                tab="poems"
                active={activeTab === 'poems'}
                label="📜 Стихи"
                panelId={panelId}
                onClick={handleTabChange}
              />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleClose}
                className="ml-auto px-3 py-2 text-slate-500 hover:text-rose-400 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-rose-500/40"
                aria-label="Закрыть панель"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <div
              id={panelId}
              role="tabpanel"
              aria-labelledby={`karma-poem-tab-${activeTab}`}
              className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin"
            >
              {activeTab === 'karma' ? (
                <KarmaTab
                  karma={view.karma}
                  availableEndings={view.availableEndings}
                  recentChanges={view.recentKarmaChanges}
                  reducedMotion={reducedMotion}
                />
              ) : (
                <PoemsTab
                  poemSlots={view.poemSlots}
                  collectedCount={view.collectedCount}
                  totalPoems={view.totalPoems}
                  readyPowerCount={view.readyPowerCount}
                  powerPoemCount={view.powerPoemCount}
                  poemBypassQuests={view.poemBypassQuests}
                />
              )}
            </div>
          </motion.div>
        </FocusTrap>
      </motion.div>
    </AnimatePresence>
  );
}
