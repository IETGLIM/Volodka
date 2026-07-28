/* ─── Volodka RPG – Quick Use Cooldown Overlay ───
   SVG-based cooldown ring overlay for QuickUseBar slots.
   Renders an animated circular progress ring over each slot on cooldown.
   Uses CSS animation + JS-controlled stroke-dashoffset for precise timing.
*/

import { useState, useEffect, useRef } from 'react';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const CIRCUMFERENCE = 2 * Math.PI * 22; // radius=22

interface CooldownEntry {
  id: string;
  startTime: number;
  duration: number;
}

export function QuickUseCooldownOverlay() {
  const [cooldowns, setCooldowns] = useState<Map<string, CooldownEntry>>(new Map());
  const rafRef = useRef<number>(0);
  const reducedMotion = useEffectiveReducedMotion();

  // Listen for sound:play events as a proxy for item use timing
  useEffect(() => {
     
    const unsub = eventBus.on('sound:play' as any, (payload: any) => {
      const p = payload as { type?: string; slotIndex?: number; itemId?: string; cooldownMs?: number } | undefined;
      if (!p || p.type !== 'item_use') return;
      const id = p.itemId ?? `slot-${p.slotIndex ?? 0}`;
      const duration = p.cooldownMs ?? 300;

      setCooldowns((prev) => {
        const next = new Map(prev);
        next.set(id, { id, startTime: Date.now(), duration });
        return next;
      });

      // Auto-remove after duration
      setTimeout(() => {
        setCooldowns((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      }, duration + 100);
    });

    return unsub;
  }, []);

  // RAF loop for smooth stroke-dashoffset updates
  useEffect(() => {
    if (cooldowns.size === 0) return;
    let running = true;

    const tick = () => {
      if (!running) return;
      // Force re-render for smooth progress
      setCooldowns((prev) => new Map(prev)); // shallow copy triggers re-render
      rafRef.current = requestAnimationFrame(tick);
    };

    if (!reducedMotion) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [cooldowns.size, reducedMotion]);

  if (cooldowns.size === 0) return null;

  return (
    <>
      {Array.from(cooldowns.entries()).map(([id, entry]) => {
        const elapsed = Date.now() - entry.startTime;
        const progress = Math.min(1, elapsed / entry.duration);
        const dashoffset = CIRCUMFERENCE * (1 - progress);

        return (
          <svg
            key={id}
            className="cooldown-ring-svg"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <circle className="cooldown-ring-track" cx="24" cy="24" r="22" />
            <circle
              cx="24"
              cy="24"
              r="22"
              style={{
                stroke: 'var(--cyber-cyan)',
                strokeDasharray: CIRCUMFERENCE,
                strokeDashoffset: reducedMotion ? 0 : dashoffset,
                transition: reducedMotion ? 'none' : 'stroke-dashoffset 0.05s linear',
              }}
            />
          </svg>
        );
      })}
    </>
  );
}