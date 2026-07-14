/* ─── Volodka RPG – Journal/Codex Panel ─── */

import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  X,
} from 'lucide-react';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { usePanelExitComplete } from '@/components/game/orchestrator/PanelExitContext';
import { JOURNAL_TABS } from '@/components/game/journal/journalConstants';
import { LoreTab } from '@/components/game/journal/LoreTab';
import { NotesTab } from '@/components/game/journal/NotesTab';
import { PoemsTab } from '@/components/game/journal/PoemsTab';
import { SkillsTab } from '@/components/game/journal/SkillsTab';
import { ThoughtsTab } from '@/components/game/journal/ThoughtsTab';
import { useJournalPanel } from '@/components/game/journal/useJournalPanel';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export function JournalPanel({
  open: openProp,
  onClose: onCloseProp,
}: {
  open?: boolean;
  onClose?: () => void;
} = {}) {
  const reducedMotion = useEffectiveReducedMotion();
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const notifyPanelExit = usePanelExitComplete();
  const {
    journalOpen,
    journalTab,
    searchQuery,
    setSearchQuery,
    handleClose,
    handleTabChange,
  } = useJournalPanel(openProp, onCloseProp);

  const motionDuration = reducedMotion ? 0 : undefined;
  const activeTab = JOURNAL_TABS.find((tab) => tab.id === journalTab);

  return (
    <AnimatePresence initial={false} onExitComplete={() => notifyPanelExit?.()}>
      {journalOpen && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: motionDuration ?? 0.25 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: UI_LAYERS.PANEL }}
        >
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={handleClose} aria-hidden="true" />

          {!reducedMotion && (
            <>
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                aria-hidden
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgb(var(--cyber-cyan-rgb) / 0.15) 2px, rgb(var(--cyber-cyan-rgb) / 0.15) 4px)',
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden
                style={{
                  background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
                }}
              />
            </>
          )}

          <FocusTrap initialFocusRef={closeButtonRef}>
            <motion.div
              initial={reducedMotion ? false : { scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: motionDuration ?? 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-[95vw] max-w-4xl h-[85vh] max-h-[700px] flex overflow-hidden rounded-xl shadow-2xl shadow-black/50 glass-panel-dark"
              {...dialogProps}
              data-testid="journal-panel"
              style={{
                background: 'linear-gradient(135deg, rgba(8,12,28,0.95) 0%, rgba(4,8,18,0.97) 100%)',
                border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.15)',
                boxShadow: '0 0 40px rgb(var(--cyber-cyan-rgb) / 0.05), inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.08), 0 25px 50px -12px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <h2 {...titleProps} className="sr-only">Журнал</h2>

              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-xl pointer-events-none" aria-hidden />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-xl pointer-events-none" aria-hidden />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-xl pointer-events-none" aria-hidden />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40 rounded-br-xl pointer-events-none" aria-hidden />

              <div className="w-16 sm:w-20 flex flex-col border-r border-cyan-900/20 bg-slate-950/60 shrink-0 relative">
                <div className="p-2 sm:p-3 border-b border-cyan-900/20">
                  <BookOpen className="size-5 sm:size-6 text-cyan-400/70 mx-auto" aria-hidden />
                  <p className="text-[8px] sm:text-[9px] text-cyan-400/50 text-center mt-1 font-medium tracking-wider uppercase hidden sm:block">
                    Журнал
                  </p>
                </div>

                <div
                  role="tablist"
                  aria-label="Разделы журнала"
                  className="flex-1 flex flex-col py-2 gap-0.5 px-1.5 sm:px-2"
                >
                  {JOURNAL_TABS.map((tab) => {
                    const isActive = journalTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        id={`journal-tab-${tab.id}`}
                        aria-selected={isActive}
                        aria-controls={`journal-tabpanel-${tab.id}`}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex flex-col items-center justify-center gap-1 py-2.5 sm:py-3 min-h-[44px] rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-cyan-950/50 border border-cyan-800/40 shadow-[0_0_12px_rgb(var(--cyber-cyan-rgb) / 0.08)] cyber-tab-indicator cyber-underline-animated'
                            : 'hover:bg-slate-800/30 border border-transparent cyber-underline-animated'
                        }`}
                        title={tab.label}
                      >
                        <Icon className={`size-4 sm:size-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} aria-hidden />
                        <span className={`text-[8px] sm:text-[9px] ${isActive ? 'text-cyan-300' : 'text-slate-600'}`}>
                          {tab.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-1.5 sm:p-2 border-t border-cyan-900/20">
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={handleClose}
                    className="w-full flex items-center justify-center py-2 min-h-[44px] rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                    title="Закрыть (Esc)"
                    aria-label="Закрыть журнал"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                {/* Animated gradient top border line */}
              <div className="journal-header-glow-line cyber-glow-line absolute top-0 left-0 right-0 h-[2px] rounded-t-xl overflow-hidden pointer-events-none z-20" />

              <div className="px-5 py-3 border-b border-cyan-900/20 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {activeTab && (
                        <>
                          <activeTab.icon className="size-4 text-cyan-400/70" aria-hidden />
                          <h2 className="text-base font-semibold text-slate-100">{activeTab.label}</h2>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="text-[9px] text-slate-600 bg-slate-800/50 px-1.5 py-0.5 rounded border border-cyan-900/20">
                        J
                      </kbd>
                      <span className="text-[10px] text-slate-600">закрыть</span>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" aria-hidden />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Поиск..."
                      aria-label="Поиск в журнале"
                      className="w-full bg-slate-900/40 border border-cyan-900/20 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-700/40 focus:shadow-[0_0_8px_rgb(var(--cyber-cyan-rgb) / 0.1)] transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Очистить поиск"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={journalTab}
                      id={`journal-tabpanel-${journalTab}`}
                      role="tabpanel"
                      aria-labelledby={`journal-tab-${journalTab}`}
                      initial={reducedMotion ? false : { opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reducedMotion ? undefined : { opacity: 0, x: -10 }}
                      transition={{ duration: motionDuration ?? 0.15 }}
                      className="h-full"
                    >
                      {journalTab === 'notes' && <NotesTab searchQuery={searchQuery} />}
                      {journalTab === 'skills' && <SkillsTab searchQuery={searchQuery} />}
                      {journalTab === 'poems' && <PoemsTab searchQuery={searchQuery} />}
                      {journalTab === 'lore' && <LoreTab searchQuery={searchQuery} />}
                      {journalTab === 'thoughts' && <ThoughtsTab searchQuery={searchQuery} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </FocusTrap>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
