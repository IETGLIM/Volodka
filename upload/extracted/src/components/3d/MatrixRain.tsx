'use client';

/* ─── Volodka RPG – MatrixRain Effect ─── */
/* Green cascading characters (Cyrillic + Latin + code symbols)
   Falls like rain as a screen-space overlay using pure CSS animations.
   Only appears during story/text stages (visual-novel mode, cutscene),
   NOT during exploration gameplay.
   Replaces Canvas2D approach (~1680 fillText/frame) with zero-JS-per-frame
   CSS keyframe animation for massive GPU savings. */

import { useMemo, useEffect, useState, useSyncExternalStore } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/** Character set: digits, hex, brackets, operators, Greek, Cyrillic, OpenStack/Bash commands */
const CHARS = '0123456789ABCDEF{}[]<>/\\|#$@!αβγδεζηθклмнопрстуфхцчшщъыьэюяsudo_openstack_nova_awk_grep';

/** Classic Matrix green — brighter for distinctness */
const MATRIX_GREEN = '#00ff41';
const HEAD_GREEN = '#aaffcc'; // bright leading char

/** How many columns of rain to render (scales with screen width) */
const COLUMN_WIDTH = 16; // px per column — tighter for more detail

/** Opacity of the entire overlay — more distinct */
const OVERLAY_OPACITY = 0.25;

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

interface ColumnData {
  id: number;
  x: number;
  chars: string[];
  duration: number;
  delay: number;
}

/** Build column data for current viewport width */
function buildColumns(width: number): ColumnData[] {
  const count = Math.ceil(width / COLUMN_WIDTH);
  return Array.from({ length: Math.min(count, 120) }, (_, i) => ({
    id: i,
    x: i * COLUMN_WIDTH,
    chars: Array.from({ length: 20 + Math.floor(Math.random() * 15) }, () => randomChar()),
    duration: 4 + Math.random() * 8,
    delay: Math.random() * 5,
  }));
}

export function MatrixRain() {
  const mode = useGameStore((s) => s.mode);
  const showStoryOverlay = useGameStore((s) => s.showStoryOverlay);
  const enabled = mode === 'visual-novel' || mode === 'cutscene' || showStoryOverlay;

  // SSR-safe: only compute columns on client
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Speed multiplier from EventBus (for minigames/glitch)
  // Implemented as CSS animation-duration change instead of JS per-frame speed
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);

  useEffect(() => {
    const unsubOpen = eventBus.on('minigame:open', ({ gameType }) => {
      if (gameType === 'codebreaker' || gameType === 'openstack_terminal' || gameType === 'bash_terminal') {
        setSpeedMultiplier(3.0);
      }
    });
    const unsubClose = eventBus.on('minigame:close', () => {
      setSpeedMultiplier(1.0);
    });
    const unsubComplete = eventBus.on('minigame:complete', () => {
      setSpeedMultiplier(1.0);
    });
    const unsubGlitch = eventBus.on('fx:glitch', () => {
      setSpeedMultiplier((prev) => Math.min(prev + 1.5, 5.0));
      const timer = setTimeout(() => {
        setSpeedMultiplier((prev) => Math.max(prev - 1.5, 1.0));
      }, 600);
      return () => clearTimeout(timer);
    });

    return () => {
      unsubOpen();
      unsubClose();
      unsubComplete();
      unsubGlitch();
    };
  }, []);

  // Build columns once on mount (SSR-safe)
  const columns = useMemo<ColumnData[]>(() => {
    if (!mounted) return [];
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    return buildColumns(width);
  }, [mounted]);

  if (!enabled || !mounted) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        opacity: OVERLAY_OPACITY,
        zIndex: UI_LAYERS.GLITCH,
        mixBlendMode: 'screen',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {columns.map((col) => (
        <div
          key={col.id}
          style={{
            position: 'absolute',
            left: col.x,
            top: '-100%',
            animation: `matrixFall ${col.duration / speedMultiplier}s linear ${col.delay / speedMultiplier}s infinite`,
            whiteSpace: 'nowrap',
            fontFamily: '"Courier New", "Lucida Console", monospace',
            fontSize: '16px',
            lineHeight: '16px',
          }}
        >
          {col.chars.map((char, ci) => (
            <div
              key={ci}
              style={{
                color: ci === col.chars.length - 1 ? HEAD_GREEN : MATRIX_GREEN,
                opacity: ci === col.chars.length - 1 ? 1 : Math.max(0.1, 1 - (col.chars.length - 1 - ci) * 0.06),
                textShadow: ci === col.chars.length - 1
                  ? `0 0 8px ${MATRIX_GREEN}`
                  : 'none',
              }}
            >
              {char}
            </div>
          ))}
        </div>
      ))}
      <style>{`
        @keyframes matrixFall {
          0% { transform: translateY(0); }
          100% { transform: translateY(calc(200vh + 100%)); }
        }
      `}</style>
    </div>
  );
}
