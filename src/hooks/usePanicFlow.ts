import { useCallback } from 'react';
import { eventBus } from '@/engine/EventBus';

interface UsePanicFlowParams {
  clearPanicMode: () => void;
  reduceStress: (amount: number) => void;
  getCurrentStress: () => number;
}

export function usePanicFlow({
  clearPanicMode,
  reduceStress,
  getCurrentStress,
}: UsePanicFlowParams) {
  const handleCalmDown = useCallback(() => {
    clearPanicMode();
    reduceStress(10);
    eventBus.emit('panic:cleared', { stress: getCurrentStress() });
  }, [clearPanicMode, reduceStress, getCurrentStress]);

  return {
    handleCalmDown,
  };
}
