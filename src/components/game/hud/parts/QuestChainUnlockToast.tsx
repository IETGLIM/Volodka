/* ─── Volodka RPG – Quest Chain Unlock Toast ───
   Polished AAA toast shown when a story quest chain advances:
   the previous quest's completion unlocks its direct spine successor.
   Fires on `story:quest_chain_unlock` (see GuidedStoryManager.ts:337-346).

   Layout: top-center card, ~360px wide, slides in from top.
   Visual: gold/cyan glow border, quest icon, NPC portrait, scene name.
   Dismiss: 4s auto-timer OR click anywhere on the card.
   Reduced-motion aware. Screen-reader announcement via AriaLiveRegion.
*/

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollText, Sparkles, MapPin, X } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useNotificationSlot, NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGamePhase } from '@/store/selectors/uiSelectors';
import { findNpcById } from '@/data/allNpcDefinitions';
import { STORY_NODE_TO_NPC_ID } from '@/data/goldenPath';
import { getStoryNodeSceneId } from '@/shared/story/getStoryNodeSceneId';
import { getSceneConfig } from '@/config/scenes';
import { NpcPortrait } from '@/components/game/NpcPortrait';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import type { SceneId } from '@/shared/types/game';

interface ChainUnlockEntry {
  uid: number;
  completedQuestTitle: string;
  nextQuestId: string;
  nextQuestTitle: string;
  nextQuestType: string;
  npcId?: string;
  actNumber: number;
}

const AUTO_DISMISS_MS = 4000;
const TOAST_TOP_PX = 76;
const TOAST_MAX_WIDTH = 380;

let nextEntryUid = 1;

/** Reverse-lookup the scene id where an NPC is anchored (static, schedule-agnostic). */
function findSceneForNpc(npcId: string): SceneId | undefined {
  for (const [nodeId, mappedNpc] of Object.entries(STORY_NODE_TO_NPC_ID)) {
    if (mappedNpc !== npcId) continue;
    const scene = getStoryNodeSceneId(nodeId);
    if (scene) return scene as SceneId;
  }
  return undefined;
}

function resolveSceneName(npcId: string | undefined): string | undefined {
  if (!npcId) return undefined;
  const sceneId = findSceneForNpc(npcId);
  if (!sceneId) return undefined;
  try {
    return getSceneConfig(sceneId).name;
  } catch {
    return undefined;
  }
}

function questTypeLabel(questType: string): string {
  switch (questType) {
    case 'main':
      return 'Сюжетное задание';
    case 'side':
      return 'Побочное задание';
    case 'hidden':
      return 'Скрытое задание';
    case 'daily':
      return 'Ежедневное задание';
    default:
      return 'Новое задание';
  }
}

