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

export function usePoemWorldEffectController() {
  const reducedMotion = useEffectiveReducedMotion();
  const { phase: transitionPhase } = useTransitionDirector();
  const [activeEvent, setActiveEvent] = useState<ActivePoemWorldEvent | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setActiveEvent(null);
  }, [clearTimer]);

  useEffect(() => dismiss, [dismiss]);

  useEffect(() => {
    if (transitionPhase === 'loading') dismiss();
  }, [transitionPhase, dismiss]);

  useEffect(() => {
    const unsub = eventBus.on('poem:world_event', (payload) => {
      clearTimer();
      const event: ActivePoemWorldEvent = {
        id: `poem-world-${Date.now()}-${payload.poemId}`,
        poemId: payload.poemId,
        powerName: payload.powerName,
        profile: payload.profile,
        startedAt: Date.now(),
      };
      setActiveEvent(event);
      timerRef.current = setTimeout(() => {
        setActiveEvent((prev) => (prev?.id === event.id ? null : prev));
        timerRef.current = null;
      }, payload.profile.durationMs);
    });
    return () => {
      unsub();
      clearTimer();
    };
  }, [clearTimer]);

  return { activeEvent, reducedMotion };
}
