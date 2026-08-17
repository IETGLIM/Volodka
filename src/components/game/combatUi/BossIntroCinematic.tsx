/* ─── Boss Intro Cinematic — letterbox + glitch + chromatic pulse ───
 * Listens to `combat:start`. When the enemy type is a boss (one of the three
 * act finale bosses), plays a dramatic 3-second letterbox intro:
 *   1. Black bars slide in top/bottom (framer-motion).
 *   2. Boss name + title appear center screen with a CSS glitch effect.
 *   3. Atmospheric Russian subtitle line fades in below the title.
 *   4. Red/cyan chromatic pulse sweeps the screen.
 *   5. Bars slide out, the regular CombatIntroSplash / combat UI takes over.
 *
 * For non-boss combats this component renders nothing — the listener bails
 * before any state mutation.
 *
 * All visible text is Russian. Code identifiers / structural comments are
 * English to match the surrounding file style.
 */

'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { isBossEnemyType } from '@/engine/combat/types';
import type { EnemyType } from '@/shared/types/game';
import { triggerCameraShake } from '@/engine/camera/cameraShake';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ══════════════════════════════════════════════════════════════
   Boss display data — Russian name + atmospheric subtitle.
   Keyed by EnemyType so the lookup is O(1) and type-safe.
   ══════════════════════════════════════════════════════════════ */

export interface BossIntroData {
  /** Glitchy display name (Russian, upper-case). */
  name: string;
  /** Subtitle line under the name (Russian, atmospheric). */
  subtitle: string;
  /** Accent hue for the chromatic pulse + bar edges (hex). */
  accent: string;
  /** Optional CSS-level title for accessibility — falls back to `name`. */
  ariaLabel: string;
}

const BOSS_INTRO_DATA: Partial<Record<EnemyType, BossIntroData>> = {
  boss_neuro_sys: {
    name: 'НЕЙРО-СИСТЕМА',
    subtitle: 'Сетевой страж пробудился',
    accent: '#ff3b6b',
    ariaLabel: 'Босс: Нейро-Система',
  },
  boss_dream_eater: {
    name: 'ПОЖИРАТЕЛЬ СНОВ',
    subtitle: 'Он питается твоими страхами',
    accent: '#9b5cff',
    ariaLabel: 'Босс: Пожиратель Снов',
  },
  boss_final_code: {
    name: 'ФИНАЛЬНЫЙ КОД',
    subtitle: 'Последняя строка Володьки',
    accent: '#00e5ff',
    ariaLabel: 'Босс: Финальный Код',
  },
};

/* ══════════════════════════════════════════════════════════════
   Timing
   ══════════════════════════════════════════════════════════════ */

/** Total intro runtime (ms) — bars slide in, hold, slide out. */
const BOSS_INTRO_TOTAL_MS = 3000;
/** Bars slide-in duration (ms). */
const BARS_IN_MS = 380;
/** Bars slide-out duration (ms). */
const BARS_OUT_MS = 340;
/** Hold time after bars settle before they slide out (ms). */
const HOLD_MS = BOSS_INTRO_TOTAL_MS - BARS_IN_MS - BARS_OUT_MS;
/** When (ms after intro start) the title block begins its fade-out, so it
 *  disappears just before the bars finish sliding out (no visible cut). */
const TITLE_FADE_OUT_AT_MS = HOLD_MS + BARS_IN_MS + Math.round(BARS_OUT_MS * 0.4);

/** Letterbox bar height (vh). 12% top + 12% bottom = 24% screen coverage. */
const BAR_HEIGHT_VH = 12;

/* ══════════════════════════════════════════════════════════════
   Subtle chromatic pulse overlay — red/cyan split-second flash.
   ══════════════════════════════════════════════════════════════ */

const ChromaticPulse = memo(function ChromaticPulse({ accent }: { accent: string }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: UI_LAYERS.COMBAT + 2,
        mixBlendMode: 'screen',
        background: `linear-gradient(90deg, ${accent}33 0%, transparent 35%, transparent 65%, ${accent}33 100%)`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.9, 0.4, 0.85, 0] }}
      transition={{
        duration: BOSS_INTRO_TOTAL_MS / 1000,
        times: [0, 0.18, 0.45, 0.7, 1],
        ease: 'easeOut',
      }}
      aria-hidden="true"
    />
  );
});

