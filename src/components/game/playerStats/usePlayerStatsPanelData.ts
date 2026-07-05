import { useCallback, useEffect, useMemo, useState } from 'react';
import { determineWeatherType, type WeatherType } from '@/data/weatherEffects';
import { eventBus } from '@/engine/EventBus';
import { buildActiveStatusEffects } from '@/engine/statusEffects/activeStatusEffects';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';
import { usePlayerStatsPanelState } from '@/store/selectors';

export function usePlayerStatsPanelData(open: boolean, onClose: () => void) {
  const reducedMotion = useEffectiveReducedMotion();
  const { phase: transitionPhase } = useTransitionDirector();
  const store = usePlayerStatsPanelState();
  const [snowActive, setSnowActive] = useState(false);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const unsub = eventBus.on('weather:snow', (payload) => {
      setSnowActive(payload.active);
    });
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!open || transitionPhase !== 'loading') return;
    handleClose();
  }, [open, transitionPhase, handleClose]);

  const currentWeather: WeatherType = useMemo(
    () =>
      determineWeatherType(
        store.weatherEnabled,
        store.rainIntensity,
        snowActive,
        store.currentSceneId,
        store.timeOfDay,
      ),
    [
      store.weatherEnabled,
      store.rainIntensity,
      snowActive,
      store.currentSceneId,
      store.timeOfDay,
    ],
  );

  const activeEffects = useMemo(
    () =>
      buildActiveStatusEffects({
        currentWeather,
        unlockedPerks: store.unlockedPerks,
        energy: store.energy,
        stress: store.stress,
      }),
    [currentWeather, store.unlockedPerks, store.energy, store.stress],
  );

  return {
    reducedMotion,
    ...store,
    activeEffects,
    handleClose,
  };
}

export type PlayerStatsPanelData = ReturnType<typeof usePlayerStatsPanelData>;
