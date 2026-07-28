'use client';

/* ─── Volodka RPG – Poem Power Visual Effect ───
   Dramatic full-screen visual when a poem power is activated.
   Triggers from both EventBus ('poem:power_used') and Zustand store
   (poemPowers lastUsed timestamp changes).

   Features:
   - Color-themed flash (cyan / green / amber / red / blue per power type)
   - Floating poem power name with cyberpunk glow
   - Matrix-rain cascade of Cyrillic characters
   - Particle burst from center
   - 2-second duration, then fade out
   - Full-screen overlay at high z-index, pointer-events: none
*/

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { getPoemPower } from '@/engine/PoemPowerSystem';
import { usePoemPowers } from '@/store/selectors';
import { cyberGlowText } from './cyberpunkThemeUtils';

/* ─── Color theme mapping ─── */

const ACT1_COLOR = '#00ffee'; // cyan — awakening, discovery (poem_1..poem_7)
const ACT2_COLOR = '#00ff66'; // green — growth, truth (poem_8..poem_13)
const ACT3_COLOR = '#ffcc00'; // amber — power, revelation (poem_14..poem_18)
const COMBAT_COLOR = '#ff4444'; // red — combat/bypass powers
const DEFENSE_COLOR = '#4488ff'; // blue — defense powers

/** Map poemId to its thematic color */
function getPoemColor(poemId: string): string {
  const numStr = poemId.replace('poem_', '');
  const num = parseInt(numStr, 10);
  if (isNaN(num)) return ACT1_COLOR;

  // Defense powers: Каменная Кожа (poem_10)
  if (num === 10) return DEFENSE_COLOR;

  // Combat/bypass powers: Прорыв (poem_8), Штормовой Ветер (poem_5), Слово Мощь (poem_6)
  if (num === 5 || num === 6 || num === 8) return COMBAT_COLOR;

  // Act ranges
  if (num >= 1 && num <= 7) return ACT1_COLOR;
  if (num >= 8 && num <= 13) return ACT2_COLOR;
  if (num >= 14) return ACT3_COLOR;

  return ACT1_COLOR;
}

/** Map poemId to act number label */
function getActLabel(poemId: string): string {
  const num = parseInt(poemId.replace('poem_', ''), 10);
  if (isNaN(num)) return 'АКТ 1';
  if (num >= 1 && num <= 7) return 'АКТ 1';
  if (num >= 8 && num <= 13) return 'АКТ 2';
  return 'АКТ 3';
}

/* ─── Cyrillic character set for matrix rain ─── */

const CYRILLIC_CHARS = 'абвгдежзийклмнопрстуфхцчшщъыьэюяАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ0123456789{}[]<>/\\|#$@!';

/* ─── Notification type ─── */

interface ActivePowerNotification {
  id: string;
  powerName: string;
  poemId: string;
  timestamp: number;
  color: string;
  actLabel: string;
}

/* ─── Particle burst config ─── */
const PARTICLE_COUNT = 32;

/* ─── Matrix rain column config ─── */
const MATRIX_COLUMN_COUNT = 50;

/* ─── Helper: generate random matrix rain columns ─── */
function generateRainColumns(color: string, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const charCount = 8 + Math.floor(Math.random() * 14);
    return {
      id: i,
      x: `${(i / count) * 100}%`,
      chars: Array.from({ length: charCount }, () =>
        CYRILLIC_CHARS[Math.floor(Math.random() * CYRILLIC_CHARS.length)],
      ),
      charCount,
      duration: 1.5 + Math.random() * 2,
      delay: Math.random() * 0.8,
      color,
    };
  });
}

/* ─── Main Component ─── */

