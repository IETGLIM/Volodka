/* ─── Volodka RPG – Objective Complete VFX ───
   Brief celebratory overlay fired on `quest:complete_objective`.
   Plays for ~1.5s and includes:
     (a) A framer-motion animated checkmark + "Цель выполнена" text
         fading in/out at screen center-top.
     (b) A short gold particle burst (CSS-only — 8 motion.div sparks
         radiating outward from the center).
     (c) A soft gold screen flash overlay, plus an `fx:flash` event
         emission so ScreenEffects can layer its own gold flash.
     (d) Spawns a floating "✓ Цель выполнена" text via floatingTextService
         for in-world persistence after the overlay fades.
   Reduced-motion aware: skips particles + flash, keeps the static checkmark.
*/

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGamePhase } from '@/store/selectors/uiSelectors';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { spawnFloatingText } from '@/engine/floatingText/floatingTextService';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';

interface ObjectiveBurst {
  uid: number;
  questId: string;
  objectiveId: string;
  label: string;
}

const BURST_DURATION_MS = 1500;
const VFX_TOP_PX = 64;
const PARTICLE_COUNT = 8;

const GOLD_PARTICLE_ANGLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  return (i / PARTICLE_COUNT) * Math.PI * 2 + Math.PI / PARTICLE_COUNT;
});

let nextBurstUid = 1;

function resolveObjectiveLabel(questId: string, objectiveId: string): string {
  const def = QUEST_DEFINITIONS.find((d) => d.id === questId);
  if (!def) return 'Цель выполнена';
  const obj = def.objectives.find((o) => o.id === objectiveId);
  return obj?.description?.trim() || 'Цель выполнена';
}

