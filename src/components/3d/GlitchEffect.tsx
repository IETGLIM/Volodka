
/* ─── Volodka RPG – Glitch Effect ─── */
/* Random screen tears, color splits, and pixel displacement.
   CSS + Canvas hybrid for performance.
   Activatable via eventBus.emit('fx:glitch', { intensity, duration })
   Also auto-triggers on scene transitions and low karma events. */

import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

interface GlitchParams {
  intensity: number; // 0-1
  duration: number;  // ms
}

type GlitchType = 'horizontal-tear' | 'color-split' | 'pixel-sort' | 'scan-line';

/** Generate a random glitch type weighted by intensity */
function pickGlitchType(intensity: number): GlitchType {
  const r = Math.random();
  if (intensity > 0.7 && r < 0.3) return 'pixel-sort';
  if (intensity > 0.4 && r < 0.5) return 'color-split';
  if (r < 0.7) return 'horizontal-tear';
  return 'scan-line';
}

export function GlitchEffect() {
  const [active, setActive] = useState(false);
  const [glitchType, setGlitchType] = useState<GlitchType>('horizontal-tear');
  const [intensity, setIntensity] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number>(0);

  /** Trigger a glitch with given parameters */
  const triggerGlitch = useCallback((params: GlitchParams) => {
    const type = pickGlitchType(params.intensity);
    setGlitchType(type);
    setIntensity(params.intensity);
    setActive(true);

    // Clear any previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Deactivate after duration
    timerRef.current = setTimeout(() => {
      setActive(false);
    }, params.duration);
  }, []);

  /** Listen for fx:glitch events and scene transitions */
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Direct fx:glitch events
    unsubs.push(
      eventBus.on('fx:glitch', (payload) => {
        triggerGlitch({ intensity: payload.intensity, duration: payload.duration });
      }),
    );

    // Scene transitions trigger a mild glitch
    unsubs.push(
      eventBus.on('scene:enter', () => {
        triggerGlitch({ intensity: 0.3, duration: 400 });
      }),
    );

    // Combat camera events trigger glitch
    unsubs.push(
      eventBus.on('camera:combat_impact', ({ intensity }) => {
        triggerGlitch({ intensity: Math.min(intensity * 0.8, 0.7), duration: 200 });
      }),
    );

    unsubs.push(
      eventBus.on('camera:combat_shake', ({ intensity }) => {
        triggerGlitch({ intensity: Math.min(intensity * 0.6, 0.5), duration: 250 });
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, [triggerGlitch]);

  /** Canvas-based glitch rendering for pixel-sort and scan-line types */
  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const w = window.innerWidth;
    const h = window.innerHeight;

    if (glitchType === 'pixel-sort') {
      // Draw horizontal displacement bands
      const bandCount = Math.floor(3 + intensity * 8);
      for (let i = 0; i < bandCount; i++) {
        const bandY = Math.random() * h;
        const bandH = 2 + Math.random() * 20 * intensity;
        const shift = (Math.random() - 0.5) * 80 * intensity;
        ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '0, 255, 65' : '255, 0, 80'}, ${0.15 + intensity * 0.2})`;
        ctx.fillRect(shift, bandY, w, bandH);
      }
    } else if (glitchType === 'scan-line') {
      // Draw bright scan lines
      const lineCount = Math.floor(2 + intensity * 5);
      for (let i = 0; i < lineCount; i++) {
        const lineY = Math.random() * h;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + intensity * 0.1})`;
        ctx.fillRect(0, lineY, w, 1 + Math.random() * 2);
      }
    }

    // Animate: re-render every 50ms for dynamic glitch
    const interval = setInterval(() => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (glitchType === 'pixel-sort') {
        const bandCount = Math.floor(3 + intensity * 8);
        for (let i = 0; i < bandCount; i++) {
          const bandY = Math.random() * h * dpr;
          const bandH = 2 + Math.random() * 20 * intensity * dpr;
          const shift = (Math.random() - 0.5) * 80 * intensity * dpr;
          ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '0, 255, 65' : '255, 0, 80'}, ${0.15 + intensity * 0.2})`;
          ctx.fillRect(shift, bandY, w * dpr, bandH);
        }
      } else if (glitchType === 'scan-line') {
        const lineCount = Math.floor(2 + intensity * 5);
        for (let i = 0; i < lineCount; i++) {
          const lineY = Math.random() * h * dpr;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + intensity * 0.1})`;
          ctx.fillRect(0, lineY, w * dpr, 1 + Math.random() * 2 * dpr);
        }
      }
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [active, glitchType, intensity]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  if (!active) return null;

  // CSS-based effects for horizontal-tear and color-split
  const isCSSGlitch = glitchType === 'horizontal-tear' || glitchType === 'color-split';

  const cssStyle: React.CSSProperties = isCSSGlitch
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: UI_LAYERS.GLITCH,
        animation: glitchType === 'color-split'
          ? `glitchColorSplit ${200 / (1 + intensity)}ms infinite`
          : `glitchHorizontalTear ${150 / (1 + intensity)}ms infinite`,
      }
    : {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: UI_LAYERS.GLITCH,
      };

  return (
    <>
      {/* CSS keyframes injected once */}
      <style>{`
        @keyframes glitchHorizontalTear {
          0%   { clip-path: inset(40% 0 50% 0); transform: translate(${3 * intensity}px, 0); }
          10%  { clip-path: inset(10% 0 70% 0); transform: translate(-${5 * intensity}px, 0); }
          20%  { clip-path: inset(60% 0 10% 0); transform: translate(${2 * intensity}px, 0); }
          30%  { clip-path: inset(30% 0 40% 0); transform: translate(-${4 * intensity}px, 0); }
          40%  { clip-path: inset(75% 0 5% 0);  transform: translate(${6 * intensity}px, 0); }
          50%  { clip-path: inset(5% 0 80% 0);  transform: translate(-${2 * intensity}px, 0); }
          60%  { clip-path: inset(50% 0 20% 0); transform: translate(${4 * intensity}px, 0); }
          70%  { clip-path: inset(20% 0 55% 0); transform: translate(-${3 * intensity}px, 0); }
          80%  { clip-path: inset(65% 0 15% 0); transform: translate(${5 * intensity}px, 0); }
          90%  { clip-path: inset(35% 0 35% 0); transform: translate(-${1 * intensity}px, 0); }
          100% { clip-path: inset(45% 0 30% 0); transform: translate(${2 * intensity}px, 0); }
        }
        @keyframes glitchColorSplit {
          0%   { filter: none; box-shadow: inset 0 0 0 transparent; }
          15%  { box-shadow: inset ${4 * intensity}px 0 0 rgba(255,0,80,0.15), inset -${4 * intensity}px 0 0 rgba(0,255,65,0.15); }
          30%  { box-shadow: inset -${3 * intensity}px 0 0 rgba(255,0,80,0.12), inset ${3 * intensity}px 0 0 rgba(0,255,65,0.12); }
          45%  { box-shadow: inset ${5 * intensity}px 0 0 rgba(0,120,255,0.1), inset -${5 * intensity}px 0 0 rgba(255,200,0,0.1); }
          60%  { box-shadow: inset -${2 * intensity}px 0 0 rgba(255,0,80,0.1), inset ${2 * intensity}px 0 0 rgba(0,255,65,0.1); }
          75%  { box-shadow: inset ${6 * intensity}px 0 0 rgba(0,255,65,0.15), inset -${6 * intensity}px 0 0 rgba(255,0,80,0.15); }
          90%  { box-shadow: inset -${3 * intensity}px 0 0 rgba(255,0,80,0.08), inset ${3 * intensity}px 0 0 rgba(0,255,65,0.08); }
          100% { box-shadow: inset 0 0 0 transparent; }
        }
      `}</style>

      {/* CSS glitch layer */}
      {isCSSGlitch && (
        <div style={cssStyle} aria-hidden="true" />
      )}

      {/* Canvas glitch layer (pixel-sort, scan-line) */}
      {!isCSSGlitch && (
        <canvas
          ref={canvasRef}
          style={cssStyle}
          aria-hidden="true"
        />
      )}
    </>
  );
}