/* ══════════════════════════════════════════════════════════════
   Letterbox bars — top & bottom, slide in/out via framer-motion.
   Driven by a single `barsOpen` boolean so we can independently time
   slide-in (start of intro) and slide-out (near end of intro).
   ══════════════════════════════════════════════════════════════ */

const LetterboxBars = memo(function LetterboxBars({
  barsOpen,
  reducedMotion,
  accent,
}: {
  barsOpen: boolean;
  reducedMotion: boolean;
  accent: string;
}) {
  const dur = reducedMotion ? 0 : BARS_IN_MS / 1000;
  const ease: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

  return (
    <>
      {/* Top bar — slides down from above when opening, up when closing. */}
      <motion.div
        className="absolute left-0 right-0 top-0 pointer-events-none"
        style={{
          zIndex: UI_LAYERS.COMBAT + 1,
          height: `${BAR_HEIGHT_VH}vh`,
          background: 'linear-gradient(180deg, #000 0%, #050810 70%, rgba(5,8,16,0) 100%)',
          boxShadow: `inset 0 -1px 0 ${accent}55, 0 4px 14px rgba(0,0,0,0.7)`,
        }}
        initial={{ y: '-100%' }}
        animate={{ y: barsOpen ? '0%' : '-100%' }}
        transition={{ duration: dur, ease }}
        aria-hidden="true"
      />
      {/* Bottom bar — mirror of top, slides up from below. */}
      <motion.div
        className="absolute left-0 right-0 bottom-0 pointer-events-none"
        style={{
          zIndex: UI_LAYERS.COMBAT + 1,
          height: `${BAR_HEIGHT_VH}vh`,
          background: 'linear-gradient(0deg, #000 0%, #050810 70%, rgba(5,8,16,0) 100%)',
          boxShadow: `inset 0 1px 0 ${accent}55, 0 -4px 14px rgba(0,0,0,0.7)`,
        }}
        initial={{ y: '100%' }}
        animate={{ y: barsOpen ? '0%' : '100%' }}
        transition={{ duration: dur, ease }}
        aria-hidden="true"
      />
    </>
  );
});

/* ══════════════════════════════════════════════════════════════
   Boss title block — glitchy name + subtitle.
   Driven by `titleVisible` so it can fade out before the bars finish.
   ══════════════════════════════════════════════════════════════ */

