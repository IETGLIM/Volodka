'use client';

/* ══════════════════════════════════════════════════════════════════════════════
   Volodka RPG — HUD Compass with NPC/Quest Blips
   Top-center horizontal bar · direction markers · NPC & quest blips
   ══════════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sharedPlayerRotationRef } from '@/engine/PlayerRotationState';
import { useGamePhase } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { explorationCompassTopPx } from '@/shared/constants/hudLayout';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface CompassBlip {
  id: string;
  name: string;
  /** World-space angle from player (radians, 0 = North/-Z) */
  angle: number;
  /** Distance in world units (for size scaling) */
  distance: number;
  variant: 'npc-friendly' | 'npc-neutral' | 'npc-hostile' | 'quest';
}

interface HudCompassProps {
  blips?: CompassBlip[];
}

/* ── Direction config (Cyrillic) ────────────────────────────────────────────── */

interface CompassDir {
  label: string;
  angle: number;
  isCardinal: boolean;
}

const COMPASS_DIRS: CompassDir[] = [
  { label: 'С',  angle: 0,                  isCardinal: true },
  { label: 'СВ', angle: Math.PI / 4,       isCardinal: false },
  { label: 'В',  angle: Math.PI / 2,       isCardinal: true },
  { label: 'ЮВ', angle: (3 * Math.PI) / 4, isCardinal: false },
  { label: 'Ю',  angle: Math.PI,            isCardinal: true },
  { label: 'ЮЗ', angle: (5 * Math.PI) / 4, isCardinal: false },
  { label: 'З',  angle: (3 * Math.PI) / 2, isCardinal: true },
  { label: 'СЗ', angle: (7 * Math.PI) / 4, isCardinal: false },
];

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function normalizeAngle(a: number): number {
  const TWO_PI = Math.PI * 2;
  let n = a % TWO_PI;
  if (n < 0) n += TWO_PI;
  return n;
}

