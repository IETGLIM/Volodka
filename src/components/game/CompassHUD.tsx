
/* ─── Volodka RPG – Compass HUD ───
   Top-center compass strip showing the player's facing direction
   with Cyrillic cardinal labels and cyberpunk glass-morphism styling.
*/

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamePhase } from '@/store/selectors';
import { useGameStore } from '@/store/gameStore';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { sharedPlayerRotationRef } from '@/engine/PlayerRotationState';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { explorationCompassTopPx } from '@/shared/constants/hudLayout';

/* ── Cyrillic cardinal directions ── */
interface CompassDir {
  label: string;
  angle: number; // radians, 0 = North (-Z)
  short: string;
}

const COMPASS_DIRS: CompassDir[] = [
  { label: 'С',  angle: 0,            short: 'С'  },
  { label: 'СВ', angle: Math.PI / 4,  short: 'СВ' },
  { label: 'В',  angle: Math.PI / 2,  short: 'В'  },
  { label: 'ЮВ', angle: 3 * Math.PI / 4, short: 'ЮВ' },
  { label: 'Ю',  angle: Math.PI,       short: 'Ю'  },
  { label: 'ЮЗ', angle: 5 * Math.PI / 4, short: 'ЮЗ' },
  { label: 'З',  angle: 3 * Math.PI / 2, short: 'З'  },
  { label: 'СЗ', angle: 7 * Math.PI / 4, short: 'СЗ' },
];

/* ── Normalize angle to [0, 2π) ── */
function normalizeAngle(a: number): number {
  const TWO_PI = Math.PI * 2;
  let n = a % TWO_PI;
  if (n < 0) n += TWO_PI;
  return n;
}

/* ── Get the closest direction index for a given angle ── */
function getClosestDirIndex(angle: number): number {
  const norm = normalizeAngle(angle);
  let closest = 0;
  let minDist = Infinity;
  for (let i = 0; i < COMPASS_DIRS.length; i++) {
    let diff = Math.abs(norm - COMPASS_DIRS[i].angle);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff < minDist) {
      minDist = diff;
      closest = i;
    }
  }
  return closest;
}

/* ── Compass marker component ── */
function CompassMarker({
  dir,
  isActive,
  offset,
}: {
  dir: CompassDir;
  isActive: boolean;
  offset: number;
}) {
  const isCardinal = dir.label.length === 1;

  return (
    <div
      className="compass-marker absolute flex flex-col items-center justify-center select-none"
      style={{
        transform: `translateX(${offset}px)`,
        left: '50%',
        top: 0,
        bottom: 0,
      }}
    >
      {/* Direction label */}
      <span
        className={`font-mono tracking-wider transition-all duration-150 ${
          isActive
            ? 'text-cyan-300 text-base font-bold'
            : isCardinal
              ? 'text-slate-400 text-xs font-medium'
              : 'text-slate-500 text-[10px] font-normal'
        }`}
        style={
          isActive
            ? {
                textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.6), 0 0 16px rgb(var(--cyber-cyan-rgb) / 0.3)',
              }
            : undefined
        }
      >
        {dir.label}
      </span>
    </div>
  );
}

/* ── Tick mark between directions ── */
function TickMark({ offset, isMajor }: { offset: number; isMajor: boolean }) {
  return (
    <div
      className="absolute top-0 bottom-0 flex items-center justify-center pointer-events-none"
      style={{
        transform: `translateX(${offset}px)`,
        left: '50%',
      }}
    >
      <div
        className={`${isMajor ? 'w-px h-3' : 'w-px h-1.5'}`}
        style={{
          background: isMajor
            ? 'rgb(var(--cyber-cyan-rgb) / 0.2)'
            : 'rgb(var(--cyber-cyan-rgb) / 0.08)',
        }}
      />
    </div>
  );
}