export function PoemPowerEffect() {
  const [notifications, setNotifications] = useState<ActivePowerNotification[]>([]);

  // Track poemPowers from store for state-change detection
  const poemPowers = usePoemPowers();
  const prevPoemPowersRef = useRef(poemPowers);
  const poemPowersJSON = JSON.stringify(poemPowers);

  // Color for current notification
  const currentColor = notifications.length > 0
    ? notifications[notifications.length - 1].color
    : ACT1_COLOR;

  /* ── Create notification from event data ── */
  const createNotification = useCallback((poemId: string, powerName: string) => {
    const notification: ActivePowerNotification = {
      id: `power-fx-${Date.now()}-${poemId}`,
      powerName,
      poemId,
      timestamp: Date.now(),
      color: getPoemColor(poemId),
      actLabel: getActLabel(poemId),
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remove after 2.5 seconds (2s display + 0.5s exit)
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 2500);
  }, []);

  /* ── Listen to EventBus 'poem:power_used' ── */
  useEffect(() => {
    const unsub = eventBus.on('poem:power_used', (payload: { poemId: string; powerName: string }) => {
      createNotification(payload.poemId, payload.powerName);
    });
    return () => unsub();
  }, [createNotification]);

  /* ── Also listen to poemPowers store changes as a fallback trigger ── */
  useEffect(() => {
    // Compare new state vs. previous ref
    const prev = prevPoemPowersRef.current;
    const curr = poemPowers;

    // Find entries where lastUsed changed (i.e., a power was just activated)
    for (const [poemId, state] of Object.entries(curr)) {
      const prevState = prev[poemId];
      if (prevState && state.lastUsed !== prevState.lastUsed && state.lastUsed > 0) {
        // Check if we already have a very recent notification for this poemId (debounce)
        const hasRecent = notifications.some(
          (n) => n.poemId === poemId && Date.now() - n.timestamp < 500,
        );
        if (!hasRecent) {
          const power = getPoemPower(poemId);
          if (power) {
            createNotification(poemId, power.name);
          }
        }
      }
    }

    prevPoemPowersRef.current = curr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poemPowersJSON]);

  const latestNotification = notifications[notifications.length - 1];

  // Generate matrix rain columns when a new notification arrives
  const rainColumns = useMemo(() => {
    if (!latestNotification) return [];
    return generateRainColumns(latestNotification.color, MATRIX_COLUMN_COUNT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestNotification?.id]);

  // Generate particles
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (360 / PARTICLE_COUNT) * i + (Math.random() - 0.5) * 15;
      const distance = 80 + (i % 4) * 60 + Math.random() * 40;
      const delay = i * 0.018;
      const size = 2 + (i % 6);
      return { id: i, angle, distance, delay, size };
    });
  }, []);

  // Current color hex to rgba helper
  const colorRgba = useCallback((alpha: number) => {
    const hex = currentColor;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, [currentColor]);

  return (
    <>
      {/* ── Full-screen overlay: flash + matrix rain + particles ── */}
      <AnimatePresence>
        {latestNotification && (
          <motion.div
            key={`overlay-${latestNotification.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION - 1 }}
          >
            {/* ── Bright initial flash ── */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                background: `radial-gradient(ellipse at center, ${colorRgba(0.35)} 0%, ${colorRgba(0.12)} 40%, transparent 70%)`,
              }}
            />

            {/* ── Lingering glow (longer fade) ── */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 2.0, ease: 'easeOut' }}
              style={{
                background: `radial-gradient(ellipse at center, ${colorRgba(0.1)} 0%, transparent 60%)`,
              }}
            />

            {/* ── Scanline flash ── */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${colorRgba(0.06)} 2px, ${colorRgba(0.06)} 4px)`,
              }}
            />

            {/* ── Matrix rain cascade ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ opacity: 0.2, mixBlendMode: 'screen' as const }}
            >
              {rainColumns.map((col) => (
                <motion.div
                  key={col.id}
                  style={{
                    position: 'absolute',
                    left: col.x,
                    top: '-10%',
                    whiteSpace: 'nowrap',
                    fontFamily: '"Courier New", monospace',
                    fontSize: '13px',
                    lineHeight: '15px',
                  }}
                  initial={{ y: 0, opacity: 0.8 }}
                  animate={{ y: '110vh', opacity: 0 }}
                  transition={{
                    duration: col.duration,
                    delay: col.delay,
                    ease: 'linear',
                  }}
                >
                  {col.chars.map((char, ci) => (
                    <div
                      key={ci}
                      style={{
                        color: ci === col.charCount - 1 ? '#ffffff' : col.color,
                        opacity: ci === col.charCount - 1 ? 1 : Math.max(0.15, 1 - (col.charCount - 1 - ci) * 0.08),
                        textShadow: ci === col.charCount - 1
                          ? `0 0 8px ${col.color}`
                          : 'none',
                      }}
                    >
                      {char}
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>

            {/* ── Particle burst ── */}
            <div className="absolute inset-0 flex items-center justify-center">
              {particles.map((p) => (
                <motion.div
                  key={`particle-${latestNotification.id}-${p.id}`}
                  className="absolute rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    background: colorRgba(0.9),
                    boxShadow: `0 0 ${p.size * 2}px ${colorRgba(0.6)}`,
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                    y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                    opacity: 0,
                    scale: 0.1,
                  }}
                  transition={{ duration: 1.3, delay: p.delay, ease: 'easeOut' }}
                />
              ))}
            </div>

            {/* ── CRT vignette effect ── */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating power name text ── */}
      <AnimatePresence>
        {latestNotification && (
          <motion.div
            key={`text-${latestNotification.id}`}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }}
          >
            <div className="relative text-center px-8">
              {/* Glow behind text */}
              <motion.div
                className="absolute inset-0 -m-16 rounded-2xl pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse, ${colorRgba(0.08)} 0%, transparent 70%)`,
                  filter: 'blur(30px)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />

              {/* Act label */}
              <motion.p
                className="font-mono text-[10px] sm:text-xs tracking-[0.4em] uppercase mb-3"
                style={{
                  color: colorRgba(0.5),
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {latestNotification.actLabel}
              </motion.p>

              {/* "Способность активирована" subtitle */}
              <motion.p
                className="font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase mb-2"
                style={{
                  color: colorRgba(0.6),
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                Способность активирована
              </motion.p>

              {/* Main power name */}
              <motion.h2
                className="font-mono text-3xl sm:text-5xl md:text-6xl font-black tracking-[0.05em] leading-tight"
                style={{
                  color: latestNotification.color,
                  textShadow: cyberGlowText(latestNotification.color),
                }}
                initial={{ scale: 0.4, opacity: 0, y: 20 }}
                animate={{
                  scale: [0.4, 1.15, 1],
                  opacity: [0, 1, 1],
                  y: [20, 0, 0],
                }}
                exit={{ scale: 0.95, opacity: 0, y: -10 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {latestNotification.powerName}
              </motion.h2>

              {/* Decorative line below name */}
              <motion.div
                className="mt-4 h-[1px] mx-auto"
                style={{
                  background: `linear-gradient(90deg, transparent, ${colorRgba(0.5)}, transparent)`,
                }}
                initial={{ width: 0 }}
                animate={{ width: 250 }}
                exit={{ width: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />

              {/* Poem description (fetched from power definition) */}
              {(() => {
                const power = getPoemPower(latestNotification.poemId);
                if (!power) return null;
                return (
                  <motion.p
                    className="font-mono text-xs sm:text-sm mt-3 max-w-sm mx-auto"
                    style={{
                      color: colorRgba(0.55),
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    {power.description}
                  </motion.p>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
