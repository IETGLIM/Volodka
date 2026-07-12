import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import { getPoemPower } from '@/engine/PoemPowerSystem';
import {
  POEM_POWER_EFFECT_DURATION_MS,
  POEM_POWER_EFFECT_LABELS,
} from '@/engine/poemPower/poemPowerEffectConstants';
import {
  buildActivatedAnnouncement,
  resolvePoemPowerEffectMeta,
} from '@/engine/poemPower/poemPowerEffectPresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';

export type ActivePowerNotification = {
  id: string;
  powerName: string;
  powerDescription: string;
  poemId: string;
  timestamp: number;
  color: string;
  actLabel: string;
  screenReaderMessage: string;
};

export function usePoemPowerEffectController() {
  const reducedMotion = useEffectiveReducedMotion();
  const { phase: transitionPhase } = useTransitionDirector();
  const [notifications, setNotifications] = useState<ActivePowerNotification[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) {
      clearTimeout(timer);
    }
    timersRef.current = [];
  }, []);

  const dismissAll = useCallback(() => {
    clearTimers();
    setNotifications([]);
  }, [clearTimers]);

  useEffect(() => dismissAll, [dismissAll]);

  useEffect(() => {
    if (transitionPhase === 'loading') {
      dismissAll();
    }
  }, [transitionPhase, dismissAll]);

  const createNotification = useCallback((poemId: string, powerName: string) => {
    const power = getPoemPower(poemId);
    if (!power) return;

    const meta = resolvePoemPowerEffectMeta(power);
    const notification: ActivePowerNotification = {
      id: `power-fx-${Date.now()}-${poemId}`,
      powerName,
      powerDescription: power.description,
      poemId,
      timestamp: Date.now(),
      color: meta.color,
      actLabel: meta.actLabel,
      screenReaderMessage: buildActivatedAnnouncement(powerName),
    };

    setNotifications((prev) => [...prev, notification]);

    const timer = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      timersRef.current = timersRef.current.filter((entry) => entry !== timer);
    }, POEM_POWER_EFFECT_DURATION_MS);
    timersRef.current.push(timer);
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('poem:power_used', (payload) => {
      createNotification(payload.poemId, payload.powerName);
    });
    return unsub;
  }, [createNotification]);

  const latestNotification = notifications.at(-1) ?? null;

  return {
    reducedMotion,
    latestNotification,
    powerActivatedLabel: POEM_POWER_EFFECT_LABELS.powerActivated,
  };
}
