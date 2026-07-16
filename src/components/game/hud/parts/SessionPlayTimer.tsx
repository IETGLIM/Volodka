/* ─── Volodka RPG – Session Play Timer ───
 * Displays current session playtime as MM:SS with a blinking colon.
 * Tracks elapsed time from component mount with a 1-second interval.
 */

import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';

export function SessionPlayTimer() {
  const quietStyle = useHudQuietStyle();
  const startTimeRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const seconds = String(elapsed % 60).padStart(2, '0');

  return (
    <div
      className="session-timer-widget flex flex-col items-center gap-0.5 select-none pointer-events-none"
      style={quietStyle}
      aria-label={`Сессия: ${minutes}:${seconds}`}
    >
      {/* Label */}
      <span
        className="font-mono tracking-[0.12em] uppercase"
        style={{
          fontSize: '7px',
          color: 'rgb(var(--cyber-cyan-rgb) / 0.4)',
          lineHeight: 1,
        }}
      >
        СЕССИЯ
      </span>

      {/* Time display */}
      <div className="flex items-center gap-0">
        <span
          className="font-mono tabular-nums"
          style={{
            fontSize: '10px',
            color: 'rgb(var(--cyber-cyan-rgb) / 0.75)',
            textShadow: '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.2)',
          }}
        >
          {minutes}
        </span>
        <span
          className="session-timer-blink font-mono"
          style={{
            fontSize: '10px',
            color: 'rgb(var(--cyber-cyan-rgb) / 0.75)',
            textShadow: '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.2)',
          }}
        >
          :
        </span>
        <span
          className="font-mono tabular-nums"
          style={{
            fontSize: '10px',
            color: 'rgb(var(--cyber-cyan-rgb) / 0.75)',
            textShadow: '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.2)',
          }}
        >
          {seconds}
        </span>
      </div>

      {/* Small clock icon */}
      <Clock
        size={10}
        style={{ color: 'rgb(var(--cyber-cyan-rgb) / 0.3)', marginTop: 1 }}
      />
    </div>
  );
}