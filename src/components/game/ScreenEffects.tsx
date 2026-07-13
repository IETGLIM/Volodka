
/* ─── Volodka RPG – Screen Effects Manager ───
   Screen flash, shake, vignette, chromatic aberration, slow-motion.
   All effects triggered via EventBus events.
   Uses CSS animations where possible for performance.
   Enhanced: damage vignette with red flash, low health pulse,
   karma shift visual flash, scene transition dissolve.
*/

/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { useScreenEffectsVitals, usePlayerKarma } from '@/store/selectors';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGameStore } from '@/store/gameStore';

/* ── Effect state types ── */
interface FlashEffect {
  id: number;
  color: string;
  opacity: number;
  duration: number;
}

interface ShakeEffect {
  id: number;
  intensity: number;
  duration: number;
}

interface DissolveEffect {
  id: number;
  duration: number;
  color: string;
}

let nextEffectId = 0;

/* ── Public API (triggered via import) ── */
export function triggerFlash(color: string = 'white', opacity: number = 0.3, duration: number = 300) {
  eventBus.emit('fx:flash', { color, opacity, duration });
}

export function triggerShake(intensity: number = 8, duration: number = 400) {
  eventBus.emit('fx:shake', { intensity, duration });
}

export function triggerVignette(intensity: number = 0.7, duration: number = 2000) {
  eventBus.emit('fx:vignette', { intensity, duration });
}

export function triggerChromaticAberration(intensity: number = 3, duration: number = 500) {
  eventBus.emit('fx:chromatic', { intensity, duration });
}

export function triggerSlowMotion(duration: number = 800) {
  eventBus.emit('fx:slowmo', { duration });
}

export function triggerAchievement(title: string, description: string, icon?: string) {
  eventBus.emit('fx:achievement', { title, description, icon });
}

export function triggerXpGain(amount: number, source?: string) {
  eventBus.emit('fx:xp_gain', { amount, source });
}

/** Trigger a damage vignette — red flash with heavy vignette */
export function triggerDamageVignette(intensity: number = 0.6, duration: number = 600) {
  eventBus.emit('fx:damage_vignette', { intensity, duration });
}

/** Trigger a karma shift visual flash */
export function triggerKarmaShiftFlash(direction: 'light' | 'dark' = 'dark', intensity: number = 0.3) {
  eventBus.emit('fx:karma_shift', { direction, intensity });
}

/** Trigger a scene transition dissolve */
export function triggerSceneDissolve(duration: number = 800, color: string = '#000000') {
  eventBus.emit('fx:scene_dissolve', { duration, color });
}

