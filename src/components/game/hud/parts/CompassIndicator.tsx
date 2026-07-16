/* ─── Volodka RPG – Compass Indicator (mini compass in top-right HUD) ───
   Shows cardinal directions (N/S/E/W) based on camera/player yaw.
   Small 50×50px circle with a rotating compass needle.
   Uses the exploration:footstep event's yaw as the direction proxy.
*/

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';

/* ── Convert yaw (radians) to CSS rotation degrees ── */
function yawToDeg(yaw: number): number {
  // Yaw: 0 = looking along -Z (North in most 3D engines)
  // CSS rotation: 0deg = up (North), clockwise positive
  const deg = (-yaw * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

export function CompassIndicator() {
  const [rotation, setRotation] = useState(0);
  const rafRef = useRef<number>(0);
  const targetYawRef = useRef(0);
  const currentRotRef = useRef(0);

  // Subscribe to footstep yaw to track player facing direction
  useEffect(() => {
    const unsub = eventBus.on('exploration:footstep', (payload) => {
      targetYawRef.current = payload.yaw;
    });
    return () => { unsub(); };
  }, []);

  // Smooth interpolation via RAF
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
      current += delta * 0.12; // smooth factor

      currentRotRef.current = ((current % 360) + 360) % 360;
      setRotation(currentRotRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const displayDeg = Math.round(rotation);

  return (
    <div
      className="relative shrink-0 pointer-events-none select-none flex flex-col items-center"
      style={{ width: 50 }}
      aria-label="Компас"
      role="img"
    >
      <motion.div
        className="w-full h-full rounded-full border backdrop-blur-sm"
        style={{
          background: 'radial-gradient(circle, rgba(2,6,23,0.85) 0%, rgba(15,23,42,0.75) 70%, rgba(0,0,0,0.6) 100%)',
          borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.25)',
          boxShadow: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.15), inset 0 0 8px rgba(0,0,0,0.4), 0 0 24px rgb(var(--cyber-cyan-rgb) / 0.05)',
        }}
        animate={{ rotate: -rotation }}
        transition={{ duration: 0.15, ease: 'linear' }}
      >
        {/* Cardinal direction labels — fixed visual up = North */}
        <span
          className="absolute left-1/2 -translate-x-1/2 text-[8px] font-bold text-cyan-400"
          style={{ top: 3, textShadow: '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.5)' }}
        >
          С
        </span>
        <span
          className="absolute left-1/2 -translate-x-1/2 text-[8px] font-medium text-slate-500"
          style={{ bottom: 3 }}
        >
          Ю
        </span>
        <span
          className="absolute top-1/2 -translate-y-1/2 text-[8px] font-medium text-slate-500"
          style={{ left: 4 }}
        >
          З
        </span>
        <span
          className="absolute top-1/2 -translate-y-1/2 text-[8px] font-medium text-slate-500"
          style={{ right: 4 }}
        >
          В
        </span>

        {/* Compass needle — pointing North (up) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full" style={{ height: '40%', width: 2 }}>
          <div
            className="w-0.5 h-full mx-auto rounded-t-full"
            style={{
              background: 'linear-gradient(180deg, var(--cyber-cyan) 0%, transparent 100%)',
              boxShadow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.5)',
            }}
          />
        </div>
        {/* South needle (dimmer) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2" style={{ height: '30%', width: 2 }}>
          <div
            className="w-0.5 h-full mx-auto rounded-b-full"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(251,113,133,0.4) 100%)',
            }}
          />
        </div>

        {/* Center dot with pulse */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 5,
            height: 5,
            background: 'var(--cyber-cyan)',
            boxShadow: '0 0 6px var(--cyber-cyan), 0 0 12px rgb(var(--cyber-cyan-rgb) / 0.3)',
            animation: 'compass-needle-swing 5s ease-in-out infinite',
          }}
        />
      </motion.div>

      {/* Fixed North indicator (stays on top, doesn't rotate) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-[7px] font-bold text-cyan-400/80 pointer-events-none"
        style={{ top: -2, textShadow: '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.4)' }}
        aria-hidden="true"
      >
        ▲
      </div>

      {/* Numeric degree readout with subtle glow */}
      <span
        className="mt-0.5 text-[9px] font-mono tabular-nums select-none pointer-events-none"
        style={{
          color: 'rgb(var(--cyber-cyan-rgb) / 0.7)',
          textShadow: '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.3)',
        }}
        aria-hidden="true"
      >
        {displayDeg}°
      </span>
    </div>
  );
}
