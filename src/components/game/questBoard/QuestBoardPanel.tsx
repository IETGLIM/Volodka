import { useId } from 'react';
import { AlertCircle, ScrollText } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PanelWrapper } from '@/components/game/PanelWrapper';
import { CyberSkeleton } from '@/components/game/CyberLoadingScreen';
import { QuestBoardMissionCard } from '@/components/game/questBoard/QuestBoardMissionCard';
import { QuestBoardTabs } from '@/components/game/questBoard/QuestBoardTabs';
import { useQuestBoardController } from '@/components/game/questBoard/useQuestBoardController';
import '@/components/game/questBoard/quest-board.css';
import { QUEST_BOARD_LABELS, QUEST_BOARD_TAB_IDS } from '@/engine/questBoard/questBoardConstants';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGameDataPreload } from '@/hooks/useGameDataPreload';
import { eventBus } from '@/engine/EventBus';

export type QuestBoardPanelProps = {
  open: boolean;
  onClose: () => void;
};

function QuestBoardPanelInner({ open, onClose }: QuestBoardPanelProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const board = useQuestBoardController();
  const gridPatternId = useId();
  const gameDataReady = useGameDataPreload();

  const staticClass = reducedMotion ? ' quest-board-dialog--static' : '';
  const badgeFull = board.slotsFull;

  return (
    <PanelWrapper
      open={open}
      onClose={onClose}
      title={QUEST_BOARD_LABELS.title}
      urlPath={QUEST_BOARD_LABELS.urlPath}
      accentColor="emerald"
      layout="centered"
      maxWidth="max-w-3xl"
      icon={<ScrollText className="size-4 text-emerald-400/60" aria-hidden="true" />}
      shortcutLabel={QUEST_BOARD_LABELS.shortcut}
      closeAriaLabel="Закрыть доску заданий"
      headerExtra={
        <div
          className={`quest-board-header-badge flex items-center gap-1.5 px-2.5 py-1 rounded-md border${
            badgeFull ? ' quest-board-header-badge--full' : ''
          }`}
          aria-label={
            badgeFull
              ? QUEST_BOARD_LABELS.headerActiveBadgeFull(board.activeCount, board.maxActive)
              : QUEST_BOARD_LABELS.headerActiveBadge(board.activeCount)
          }
        >
          <ScrollText className="size-3.5 text-emerald-400" aria-hidden="true" />
          <span className="text-xs font-bold font-mono text-emerald-300 quest-board-header-badge-count">
            {board.activeCount}
          </span>
          <span className="text-[10px] text-emerald-400/70 font-mono" aria-hidden="true">
            {QUEST_BOARD_LABELS.headerActiveSuffix}
          </span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[9px] text-slate-600 font-mono">{QUEST_BOARD_LABELS.urlPath}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-[10px] font-mono text-cyan-400/80 hover:text-cyan-300 underline-offset-2 hover:underline transition-colors"
              aria-label={QUEST_BOARD_LABELS.openJournalAria}
              title={QUEST_BOARD_LABELS.openJournalHint}
              onClick={() => {
                onClose();
                eventBus.emit('ui:open_panel', { panel: 'quests' });
              }}
            >
              {QUEST_BOARD_LABELS.openJournal}
            </button>
            <span className="text-[9px] text-slate-500 font-mono">
              {QUEST_BOARD_LABELS.footerStats(board.activeCount, board.completedCount, board.maxActive)}
            </span>
          </div>
        </div>
      }
    >
      <div className={`scanline-overlay${staticClass}`} style={{ background: 'rgba(0,0,0,0.2)' }}>
        <span className="sr-only" aria-live="polite">
          {board.tabAnnouncement}
        </span>

        <QuestBoardTabs
          activeTab={board.activeTab}
          dailyCount={board.dailyMissions.length}
          weeklyCount={board.weeklyMissions.length}
          onTabChange={board.setActiveTab}
          onTabListKeyDown={board.handleTabListKeyDown}
        />

        <div
          id={QUEST_BOARD_TAB_IDS.panel}
          role="tabpanel"
          aria-labelledby={
            board.activeTab === 'daily' ? QUEST_BOARD_TAB_IDS.daily : QUEST_BOARD_TAB_IDS.weekly
          }
          className="relative p-4 sm:p-6 overflow-y-auto max-h-96 custom-scrollbar"
          aria-label={QUEST_BOARD_LABELS.missionListRegion}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.02]"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <pattern id={gridPatternId} width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#10b981" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${gridPatternId})`} />
          </svg>

          {!reducedMotion && (
            <>
              <div
                className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full pointer-events-none"
                aria-hidden="true"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)' }}
              />
              <div
                className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full pointer-events-none"
                aria-hidden="true"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)' }}
              />
            </>
          )}

          <div className="relative z-10 space-y-4">
            {board.activeMissions.length > 0 && (
              <section aria-labelledby="quest-board-active-heading">
                <div className="flex items-center gap-2 mb-2.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full bg-emerald-400${reducedMotion ? '' : ' quest-board-active-dot--pulse'}`}
                    aria-hidden="true"
                  />
                  <span
                    id="quest-board-active-heading"
                    className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest"
                  >
                    {QUEST_BOARD_LABELS.activeSection}
                  </span>
                  <div className="flex-1 h-px bg-emerald-400/15" aria-hidden="true" />
                </div>
                <div className="space-y-2" role="list" aria-label={QUEST_BOARD_LABELS.activeMissionsList}>
                  {board.activeMissions.map(({ mission }) => (
                    <QuestBoardMissionCard
                      key={mission.id}
                      mission={mission}
                      reducedMotion={reducedMotion}
                      acceptDisabled={false}
                      onAccept={board.handleAccept}
                      onAbandon={board.handleAbandon}
                      onClaim={board.handleClaim}
                    />
                  ))}
                </div>
              </section>
            )}

            {board.availableMissions.length > 0 && (
              <section aria-labelledby="quest-board-available-heading">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500" aria-hidden="true" />
                  <span
                    id="quest-board-available-heading"
                    className="text-[10px] font-mono text-slate-500 uppercase tracking-widest"
                  >
                    {QUEST_BOARD_LABELS.availableSection}
                  </span>
                  <div className="flex-1 h-px bg-slate-700/30" aria-hidden="true" />
                </div>
                <div className="space-y-2" role="list" aria-label={QUEST_BOARD_LABELS.availableMissionsList}>
                  {board.availableMissions.map((mission) => (
                    <QuestBoardMissionCard
                      key={mission.id}
                      mission={mission}
                      reducedMotion={reducedMotion}
                      acceptDisabled={board.slotsFull}
                      onAccept={board.handleAccept}
                      onAbandon={board.handleAbandon}
                      onClaim={board.handleClaim}
                    />
                  ))}
                </div>
              </section>
            )}

            {!gameDataReady ? (
              <div className="space-y-3" aria-busy="true" aria-label="Загрузка миссий">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="space-y-2 rounded-lg border border-emerald-900/20 bg-slate-950/40 p-3">
                    <CyberSkeleton width="w-2/3" height="h-3" variant="text" />
                    <CyberSkeleton width="w-full" height="h-2" variant="text" />
                    <CyberSkeleton width="w-1/3" height="h-2" variant="text" />
                  </div>
                ))}
              </div>
            ) : board.currentMissions.length === 0 ? (
              <div className="text-center py-12" role="status">
                <AlertCircle className="size-8 text-slate-700 mx-auto mb-3" aria-hidden="true" />
                <p className="text-sm text-slate-500 font-mono">{QUEST_BOARD_LABELS.emptyTitle}</p>
                <p className="text-[10px] text-slate-600 mt-1">{QUEST_BOARD_LABELS.emptyHint}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </PanelWrapper>
  );
}

export function QuestBoardPanel(props: QuestBoardPanelProps) {
  return (
    <ErrorBoundary name="QuestBoardPanel" fallback={null}>
      <QuestBoardPanelInner {...props} />
    </ErrorBoundary>
  );
}
