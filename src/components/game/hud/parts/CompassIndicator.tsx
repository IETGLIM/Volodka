/* ─── Volodka RPG – Compass Indicator (mini compass in top-right HUD) ───
   Shows cardinal directions (N/S/E/W) based on camera/player yaw.
   Small 50×50px circle with a rotating compass needle.
   Uses the exploration:footstep event's yaw as the direction proxy.
*/

import { useEffect, useRef, useState } from 'react';
import { eventBus } from '@/engine/EventBus';

/* ── Convert yaw (radians) to CSS rotation degrees ── */
function yawToDeg(yaw: number): number {
  // Yaw: 0 = looking along -Z (North in most 3D engines)
  // CSS rotation: 0deg = up (North), clockwise positive
  const deg = (-yaw * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

export function CompassIndicator() {
  const [displayDeg, setDisplayDeg] = useState(0);
  const rafRef = useRef(0);
  const targetYawRef = useRef(0);
  const currentRotRef = useRef(0);
  const dialRef = useRef<HTMLDivElement>(null);
  const lastShownDegRef = useRef(-1);

  // Subscribe to footstep yaw to track player facing direction
  useEffect(() => {
    const unsub = eventBus.on('exploration:footstep', (payload) => {
      targetYawRef.current = payload.yaw ?? 0;
    });
    return () => { unsub(); };
  }, []);

  // Smooth interpolation via RAF — mutate DOM/CSS, React only when readout changes ≥1°
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const target = yawToDeg(targetYawRef.current);
      let current = currentRotRef.current;

      // Shortest-path interpolation
      let delta = target - current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      current += delta * 0.12;

      currentRotRef.current = ((current % 360) + 360) % 360;
      if (dialRef.current) {
        dialRef.current.style.transform = `rotate(${-currentRotRef.current}deg)`;
      }

      const shown = Math.round(currentRotRef.current);
      if (shown !== lastShownDegRef.current) {
        lastShownDegRef.current = shown;
        setDisplayDeg(shown);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="relative shrink-0 pointer-events-none select-none flex flex-col items-center"
      style={{ width: 50 }}
      aria-label="Компас"
      role="img"
    >
      <div
        ref={dialRef}
        className="w-full h-full rounded-full border backdrop-blur-sm will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(12,10,9,0.88) 0%, rgba(28,25,23,0.78) 70%, rgba(0,0,0,0.55) 100%)',
          borderColor: 'rgba(168, 162, 158, 0.28)',
          boxShadow: '0 1px 10px rgba(0,0,0,0.45), inset 0 0 8px rgba(0,0,0,0.35)',
        }}
      >
        {/* Cardinal direction labels — fixed visual up = North */}
        <span
          className="absolute left-1/2 -translate-x-1/2 text-[8px] font-bold"
          style={{ top: 3, color: 'rgba(231, 229, 228, 0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
        >
          С
        </span>
        <span
          className="absolute left-1/2 -translate-x-1/2 text-[8px] font-medium"
          style={{ bottom: 3, color: 'rgba(168, 162, 158, 0.75)' }}
        >
          Ю
        </span>
        <span
          className="absolute top-1/2 -translate-y-1/2 text-[8px] font-medium"
          style={{ left: 4, color: 'rgba(168, 162, 158, 0.75)' }}
        >
          З
        </span>
        <span
          className="absolute top-1/2 -translate-y-1/2 text-[8px] font-medium"
          style={{ right: 4, color: 'rgba(168, 162, 158, 0.75)' }}
        >
          В
        </span>

        {/* Compass needle — pointing North (up) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full" style={{ height: '40%', width: 2 }}>
          <div
            className="w-0.5 h-full mx-auto rounded-t-full"
            style={{
              background: 'linear-gradient(180deg, rgba(231,229,228,0.95) 0%, transparent 100%)',
              boxShadow: 'none',
            }}
          />
        </div>
        {/* South needle (dimmer) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2" style={{ height: '30%', width: 2 }}>
          <div
            className="w-0.5 h-full mx-auto rounded-b-full"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(168,162,158,0.45) 100%)',
            }}
          />
        </div>

        {/* Center dot with pulse */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 5,
            height: 5,
            background: 'rgba(214, 211, 209, 0.9)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
            animation: 'compass-needle-swing 5s ease-in-out infinite',
          }}
        />
      </div>

      {/* Fixed North indicator (stays on top, doesn't rotate) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-[7px] font-bold pointer-events-none"
        style={{ top: -2, color: 'rgba(231, 229, 228, 0.75)', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
        aria-hidden="true"
      >
        ▲
      </div>

      {/* Numeric degree readout */}
      <span
        className="mt-0.5 text-[9px] font-mono tabular-nums select-none pointer-events-none"
        style={{
          color: 'rgba(168, 162, 158, 0.8)',
          textShadow: '0 1px 2px rgba(0,0,0,0.55)',
        }}
        aria-hidden="true"
      >
        {displayDeg}°
      </span>
    </div>
  );
}
