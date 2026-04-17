import { useCallback, useRef, useState } from 'react';

export function useTimedMessage(timeoutMs = 2000) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearMessage = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setMessage(null);
  }, []);

  const showMessage = useCallback((text: string, durationMs?: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setMessage(text);
    const ms = durationMs ?? timeoutMs;
    timeoutRef.current = setTimeout(() => {
      setMessage(null);
      timeoutRef.current = null;
    }, ms);
  }, [timeoutMs]);

  return {
    message,
    showMessage,
    clearMessage,
  };
}
