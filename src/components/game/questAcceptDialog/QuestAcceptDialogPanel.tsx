import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Lock } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { QuestAcceptBracketCorners, QuestAcceptNpcPortrait } from '@/components/game/questAcceptDialog/QuestAcceptNpcPortrait';
import { QuestAcceptObjectiveRow } from '@/components/game/questAcceptDialog/QuestAcceptObjectiveRow';
import { QuestAcceptRewardRow } from '@/components/game/questAcceptDialog/QuestAcceptRewardRow';
import {
  useQuestAcceptDialogController,
  type QuestAcceptDialogProps,
} from '@/components/game/questAcceptDialog/useQuestAcceptDialogController';
import '@/components/game/questAcceptDialog/quest-accept-dialog.css';
import {
  QUEST_ACCEPT_ACCENT,
  QUEST_ACCEPT_DIALOG_LABELS,
} from '@/engine/quest/questAcceptDialogConstants';
import {
  getDialogMotion,
  getDifficultyDiamondCount,
  getGiverFallbackLabel,
  getObjectivesWithPoemHints,
  getObjectiveRowMotion,
  getOverlayMotion,
  getQuestTypeBadgeColor,
  getQuestTypeLabel,
  hasPoemPowerBypass,
  isRelationDotFilled,
} from '@/engine/quest/questAcceptDialogPresentation';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

