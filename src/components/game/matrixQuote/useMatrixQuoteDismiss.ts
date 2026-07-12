import { useCallback, useEffect, useRef } from 'react';
import { MATRIX_QUOTE_FADE_MS } from '@/engine/matrixQuote/matrixQuoteConstants';
import { useMatrixQuoteSkipInput } from '@/components/game/matrixQuote/useMatrixQuoteSkipInput';

type UseMatrixQuoteDismissArgs = {
  done: boolean;
  skip: () => void;
  onDismiss: () => void;
  reducedMotion: boolean;
  duration: number;
  enabled: boolean;
  setVisible: (visible: boolean) => void;
};

export function useMatrixQuoteDismiss({
  done,
  skip,
  onDismiss,
  reducedMotion,
  duration,
  enabled,
  setVisible,
}: UseMatrixQuoteDismissArgs) {
  const dismissedRef = useRef(false);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFadeTimeout = useCallback(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setVisible(false);

    clearFadeTimeout();
    fadeTimeoutRef.current = setTimeout(
      onDismiss,
      reducedMotion ? 0 : MATRIX_QUOTE_FADE_MS,
    );
  }, [clearFadeTimeout, onDismiss, reducedMotion, setVisible]);

  const handleInteraction = useCallback(() => {
    if (!done) skip();
    handleDismiss();
  }, [done, handleDismiss, skip]);

  useEffect(() => {
    if (!done || dismissedRef.current) return;

    autoDismissRef.current = setTimeout(handleDismiss, duration);
    return () => {
      if (autoDismissRef.current) {
        clearTimeout(autoDismissRef.current);
        autoDismissRef.current = null;
      }
    };
  }, [done, duration, handleDismiss]);

  useEffect(() => () => clearFadeTimeout(), [clearFadeTimeout]);

  useMatrixQuoteSkipInput(enabled, handleInteraction);

  return { handleInteraction, handleDismiss };
}
