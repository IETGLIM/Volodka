/* ─── Boss Defeat Cinematic — slow-mo + dissolve + gold burst ───
 *
 * Listens to `combat:victory`. When the defeated enemy was a boss (one of
 * the three act finale bosses), plays a ~2-second slow-mo victory cinematic:
 *   1. Bullet-time event emitted (existing slow-mo pipeline picks it up).
 *   2. A full-screen overlay renders on top of the combat arena with a
 *      dissolving effect (CSS `filter: blur() + brightness` ramp on a
 *      white/gold radial wash).
 *   3. The word «ПОВЕРЖЕН» (Russian for "vanquished") appears center-screen
 *      with a scale-up + chromatic-split glitch.
 *   4. A burst of gold particles spawns from the center and drifts outward.
 *   5. The overlay fades out, the regular victory screen takes over.
 *
 * Implementation notes:
 *   - Pure CSS / framer-motion — no new 3D assets.
 *   - The "dissolve" effect is achieved via CSS `filter` on a sibling
 *     overlay that sits ABOVE the regular combat UI (zIndex COMBAT + 6).
 *     We don't blur the actual combat DOM tree (which would be expensive
 *     and would also blur our own «ПОВЕРЖЕН» text); instead we layer a
 *     radial white-gold wash on top that pulses in opacity, simulating
 *     the "everything is dissolving into light" feel.
 *   - The slow-mo is fired via the existing `combat:bullet_time` event
 *     so the music engine + camera shake pipeline treat this like any
 *     other bullet-time moment.
 *
 * All visible text is Russian. Code identifiers / structural comments are
 * English to match the surrounding file style.
 */

'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { isBossEnemyType } from '@/engine/combat/types';
import type { EnemyType } from '@/shared/types/game';
import { triggerCameraShake } from '@/engine/camera/cameraShake';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ══════════════════════════════════════════════════════════════
   Timing
   ══════════════════════════════════════════════════════════════ */

/** Total defeat cinematic runtime (ms). */
const DEFEAT_TOTAL_MS = 2000;
/** Slow-mo bullet-time duration (s) — sent to the existing pipeline. */
const DEFEAT_BULLET_TIME_S = 1.8;
/** Slow-mo intensity (0..1) — gentle, more "awe" than "violence". */
const DEFEAT_BULLET_TIME_INTENSITY = 0.18;
/** When (ms) the gold particle burst spawns. */
const BURST_AT_MS = 120;
/** When (ms) the «ПОВЕРЖЕН» text begins fading out. */
const TEXT_FADE_OUT_AT_MS = DEFEAT_TOTAL_MS - 350;

/* ══════════════════════════════════════════════════════════════
   Seeded RNG — deterministic particle positions so re-renders are stable.
   ══════════════════════════════════════════════════════════════ */

const seededRand = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  const fract = x - Math.floor(x);
  return Number.isFinite(fract) ? fract : 0;
};

interface GoldParticle {
  id: number;
  /** Start position offset from center (% of viewport, -50..50). */
  x: number;
  y: number;
  /** Drift distance (% of viewport). */
  dx: number;
  dy: number;
  /** Particle size (px). */
  size: number;
  /** Spawn delay (s). */
  delay: number;
  /** Animation duration (s). */
  duration: number;
}

/* ══════════════════════════════════════════════════════════════
   Gold particle burst — spawns ~28 gold motes from screen center,
   drifts outward with gravity-like arc + fade.
   ══════════════════════════════════════════════════════════════ */

const GoldBurst = memo(function GoldBurst({ reducedMotion }: { reducedMotion: boolean }) {
  const particles = useMemo<GoldParticle[]>(() => {
    const count = 28;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + seededRand(i) * 0.4;
      const speed = 18 + seededRand(i + 100) * 24; // 18..42% viewport
      return {
        id: i,
        x: 0,
        y: 0,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 8 - seededRand(i + 200) * 6, // bias upward
        size: 3 + seededRand(i + 300) * 5,
        delay: seededRand(i + 400) * 0.18,
        duration: 1.1 + seededRand(i + 500) * 0.5,
      };
    });
  }, []);

  if (reducedMotion) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: 'radial-gradient(circle, #fde68a 0%, #fbbf24 50%, #f59e0b 100%)',
            boxShadow: '0 0 6px rgba(251,191,36,0.9), 0 0 14px rgba(251,191,36,0.5)',
          }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{
            x: `${p.dx}vw`,
            y: `${p.dy}vh`,
            opacity: [0, 1, 1, 0],
            scale: [0.4, 1.2, 1.0, 0.6],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
            times: [0, 0.15, 0.6, 1],
          }}
        />
      ))}
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   «ПОВЕРЖЕН» text — scales up with chromatic-split glitch.
   ══════════════════════════════════════════════════════════════ */

