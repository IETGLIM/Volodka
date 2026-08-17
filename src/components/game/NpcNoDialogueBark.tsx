
/* ─── Volodka RPG – NPC No-Dialogue Bark ───
   Brief, themed floating bark shown when an NPC has no narrative
   content to display. Cyberpunk glass-morphism styling consistent
   with InteractionHintPopup.
*/

import { useState, useEffect, useRef, useCallback } from 'react';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareOff } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/** How long the bark stays visible (ms) before auto-dismissing. */
const BARK_DISPLAY_DURATION_MS = 2200;

interface BarkData {
  id: number;
  npcId: string;
  barkText: string;
}

export function NpcNoDialogueBark() {
  const [bark, setBark] = useState<BarkData | null>(null);
  const reducedMotion = useEffectiveReducedMotion();
  const idCounterRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const dismiss = useCallback(() => {
    setBark(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('npc:no_dialogue', ({ npcId, barkText }) => {
      idCounterRef.current += 1;
      const id = idCounterRef.current;
      setBark({ id, npcId, barkText });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          dismissRef.current();
        }
      }, BARK_DISPLAY_DURATION_MS);
    });

    return () => {
      unsub();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Auto-dismiss on interaction:end (player moves away / interaction cycle ends)
  useEffect(() => {
    const unsub = eventBus.on('interaction:end', () => {
      // Small delay so the bark is visible briefly before dismissal
      setTimeout(() => {
        if (mountedRef.current) {
          dismissRef.current();
        }
      }, 400);
    });
    return unsub;
  }, []);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 pointer-events-none select-none"
      data-exploration-ui
      data-testid="npc-no-dialogue-bark"
      style={{
        zIndex: UI_LAYERS.TOASTS,
        bottom: 'calc(140px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <AnimatePresence mode="wait">
        {bark && (
          <motion.div
            key={bark.id}
            role="status"
            aria-live="polite"
            aria-label={bark.barkText}
            className="relative overflow-hidden max-w-[360px] rounded-md"
            style={{
              background: 'rgba(0, 8, 16, 0.78)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(100, 180, 200, 0.25)',
              boxShadow: '0 0 16px rgba(100, 180, 200, 0.08), inset 0 0 12px rgba(0,0,0,0.3)',
            }}
            initial={reducedMotion ? false : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
          >
            {/* Scan-line overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
              }}
            />

            {/* Corner brackets */}
            <div
              className="absolute top-0 left-0 w-2 h-2 pointer-events-none"
              style={{ borderTop: '1px solid rgba(100, 180, 200, 0.3)', borderLeft: '1px solid rgba(100, 180, 200, 0.3)' }}
            />
            <div
              className="absolute top-0 right-0 w-2 h-2 pointer-events-none"
              style={{ borderTop: '1px solid rgba(100, 180, 200, 0.3)', borderRight: '1px solid rgba(100, 180, 200, 0.3)' }}
            />
            <div
              className="absolute bottom-0 left-0 w-2 h-2 pointer-events-none"
              style={{ borderBottom: '1px solid rgba(100, 180, 200, 0.3)', borderLeft: '1px solid rgba(100, 180, 200, 0.3)' }}
            />
            <div
              className="absolute bottom-0 right-0 w-2 h-2 pointer-events-none"
              style={{ borderBottom: '1px solid rgba(100, 180, 200, 0.3)', borderRight: '1px solid rgba(100, 180, 200, 0.3)' }}
            />

            {/* Content */}
            <div className="relative z-20 flex items-center gap-2.5 px-4 py-2.5">
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{ filter: 'drop-shadow(0 0 4px rgba(100, 180, 200, 0.3))' }}
              >
                <MessageSquareOff size={14} color="rgba(100, 180, 200, 0.7)" />
              </div>
              <span
                className="font-mono text-sm tracking-wide"
                style={{
                  color: 'rgba(180, 210, 220, 0.9)',
                  textShadow: '0 0 6px rgba(100, 180, 200, 0.2)',
                }}
              >
                {bark.barkText}
              </span>
            </div>

            {/* Bottom accent line */}
            <div
              className="absolute bottom-0 left-3 right-3 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(100, 180, 200, 0.25), transparent)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