/* ── Component ── */
export function ScreenEffects() {
  const reducedMotion = useEffectiveReducedMotion();
  const [flashes, setFlashes] = useState<FlashEffect[]>([]);
  const [shake, setShake] = useState<ShakeEffect | null>(null);
  const [vignetteIntensity, setVignetteIntensity] = useState(0);
  const [chromaticIntensity, setChromaticIntensity] = useState(0);
  const [isSlowMo, setIsSlowMo] = useState(false);
  const [damageVignette, setDamageVignette] = useState<{ intensity: number; duration: number } | null>(null);
  const [karmaFlash, setKarmaFlash] = useState<{ direction: string; intensity: number } | null>(null);
  const [dissolve, setDissolve] = useState<DissolveEffect | null>(null);

  // ── Flash listener ──
  useEffect(() => {
    const unsub = eventBus.on('fx:flash', (payload) => {
      const flash: FlashEffect = {
        id: nextEffectId++,
        color: payload.color,
        opacity: reducedMotion ? Math.min(payload.opacity, 0.12) : payload.opacity,
        duration: reducedMotion ? Math.min(payload.duration, 120) : payload.duration,
      };
      setFlashes((prev) => [...prev, flash]);
      setTimeout(() => {
        setFlashes((prev) => prev.filter((f) => f.id !== flash.id));
      }, payload.duration + 50);
    });
    return unsub;
  }, [reducedMotion]);

  // ── Shake listener ──
  useEffect(() => {
    const unsub = eventBus.on('fx:shake', (payload) => {
      if (reducedMotion) return;
      const effect: ShakeEffect = {
        id: nextEffectId++,
        intensity: payload.intensity,
        duration: payload.duration,
      };
      setShake(effect);
      setTimeout(() => {
        setShake((prev) => (prev?.id === effect.id ? null : prev));
      }, payload.duration + 50);
    });
    return unsub;
  }, [reducedMotion]);

  // ── Vignette listener ──
  useEffect(() => {
    const unsub = eventBus.on('fx:vignette', (payload) => {
      if (reducedMotion) return;
      setVignetteIntensity(payload.intensity);
      setTimeout(() => setVignetteIntensity(0), payload.duration);
    });
    return unsub;
  }, [reducedMotion]);

  // ── Chromatic aberration listener ──
  useEffect(() => {
    const unsub = eventBus.on('fx:chromatic', (payload) => {
      if (reducedMotion) return;
      setChromaticIntensity(payload.intensity);
      setTimeout(() => setChromaticIntensity(0), payload.duration);
    });
    return unsub;
  }, [reducedMotion]);

  // ── Slow motion listener ──
  useEffect(() => {
    const unsub = eventBus.on('fx:slowmo', (payload) => {
      if (reducedMotion) return;
      setIsSlowMo(true);
      setTimeout(() => setIsSlowMo(false), payload.duration);
    });
    return unsub;
  }, [reducedMotion]);

  // ── Damage vignette listener ──
  useEffect(() => {
    const unsub = eventBus.on('fx:damage_vignette', (payload) => {
      if (reducedMotion) {
        // Reduced motion: just a subtle flash
        triggerFlash('rgba(255,50,50,0.1)', 0.1, 150);
        return;
      }
      setDamageVignette({ intensity: payload.intensity, duration: payload.duration });
      setTimeout(() => setDamageVignette(null), payload.duration);
    });
    return unsub;
  }, [reducedMotion]);

  // ── Karma shift flash listener ──
  useEffect(() => {
    const unsub = eventBus.on('fx:karma_shift', (payload) => {
      if (reducedMotion) return;
      setKarmaFlash({ direction: payload.direction, intensity: payload.intensity });
      setTimeout(() => setKarmaFlash(null), 500);
    });
    return unsub;
  }, [reducedMotion]);

  // ── Scene dissolve listener ──
  useEffect(() => {
    const unsub = eventBus.on('fx:scene_dissolve', (payload) => {
      if (reducedMotion) {
        // Reduced motion: instant cut instead of dissolve
        triggerFlash(payload.color, 1.0, 100);
        return;
      }
      const effect: DissolveEffect = {
        id: nextEffectId++,
        duration: payload.duration,
        color: payload.color,
      };
      setDissolve(effect);
      setTimeout(() => setDissolve(null), payload.duration);
    });
    return unsub;
  }, [reducedMotion]);

  // ── Auto-trigger from game events ──
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(eventBus.on('combat:hit', (payload) => {
      if (payload.isPlayerHit) {
        triggerFlash('rgba(255,50,50,0.25)', reducedMotion ? 0.1 : 0.25, reducedMotion ? 100 : 200);
        if (!reducedMotion) {
          triggerShake(6, 300);
          triggerDamageVignette(0.5, 400);
        }
      } else {
        triggerFlash('rgba(255,200,50,0.1)', reducedMotion ? 0.06 : 0.1, reducedMotion ? 80 : 150);
      }
    }, EventBusPriority.FX));

    unsubs.push(eventBus.on('combat:victory', () => {
      triggerFlash('rgba(251,191,36,0.2)', reducedMotion ? 0.08 : 0.2, reducedMotion ? 120 : 600);
    }, EventBusPriority.FX));

    unsubs.push(eventBus.on('combat:defeat', () => {
      triggerFlash('rgba(255,0,0,0.35)', reducedMotion ? 0.1 : 0.35, reducedMotion ? 120 : 800);
      if (!reducedMotion) triggerVignette(0.8, 3000);
    }, EventBusPriority.FX));

    unsubs.push(eventBus.on('fx:glitch', (payload) => {
      if (reducedMotion) return;
      triggerChromaticAberration(payload.intensity * 2, payload.duration);
      if (payload.intensity > 0.5) {
        triggerShake(payload.intensity * 4, payload.duration);
      }
    }));

    unsubs.push(eventBus.on('skill:level_up', () => {
      triggerFlash('rgba(251,191,36,0.15)', reducedMotion ? 0.08 : 0.15, reducedMotion ? 100 : 400);
    }));

    return () => { for (const u of unsubs) u(); };
  }, [reducedMotion]);

  const shakeStyle: React.CSSProperties = shake
    ? {
        animation: `screenShake ${shake.duration}ms ease-out`,
        '--shake-intensity': `${shake.intensity}px`,
      } as React.CSSProperties
    : {};

  return (
    <>
      {/* CSS Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes screenShake {
          0% { transform: translate(0, 0); }
          10% { transform: translate(calc(var(--shake-intensity) * -0.6), calc(var(--shake-intensity) * 0.4)); }
          20% { transform: translate(calc(var(--shake-intensity) * 0.5), calc(var(--shake-intensity) * -0.3)); }
          30% { transform: translate(calc(var(--shake-intensity) * -0.4), calc(var(--shake-intensity) * 0.5)); }
          40% { transform: translate(calc(var(--shake-intensity) * 0.3), calc(var(--shake-intensity) * -0.4)); }
          50% { transform: translate(calc(var(--shake-intensity) * -0.2), calc(var(--shake-intensity) * 0.2)); }
          60% { transform: translate(calc(var(--shake-intensity) * 0.15), calc(var(--shake-intensity) * -0.1)); }
          70% { transform: translate(calc(var(--shake-intensity) * -0.1), calc(var(--shake-intensity) * 0.05)); }
          80% { transform: translate(calc(var(--shake-intensity) * 0.05), 0); }
          90% { transform: translate(calc(var(--shake-intensity) * -0.02), 0); }
          100% { transform: translate(0, 0); }
        }
        @keyframes dangerPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes healthPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes karmaShiftLight {
          0% { opacity: 0; transform: scale(0.8); }
          30% { opacity: 0.6; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.2); }
        }
        @keyframes karmaShiftDark {
          0% { opacity: 0; }
          30% { opacity: 0.7; }
          100% { opacity: 0; }
        }
      `}} />

      {/* Shake wrapper */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: UI_LAYERS.GLITCH - 1, ...shakeStyle }}
      />

      {/* Flash overlays */}
      <AnimatePresence>
        {flashes.map((flash) => (
          <motion.div
            key={flash.id}
            initial={{ opacity: flash.opacity }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: flash.duration / 1000, ease: 'easeOut' }}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION - 1, backgroundColor: flash.color }}
          />
        ))}
      </AnimatePresence>

      {/* Dynamic vignette */}
      <AnimatePresence>
        {vignetteIntensity > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: vignetteIntensity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: UI_LAYERS.GLITCH,
              background: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,${vignetteIntensity}) 100%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Damage vignette — red flash with heavy vignette ── */}
      <AnimatePresence>
        {damageVignette && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: damageVignette.duration / 1000, ease: 'easeOut' }}
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: UI_LAYERS.DAMAGE_FLASH,
              background: `radial-gradient(ellipse at center, rgba(255,30,30,${damageVignette.intensity * 0.3}) 20%, rgba(180,0,0,${damageVignette.intensity * 0.6}) 60%, rgba(0,0,0,${damageVignette.intensity * 0.4}) 100%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Low health/stress persistent vignette */}
      <LowHealthVignette />

      {/* ── Karma shift visual flash ── */}
      <AnimatePresence>
        {karmaFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: karmaFlash.intensity }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: UI_LAYERS.GLITCH + 3,
              background: karmaFlash.direction === 'light'
                ? `radial-gradient(ellipse at center, rgba(255,220,150,${karmaFlash.intensity}) 0%, transparent 70%)`
                : `radial-gradient(ellipse at center, rgba(80,0,120,${karmaFlash.intensity}) 0%, rgba(0,0,0,${karmaFlash.intensity * 0.5}) 60%, transparent 100%)`,
              animation: karmaFlash.direction === 'light'
                ? 'karmaShiftLight 500ms ease-out forwards'
                : 'karmaShiftDark 500ms ease-out forwards',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Scene transition dissolve ── */}
      <AnimatePresence>
        {dissolve && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dissolve.duration / 2000, ease: 'easeInOut' }}
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: UI_LAYERS.CINEMATIC_TRANSITION,
              backgroundColor: dissolve.color,
            }}
          />
        )}
      </AnimatePresence>

      {/* Chromatic aberration */}
      <AnimatePresence>
        {chromaticIntensity > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: UI_LAYERS.GLITCH + 1,
              background: `linear-gradient(${chromaticIntensity * 2}deg, rgba(255,0,0,${chromaticIntensity * 0.04}) 0%, transparent 30%, transparent 70%, rgba(0,255,255,${chromaticIntensity * 0.04}) 100%)`,
              mixBlendMode: 'screen',
            }}
          />
        )}
      </AnimatePresence>

      {/* Slow motion overlay */}
      <AnimatePresence>
        {isSlowMo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: UI_LAYERS.GLITCH + 2,
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.15) 100%)',
              backdropFilter: 'saturate(0.7) brightness(0.95)',
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Persistent low-health vignette with pulse ── */
function LowHealthVignette() {
  const { energy, stress } = useScreenEffectsVitals();

  const isDanger = energy < 25 || stress > 70;
  const intensity = isDanger
    ? Math.min(0.5, (energy < 25 ? (25 - energy) / 25 : 0) * 0.3 + (stress > 70 ? (stress - 70) / 30 : 0) * 0.2)
    : 0;

  if (intensity <= 0) return null;

  // Color shifts: red for low health, orange for high stress, purple for both
  const isCritical = energy < 15;
  const isBoth = energy < 25 && stress > 70;

  const pulseColor = isCritical
    ? `rgba(255, 30, 30, ${intensity * 0.7})`
    : isBoth
      ? `rgba(200, 50, 100, ${intensity * 0.5})`
      : energy < 25
        ? `rgba(255, 50, 50, ${intensity * 0.5})`
        : `rgba(255, 150, 50, ${intensity * 0.3})`;

  // Pulse rate increases with danger level
  const pulseRate = isCritical ? '0.8s' : isDanger ? '1.5s' : '2s';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: UI_LAYERS.NOIR_OVERLAY + 1,
        background: `radial-gradient(ellipse at center, transparent 35%, ${pulseColor} 100%)`,
        animation: `healthPulse ${pulseRate} ease-in-out infinite`,
      }}
    />
  );
}
