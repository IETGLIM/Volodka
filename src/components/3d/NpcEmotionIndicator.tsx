/* ─── Volodka RPG – NPC emotion cloud above head ───
 * Shows a short-lived emotion glyph when npc:emotion_triggered fires.
 * Uses Html billboard (same pattern as proximity markers).
 */

import { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { eventBus } from '@/engine/EventBus';
import { getNpcEmotion } from '@/engine/npc/npcEmotionalReactions';
import {
  NPC_EMOTION_LABELS,
  type NpcEmotion,
} from '@/engine/npc/npcEmotionTypes';

const EMOTION_GLYPHS: Record<NpcEmotion, string> = {
  neutral: '😐',
  curious: '🤔',
  alarmed: '😨',
  contemplative: '🧐',
  annoyed: '😤',
  respectful: '🙏',
  fearful: '😰',
};

const EMOTION_TINT: Record<NpcEmotion, string> = {
  neutral: 'rgba(148,163,184,0.85)',
  curious: 'rgba(56,189,248,0.9)',
  alarmed: 'rgba(251,146,60,0.9)',
  contemplative: 'rgba(167,139,250,0.9)',
  annoyed: 'rgba(248,113,113,0.9)',
  respectful: 'rgba(52,211,153,0.9)',
  fearful: 'rgba(251,113,133,0.9)',
};

export function NpcEmotionIndicator({ npcId }: { npcId: string }) {
  const [emotion, setEmotion] = useState<NpcEmotion>(() => getNpcEmotion(npcId));
  const [visible, setVisible] = useState(() => getNpcEmotion(npcId) !== 'neutral');

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

  if (!visible || emotion === 'neutral') return null;

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
