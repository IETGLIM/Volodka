import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Users, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { GiftDialog } from '@/components/game/GiftDialog';
import { useHasGiftableItems } from '@/components/game/gift/useGiftDialogData';
import { NPCRelationshipCard } from '@/components/game/npcRelationship/NPCRelationshipCard';
import { NPCRelationshipEmptyState } from '@/components/game/npcRelationship/NPCRelationshipEmptyState';
import { NPCRelationshipFooter } from '@/components/game/npcRelationship/NPCRelationshipFooter';
import { useNpcRelationshipPanelData } from '@/components/game/npcRelationship/useNpcRelationshipPanelData';
import { NPC_RELATIONSHIP_LABELS } from '@/engine/npcRelationship/npcRelationshipConstants';
import {
  getPanelSlideTransition,
  getRelationFooterCounts,
} from '@/engine/npcRelationship/npcRelationshipPresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { ScrollArea } from '@/components/ui/scroll-area';

export type NPCRelationshipPanelProps = {
  open: boolean;
  onClose: () => void;
};

function NPCRelationshipPanelInner({ open, onClose }: NPCRelationshipPanelProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const reducedMotion = useEffectiveReducedMotion();
  const { phase: transitionPhase } = useTransitionDirector();
  const { sortedRelations, npcStates, currentHour, npcAffinity } = useNpcRelationshipPanelData();
  const canGift = useHasGiftableItems();
  const [showSchedule, setShowSchedule] = useState(true);
  const [giftDialogNpcId, setGiftDialogNpcId] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setGiftDialogNpcId(null);
    onClose();
  }, [onClose]);

  const handleOpenGift = useCallback((npcId: string) => {
    setGiftDialogNpcId(npcId);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (transitionPhase === 'loading') {
      handleClose();
    }
  }, [open, transitionPhase, handleClose]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.code === 'KeyN' || event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, handleClose]);

  const footerCounts = useMemo(() => getRelationFooterCounts(sortedRelations), [sortedRelations]);
  const hasRelations = sortedRelations.length > 0;
  const panelTransition = getPanelSlideTransition(reducedMotion);

  return (
    <>
      <AnimatePresence>
        {open && (
          <FocusTrap initialFocusRef={closeButtonRef}>
            <motion.div
              initial={reducedMotion ? false : { x: '100%' }}
              animate={{ x: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { x: '100%' }}
              transition={panelTransition}
              className="fixed bottom-0 right-0 top-0 w-full sm:w-[30rem]"
              {...dialogProps}
              style={{
                zIndex: UI_LAYERS.PANEL,
                background: 'linear-gradient(180deg, rgba(8,12,28,0.97) 0%, rgba(4,8,18,0.98) 100%)',
                borderLeft: '1px solid rgb(var(--cyber-cyan-rgb) / 0.15)',
                backdropFilter: 'blur(20px)',
                boxShadow: '-20px 0 40px rgba(0,0,0,0.5), inset 1px 0 0 rgb(var(--cyber-cyan-rgb) / 0.08)',
              }}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-cyan-900/20 px-4 py-3">
                  <h2 {...titleProps} className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                    <Users className="size-5 text-cyan-400" aria-hidden="true" />
                    {NPC_RELATIONSHIP_LABELS.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSchedule((value) => !value)}
                      className={`flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/70 ${
                        showSchedule
                          ? 'border border-cyan-800/30 bg-cyan-950/40 text-cyan-400'
                          : 'border border-slate-700/20 bg-slate-900/40 text-slate-500 hover:text-slate-300'
                      }`}
                      aria-pressed={showSchedule}
                      aria-label={
                        showSchedule
                          ? NPC_RELATIONSHIP_LABELS.hideSchedule
                          : NPC_RELATIONSHIP_LABELS.showSchedule
                      }
                    >
                      <CalendarClock className="size-3" aria-hidden="true" />
                      {NPC_RELATIONSHIP_LABELS.schedule}
                    </button>
                    <span className="font-mono text-[10px] text-slate-500" aria-hidden="true">
                      [N] {NPC_RELATIONSHIP_LABELS.closeHint}
                    </span>
                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={handleClose}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/70"
                      aria-label={NPC_RELATIONSHIP_LABELS.close}
                    >
                      <X className="size-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <ScrollArea className="flex-1 px-4 py-3">
                  {hasRelations ? (
                    <div className="flex flex-col gap-3" role="list">
                      {sortedRelations.map((relation, index) => (
                        <div key={relation.npcId} role="listitem">
                          <NPCRelationshipCard
                            relation={relation}
                            index={index}
                            npcStates={npcStates}
                            currentHour={currentHour}
                            showSchedule={showSchedule}
                            affinity={npcAffinity[relation.npcId] ?? 0}
                            canGift={canGift}
                            reducedMotion={reducedMotion}
                            onOpenGift={handleOpenGift}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <NPCRelationshipEmptyState reducedMotion={reducedMotion} />
                  )}
                </ScrollArea>

                {hasRelations && <NPCRelationshipFooter counts={footerCounts} />}
              </div>
            </motion.div>
          </FocusTrap>
        )}
      </AnimatePresence>

      {giftDialogNpcId && open && (
        <GiftDialog
          open
          onClose={() => setGiftDialogNpcId(null)}
          npcId={giftDialogNpcId}
        />
      )}
    </>
  );
}

export function NPCRelationshipPanel(props: NPCRelationshipPanelProps) {
  return (
    <ErrorBoundary name="NPCRelationshipPanel">
      <NPCRelationshipPanelInner {...props} />
    </ErrorBoundary>
  );
}