const BossTitle = memo(function BossTitle({
  data,
  reducedMotion,
  titleVisible,
}: {
  data: BossIntroData;
  reducedMotion: boolean;
  titleVisible: boolean;
}) {
  const titleDuration = reducedMotion ? 0 : 0.6;
  const subtitleDelay = reducedMotion ? 0 : 0.45;
  const subtitleDuration = reducedMotion ? 0 : 0.5;

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4 text-center"
      style={{ zIndex: UI_LAYERS.COMBAT + 4 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: titleVisible ? 1 : 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
      aria-live="assertive"
      aria-label={data.ariaLabel}
      role="status"
    >
      {/* "⚠ БОСС ⚠" tag */}
      <motion.div
        className="text-[11px] sm:text-xs font-mono tracking-[0.5em] uppercase mb-3"
        style={{ color: data.accent, textShadow: `0 0 12px ${data.accent}cc` }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: titleVisible ? 1 : 0, y: 0 }}
        transition={{ duration: titleDuration, ease: 'easeOut' }}
      >
        ⚠ БОСС ⚠
      </motion.div>

      {/* Glitchy boss name — uses the existing .cyber-glitch-text class which
       *  renders red/cyan chromatic-split pseudo-elements from `data-text`,
       *  PLUS the .glitch-text class for periodic full-text glitch bursts. */}
      <motion.h2
        className="cyber-glitch-text glitch-text font-mono font-extrabold tracking-[0.15em] uppercase leading-tight"
        style={{
          fontSize: 'clamp(2.5rem, 9vw, 6rem)',
          color: '#fff',
          textShadow: `0 0 18px ${data.accent}aa, 0 0 32px ${data.accent}55`,
          ['--text-glitch-speed' as string]: '1.6s',
        }}
        data-text={data.name}
        initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
        animate={{
          opacity: titleVisible ? 1 : 0,
          scale: titleVisible ? 1 : 1.04,
          filter: titleVisible ? 'blur(0px)' : 'blur(6px)',
        }}
        transition={{ duration: titleDuration, ease: [0.22, 0.61, 0.36, 1] }}
      >
        {data.name}
      </motion.h2>

      {/* Atmospheric subtitle */}
      <motion.p
        className="mt-4 text-sm sm:text-base font-mono tracking-[0.25em] uppercase"
        style={{ color: '#cbd5e1', textShadow: '0 0 8px rgba(0,0,0,0.9)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: titleVisible ? 0.92 : 0, y: 0 }}
        transition={{ delay: subtitleDelay, duration: subtitleDuration, ease: 'easeOut' }}
      >
        {data.subtitle}
      </motion.p>

      {/* "Побег невозможен" warning line — parity with the regular
       *  CombatIntroSplash boss treatment but with extra chromatic glow. */}
      <motion.div
        className="mt-6 text-[10px] sm:text-xs font-mono tracking-[0.35em] uppercase"
        style={{ color: '#fb7185', textShadow: `0 0 10px ${data.accent}88` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: titleVisible ? 0.7 : 0 }}
        transition={{ delay: reducedMotion ? 0 : 0.85, duration: 0.4 }}
      >
        Побег невозможен · исход решает судьбу
      </motion.div>
    </motion.div>
  );
});

/* ══════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════ */

export const BossIntroCinematic = memo(function BossIntroCinematic() {
  const reducedMotion = useEffectiveReducedMotion();
  const [activeBoss, setActiveBoss] = useState<BossIntroData | null>(null);
  /** Whether the letterbox bars are in their "open" (visible) position. */
  const [barsOpen, setBarsOpen] = useState(false);
  /** Whether the title block is visible. Title fades out slightly before
   *  bars finish sliding out so there's no visible cut. */
  const [titleVisible, setTitleVisible] = useState(false);
  /** Monotonic key — bumps on every boss intro start so framer-motion replays
   *  the enter transition even when two boss fights happen back-to-back. */
  const [runKey, setRunKey] = useState(0);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of timers) clearTimeout(id);
      timers.clear();
    };
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('combat:start', ({ enemyType }) => {
      if (!enemyType || !isBossEnemyType(enemyType)) return;
      const data = BOSS_INTRO_DATA[enemyType];
      if (!data) return;

      // Clear any timers from a previous (interrupted) boss intro so they
      // don't fire on top of this new run. Done before scheduling new timers
      // so the new run's timers aren't wiped by an old dismissal callback.
      for (const id of timersRef.current) clearTimeout(id);
      timersRef.current.clear();

      // Reset state for this run.
      setRunKey((k) => k + 1);
      setActiveBoss(data);
      setBarsOpen(false);
      setTitleVisible(false);

      // Bars slide in immediately on next frame (gives framer-motion a tick
      // to mount the elements with their initial state before animating).
      const barsInId = setTimeout(() => setBarsOpen(true), 16);
      timersRef.current.add(barsInId);

      // Title appears once the bars have settled.
      const titleInId = setTimeout(() => setTitleVisible(true), BARS_IN_MS + 60);
      timersRef.current.add(titleInId);

      // Heavy single camera kick on intro start — AAA boss reveal feel.
      if (!reducedMotion) {
        triggerCameraShake(0.45, 6.0);
      }

      // Title fades out slightly before the bars slide out so there's no
      // visible "pop" when the bars uncover the regular combat UI.
      const titleOutId = setTimeout(() => setTitleVisible(false), TITLE_FADE_OUT_AT_MS);
      timersRef.current.add(titleOutId);

      // Bars slide out.
      const barsOutId = setTimeout(() => setBarsOpen(false), HOLD_MS + BARS_IN_MS);
      timersRef.current.add(barsOutId);

      // Unmount everything after the bars have finished sliding out.
      const dismissId = setTimeout(() => {
        timersRef.current.delete(dismissId);
        setActiveBoss(null);
      }, BOSS_INTRO_TOTAL_MS);
      timersRef.current.add(dismissId);
    });
    return unsub;
  }, [reducedMotion]);

  return (
    <AnimatePresence>
      {activeBoss && (
        <div
          key={`boss-intro-${runKey}`}
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: UI_LAYERS.COMBAT + 1 }}
          aria-hidden="true"
        >
          <ChromaticPulse accent={activeBoss.accent} />
          <LetterboxBars barsOpen={barsOpen} reducedMotion={reducedMotion} accent={activeBoss.accent} />
          <BossTitle
            data={activeBoss}
            reducedMotion={reducedMotion}
            titleVisible={titleVisible}
          />
        </div>
      )}
    </AnimatePresence>
  );
});
