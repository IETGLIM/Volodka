
/* ─── Volodka RPG – Screen Effects Manager ───
   Screen flash, shake, vignette, chromatic aberration.
   All effects triggered via EventBus events.
   Uses CSS animations where possible for performance.
   Enhanced: damage vignette with red flash, low health pulse.
*/

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { useScreenEffectsVitals } from '@/store/selectors';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import {
  triggerFlash,
  triggerShake,
  triggerVignette,
  triggerChromaticAberration,
  triggerDamageVignette,
} from '@/engine/fx/screenFxTriggers';

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

let nextEffectId = 0;

/* ── Component ── */
export function ScreenEffects() {
  const reducedMotion = useEffectiveReducedMotion();
  const [flashes, setFlashes] = useState<FlashEffect[]>([]);
  const [shake, setShake] = useState<ShakeEffect | null>(null);
  const [vignetteIntensity, setVignetteIntensity] = useState(0);
  const [chromaticIntensity, setChromaticIntensity] = useState(0);
  const [damageVignette, setDamageVignette] = useState<{ intensity: number; duration: number } | null>(null);

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

    // Area F: Clear all active screen FX when a scene transition starts.
    // Poem power visual effects (vignette, chromatic aberration, flash) are
    // duration-based via setTimeout, but if the player transitions scenes
    // mid-effect, the remaining duration would persist into the new scene
    // (e.g., a 2.2s vignette started 500ms before a doorway transition
    // would linger for 1.7s in the new scene). Clear all active effects
    // synchronously on scene:transition_start so each scene starts visually clean.
    unsubs.push(eventBus.on('scene:transition_start', () => {
      setFlashes([]);
      setShake(null);
      setVignetteIntensity(0);
      setChromaticIntensity(0);
      setDamageVignette(null);
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
            className="fixed inset-0 pointer-events-none damage-flash-overlay"
            style={{
              zIndex: UI_LAYERS.DAMAGE_FLASH,
              background: `radial-gradient(ellipse at center, rgba(255,30,30,${damageVignette.intensity * 0.3}) 20%, rgba(180,0,0,${damageVignette.intensity * 0.6}) 60%, rgba(0,0,0,${damageVignette.intensity * 0.4}) 100%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Low health/stress persistent vignette */}
      <LowHealthVignette />

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
    </>
  );
}

/* ── Persistent low-health vignette with pulse ── */
function LowHealthVignette() {
  const { energy, stress } = useScreenEffectsVitals();
  // Track combat HP ratio via combat:hit events (playerHp lives in CombatState,
  // not the exploration store). When the player takes damage and HP drops low,
  // we pulse a red heartbeat vignette.
  const [combatHpRatio, setCombatHpRatio] = useState(1);
  useEffect(() => {
    const unsub = eventBus.on('combat:hit', (payload) => {
      if (payload.isPlayerHit) {
        // Read combat state to get current HP ratio — CombatSystem is the source of truth.
        import('@/engine/CombatSystem').then(({ combat }) => {
          const cs = combat.getState();
          if (cs && cs.playerMaxHp > 0) {
            setCombatHpRatio(cs.playerHp / cs.playerMaxHp);
          }
        }).catch(() => {});
      }
    });
    return () => unsub();
  }, []);

  const isDanger = energy < 25 || stress > 70;
  const intensity = isDanger
    ? Math.min(0.5, (energy < 25 ? (25 - energy) / 25 : 0) * 0.3 + (stress > 70 ? (stress - 70) / 30 : 0) * 0.2)
    : 0;

  // AAA low-HP heartbeat: when combat HP drops below 25%, a red vignette pulses
  // faster as HP approaches 0. At <10% it's a critical emergency strobe.
  const hpPct = combatHpRatio;
  const hpDanger = hpPct < 0.25;
  const hpCritical = hpPct < 0.1;
  const hpIntensity = hpCritical ? 0.55 : hpDanger ? 0.35 * (1 - hpPct / 0.25) : 0;
  const hpPulseRate = hpCritical ? '0.5s' : '0.9s';

  if (intensity <= 0 && hpIntensity <= 0) return null;

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
    <>
      {intensity > 0 && (
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
      )}
      {/* AAA low-HP heartbeat vignette — faster pulse as HP drops */}
      {hpIntensity > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: UI_LAYERS.NOIR_OVERLAY + 2,
            background: `radial-gradient(ellipse at center, transparent 25%, rgba(200,20,20,${hpIntensity}) 90%)`,
            animation: `dangerPulse ${hpPulseRate} ease-in-out infinite`,
          }}
        />
      )}
    </>
  );
}