const DefeatText = memo(function DefeatText({
  reducedMotion,
  visible,
}: {
  reducedMotion: boolean;
  visible: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.35, ease: 'easeOut' }}
      aria-live="assertive"
      role="status"
      aria-label="Босс повержен"
    >
      <motion.h2
        className="cyber-glitch-text font-mono font-extrabold uppercase tracking-[0.3em] leading-tight text-center px-4"
        style={{
          fontSize: 'clamp(2.8rem, 11vw, 7rem)',
          color: '#fde68a',
          textShadow:
            '0 0 18px rgba(251,191,36,0.85), 0 0 36px rgba(251,191,36,0.45), 0 4px 12px rgba(0,0,0,0.85)',
          ['--text-glitch-speed' as string]: '1.2s',
        }}
        data-text="ПОВЕРЖЕН"
        initial={{ scale: 0.7, opacity: 0, filter: 'blur(12px)' }}
        animate={{
          scale: visible ? 1 : 1.08,
          opacity: visible ? 1 : 0,
          filter: visible ? 'blur(0px)' : 'blur(8px)',
        }}
        transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.22, 0.61, 0.36, 1] }}
      >
        ПОВЕРЖЕН
      </motion.h2>
    </motion.div>
  );
});

/* ══════════════════════════════════════════════════════════════
   Dissolve wash — radial white-gold overlay that pulses in opacity.
   Simulates the "everything is dissolving into light" feel without
   actually blurring the combat DOM (which would be expensive and would
   also blur our «ПОВЕРЖЕН» text).
   ══════════════════════════════════════════════════════════════ */

const DissolveWash = memo(function DissolveWash({
  reducedMotion,
  visible,
}: {
  reducedMotion: boolean;
  visible: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: UI_LAYERS.COMBAT + 5,
        background:
          'radial-gradient(ellipse at center, rgba(255,250,220,0.55) 0%, rgba(251,191,36,0.25) 30%, rgba(0,0,0,0) 70%)',
        mixBlendMode: 'screen',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? [0, 0.85, 0.45, 0.9, 0] : 0 }}
      transition={{
        duration: reducedMotion ? 0 : DEFEAT_TOTAL_MS / 1000,
        times: [0, 0.2, 0.45, 0.7, 1],
        ease: 'easeOut',
      }}
      aria-hidden="true"
    />
  );
});

/* ══════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════ */

export const BossDefeatCinematic = memo(function BossDefeatCinematic() {
  const reducedMotion = useEffectiveReducedMotion();
  const [defeatBoss, setDefeatBoss] = useState<{ enemyType: EnemyType } | null>(null);
  /** Whether the «ПОВЕРЖЕН» text is in its visible phase. */
  const [textVisible, setTextVisible] = useState(false);
  /** Monotonic key — bumps on every defeat so framer-motion replays entrance. */
  const [runKey, setRunKey] = useState(0);
  /** Separate state for the particle burst — keyed so AnimatePresence can
   *  re-trigger the entrance animations on each new burst. */
  const [burstKey, setBurstKey] = useState(0);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of timers) clearTimeout(id);
      timers.clear();
    };
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('combat:victory', ({ enemyType }) => {
      if (!enemyType || !isBossEnemyType(enemyType)) return;

      // Clear any timers from a previous (interrupted) defeat cinematic.
      for (const id of timersRef.current) clearTimeout(id);
      timersRef.current.clear();

      setRunKey((k) => k + 1);
      setDefeatBoss({ enemyType });
      setTextVisible(false);

      // Emit bullet-time so the existing slow-mo pipeline (music ducking,
      // camera FOV punch, etc.) treats this like any other bullet-time.
      if (!reducedMotion) {
        eventBus.emit('combat:bullet_time', {
          duration: DEFEAT_BULLET_TIME_S,
          intensity: DEFEAT_BULLET_TIME_INTENSITY,
          reason: 'poem_power',
        });
        // Single heavy camera kick — the boss has fallen.
        triggerCameraShake(0.55, 5.5);
      }

      // «ПОВЕРЖЕН» text appears slightly after the dissolve wash starts.
      const textInId = setTimeout(() => setTextVisible(true), 180);
      timersRef.current.add(textInId);

      // Gold particle burst.
      const burstId = setTimeout(() => {
        // The burst is rendered conditionally on `defeatBoss` being set;
        // we use a separate state to trigger it on demand.
        setBurstKey((k) => k + 1);
      }, BURST_AT_MS);
      timersRef.current.add(burstId);

      // Text begins fading out near the end so it doesn't pop.
      const textOutId = setTimeout(() => setTextVisible(false), TEXT_FADE_OUT_AT_MS);
      timersRef.current.add(textOutId);

      // Unmount everything.
      const dismissId = setTimeout(() => {
        timersRef.current.delete(dismissId);
        setDefeatBoss(null);
        setBurstKey(0);
      }, DEFEAT_TOTAL_MS);
      timersRef.current.add(dismissId);
    });
    return unsub;
  }, [reducedMotion]);

  return (
    <AnimatePresence>
      {defeatBoss && (
        <div
          key={`boss-defeat-${runKey}`}
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: UI_LAYERS.COMBAT + 4 }}
          aria-hidden="true"
        >
          <DissolveWash reducedMotion={reducedMotion} visible={textVisible || defeatBoss !== null} />

          {/* Gold particle burst — keyed by burstKey so AnimatePresence can
           *  replay entrance. Rendered only after the burst timer fires
           *  (burstKey > 0). */}
          <AnimatePresence>
            {burstKey > 0 && (
              <motion.div
                key={`burst-${burstKey}`}
                className="absolute inset-0"
                style={{ zIndex: UI_LAYERS.COMBAT + 6 }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <GoldBurst reducedMotion={reducedMotion} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute inset-0" style={{ zIndex: UI_LAYERS.COMBAT + 7 }}>
            <DefeatText reducedMotion={reducedMotion} visible={textVisible} />
          </div>
        </div>
      )}
    </AnimatePresence>
  );
});
