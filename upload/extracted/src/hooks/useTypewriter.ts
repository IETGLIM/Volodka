'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Typewriter hook — requestAnimationFrame-based for smooth animation.
 * Shared between StoryRenderer and DialogueRenderer.
 */
export function useTypewriter(text: string, speed = 30) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let idx = 0;
    let rafId: number;
    let lastUpdate = 0;

    const tick = (timestamp: number) => {
      if (timestamp - lastUpdate >= speed) {
        lastUpdate = timestamp;
        idx++;
        if (idx >= text.length) {
          setDisplayed(text);
          setDone(true);
          return; // Stop the loop
        } else {
          setDisplayed(text.slice(0, idx));
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [text, speed]);

  const skip = useCallback(() => {
    setDisplayed(text);
    setDone(true);
  }, [text]);

  return { displayed, done, skip };
}