export function QuestChainUnlockToast() {
  const reducedMotion = useEffectiveReducedMotion();
  const gamePhase = useGamePhase();
  const [entry, setEntry] = useState<ChainUnlockEntry | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // High-priority slot — chain unlock is rare and important; preempt other toasts.
  const slotGranted = useNotificationSlot(
    'quest-chain-unlock',
    NOTIFY_PRIORITY.quest,
    entry !== null,
    { critical: true },
  );

  const dismiss = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setEntry(null);
  }, []);

  useEffect(() => {
    if (gamePhase !== 'exploration') return;

    const unsub = eventBus.on('story:quest_chain_unlock', (payload) => {
      // Clear any pending dismiss timer — the new entry resets the 4s window.
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      setEntry({
        uid: nextEntryUid++,
        completedQuestTitle: payload.completedQuestTitle,
        nextQuestId: payload.nextQuestId,
        nextQuestTitle: payload.nextQuestTitle,
        nextQuestType: payload.nextQuestType,
        npcId: payload.npcId,
        actNumber: payload.actNumber,
      });
    });

    return () => {
      unsub();
    };
  }, [gamePhase]);

  // Auto-dismiss after AUTO_DISMISS_MS — re-armed whenever entry changes.
  useEffect(() => {
    if (!entry) return;
    dismissTimerRef.current = setTimeout(() => {
      dismissTimerRef.current = null;
      setEntry(null);
    }, AUTO_DISMISS_MS);
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [entry]);

  // Hide in menu/intro/cutscene — chain unlock toasts only show in exploration.
  if (gamePhase === 'menu' || gamePhase === 'intro') return null;
  // Don't render if the slot arbiter hasn't granted us a slot (rare since critical=true).
  if (!entry || !slotGranted) {
    return <AriaLiveRegion message="" priority="polite" />;
  }

  const npc = entry.npcId ? findNpcById(entry.npcId) : undefined;
  const npcName = npc?.name;
  const sceneName = resolveSceneName(entry.npcId);
  const typeLabel = questTypeLabel(entry.nextQuestType);

  const ariaMessage = `Новое задание доступно: ${entry.nextQuestTitle}.${
    npcName ? ` Заказчик: ${npcName}.` : ''
  }${sceneName ? ` Локация: ${sceneName}.` : ''
  } Акт ${entry.actNumber}.`;

  const enter = reducedMotion
    ? { opacity: 0, y: 0, scale: 1 }
    : { opacity: 0, y: -28, scale: 0.96 };
  const animate = { opacity: 1, y: 0, scale: 1 };
  const exit = reducedMotion
    ? { opacity: 0, transition: { duration: 0.15 } }
    : { opacity: 0, y: -20, scale: 0.97, transition: { duration: 0.28, ease: [0.4, 0, 1, 1] as const } };

  return (
    <div
      data-exploration-ui
      className="fixed left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ top: TOAST_TOP_PX, zIndex: UI_LAYERS.TOASTS, maxWidth: TOAST_MAX_WIDTH, width: 'calc(100vw - 24px)' }}
      role="status"
      aria-live="polite"
    >
      <AriaLiveRegion message={ariaMessage} priority="polite" />
      <AnimatePresence mode="wait">
        <motion.div
          key={entry.uid}
          initial={enter}
          animate={animate}
          exit={exit}
          transition={{ duration: reducedMotion ? 0.15 : 0.42, ease: [0.16, 1, 0.3, 1] }}
          onClick={dismiss}
          className="pointer-events-auto cursor-pointer relative overflow-hidden rounded-xl"
          style={{
            padding: '14px 16px',
            background:
              'linear-gradient(135deg, rgba(8,12,22,0.96) 0%, rgba(22,18,10,0.94) 60%, rgba(12,18,24,0.96) 100%)',
            border: '1px solid rgba(202,138,4,0.55)',
            boxShadow:
              '0 0 0 1px rgba(0,212,224,0.18), 0 0 22px rgba(202,138,4,0.32), 0 0 42px rgba(0,212,224,0.18), 0 6px 18px rgba(0,0,0,0.55)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Animated gold→cyan gradient border accent (top edge) */}
          <motion.div
            aria-hidden
            className="absolute left-0 right-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(202,138,4,0) 8%, rgba(202,138,4,0.9) 28%, rgba(0,212,224,0.95) 72%, rgba(0,212,224,0) 92%, transparent 100%)',
            }}
            initial={reducedMotion ? false : { opacity: 0.4, scaleX: 0.6 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />

          {/* Soft scanline sweep — decorative, reduced-motion-gated */}
          {!reducedMotion && (
            <motion.div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(120deg, transparent 30%, rgba(255,224,140,0.10) 50%, transparent 70%)',
              }}
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: '100%', opacity: [0, 1, 0] }}
              transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.15 }}
            />
          )}

          {/* Close button (top-right) */}
          <button
            type="button"
            aria-label="Закрыть"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className="absolute top-2 right-2 flex items-center justify-center size-6 rounded
                       text-stone-400 hover:text-amber-200 hover:bg-amber-500/10
                       transition-colors duration-150 focus:outline-none focus-visible:ring-2
                       focus-visible:ring-amber-400/60"
          >
            <X className="size-3.5" aria-hidden />
          </button>

          {/* Header row: icon + type label + act badge */}
          <div className="flex items-center gap-3 pr-6">
            <motion.div
              aria-hidden
              className="flex items-center justify-center size-10 rounded-lg shrink-0"
              style={{
                background:
                  'radial-gradient(circle at 30% 30%, rgba(251,191,36,0.35) 0%, rgba(202,138,4,0.18) 60%, rgba(8,12,22,0.6) 100%)',
                border: '1px solid rgba(251,191,36,0.55)',
                boxShadow: '0 0 12px rgba(251,191,36,0.35), inset 0 0 8px rgba(251,191,36,0.2)',
              }}
              initial={reducedMotion ? false : { rotate: -8, scale: 0.7 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 14, stiffness: 220, delay: 0.05 }}
            >
              <ScrollText className="size-5 text-amber-300" strokeWidth={2.2} />
            </motion.div>

            <div className="flex flex-col min-w-0 flex-1">
              <span
                className="text-[10px] font-semibold tracking-[0.18em] uppercase text-amber-300/85 flex items-center gap-1"
              >
                <Sparkles className="size-3" aria-hidden />
                Новое задание доступно
              </span>
              <span className="text-[11px] text-stone-400/85">{typeLabel}</span>
            </div>

            {/* Act badge */}
            <span
              className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md"
              style={{
                color: 'rgba(0,212,224,0.95)',
                background: 'rgba(0,212,224,0.10)',
                border: '1px solid rgba(0,212,224,0.32)',
              }}
            >
              Акт {entry.actNumber}
            </span>
          </div>

          {/* Quest title */}
          <h3
            className="mt-2.5 text-[15px] font-semibold leading-snug text-amber-50"
            style={{ textShadow: '0 0 12px rgba(251,191,36,0.25)' }}
          >
            {entry.nextQuestTitle}
          </h3>

          {/* Previous quest context line */}
          <p className="mt-1 text-[11px] leading-snug text-stone-400/80">
            Продолжение: <span className="text-stone-300/90">{entry.completedQuestTitle}</span>
          </p>

          {/* NPC + scene row */}
          {(npc || sceneName) && (
            <div className="mt-3 flex items-center gap-3">
              {npc && (
                <NpcPortrait
                  npcId={npc.id}
                  name={npc.name}
                  appearance={npc.appearance}
                  size="sm"
                  decorative
                  className="!rounded-md"
                />
              )}
              <div className="flex flex-col gap-1 min-w-0">
                {npcName && (
                  <span className="text-[12px] font-medium text-amber-100/90 truncate">
                    Заказчик: <span className="text-amber-50">{npcName}</span>
                  </span>
                )}
                {sceneName && (
                  <span className="text-[11px] text-cyan-300/85 flex items-center gap-1 truncate">
                    <MapPin className="size-3 shrink-0" aria-hidden />
                    {sceneName}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Hint footer */}
          <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-stone-500/70">
            Нажмите, чтобы закрыть
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
