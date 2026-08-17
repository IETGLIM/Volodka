import { useRef, type RefObject } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { Group } from 'three';

/**
 * Applies a brief horizontal glitch displacement (translateX jitter)
 * to the center terminal monitor every 5–10 seconds.
 *
 * Pure-refs — no React re-renders.
 */
export function useMonitorGlitch(
  monitorGroupRef: RefObject<Group | null>,
): void {
  const timeRef = useRef(0);
  const nextGlitchRef = useRef(5 + Math.random() * 5);
  const glitchPhaseRef = useRef<'idle' | 'active'>('idle');
  const glitchTimerRef = useRef(0);
  const glitchDurationRef = useRef(0.1 + Math.random() * 0.1); // 100–200ms
  const offsetXRef = useRef(0);

  useFrameTick('misc', ({ delta }) => {
    const group = monitorGroupRef.current;
    if (!group) return;
    timeRef.current += delta;

    const phase = glitchPhaseRef.current;

    if (phase === 'idle') {
      // Reset any residual offset
      if (offsetXRef.current !== 0) {
        offsetXRef.current = 0;
        group.position.x = 0;
      }
      if (timeRef.current >= nextGlitchRef.current) {
        glitchPhaseRef.current = 'active';
        glitchTimerRef.current = 0;
        glitchDurationRef.current = 0.1 + Math.random() * 0.1;
      }
    } else if (phase === 'active') {
      glitchTimerRef.current += delta;

      // Random jitter: pick new target every frame for that "glitchy" feel
      const jitter = (Math.random() - 0.5) * 0.012; // ±6mm
      offsetXRef.current += (jitter - offsetXRef.current) * 0.6;
      group.position.x = offsetXRef.current;

      if (glitchTimerRef.current >= glitchDurationRef.current) {
        glitchPhaseRef.current = 'idle';
        nextGlitchRef.current = timeRef.current + 5 + Math.random() * 5;
        offsetXRef.current = 0;
        group.position.x = 0;
      }
    }
  });
}