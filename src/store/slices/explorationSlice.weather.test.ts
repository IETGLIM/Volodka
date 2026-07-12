import { describe, expect, it, beforeEach } from 'vitest';
import { useExplorationStore } from '../stores/explorationStore';

describe('explorationSlice weather mutations', () => {
  beforeEach(() => {
    useExplorationStore.setState({
      weatherEnabled: true,
      rainIntensity: 0.7,
    });
  });

  it('toggleWeather mutates top-level weatherEnabled', () => {
    useExplorationStore.getState().toggleWeather();
    const state = useExplorationStore.getState();
    expect(state.weatherEnabled).toBe(false);
  });

  it('setRainIntensity mutates top-level rainIntensity', () => {
    useExplorationStore.getState().setRainIntensity(0.15);
    const state = useExplorationStore.getState();
    expect(state.rainIntensity).toBe(0.15);
  });
});