/* ── Main component ── */
export function CompassHUD() {
  const mode = useGamePhase();
  const reducedMotion = useEffectiveReducedMotion();
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const quietStyle = useHudQuietStyle();
  const [rotation, setRotation] = useState(sharedPlayerRotationRef.current);
  const rafRef = useRef<number | null>(null);

  /* ── Read rotation via rAF loop (no React state churn) ── */
  useEffect(() => {
    if (mode !== 'exploration') return;

    const tick = () => {
      setRotation(sharedPlayerRotationRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [mode]);

  /* ── Compute compass data ── */
  const { centerOffset, closestIdx } = useMemo(() => {
    // In Three.js, rotation.y = 0 means facing -Z (North).
    // rotation.y positive = counterclockwise from above.
    // For the compass strip, we map so that:
    //   rotation 0 → North at center
    //   rotation increasing → strip moves right (directions appear to scroll left)
    const normalized = normalizeAngle(rotation);
    // Offset in "radians" from North
    const centerOffset = -normalized; // negative because we want the strip to slide opposite to rotation
    const closestIdx = getClosestDirIndex(normalized);
    return { centerOffset, closestIdx };
  }, [rotation]);

  /* ── Pixel-per-radian scale ── */
  const PX_PER_RAD = 120; // pixels per radian — controls how "wide" the compass feels

  /* ── Generate markers (3 full rotations worth for seamless wrap) ── */
  const markers = useMemo(() => {
    const result: Array<{
      key: string;
      dir: CompassDir;
      offset: number;
      isActive: boolean;
      wrapIndex: number;
    }> = [];

    // Show 3 full wraps of the compass (-1, 0, +1)
    for (let wrap = -1; wrap <= 1; wrap++) {
      COMPASS_DIRS.forEach((dir, i) => {
        const angleOffset = dir.angle + wrap * Math.PI * 2;
        const pxOffset = (angleOffset + centerOffset) * PX_PER_RAD;
        const isActive = wrap === 0 && i === closestIdx;
        result.push({
          key: `${wrap}-${i}`,
          dir,
          offset: pxOffset,
          isActive,
          wrapIndex: wrap,
        });
      });
    }
    return result;
  }, [centerOffset, closestIdx, PX_PER_RAD]);

  /* ── Generate tick marks between directions ── */
  const ticks = useMemo(() => {
    const result: Array<{ key: string; offset: number; isMajor: boolean }> = [];
    for (let wrap = -1; wrap <= 1; wrap++) {
      for (let i = 0; i < COMPASS_DIRS.length; i++) {
        // Midpoint tick between this direction and the next
        const midAngle = COMPASS_DIRS[i].angle + Math.PI / 8 + wrap * Math.PI * 2;
        const pxOffset = (midAngle + centerOffset) * PX_PER_RAD;
        result.push({
          key: `tick-${wrap}-${i}`,
          offset: pxOffset,
          isMajor: COMPASS_DIRS[i].label.length === 1, // major tick after cardinal
        });
      }
    }
    return result;
  }, [centerOffset, PX_PER_RAD]);

  /* ── Visibility: exploration + outdoor only (a compass indoors is noise) ── */
  const isOutdoor = SCENE_DEFINITIONS[sceneId]?.type === 'outdoor';
  const isVisible = mode === 'exploration' && isOutdoor;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -20 }}
          transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
          className="compass-hud fixed left-1/2 -translate-x-1/2 pointer-events-none"
          data-exploration-ui
          data-testid="compass-hud"
          style={{ top: explorationCompassTopPx(), zIndex: UI_LAYERS.HUD + 1, ...quietStyle }}
        >
          {/* Glass-morphism container */}
          <div
            className="relative overflow-hidden"
            style={{
              width: '320px',
              height: '32px',
              maxWidth: '80vw',
              background: 'rgba(0, 8, 16, 0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.15)',
              borderRadius: '4px',
              boxShadow: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.06), inset 0 0 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
              }}
            />

            {/* Hex grid subtle pattern */}
            <div
              className="absolute inset-0 pointer-events-none z-0 opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2322d3ee' fill-opacity='0.03'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            {/* Direction markers strip */}
            <div className="relative w-full h-full z-5">
              {/* Tick marks */}
              {ticks
                .filter((t) => Math.abs(t.offset) < 200)
                .map((t) => (
                  <TickMark key={t.key} offset={t.offset} isMajor={t.isMajor} />
                ))}

              {/* Direction labels */}
              {markers
                .filter((m) => Math.abs(m.offset) < 200)
                .map((m) => (
                  <CompassMarker
                    key={m.key}
                    dir={m.dir}
                    isActive={m.isActive}
                    offset={m.offset}
                  />
                ))}
            </div>

            {/* Edge fades */}
            <div
              className="absolute inset-y-0 left-0 w-12 z-20 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, rgba(0,8,16,0.95), transparent)',
              }}
            />
            <div
              className="absolute inset-y-0 right-0 w-12 z-20 pointer-events-none"
              style={{
                background: 'linear-gradient(-90deg, rgba(0,8,16,0.95), transparent)',
              }}
            />
          </div>

          {/* Center indicator ▼ */}
          <div
            className="compass-center-indicator absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
            style={{ top: '-2px' }}
          >
            <span
              className="text-cyan-400 text-[10px] leading-none"
              style={{
                textShadow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.6), 0 0 12px rgb(var(--cyber-cyan-rgb) / 0.3)',
                filter: 'drop-shadow(0 0 2px rgb(var(--cyber-cyan-rgb) / 0.8))',
              }}
            >
              ▼
            </span>
          </div>

          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-cyan-500/20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-cyan-500/20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-cyan-500/20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-cyan-500/20 pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
