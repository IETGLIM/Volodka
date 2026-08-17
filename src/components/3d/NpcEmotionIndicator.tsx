/* ─── Volodka RPG – NPC emotion cloud above head ───
 * Shows a short-lived emotion glyph when npc:emotion_triggered fires.
 * Also subscribes to npc:emotion_change for world-space floating labels
 * with AnimatePresence fade-in/out (1.5 s visible, 0.5 s fade-out).
 * Uses Html billboard (same pattern as proximity markers).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { getNpcEmotion } from '@/engine/npc/npcEmotionalReactions';
import {
  NPC_EMOTION_LABELS,
  type NpcEmotion,
} from '@/engine/npc/npcEmotionTypes';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/* ─── Glyphs ─── */

const EMOTION_GLYPHS: Record<NpcEmotion, string> = {
  neutral: '😐',
  curious: '🤔',
  alarmed: '😨',
  contemplative: '🧐',
  annoyed: '😤',
  respectful: '🙏',
  fearful: '😰',
};

/* ─── Color coding per emotion ─── */

const EMOTION_COLOR: Record<NpcEmotion, string> = {
  neutral: '#9ca3af',     /* gray */
  curious: '#f59e0b',     /* amber */
  alarmed: '#f43f5e',     /* rose */
  contemplative: '#3b82f6', /* blue */
  annoyed: '#f97316',     /* orange */
  respectful: '#10b981',  /* emerald */
  fearful: '#ef4444',     /* red */
};

/* ─── Legacy tint (kept for npc:emotion_triggered path) ─── */

const EMOTION_TINT: Record<NpcEmotion, string> = {
  neutral: 'rgba(148,163,184,0.85)',
  curious: 'rgba(56,189,248,0.9)',
  alarmed: 'rgba(251,146,60,0.9)',
  contemplative: 'rgba(167,139,250,0.9)',
  annoyed: 'rgba(248,113,113,0.9)',
  respectful: 'rgba(52,211,153,0.9)',
  fearful: 'rgba(251,113,133,0.9)',
};

/* ─── Timing ─── */

/** Duration the emotion label stays fully visible before fading out. */
const VISIBLE_DURATION_MS = 1500;
/** Duration of the fade-out transition. */
const FADE_OUT_DURATION_S = 0.5;

/* ─── Component ─── */

export function NpcEmotionIndicator({ npcId }: { npcId: string }) {
  const [emotion, setEmotion] = useState<NpcEmotion>(() => getNpcEmotion(npcId));
  const [visible, setVisible] = useState(() => getNpcEmotion(npcId) !== 'neutral');

  /* ── npc:emotion_change path (world-space floating label) ── */
  const [changeEmotion, setChangeEmotion] = useState<NpcEmotion | null>(null);
  const [changeVisible, setChangeVisible] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useEffectiveReducedMotion();

  const scheduleChangeDismiss = useCallback(() => {
    if (dismissTimerRef.current !== null) {
      clearTimeout(dismissTimerRef.current);
    }
    dismissTimerRef.current = setTimeout(() => {
      setChangeVisible(false);
    }, VISIBLE_DURATION_MS);
  }, []);

  /* ── Subscribe to npc:emotion_triggered / npc:emotion_decayed (legacy) ── */
  useEffect(() => {
    const unsubTrigger = eventBus.on('npc:emotion_triggered', ({ npcId: id, emotion: next }) => {
      if (id !== npcId) return;
      setEmotion(next);
      setVisible(next !== 'neutral');
    });
    const unsubDecay = eventBus.on('npc:emotion_decayed', ({ npcId: id }) => {
      if (id !== npcId) return;
      setEmotion('neutral');
      setVisible(false);
    });
    return () => {
      unsubTrigger();
      unsubDecay();
    };
  }, [npcId]);

  /* ── Subscribe to npc:emotion_change (new world-space label) ── */
  useEffect(() => {
    const unsubChange = eventBus.on('npc:emotion_change', ({ npcId: id, emotion: next }) => {
      if (id !== npcId) return;
      setChangeEmotion(next);
      setChangeVisible(true);
      scheduleChangeDismiss();
    });
    return () => {
      unsubChange();
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [npcId, scheduleChangeDismiss]);

  /* ── Cleanup timer on unmount ── */
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current !== null) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  /* ── Legacy glyph path ── */
  if (!visible || emotion === 'neutral') {
    /* fall through to change label below */
  } else {
    const glyph = EMOTION_GLYPHS[emotion];
    const label = NPC_EMOTION_LABELS[emotion];
    const tint = EMOTION_TINT[emotion];

    return (
      <Html
        position={[0, 2.45, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
        zIndexRange={[20, 0]}
      >
        <div
          role="img"
          aria-label={label}
          title={label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            animation: 'npc-emotion-pop 280ms ease-out',
          }}
        >
          <div
            style={{
              fontSize: 22,
              lineHeight: 1,
              filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.85))',
              transform: 'translateZ(0)',
            }}
          >
            {glyph}
          </div>
          <span
            style={{
              fontSize: 9,
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#e2e8f0',
              background: tint,
              padding: '2px 6px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
            }}
          >
            {label}
          </span>
        </div>
        <style>{`
          @keyframes npc-emotion-pop {
            from { opacity: 0; transform: translateY(6px) scale(0.85); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </Html>
    );
  }

  /* ── npc:emotion_change world-space label ── */
  return (
    <Html
      position={[0, 1.8, 0]}
      center
      distanceFactor={8}
      style={{ pointerEvents: 'none', userSelect: 'none' }}
      zIndexRange={[20, 0]}
    >
      <AnimatePresence>
        {changeVisible && changeEmotion && changeEmotion !== 'neutral' && (
          <motion.div
            key={`${npcId}-emotion-${changeEmotion}`}
            role="img"
            aria-label={NPC_EMOTION_LABELS[changeEmotion]}
            title={NPC_EMOTION_LABELS[changeEmotion]}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.85 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.9 }}
            transition={{
              duration: reducedMotion ? 0 : FADE_OUT_DURATION_S,
              ease: 'easeOut',
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontSize: 22,
                lineHeight: 1,
                filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.85))',
                transform: 'translateZ(0)',
              }}
            >
              {EMOTION_GLYPHS[changeEmotion]}
            </div>
            <span
              style={{
                fontSize: 9,
                fontFamily: 'ui-monospace, monospace',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#e2e8f0',
                background: EMOTION_COLOR[changeEmotion],
                padding: '2px 6px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
              }}
            >
              {NPC_EMOTION_LABELS[changeEmotion]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </Html>
  );
}
