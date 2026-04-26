import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useExplorationRackConsoleStore } from './explorationRackConsoleStore';

describe('explorationRackConsoleStore', () => {
  beforeEach(() => {
    useExplorationRackConsoleStore.setState({ session: null });
  });

  it('opens and closes session without calling onProceed', () => {
    const onProceed = vi.fn();
    useExplorationRackConsoleStore.getState().openSession({
      headline: 'h',
      lines: ['a'],
      proceedLabel: 'go',
      dismissLabel: 'x',
      onProceed,
    });
    expect(useExplorationRackConsoleStore.getState().session).not.toBeNull();
    useExplorationRackConsoleStore.getState().closeSession();
    expect(useExplorationRackConsoleStore.getState().session).toBeNull();
    expect(onProceed).not.toHaveBeenCalled();
  });

  it('proceedSession clears session and runs onProceed in a microtask', async () => {
    const onProceed = vi.fn();
    useExplorationRackConsoleStore.getState().openSession({
      headline: 'h',
      lines: [],
      proceedLabel: 'go',
      dismissLabel: 'x',
      onProceed,
    });
    useExplorationRackConsoleStore.getState().proceedSession();
    expect(useExplorationRackConsoleStore.getState().session).toBeNull();
    expect(onProceed).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(onProceed).toHaveBeenCalledTimes(1);
  });
});
