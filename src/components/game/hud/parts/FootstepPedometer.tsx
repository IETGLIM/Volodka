/* ─── Volodka RPG – Footstep Pedometer ───
 * Counts footsteps during the session. Updates DOM via refs — no React
 * commit per step (walking used to re-render HUD on every footstep).
 */

import { useEffect, useRef } from 'react';
import { Footprints } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';

const POP_MS = 300;
const SPM_REFRESH_MS = 2000;

export function FootstepPedometer() {
  const quietStyle = useHudQuietStyle();
  const stepCountRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const countElRef = useRef<HTMLSpanElement>(null);
  const spmElRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const popTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const bump = () => {
      stepCountRef.current += 1;
      const count = stepCountRef.current;
      if (countElRef.current) {
        countElRef.current.textContent = count.toLocaleString('ru-RU');
      }
      const root = rootRef.current;
      if (root) {
        root.classList.add('bumped');
        if (countElRef.current) countElRef.current.classList.add('pedometer-step-pop');
        if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current);
        popTimeoutRef.current = setTimeout(() => {
          root.classList.remove('bumped');
          countElRef.current?.classList.remove('pedometer-step-pop');
        }, POP_MS);
      }
      root?.setAttribute(
        'aria-label',
        `Шаги: ${count}`,
      );
    };

    const unsub = eventBus.on('exploration:footstep', bump);

    const spmTimer = setInterval(() => {
      const elapsedMinutes = (Date.now() - sessionStartRef.current) / 60000;
      if (!spmElRef.current) return;
      if (elapsedMinutes < 1) {
        spmElRef.current.hidden = true;
        return;
      }
      const spm = Math.round(stepCountRef.current / elapsedMinutes);
      spmElRef.current.hidden = false;
      spmElRef.current.textContent = `${spm} спм`;
      rootRef.current?.setAttribute(
        'aria-label',
        `Шаги: ${stepCountRef.current}, ${spm} шагов в минуту`,
      );
    }, SPM_REFRESH_MS);

    return () => {
      unsub();
      clearInterval(spmTimer);
      if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="footstep-pedometer flex flex-col items-center gap-0.5 select-none pointer-events-none"
      style={quietStyle}
      aria-label="Шаги: 0"
    >
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

      <div className="flex items-center gap-1">
        <Footprints
          size={12}
          style={{ color: 'rgba(52, 211, 153, 0.5)', flexShrink: 0 }}
        />
        <span
          ref={countElRef}
          style={{
            fontFamily: 'monospace',
            fontSize: '9px',
            color: 'rgba(52, 211, 153, 0.6)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            display: 'inline-block',
          }}
        >
          0
        </span>
      </div>

      <span
        ref={spmElRef}
        className="font-mono"
        hidden
        style={{
          fontSize: '7px',
          color: 'rgba(52, 211, 153, 0.3)',
          lineHeight: 1,
        }}
      />
    </div>
  );
}
