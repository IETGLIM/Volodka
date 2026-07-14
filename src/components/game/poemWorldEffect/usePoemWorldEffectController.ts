import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import type { PoemWorldEffectProfile } from '@/config/poemWorldEffects';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';

export type ActivePoemWorldEvent = {
  id: string;
  poemId: string;
  powerName: string;
  profile: PoemWorldEffectProfile;
  startedAt: number;
};

/** Duration of the fade-out animation before the effect is removed. */
const FADE_OUT_DURATION_MS = 1200;

export function usePoemWorldEffectController() {
  const reducedMotion = useEffectiveReducedMotion();
  const { phase: transitionPhase } = useTransitionDirector();
  const [activeEvent, setActiveEvent] = useState<ActivePoemWorldEvent | null>(null);
  const [isExpiring, setIsExpiring] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (expireTimerRef.current) {
      clearTimeout(expireTimerRef.current);
      expireTimerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimers();
    setActiveEvent(null);
    setIsExpiring(false);
  }, [clearTimers]);

  useEffect(() => dismiss, [dismiss]);

  useEffect(() => {
    if (transitionPhase === 'loading') dismiss();
  }, [transitionPhase, dismiss]);

  useEffect(() => {
    const unsub = eventBus.on('poem:world_event', (payload) => {
      clearTimers();
      setIsExpiring(false);
      const event: ActivePoemWorldEvent = {
        id: `poem-world-${Date.now()}-${payload.poemId}`,
        poemId: payload.poemId,
        powerName: payload.powerName,
        profile: payload.profile,
        startedAt: Date.now(),
      };
      setActiveEvent(event);

      const totalDuration = payload.profile.durationMs;

      // Start fade-out before the effect expires
      const fadeOutStart = Math.max(0, totalDuration - FADE_OUT_DURATION_MS);
      expireTimerRef.current = setTimeout(() => {
        setIsExpiring(true);
        expireTimerRef.current = null;
      }, fadeOutStart);

      // Full removal after total duration
      timerRef.current = setTimeout(() => {
        setActiveEvent((prev) => (prev?.id === event.id ? null : prev));
        setIsExpiring(false);
        timerRef.current = null;
      }, totalDuration);
    });
    return () => {
      unsub();
      clearTimers();
    };
  }, [clearTimers]);

  return { activeEvent, reducedMotion, isExpiring };
}
