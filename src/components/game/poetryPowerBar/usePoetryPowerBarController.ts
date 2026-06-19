import { useCallback, useEffect, useMemo } from 'react';
import { useCollectedPoems } from '@/store/selectors';
import { usePoemPowersCooldownRefresh } from '@/components/game/poetryBook/usePoemCooldownSeconds';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { useExplorationBottomHudVisible } from '@/hooks/useExplorationBottomHud';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';
import { audioEngine } from '@/engine/AudioEngine';
import { eventBus } from '@/engine/EventBus';
import {
  attemptPoemPowerActivation,
  buildCollectedWithPowers,
  getDisplayPowers,
  getEmptySlotCount,
  isPoemPowerAvailable,
} from '@/engine/poetryPowerBar/poetryPowerBarPresentation';
import { POETRY_POWER_BAR_MAX_SLOTS } from '@/engine/poetryPowerBar/poetryPowerBarConstants';

export function usePoetryPowerBarController() {
  const reducedMotion = useEffectiveReducedMotion();
  const quietStyle = useHudQuietStyle();
  const bottomHudVisible = useExplorationBottomHudVisible();
  const collectedPoems = useCollectedPoems();
  const { phase: transitionPhase } = useTransitionDirector();

  const collectedWithPowers = useMemo(
    () => buildCollectedWithPowers(collectedPoems),
    [collectedPoems],
  );

  const displayPowers = useMemo(
    () => getDisplayPowers(collectedWithPowers),
    [collectedWithPowers],
  );

  const emptySlotCount = getEmptySlotCount(displayPowers.length);
  const poemIds = useMemo(() => displayPowers.map((entry) => entry.poemId), [displayPowers]);

  usePoemPowersCooldownRefresh(poemIds);

  const visible =
    bottomHudVisible && collectedWithPowers.length > 0 && transitionPhase !== 'loading';

  useEffect(() => {
    const unsubscribe = eventBus.on('poem:power_used', () => {
      audioEngine.playSfx('quest_complete');
    });
    return unsubscribe;
  }, []);

  const activateBySlotIndex = useCallback(
    (slotIndex: number): boolean => {
      const entry = displayPowers[slotIndex];
      if (!entry || !isPoemPowerAvailable(entry.poemId)) return false;
      return attemptPoemPowerActivation(entry.poemId).ok;
    },
    [displayPowers],
  );
  useEffect(() => {
    if (!visible) return;

    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const num = parseInt(event.key, 10);
      if (num >= 1 && num <= POETRY_POWER_BAR_MAX_SLOTS && num <= displayPowers.length) {
        activateBySlotIndex(num - 1);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, displayPowers.length, activateBySlotIndex]);

  return {
    reducedMotion,
    quietStyle,
    visible,
    displayPowers,
    emptySlotCount,
  };
}