function QuestAcceptDialogInner(props: QuestAcceptDialogProps) {
  const dialog = useQuestAcceptDialogController(props);

  if (!dialog.questDef || !dialog.context) return null;

  const { questDef, context, npcRelation, mainQuest, reducedMotion, visible } = dialog;
  const overlayMotion = getOverlayMotion(reducedMotion);
  const panelMotion = getDialogMotion(reducedMotion);
  const questTypeBadgeColor = getQuestTypeBadgeColor(questDef.questType);
  const difficultyStars = getDifficultyDiamondCount(questDef.difficulty);
  const giverFallback = getGiverFallbackLabel(questDef, context.npcDef !== null);
  const staticClass = reducedMotion ? ' quest-accept-dialog--static' : '';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={overlayMotion.initial}
          animate={overlayMotion.animate}
          exit={overlayMotion.exit}
          transition={overlayMotion.transition}
          className={`fixed inset-0 flex items-center justify-center${staticClass}`}
          style={{ background: 'rgba(0,0,0,0.85)', zIndex: UI_LAYERS.PANEL }}
        >
          <span className="sr-only" aria-live="polite">
            {dialog.liveAnnouncement}
          </span>

          {!reducedMotion && (
            <div className="quest-accept-scanlines absolute inset-0 pointer-events-none" aria-hidden="true" />
          )}

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quest-dialog-title"
            aria-label={QUEST_ACCEPT_DIALOG_LABELS.dialogRegion}
            initial={panelMotion.initial}
            animate={panelMotion.animate}
            exit={panelMotion.exit}
            transition={panelMotion.transition}
            className="relative flex flex-col w-[95vw] max-w-[760px] max-h-[88vh] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,8,16,0.97), rgba(0,16,24,0.95))',
              border: `1px solid ${QUEST_ACCEPT_ACCENT.cyanDim}`,
              borderRadius: '8px',
              boxShadow:
                '0 0 30px rgba(0,255,238,0.1), 0 0 8px rgba(0,255,238,0.05), inset 0 0 15px rgba(0,255,238,0.03)',
            }}
          >
            <QuestAcceptBracketCorners color="rgba(0,255,238,0.5)" size={6} />

            <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
              <div
                className="flex-shrink-0 w-full md:w-[240px] flex flex-col items-center p-4 md:p-6"
                style={{
                  borderRight: '1px solid rgba(0,255,238,0.15)',
                  borderBottom: '1px solid rgba(0,255,238,0.15)',
                  background: 'linear-gradient(180deg, rgba(0,20,30,0.5), rgba(0,8,16,0.3))',
                }}
              >
                <QuestAcceptNpcPortrait npcDef={context.npcDef} reducedMotion={reducedMotion} />

                {context.npcDef ? (
                  <div className="mt-3 text-center">
                    <div
                      className="text-sm font-mono font-bold tracking-wider"
                      style={{
                        color: context.npcDef.appearance?.accentColor ?? QUEST_ACCEPT_ACCENT.cyan,
                        textShadow: `0 0 8px ${context.npcDef.appearance?.accentColor ?? QUEST_ACCEPT_ACCENT.cyan}44`,
                      }}
                    >
                      {context.npcDef.name}
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[10px] font-mono" style={{ color: QUEST_ACCEPT_ACCENT.muted }}>
                        {QUEST_ACCEPT_DIALOG_LABELS.relationship}
                      </span>
                      <div className="flex gap-0.5" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map((dot) => (
                          <div
                            key={dot}
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: isRelationDotFilled(npcRelation, dot) ? '#00ff66' : '#333',
                              boxShadow: isRelationDotFilled(npcRelation, dot)
                                ? '0 0 4px rgba(0,255,102,0.5)'
                                : 'none',
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono" style={{ color: '#aaa' }}>
                        {npcRelation}
                      </span>
                    </div>
                  </div>
                ) : giverFallback ? (
                  <div className="mt-3 text-center">
                    <div
                      className="text-xs font-mono tracking-wider"
                      style={{
                        color: '#557777',
                        textShadow: '0 0 4px rgba(0,255,238,0.1)',
                      }}
                    >
                      {giverFallback}
                    </div>
                  </div>
                ) : null}
              </div>

              <div
                className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto max-h-96 md:max-h-none"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#00ffee33 transparent' }}
              >
                <div className="mb-3">
                  <h2
                    id="quest-dialog-title"
                    className="text-xl font-mono font-bold tracking-wide"
                    style={{
                      color: QUEST_ACCEPT_ACCENT.text,
                      textShadow: '0 0 12px rgba(0,255,238,0.2)',
                    }}
                  >
                    {questDef.title}
                  </h2>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded"
                    style={{
                      color: questTypeBadgeColor,
                      background: `${questTypeBadgeColor}15`,
                      border: `1px solid ${questTypeBadgeColor}44`,
                      textShadow: `0 0 4px ${questTypeBadgeColor}44`,
                    }}
                  >
                    {getQuestTypeLabel(questDef.questType)}
                  </span>

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono" style={{ color: QUEST_ACCEPT_ACCENT.muted }}>
                      {QUEST_ACCEPT_DIALOG_LABELS.difficulty}
                    </span>
                    <div aria-hidden="true">
                      {[1, 2, 3].map((level) => (
                        <span
                          key={level}
                          className="text-xs"
                          style={{
                            color: level <= difficultyStars ? '#ffaa00' : '#444',
                            textShadow: level <= difficultyStars ? '0 0 4px rgba(255,170,0,0.5)' : 'none',
                          }}
                        >
                          {level <= difficultyStars ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {questDef.timeLimitHours && (
                    <div className="flex items-center gap-1">
                      <Clock className="size-3 text-amber-400/70" aria-hidden="true" />
                      <span className="text-[10px] font-mono" style={{ color: '#ddaa66' }}>
                        {questDef.timeLimitHours}ч
                      </span>
                    </div>
                  )}
                </div>

                {/* Flavor text quote from quest giver */}
                {context.npcDef && questDef.description && (
                  <div
                    className="mb-3 px-3 py-2 rounded"
                    style={{
                      background: 'rgba(0,255,238,0.04)',
                      borderLeft: '2px solid rgba(0,255,238,0.3)',
                    }}
                  >
                    <p
                      className="text-[11px] font-mono italic leading-relaxed"
                      style={{ color: '#88bbbb' }}
                    >
                      «{questDef.description.length > 120 ? questDef.description.slice(0, 120) + '…' : questDef.description}»
                    </p>
                    <span
                      className="text-[9px] font-mono mt-1 block"
                      style={{ color: context.npcDef.appearance?.accentColor ?? '#667777' }}
                    >
                      — {context.npcDef.name}
                    </span>
                  </div>
                )}

                {!context.npcDef && (
                  <p className="text-sm font-mono leading-relaxed mb-4" style={{ color: QUEST_ACCEPT_ACCENT.description }}>
                    {questDef.description}
                  </p>
                )}

                <div className="mb-4">
                  <h3 className="text-[11px] font-mono tracking-wider mb-2" style={{ color: '#00ffee88' }}>
                    {QUEST_ACCEPT_DIALOG_LABELS.objectivesHeading}
                  </h3>
                  <div className="space-y-1.5">
                    {questDef.objectives.map((objective, index) => {
                      const rowMotion = getObjectiveRowMotion(reducedMotion, index);
                      return (
                        <motion.div
                          key={objective.id}
                          initial={rowMotion.initial}
                          animate={rowMotion.animate}
                          transition={rowMotion.transition}
                        >
                          <QuestAcceptObjectiveRow objective={objective} />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Required quests prerequisites */}
                {questDef.requiresQuests && questDef.requiresQuests.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-[11px] font-mono tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#ffaa4488' }}>
                      <Lock className="size-3" style={{ color: '#ffaa4488' }} aria-hidden="true" />
                      ТРЕБУЕТСЯ:
                    </h3>
                    <div className="space-y-1">
                      {questDef.requiresQuests.map((reqId) => {
                        const reqDef = QUEST_DEFINITIONS.find((d) => d.id === reqId);
                        return (
                          <div
                            key={reqId}
                            className="flex items-center gap-1.5 text-[11px] font-mono"
                            style={{ color: '#998866' }}
                          >
                            <span aria-hidden="true">◈</span>
                            {reqDef?.title ?? reqId}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {questDef.rewards && questDef.rewards.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-[11px] font-mono tracking-wider mb-2" style={{ color: '#ffaa4488' }}>
                      {QUEST_ACCEPT_DIALOG_LABELS.rewardsHeading}
                    </h3>
                    <div className="space-y-1">
                      {questDef.rewards.map((reward, index) => (
                        <QuestAcceptRewardRow key={`reward-${index}`} reward={reward} />
                      ))}
                    </div>
                  </div>
                )}

                {hasPoemPowerBypass(questDef.objectives) && (
                  <div
                    className="mb-4 px-3 py-2 rounded"
                    style={{
                      background: 'rgba(0,255,102,0.08)',
                      border: '1px solid rgba(0,255,102,0.2)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: '#00ff66', fontSize: '14px' }} aria-hidden="true">
                        📜
                      </span>
                      <span className="text-[11px] font-mono" style={{ color: '#66ffaa' }}>
                        {QUEST_ACCEPT_DIALOG_LABELS.poemBypass}
                      </span>
                    </div>
                    {getObjectivesWithPoemHints(questDef.objectives).map((objective) => (
                      <div
                        key={objective.id}
                        className="text-[10px] font-mono mt-1 ml-6"
                        style={{ color: '#44aa66' }}
                      >
                        {objective.poemPowerHint}
                      </div>
                    ))}
                  </div>
                )}

                {questDef.hint && (
                  <div className="mb-4">
                    <div className="text-[11px] font-mono italic" style={{ color: '#668888' }}>
                      <span aria-hidden="true">💡 </span>
                      {questDef.hint}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className="flex gap-3 px-4 py-3 md:px-6"
              style={{ borderTop: '1px solid rgba(0,255,238,0.15)' }}
            >
              <motion.button
                ref={dialog.acceptBtnRef}
                type="button"
                onClick={dialog.handleAccept}
                aria-label={QUEST_ACCEPT_DIALOG_LABELS.accept}
                className="quest-accept-btn--accept flex-1 py-3 rounded font-mono text-sm tracking-wider font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,255,238,0.18), rgba(0,255,238,0.08))',
                  color: QUEST_ACCEPT_ACCENT.cyan,
                  border: '1px solid rgba(0,255,238,0.4)',
                  textShadow: '0 0 8px rgba(0,255,238,0.3)',
                }}
                whileHover={reducedMotion ? undefined : { scale: 1.01 }}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              >
                {QUEST_ACCEPT_DIALOG_LABELS.acceptButton}
              </motion.button>

              <motion.button
                type="button"
                onClick={dialog.handleDecline}
                aria-label={mainQuest ? QUEST_ACCEPT_DIALOG_LABELS.close : QUEST_ACCEPT_DIALOG_LABELS.decline}
                className="quest-accept-btn--decline flex-1 py-3 rounded font-mono text-sm tracking-wider"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,100,68,0.1), rgba(255,100,68,0.05))',
                  color: '#ff6644',
                  border: '1px solid rgba(255,100,68,0.3)',
                  textShadow: '0 0 8px rgba(255,100,68,0.3)',
                }}
                whileHover={reducedMotion ? undefined : { scale: 1.01 }}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
              >
                {mainQuest ? QUEST_ACCEPT_DIALOG_LABELS.closeButton : QUEST_ACCEPT_DIALOG_LABELS.declineButton}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function QuestAcceptDialog(props: QuestAcceptDialogProps) {
  return (
    <ErrorBoundary name="QuestAcceptDialog" fallback={null}>
      <QuestAcceptDialogInner {...props} />
    </ErrorBoundary>
  );
}

export type { QuestAcceptDialogProps };
