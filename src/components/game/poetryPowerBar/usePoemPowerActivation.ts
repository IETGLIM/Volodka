import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { eventBus } from '@/engine/EventBus';
import { POEM_POWER_JUST_USED_MS } from '@/engine/poetryBook/poetryBookConstants';
import { getCooldownRemaining, getPoemPower } from '@/engine/PoemPowerSystem';
import { getCooldownProgress } from '@/engine/poetryBook/poetryBookPresentation';
import {
  attemptPoemPowerActivation,
  buildActivatedAnnouncement,
  isPoemPowerAvailable,
} from '@/engine/poetryPowerBar/poetryPowerBarPresentation';
import { usePoemCooldownSeconds } from '@/components/game/poetryBook/usePoemCooldownSeconds';

function triggerJustUsedFeedback(
  setJustUsed: (value: boolean) => void,
  setLiveAnnouncement: (value: string) => void,
  powerName: string,
  timeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
): void {
  setJustUsed(true);
  setLiveAnnouncement(buildActivatedAnnouncement(powerName));
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }
  timeoutRef.current = setTimeout(() => {
    timeoutRef.current = null;
    setJustUsed(false);
  }, POEM_POWER_JUST_USED_MS);
}

export function usePoemPowerActivation(poemId: string) {
  const [activating, setActivating] = useState(false);
  const [justUsed, setJustUsed] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const justUsedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const power = getPoemPower(poemId);
  const available = power ? isPoemPowerAvailable(poemId) : false;
  const cooldownMs = power ? getCooldownRemaining(poemId) : 0;
  const onCooldown = cooldownMs > 0;
  const cooldownSec = usePoemCooldownSeconds(poemId, !!power && onCooldown);
  const cooldownProgress = power ? getCooldownProgress(cooldownMs, power.cooldownMs) : 0;

  const availableRef = useRef(available);
  const powerRef = useRef(power);
  availableRef.current = available;
  powerRef.current = power;

  useEffect(() => {
    const unsubscribe = eventBus.on('poem:power_used', (payload) => {
      if (payload.poemId !== poemId) return;
      triggerJustUsedFeedback(setJustUsed, setLiveAnnouncement, payload.powerName, justUsedTimeoutRef);
    });
    return unsubscribe;
  }, [poemId]);

  useEffect(
    () => () => {
      if (justUsedTimeoutRef.current) {
        clearTimeout(justUsedTimeoutRef.current);
      }
    },
    [],
  );

  const activate = useCallback((): boolean => {
    if (!availableRef.current || activating || !powerRef.current) return false;

    setActivating(true);
    const result = attemptPoemPowerActivation(poemId);
    setActivating(false);
    return result.ok;
  }, [poemId, activating]);

  return {
    power,
    available,
    activating,
    justUsed,
    onCooldown,
    cooldownSec,
    cooldownProgress,
    liveAnnouncement,
    activate,
  };
}