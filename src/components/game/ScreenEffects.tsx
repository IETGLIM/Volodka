
/* ─── Volodka RPG – Screen Effects Manager ───
   Screen flash, shake, vignette, chromatic aberration, slow-motion.
   All effects triggered via EventBus events.
   Uses CSS animations where possible for performance.
*/

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { useScreenEffectsVitals } from '@/store/selectors';
import {
  triggerFlash,
  triggerShake,
  triggerVignette,
  triggerChromaticAberration,
} from './screenEffectsApi';

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
  const [flashes, setFlashes] = useState<FlashEffect[]>([]);
  const [shake, setShake] = useState<ShakeEffect | null>(null);
  const [vignetteIntensity, setVignetteIntensity] = useState(0);
  const [chromaticIntensity, setChromaticIntensity] = useState(0);
  const [isSlowMo, setIsSlowMo] = useState(false);

  // ── Flash listener ──
  useEffect(() => {
    const unsub = eventBus.on('fx:flash', (payload) => {
      const flash: FlashEffect = {
        id: nextEffectId++,
        color: payload.color,
        opacity: payload.opacity,
        duration: payload.duration,
      };
      setFlashes((prev) => [...prev, flash]);
      setTimeout(() => {
        setFlashes((prev) => prev.filter((f) => f.id !== flash.id));
      }, payload.duration + 50);
    });
    return unsub;
  }, []);

  // ── Shake listener ──
  useEffect(() => {
    const unsub = eventBus.on('fx:shake', (payload) => {
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
  }, []);

  // ── Vignette listener ──
  useEffect(() => {
    const unsub = eventBus.on('fx:vignette', (payload) => {
      setVignetteIntensity(payload.intensity);
      setTimeout(() => setVignetteIntensity(0), payload.duration);
    });
    return unsub;
  }, []);

  // ── Chromatic aberration listener ──
  useEffect(() => {
    const unsub = eventBus.on('fx:chromatic', (payload) => {
      setChromaticIntensity(payload.intensity);
      setTimeout(() => setChromaticIntensity(0), payload.duration);
    });
    return unsub;
  }, []);

  // ── Slow motion listener ──
  useEffect(() => {
    const unsub = eventBus.on('fx:slowmo', (payload) => {
      setIsSlowMo(true);
      setTimeout(() => setIsSlowMo(false), payload.duration);
    });
    return unsub;
  }, []);

  // ── Auto-trigger from game events ──
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(eventBus.on('combat:hit', (payload) => {
      if (payload.isPlayerHit) {
        triggerFlash('rgba(255,50,50,0.25)', 0.25, 200);
        triggerShake(6, 300);
      } else {
        triggerFlash('rgba(255,200,50,0.1)', 0.1, 150);
      }
    }, EventBusPriority.FX));

    unsubs.push(eventBus.on('combat:victory', () => {
      triggerFlash('rgba(251,191,36,0.2)', 0.2, 600);
    }, EventBusPriority.FX));

    unsubs.push(eventBus.on('combat:defeat', () => {
      triggerFlash('rgba(255,0,0,0.35)', 0.35, 800);
      triggerVignette(0.8, 3000);
    }, EventBusPriority.FX));

    unsubs.push(eventBus.on('fx:glitch', (payload) => {
      triggerChromaticAberration(payload.intensity * 2, payload.duration);
      if (payload.intensity > 0.5) {
        triggerShake(payload.intensity * 4, payload.duration);
      }
    }));

    unsubs.push(eventBus.on('skill:level_up', () => {
      triggerFlash('rgba(251,191,36,0.15)', 0.15, 400);
    }));

    return () => { for (const u of unsubs) u(); };
  }, []);

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

/* ── Persistent low-health vignette ── */
function LowHealthVignette() {
  const { energy, stress } = useScreenEffectsVitals();

  const isDanger = energy < 25 || stress > 70;
  const intensity = isDanger
    ? Math.min(0.5, (energy < 25 ? (25 - energy) / 25 : 0) * 0.3 + (stress > 70 ? (stress - 70) / 30 : 0) * 0.2)
    : 0;

  if (intensity <= 0) return null;

  const pulseColor = energy < 25
    ? `rgba(255, 50, 50, ${intensity * 0.5})`
    : `rgba(255, 150, 50, ${intensity * 0.3})`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: UI_LAYERS.NOIR_OVERLAY + 1,
        background: `radial-gradient(ellipse at center, transparent 40%, ${pulseColor} 100%)`,
        animation: 'dangerPulse 2s ease-in-out infinite',
      }}
    />
  );
}
