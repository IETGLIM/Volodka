
/* ─── Volodka RPG – Glitch Effect ─── */
/* Random screen tears, color splits, and pixel displacement.
   CSS + Canvas hybrid for performance.
   Activatable via eventBus.emit('fx:glitch', { intensity, duration })
   Also auto-triggers on scene transitions, combat impacts, and
   hacking minigame openings (color-split + scanline + static burst). */

import { useRef, useEffect, useState, useCallback } from 'react';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

interface GlitchParams {
  intensity: number; // 0-1
  duration: number;  // ms
}

type GlitchType = 'horizontal-tear' | 'color-split' | 'pixel-sort' | 'scan-line' | 'hacking-burst';

/** Game types that trigger the hacking burst glitch on open */
const HACKING_GAME_TYPES = new Set(['hacking', 'codebreaker', 'openstack', 'openstack_terminal', 'bash_terminal']);

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
  // Nested decay timer (Phase 2 of hacking burst). Previously this was a
  // local variable inside triggerHackingBurst and was only reachable from
  // the outer timer's clearTimeout — if the component unmounted between
  // t=200ms and t=totalDuration, the unmount cleanup cleared timerRef but
  // NOT the decay timer, leaking the closure and firing setIntensity on
  // an unmounted component.
  const decayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  /** Trigger the hacking burst glitch: color-split + scanline + static */
  const triggerHackingBurst = useCallback(() => {
    setGlitchType('hacking-burst');
    setIntensity(0.85);
    setActive(true);

    // Clear any previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Phase 1: intense burst for 200ms
    // Phase 2: decay for remaining duration
    const totalDuration = 600 + Math.random() * 400; // 0.6-1s

    // Clear any previous decay timer (in case triggerHackingBurst fires
    // again before the previous burst finished).
    if (decayTimerRef.current) clearTimeout(decayTimerRef.current);

    // After initial burst, reduce intensity
    decayTimerRef.current = setTimeout(() => {
      setIntensity(0.4);
    }, 200);

    // Deactivate after full duration
    timerRef.current = setTimeout(() => {
      setActive(false);
      if (decayTimerRef.current) {
        clearTimeout(decayTimerRef.current);
        decayTimerRef.current = null;
      }
    }, totalDuration);
  }, []);

  /** Listen for fx:glitch events, scene transitions, and hacking minigames */
  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Direct fx:glitch events
    unsubs.push(
      eventBus.on('fx:glitch', (payload) => {
        triggerGlitch({ intensity: payload.intensity, duration: payload.duration });
      }),
    );

    // Scene transitions now use a cinematic veil; keep only a restrained signal tick.
    unsubs.push(
      eventBus.on('scene:enter', () => {
        triggerGlitch({ intensity: 0.14, duration: 260 });
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

    // ── Hacking minigame trigger: burst glitch on open ──
    unsubs.push(
      eventBus.on('minigame:open', ({ gameType }) => {
        if (HACKING_GAME_TYPES.has(gameType)) {
          triggerHackingBurst();
        }
      }),
    );

    // Also trigger a brief glitch when hacking minigame closes/completes
    unsubs.push(
      eventBus.on('minigame:complete', ({ gameType }) => {
        if (HACKING_GAME_TYPES.has(gameType)) {
          triggerGlitch({ intensity: 0.25, duration: 300 });
        }
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, [triggerGlitch, triggerHackingBurst]);

  /** Canvas-based glitch rendering for pixel-sort, scan-line, and hacking-burst */
  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    // For hacking-burst, we need the canvas too
    if (!canvas) return;
    // Only render on canvas for canvas-based types
    if (glitchType !== 'pixel-sort' && glitchType !== 'scan-line' && glitchType !== 'hacking-burst') return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const w = window.innerWidth;
    const h = window.innerHeight;

    // Animate: re-render every 50ms for dynamic glitch
    const interval = setInterval(() => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (glitchType === 'hacking-burst') {
        // ── Hacking burst: color channel separation + scanline distortion + static ──

        // 1. Color channel separation bands (red/green/blue offset stripes)
        const colorBandCount = Math.floor(4 + intensity * 10);
        for (let i = 0; i < colorBandCount; i++) {
          const bandY = Math.random() * h * dpr;
          const bandH = 1 + Math.random() * 12 * intensity * dpr;
          const shift = (Math.random() - 0.5) * 40 * intensity * dpr;
          const channel = Math.random();
          if (channel < 0.33) {
            ctx.fillStyle = `rgba(255, 0, 80, ${0.12 + intensity * 0.15})`;
          } else if (channel < 0.66) {
            ctx.fillStyle = `rgba(0, 255, 65, ${0.12 + intensity * 0.15})`;
          } else {
            ctx.fillStyle = `rgba(0, 120, 255, ${0.1 + intensity * 0.12})`;
          }
          ctx.fillRect(shift, bandY, w * dpr, bandH);
        }

        // 2. Scanline distortion
        const scanLineCount = Math.floor(3 + intensity * 8);
        for (let i = 0; i < scanLineCount; i++) {
          const lineY = Math.random() * h * dpr;
          ctx.fillStyle = `rgba(255, 255, 255, ${0.04 + intensity * 0.08})`;
          ctx.fillRect(0, lineY, w * dpr, 1 + Math.random() * 2 * dpr);
        }

        // 3. Brief static noise blocks
        const staticBlockCount = Math.floor(2 + intensity * 4);
        for (let i = 0; i < staticBlockCount; i++) {
          const bx = Math.random() * w * dpr;
          const by = Math.random() * h * dpr;
          const bw = (10 + Math.random() * 60 * intensity) * dpr;
          const bh = (2 + Math.random() * 8 * intensity) * dpr;
          // Random noise color
          const gray = Math.floor(Math.random() * 255);
          ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, ${0.15 + intensity * 0.15})`;
          ctx.fillRect(bx, by, bw, bh);
        }
      } else if (glitchType === 'pixel-sort') {
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

  // Cleanup timers on unmount. Both the outer burst timer AND the nested
  // decay timer must be cleared — otherwise a burst that started shortly
  // before unmount would fire setIntensity(0.4) on an unmounted component.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (decayTimerRef.current) clearTimeout(decayTimerRef.current);
    };
  }, []);

  if (!active) return null;

  // CSS-based effects for horizontal-tear and color-split
  const isCSSGlitch = glitchType === 'horizontal-tear' || glitchType === 'color-split';
  // Hacking-burst uses a combined CSS + Canvas approach
  const isHackingBurst = glitchType === 'hacking-burst';

  const baseCanvasStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: UI_LAYERS.GLITCH,
  };

  const cssStyle: React.CSSProperties = isCSSGlitch
    ? {
        ...baseCanvasStyle,
        animation: glitchType === 'color-split'
          ? `glitchColorSplit ${200 / (1 + intensity)}ms infinite`
          : `glitchHorizontalTear ${150 / (1 + intensity)}ms infinite`,
      }
    : baseCanvasStyle;

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
        @keyframes hackingBurstOverlay {
          0%   { filter: hue-rotate(0deg) saturate(2); box-shadow: inset 0 0 0 transparent; }
          10%  { box-shadow: inset ${6 * intensity}px 0 0 rgba(255,0,80,0.2), inset -${6 * intensity}px 0 0 rgba(0,255,65,0.2); filter: hue-rotate(30deg) saturate(3); }
          25%  { box-shadow: inset -${4 * intensity}px 0 0 rgba(0,120,255,0.15), inset ${4 * intensity}px 0 0 rgba(255,200,0,0.15); filter: hue-rotate(-20deg) saturate(2.5); }
          40%  { box-shadow: inset ${8 * intensity}px 0 0 rgba(0,255,65,0.2), inset -${8 * intensity}px 0 0 rgba(255,0,80,0.2); filter: hue-rotate(60deg) saturate(3); }
          60%  { box-shadow: inset -${5 * intensity}px 0 0 rgba(255,0,80,0.12), inset ${5 * intensity}px 0 0 rgba(0,255,65,0.12); filter: hue-rotate(15deg) saturate(1.8); }
          80%  { box-shadow: inset ${3 * intensity}px 0 0 rgba(0,255,65,0.08), inset -${3 * intensity}px 0 0 rgba(255,0,80,0.08); filter: hue-rotate(5deg) saturate(1.3); }
          100% { box-shadow: inset 0 0 0 transparent; filter: hue-rotate(0deg) saturate(1); }
        }
      `}</style>

      {/* CSS glitch layer */}
      {isCSSGlitch && (
        <div style={cssStyle} aria-hidden="true" />
      )}

      {/* Hacking burst: combined CSS overlay + Canvas static */}
      {isHackingBurst && (
        <>
          <div
            style={{
              ...baseCanvasStyle,
              animation: `hackingBurstOverlay ${150 / (1 + intensity)}ms infinite`,
            }}
            aria-hidden="true"
          />
          <canvas
            ref={canvasRef}
            style={baseCanvasStyle}
            aria-hidden="true"
          />
        </>
      )}

      {/* Canvas glitch layer (pixel-sort, scan-line) */}
      {!isCSSGlitch && !isHackingBurst && (
        <canvas
          ref={canvasRef}
          style={cssStyle}
          aria-hidden="true"
        />
      )}
    </>
  );
}
