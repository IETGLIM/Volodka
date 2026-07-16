/* ─── Volodka RPG – Footstep Pedometer ───
 * Counts total footsteps during the session and displays the total
 * with a pop animation on each increment. Also shows steps-per-minute (SPM).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Footprints } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';

export function FootstepPedometer() {
  const quietStyle = useHudQuietStyle();
  const stepCountRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const [displayCount, setDisplayCount] = useState(0);
  const [popped, setPopped] = useState(false);
  const popTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bump = useCallback(() => {
    stepCountRef.current++;
    setDisplayCount(stepCountRef.current);
    setPopped(true);

    if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current);
    popTimeoutRef.current = setTimeout(() => setPopped(false), 300);
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('exploration:footstep', bump);
    return () => {
      unsub();
      if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current);
    };
  }, [bump]);

  // Calculate SPM: steps / elapsed minutes (0 if under 1 minute)
  const elapsedMinutes = (Date.now() - sessionStartRef.current) / 60000;
  const spm = elapsedMinutes >= 1 ? Math.round(stepCountRef.current / elapsedMinutes) : 0;

  const formattedCount = displayCount.toLocaleString('ru-RU');

  return (
    <div
      className={`footstep-pedometer${popped ? ' bumped' : ''} flex flex-col items-center gap-0.5 select-none pointer-events-none`}
      style={quietStyle}
      aria-label={`Шаги: ${displayCount}, ${spm} шагов в минуту`}
    >
      {/* Label */}
      <span
        className="font-mono tracking-[0.12em] uppercase"
        style={{
          fontSize: '7px',
          color: 'rgba(52, 211, 153, 0.4)',
          lineHeight: 1,
        }}
      >
        ШАГИ
      </span>

      {/* Step count with pop */}
      <div className="flex items-center gap-1">
        <Footprints
          size={12}
          style={{ color: 'rgba(52, 211, 153, 0.5)', flexShrink: 0 }}
        />
        <span
          className={popped ? 'pedometer-step-pop' : undefined}
          style={{
            fontFamily: 'monospace',
            fontSize: '9px',
            color: 'rgba(52, 211, 153, 0.6)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            display: 'inline-block',
          }}
        >
          {formattedCount}
        </span>
      </div>

      {/* Steps per minute */}
      {spm > 0 && (
        <span
          className="font-mono"
          style={{
            fontSize: '7px',
            color: 'rgba(52, 211, 153, 0.3)',
            lineHeight: 1,
          }}
        >
          {spm} спм
        </span>
      )}
    </div>
  );
}