export function ObjectiveCompleteVfx() {
  const reducedMotion = useEffectiveReducedMotion();
  const gamePhase = useGamePhase();
  const [burst, setBurst] = useState<ObjectiveBurst | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Dedupe: if the same objective fires repeatedly within BURST_DURATION_MS,
  // skip the burst. Objectives rarely complete twice in quick succession, but
  // a store-driven emit + an EventBus-driven emit could double-fire.
  const lastFiredRef = useRef<string | null>(null);

  const triggerBurst = useCallback(
    (questId: string, objectiveId: string) => {
      const dedupeKey = `${questId}:${objectiveId}`;
      const now = Date.now();
      // 800ms dedupe window — short enough to allow separate objectives to fire,
      // long enough to swallow a duplicate emit from a different code path.
      if (
        lastFiredRef.current
        && lastFiredRef.current.startsWith(`${dedupeKey}@`)
        && now - parseInt(lastFiredRef.current.split('@')[1], 10) < 800
      ) {
        return;
      }
      lastFiredRef.current = `${dedupeKey}@${now}`;

      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      setBurst({
        uid: nextBurstUid++,
        questId,
        objectiveId,
        label: resolveObjectiveLabel(questId, objectiveId),
      });
      setFlashKey((k) => k + 1);

      // (b) Floating text — in-world persistence after the overlay fades.
      //     Spawn at center-top so it floats up and away from the checkmark.
      if (typeof window !== 'undefined') {
        const x = window.innerWidth / 2;
        const y = Math.max(120, Math.round(window.innerHeight * 0.18));
        spawnFloatingText('✓ Цель выполнена', 'custom', x, y, 'high');
      }

      // (c) Gold screen flash — emit to ScreenEffects (existing listener).
      eventBus.emit('fx:flash', {
        color: 'rgba(251,191,36,0.10)',
        opacity: 1,
        duration: 320,
      });
    },
    [],
  );

  useEffect(() => {
    if (gamePhase !== 'exploration') return;

    const unsub = eventBus.on('quest:complete_objective', (payload) => {
      triggerBurst(payload.questId, payload.objectiveId);
    });
    return () => {
      unsub();
    };
  }, [gamePhase, triggerBurst]);

  // Auto-dismiss after BURST_DURATION_MS.
  useEffect(() => {
    if (!burst) return;
    dismissTimerRef.current = setTimeout(() => {
      dismissTimerRef.current = null;
      setBurst(null);
    }, BURST_DURATION_MS);
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [burst]);

  if (gamePhase === 'menu' || gamePhase === 'intro') return null;

  const ariaMessage = burst
    ? `Цель выполнена: ${burst.label}.`
    : '';

  return (
    <>
      <AriaLiveRegion message={ariaMessage} priority="polite" />

      {/* Center-top checkmark + label overlay */}
      <div
        data-exploration-ui
        className="fixed left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ top: VFX_TOP_PX, zIndex: UI_LAYERS.TOASTS + 1 }}
        role="status"
        aria-live="polite"
      >
        <AnimatePresence mode="wait">
          {burst && (
            <motion.div
              key={burst.uid}
              className="flex flex-col items-center gap-2"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
              transition={
                reducedMotion
                  ? { duration: 0.12 }
                  : { duration: 0.42, ease: [0.16, 1, 0.3, 1] }
              }
            >
              {/* Gold halo + animated checkmark */}
              <div className="relative flex items-center justify-center">
                {/* Halo pulse — reduced-motion-gated */}
                {!reducedMotion && (
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(251,191,36,0.55) 0%, rgba(251,191,36,0.12) 50%, transparent 75%)',
                    }}
                    initial={{ scale: 0.4, opacity: 0.9 }}
                    animate={{ scale: 2.4, opacity: 0 }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                  />
                )}

                {/* Solid gold ring */}
                <motion.div
                  aria-hidden
                  className="relative flex items-center justify-center size-14 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle at 35% 30%, rgba(254,243,199,0.95) 0%, rgba(251,191,36,0.95) 35%, rgba(180,120,8,0.95) 100%)',
                    boxShadow:
                      '0 0 24px rgba(251,191,36,0.65), 0 0 48px rgba(251,191,36,0.35), inset 0 0 8px rgba(255,240,180,0.5)',
                  }}
                  initial={reducedMotion ? false : { scale: 0.5, rotate: -25 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={
                    reducedMotion
                      ? { duration: 0.1 }
                      : { type: 'spring', damping: 11, stiffness: 240, delay: 0.05 }
                  }
                >
                  <motion.div
                    initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={
                      reducedMotion
                        ? { duration: 0.1 }
                        : { type: 'spring', damping: 13, stiffness: 320, delay: 0.22 }
                    }
                  >
                    <Check
                      className="size-7 text-stone-900"
                      strokeWidth={3.5}
                      aria-hidden
                    />
                  </motion.div>
                </motion.div>

                {/* Particle burst — reduced-motion-gated */}
                {!reducedMotion && (
                  <div className="absolute inset-0 pointer-events-none" aria-hidden>
                    {GOLD_PARTICLE_ANGLES.map((angle, i) => {
                      const distance = 60 + (i % 3) * 18;
                      const dx = Math.cos(angle) * distance;
                      const dy = Math.sin(angle) * distance;
                      return (
                        <motion.span
                          key={i}
                          className="absolute left-1/2 top-1/2 rounded-full"
                          style={{
                            width: 4 + (i % 2) * 2,
                            height: 4 + (i % 2) * 2,
                            background:
                              i % 2 === 0
                                ? 'rgba(251,191,36,0.95)'
                                : 'rgba(0,212,224,0.85)',
                            boxShadow: `0 0 6px ${
                              i % 2 === 0 ? 'rgba(251,191,36,0.7)' : 'rgba(0,212,224,0.6)'
                            }`,
                            translateX: '-50%',
                            translateY: '-50%',
                          }}
                          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                          animate={{
                            x: dx,
                            y: dy,
                            opacity: [0, 1, 0],
                            scale: [0.4, 1, 0.2],
                          }}
                          transition={{
                            duration: 0.85,
                            ease: 'easeOut',
                            delay: 0.15 + i * 0.02,
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Floating label */}
              <motion.div
                className="flex flex-col items-center"
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reducedMotion
                    ? { duration: 0.1 }
                    : { duration: 0.38, delay: 0.18, ease: [0.16, 1, 0.3, 1] }
                }
              >
                <span
                  className="text-[13px] font-bold uppercase tracking-[0.22em]"
                  style={{
                    color: '#fde68a',
                    textShadow: '0 0 10px rgba(251,191,36,0.6), 0 0 18px rgba(251,191,36,0.35)',
                  }}
                >
                  Цель выполнена
                </span>
                <span
                  className="mt-1 max-w-[300px] text-center text-[12px] leading-snug text-amber-100/85 truncate"
                  style={{ textShadow: '0 0 8px rgba(0,0,0,0.6)' }}
                >
                  {burst.label}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Soft gold screen flash overlay (local, in addition to fx:flash event) */}
      <AnimatePresence>
        {burst && !reducedMotion && (
          <motion.div
            key={`gold-flash-${flashKey}`}
            aria-hidden
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: UI_LAYERS.DAMAGE_FLASH - 1,
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.06) 35%, transparent 65%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.7,
              ease: 'easeOut',
              times: [0, 0.25, 1],
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