function angleDiff(a: number, b: number): number {
  let d = a - b;
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/* ── Blip color map ────────────────────────────────────────────────────────── */

const BLIP_COLORS: Record<CompassBlip['variant'], { bg: string; glow: string; border: string }> = {
  'npc-friendly': { bg: 'rgba(52,211,153,0.9)', glow: 'rgba(52,211,153,0.4)', border: 'rgba(52,211,153,0.5)' },
  'npc-neutral':  { bg: 'rgba(148,163,184,0.8)', glow: 'rgba(148,163,184,0.3)', border: 'rgba(148,163,184,0.4)' },
  'npc-hostile':  { bg: 'rgba(248,113,113,0.9)', glow: 'rgba(248,113,113,0.4)', border: 'rgba(248,113,113,0.5)' },
  'quest':        { bg: 'rgba(251,191,36,0.9)', glow: 'rgba(251,191,36,0.4)', border: 'rgba(251,191,36,0.5)' },
};

/* ── Blip Component ────────────────────────────────────────────────────────── */

function BlipMarker({ blip, offsetPx }: { blip: CompassBlip; offsetPx: number }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = BLIP_COLORS[blip.variant];
  const isQuest = blip.variant === 'quest';

  return (
    <div
      className="absolute top-0 bottom-0 flex items-center justify-center pointer-events-auto"
      style={{ transform: `translateX(${offsetPx}px)`, left: '50%' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      role="button"
      aria-label={blip.name}
    >
      {/* Blip dot */}
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Outer glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: isQuest ? 14 : 10,
            height: isQuest ? 14 : 10,
            background: colors.glow,
            filter: 'blur(3px)',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Core dot */}
        <div
          className="rounded-full relative"
          style={{
            width: isQuest ? 8 : 6,
            height: isQuest ? 8 : 6,
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            boxShadow: `0 0 4px ${colors.glow}`,
          }}
        />
        {/* Quest diamond indicator */}
        {isQuest && (
          <div
            className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
            style={{ background: colors.bg, boxShadow: `0 0 6px ${colors.glow}` }}
          />
        )}
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-[10px] font-mono"
            style={{
              background: 'rgba(0,8,16,0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: `1px solid ${colors.border}`,
              color: colors.bg,
              textShadow: `0 0 6px ${colors.glow}`,
              zIndex: UI_LAYERS.TOOLTIP,
            }}
          >
            {blip.name}
            {blip.distance < 10 && (
              <span className="ml-1.5" style={{ color: 'rgba(148,163,184,0.5)' }}>
                {blip.distance.toFixed(0)}м
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export function HudCompass({ blips = [] }: HudCompassProps) {
  const mode = useGamePhase();
  const quietStyle = useHudQuietStyle();
  const [rotation, setRotation] = useState(sharedPlayerRotationRef.current);
  const rafRef = useRef<number | null>(null);
  const lastRotRef = useRef(sharedPlayerRotationRef.current);
  const ROTATION_THRESHOLD = 0.0087;

  useEffect(() => {
    if (mode !== 'exploration') return;
    const tick = () => {
      const cur = sharedPlayerRotationRef.current;
      if (Math.abs(cur - lastRotRef.current) > ROTATION_THRESHOLD) {
        lastRotRef.current = cur;
        setRotation(cur);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [mode]);

  const normalizedRot = normalizeAngle(rotation);
  const PX_PER_RAD = 120;

  /* Direction markers */
  const markers = useMemo(() => {
    const result: Array<{ key: string; label: string; offset: number; isCardinal: boolean; isActive: boolean }> = [];
    for (let wrap = -1; wrap <= 1; wrap++) {
      COMPASS_DIRS.forEach((dir, i) => {
        const a = dir.angle + wrap * Math.PI * 2;
        const px = (a - normalizedRot) * PX_PER_RAD;
        const diff = Math.abs(angleDiff(normalizedRot, dir.angle));
        const isActive = diff < Math.PI / 8 && dir.isCardinal;
        result.push({ key: `${wrap}-${i}`, label: dir.label, offset: px, isCardinal: dir.isCardinal, isActive });
      });
    }
    return result;
  }, [normalizedRot]);

  /* Blip offsets relative to player heading */
  const blipOffsets = useMemo(() => {
    return blips.map((b) => ({
      ...b,
      pxOffset: angleDiff(b.angle, normalizedRot) * PX_PER_RAD,
    }));
  }, [blips, normalizedRot]);

  const isVisible = mode === 'exploration';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ top: explorationCompassTopPx(), zIndex: UI_LAYERS.HUD + 1, ...quietStyle }}
          data-testid="hud-compass"
        >
          {/* Compass bar */}
          <div
            className="relative overflow-hidden"
            style={{
              width: '340px',
              maxWidth: '85vw',
              height: '34px',
              background: 'rgba(0,8,16,0.5)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(0,229,255,0.1)',
              borderRadius: '4px',
              boxShadow: '0 0 12px rgba(0,229,255,0.04), inset 0 0 12px rgba(0,0,0,0.3)',
            }}
          >
            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                zIndex: 10,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
              }}
            />

            {/* Content layer */}
            <div className="relative w-full h-full" style={{ zIndex: 5 }}>
              {/* Direction labels */}
              {markers
                .filter((m) => Math.abs(m.offset) < 190)
                .map((m) => (
                  <div
                    key={m.key}
                    className="absolute flex items-center justify-center select-none"
                    style={{
                      transform: `translateX(${m.offset}px)`,
                      left: '50%',
                      top: 0,
                      bottom: 0,
                    }}
                  >
                    <span
                      className={`font-mono tracking-wider transition-all duration-150 ${
                        m.isActive
                          ? 'text-base font-bold'
                          : m.isCardinal
                            ? 'text-xs font-medium'
                            : 'text-[10px]'
                      }`}
                      style={{
                        color: m.isActive ? '#00e5ff' : m.isCardinal ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.4)',
                        textShadow: m.isActive ? '0 0 8px rgba(0,229,255,0.6), 0 0 16px rgba(0,229,255,0.3)' : undefined,
                      }}
                    >
                      {m.label}
                    </span>
                  </div>
                ))}

              {/* NPC/Quest blips */}
              {blipOffsets
                .filter((b) => Math.abs(b.pxOffset) < 180)
                .map((b) => (
                  <BlipMarker key={b.id} blip={b} offsetPx={b.pxOffset} />
                ))}
            </div>

            {/* Edge fades */}
            <div className="absolute inset-y-0 left-0 w-14 pointer-events-none" style={{ zIndex: 20, background: 'linear-gradient(90deg, rgba(0,8,16,0.95), transparent)' }} />
            <div className="absolute inset-y-0 right-0 w-14 pointer-events-none" style={{ zIndex: 20, background: 'linear-gradient(-90deg, rgba(0,8,16,0.95), transparent)' }} />
          </div>

          {/* Center indicator ▼ */}
          <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ top: '-3px' }}>
            <span
              className="text-[10px] leading-none"
              style={{
                color: '#00e5ff',
                textShadow: '0 0 6px rgba(0,229,255,0.6), 0 0 12px rgba(0,229,255,0.3)',
              }}
            >
              ▼
            </span>
          </div>

          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l pointer-events-none" style={{ borderColor: 'rgba(0,229,255,0.15)' }} />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r pointer-events-none" style={{ borderColor: 'rgba(0,229,255,0.15)' }} />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l pointer-events-none" style={{ borderColor: 'rgba(0,229,255,0.15)' }} />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r pointer-events-none" style={{ borderColor: 'rgba(0,229,255,0.15)' }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
