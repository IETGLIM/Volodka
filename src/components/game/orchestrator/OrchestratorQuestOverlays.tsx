import { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { LazyQuestAcceptDialog, LazyQuestCompleteDialog } from './lazyPanels';
import type { PanelCoordinatorResult } from './usePanelCoordinator';

type Props = Pick<
  PanelCoordinatorResult,
  | 'questAccept'
  | 'setQuestAccept'
  | 'questComplete'
  | 'setQuestComplete'
  | 'questChainUnlock'
  | 'setQuestChainUnlock'
>;

export function OrchestratorQuestOverlays({
  questAccept,
  setQuestAccept,
  questComplete,
  setQuestComplete,
  questChainUnlock,
  setQuestChainUnlock,
}: Props) {
  return (
    <>
      {questAccept && (
        <Suspense fallback={null}>
          <LazyQuestAcceptDialog
            questId={questAccept.questId}
            npcId={questAccept.npcId}
            onClose={() => setQuestAccept(null)}
            onAccept={(qid) => {
              useGameStore.getState().activateQuest(qid);
              setQuestAccept(null);
            }}
          />
        </Suspense>
      )}

      {questComplete && (
        <Suspense fallback={null}>
          <LazyQuestCompleteDialog
            questId={questComplete.questId}
            npcId={questComplete.npcId}
            onClose={() => setQuestComplete(null)}
          />
        </Suspense>
      )}

      <AnimatePresence>
        {questChainUnlock && (
          <motion.div
            key="quest-chain-unlock"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto"
            style={{ zIndex: UI_LAYERS.TOASTS + 3 }}
            onClick={() => setQuestChainUnlock(null)}
          >
            <div
              className="flex items-center gap-4 px-6 py-4 rounded-xl border backdrop-blur-md cursor-pointer"
              style={{
                background:
                  'linear-gradient(135deg, rgba(0,16,8,0.95) 0%, rgba(0,40,30,0.92) 50%, rgba(0,16,8,0.88) 100%)',
                borderColor: 'rgba(0,255,238,0.4)',
                boxShadow:
                  '0 0 40px rgba(0,255,238,0.15), 0 0 15px rgba(0,255,238,0.08), 0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <div
                className="flex items-center justify-center w-12 h-12 rounded-lg text-xl"
                style={{
                  background: 'rgba(0,255,238,0.12)',
                  border: '1px solid rgba(0,255,238,0.3)',
                  boxShadow: '0 0 12px rgba(0,255,238,0.15)',
                }}
              >
                ⚑
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono tracking-wider font-bold"
                    style={{ color: '#00ffee', textShadow: '0 0 8px rgba(0,255,238,0.4)' }}
                  >
                    НОВОЕ ЗАДАНИЕ ДОСТУПНО
                  </span>
                  {questChainUnlock.nextQuestType === 'main' && (
                    <span
                      className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color: '#ff6644',
                        background: 'rgba(255,102,68,0.1)',
                        border: '1px solid rgba(255,102,68,0.3)',
                      }}
                    >
                      ОСНОВНОЕ
                    </span>
                  )}
                </div>
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: '#e0f8f8', textShadow: '0 0 6px rgba(0,255,238,0.2)' }}
                >
                  {questChainUnlock.nextQuestTitle}
                </span>
                <span className="text-[11px] font-mono" style={{ color: '#88aaaa' }}>
                  После «{questChainUnlock.completedQuestTitle}»
                  {questChainUnlock.actNumber > 1 && ` · Акт ${questChainUnlock.actNumber}`}
                </span>
              </div>
              <span className="text-[9px] font-mono ml-2" style={{ color: 'rgba(0,255,238,0.3)' }}>
                ✕
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
