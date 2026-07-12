import { useEffect, useState } from 'react';

export interface UseTypewriterOptions {
  text: string;
  /** ms per character */
  speed?: number;
  /** delay before typing starts */
  delay?: number;
  /** start only when true */
  active?: boolean;
}

/** Shared typewriter hook for menu subtitles + intro prose. */
export function useTypewriter({
  text,
  speed = 35,
  delay = 0,
  active = true,
}: UseTypewriterOptions): { display: string; done: boolean } {
  const [display, setDisplay] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplay('');
      setDone(false);
      return;
    }
    let cancelled = false;
    let charIndex = 0;
    setDisplay('');
    setDone(false);

    const startTimer = setTimeout(() => {
      const tick = () => {
        if (cancelled) return;
        charIndex += 1;
        setDisplay(text.slice(0, charIndex));
        if (charIndex >= text.length) {
          setDone(true);
          return;
        }
        setTimeout(tick, speed);
      };
      tick();
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
  }, [text, speed, delay, active]);

  return { display, done };
}
