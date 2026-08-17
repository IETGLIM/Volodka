import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore, getGameStore } from '@/store/gameStore';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WhisperSide = 'left' | 'right' | 'top';

interface WhisperPoint {
  text: string;
  position: [number, number, number];
  radius: number;
  side: WhisperSide;
  flagGate?: string;
}

// ---------------------------------------------------------------------------
// Whisper point data — per scene
// ---------------------------------------------------------------------------

const WHISPER_POINTS: Record<string, readonly WhisperPoint[]> = {
  volodka_room: [
    {
      text: 'компьютер... ещё один баг...',
      position: [1.8, 0, -1.0],
      radius: 2.5,
      side: 'right',
    },
    {
      text: 'свет горящих окон — как мёртвые пиксели',
      position: [-1.5, 1.2, -2.5],
      radius: 3,
      side: 'left',
    },
    {
      text: 'коридор. опять этот коридор.',
      position: [0, 0, 2.5],
      radius: 2,
      side: 'top',
    },
  ],
  volodka_corridor: [
    {
      text: 'запах плова...',
      position: [-2.5, 0, 0],
      radius: 3,
      side: 'left',
    },
    {
      text: 'холодный подъезд...',
      position: [2.5, 0, 1.0],
      radius: 2.5,
      side: 'right',
    },
    {
      text: 'кто-то знает...',
      position: [-1.0, 0, -3.0],
      radius: 2,
      side: 'left',
    },
  ],
} as const;

const MAX_VISIBLE_WHISPERS = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function distSq(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}

function getActiveWhispers(
  sceneId: string | null | undefined,
  playerPos: [number, number, number] | null,
  flags: Record<string, boolean | undefined>,
): WhisperPoint[] {
  if (!sceneId || !playerPos) return [];
  const points = WHISPER_POINTS[sceneId];
  if (!points) return [];

  const candidates: { point: WhisperPoint; distance: number }[] = [];

  for (const point of points) {
    if (point.flagGate && !flags[point.flagGate]) continue;
    const distance = Math.sqrt(distSq(playerPos, point.position));
    if (distance < point.radius) {
      candidates.push({ point, distance });
    }
  }

  // Sort by distance — closest first, then cap at MAX_VISIBLE_WHISPERS
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates.slice(0, MAX_VISIBLE_WHISPERS).map((c) => c.point);
}

// ---------------------------------------------------------------------------
// Inline styles for the edge-anchored whisper text
// ---------------------------------------------------------------------------

function whisperContainerStyle(side: WhisperSide): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'fixed',
    zIndex: UI_LAYERS.HUD,
    pointerEvents: 'none',
    maxWidth: '180px',
  };

  switch (side) {
    case 'left':
      return { ...base, left: 16, top: '35%', writingMode: 'vertical-rl' as const };
    case 'right':
      return { ...base, right: 16, top: '35%', writingMode: 'vertical-rl' as const };
    case 'top':
      return { ...base, top: 48, left: '50%', transform: 'translateX(-50%)' };
  }
}

const WHISPER_TEXT_STYLE: React.CSSProperties = {
  fontSize: '11px',
  fontStyle: 'italic',
  color: 'var(--cyber-cyan)',
  opacity: 0.45,
  textShadow: '0 0 8px var(--cyber-cyan), 0 0 20px rgba(0, 255, 255, 0.15)',
  lineHeight: 1.4,
  letterSpacing: '0.04em',
  userSelect: 'none',
  whiteSpace: 'pre-line',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ProximityWhisperOverlay = memo(function ProximityWhisperOverlay() {
  const reducedMotion = useEffectiveReducedMotion();
  const _sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const _playerPos = useGameStore((s) => s.exploration.playerPosition);
  const _flags = useGameStore((s) => s.playerState.flags);
  void _sceneId; void _playerPos; void _flags;

  const [visibleWhispers, setVisibleWhispers] = useState<WhisperPoint[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastWhisperKeysRef = useRef<string>('');

  const tick = useCallback(() => {
    const state = getGameStore();
    const liveSceneId = state.exploration.currentSceneId;

    if (!WHISPER_POINTS[liveSceneId]) {
      // No whisper data for this scene — skip all computation
      if (lastWhisperKeysRef.current !== '') {
        lastWhisperKeysRef.current = '';
        setVisibleWhispers([]);
      }
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const active = getActiveWhispers(liveSceneId, state.exploration.playerPosition, state.playerState.flags);
    const key = active.map((w) => w.text).join('|');
    if (key !== lastWhisperKeysRef.current) {
      lastWhisperKeysRef.current = key;
      setVisibleWhispers(active);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  const fadeDuration = reducedMotion ? 0 : 0.8;

  return (
    <>
      <AnimatePresence>
        {visibleWhispers.map((whisper) => (
          <motion.div
            key={`${whisper.text}-${whisper.side}`}
            style={whisperContainerStyle(whisper.side)}
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: fadeDuration, ease: 'easeInOut' }}
            aria-hidden
          >
            <span className="text-shadow-neon-cyan" style={WHISPER_TEXT_STYLE}>{whisper.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
});