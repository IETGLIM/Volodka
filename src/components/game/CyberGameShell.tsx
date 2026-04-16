'use client';

import { memo, useEffect, useRef, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useMobileVisualPerf } from '@/hooks/useMobileVisualPerf';
import { FilmGrain } from '@/components/game/CinematicEffects';
import type { SceneId } from '@/data/types';

/** Лёгкий digital rain — только вне lite-режима; resize через visualViewport + debounce */
const MatrixRainBackdrop = memo(function MatrixRainBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const fontSize = 12;
    let columns = 0;
    let drops: number[] = [];
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const applyResize = () => {
      const vv = window.visualViewport;
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w));
      canvas.height = Math.max(1, Math.floor(h));
      columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns)
        .fill(0)
        .map(() => Math.random() * -40);
    };

    const scheduleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = undefined;
        applyResize();
      }, 120);
    };

    applyResize();
    window.addEventListener('resize', scheduleResize);
    window.visualViewport?.addEventListener('resize', scheduleResize);

    const chars =
      'アイウエオカキクケコ0123456789ABCDEFВОЛОДЬКА█▓▒░[]{}()<>';

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillStyle = '#00ffcc';
        ctx.globalAlpha = 0.35;
        ctx.fillText(char, x, y);

        ctx.fillStyle = '#ff0080';
        ctx.globalAlpha = 0.08;
        if (y > fontSize) {
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y - fontSize);
        }

        ctx.globalAlpha = 1;
        if (y > canvas.height && Math.random() > 0.98) drops[i] = 0;
        drops[i]++;
      }

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationId);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', scheduleResize);
      window.visualViewport?.removeEventListener('resize', scheduleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 0.14 }}
      aria-hidden
    />
  );
});

const Scanlines = memo(function Scanlines() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.07) 2px, rgba(0, 0, 0, 0.07) 4px)',
      }}
      aria-hidden
    />
  );
});

const SynthGrid = memo(function SynthGrid() {
  return (
    <div
      className="absolute inset-0 opacity-[0.14]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        transform: 'perspective(420px) rotateX(62deg)',
        transformOrigin: 'bottom',
        maskImage: 'linear-gradient(to top, transparent, black 18%, black 72%, transparent)',
        animation: 'grid-scroll 2.2s linear infinite',
      }}
      aria-hidden
    />
  );
});

const HorizonGlow = memo(function HorizonGlow() {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 25% 15%, rgba(0, 255, 255, 0.1) 0%, transparent 45%)',
        }}
        animate={{ opacity: [0.5, 0.85, 0.55] }}
        transition={{ duration: 6, repeat: Infinity }}
        aria-hidden
      />
      <motion.div
        className="absolute -right-1/4 top-0 h-3/4 w-3/4"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 0, 128, 0.12) 0%, transparent 50%)',
        }}
        animate={{ x: [0, -24, 0], y: [0, 16, 0] }}
        transition={{ duration: 14, repeat: Infinity }}
        aria-hidden
      />
      <motion.div
        className="absolute -bottom-1/4 -left-1/4 h-2/3 w-2/3"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 140, 0, 0.1) 0%, transparent 48%)',
        }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 11, repeat: Infinity }}
        aria-hidden
      />
    </>
  );
});

/** Статичные блики вместо motion — меньше пересчётов на GPU */
const HorizonGlowStatic = memo(function HorizonGlowStatic() {
  return (
    <div className="absolute inset-0" aria-hidden>
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(ellipse at 25% 15%, rgba(0, 255, 255, 0.08) 0%, transparent 45%)',
        }}
      />
      <div
        className="absolute -right-1/4 top-0 h-3/4 w-3/4 opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 0, 128, 0.08) 0%, transparent 50%)',
        }}
      />
      <div
        className="absolute -bottom-1/4 -left-1/4 h-2/3 w-2/3 opacity-50"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 140, 0, 0.07) 0%, transparent 48%)',
        }}
      />
    </div>
  );
});

const CrtSweep = memo(function CrtSweep() {
  return (
    <motion.div
      className="absolute left-0 right-0 z-[1] h-px pointer-events-none"
      style={{
        background:
          'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.12), rgba(255, 200, 100, 0.08), transparent)',
        boxShadow: '0 0 24px rgba(0, 255, 255, 0.06)',
      }}
      initial={{ top: '0%' }}
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: 'linear' }}
      aria-hidden
    />
  );
});

const CornerBrackets = memo(function CornerBrackets() {
  const corners = [
    { pos: 'top-3 left-3', borders: 'border-l-2 border-t-2' },
    { pos: 'top-3 right-3', borders: 'border-r-2 border-t-2' },
    { pos: 'bottom-3 left-3', borders: 'border-l-2 border-b-2' },
    { pos: 'bottom-3 right-3', borders: 'border-r-2 border-b-2' },
  ] as const;

  return (
    <>
      {corners.map((corner, i) => (
        <motion.div
          key={i}
          className={`pointer-events-none absolute z-[2] h-10 w-10 ${corner.pos} ${corner.borders} border-cyan-500/25`}
          animate={{ opacity: [0.25, 0.55, 0.25] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.4 }}
          aria-hidden
        />
      ))}
    </>
  );
});

const CornerBracketsStatic = memo(function CornerBracketsStatic() {
  const corners = [
    { pos: 'top-3 left-3', borders: 'border-l-2 border-t-2' },
    { pos: 'top-3 right-3', borders: 'border-r-2 border-t-2' },
    { pos: 'bottom-3 left-3', borders: 'border-l-2 border-b-2' },
    { pos: 'bottom-3 right-3', borders: 'border-r-2 border-b-2' },
  ] as const;
  return (
    <>
      {corners.map((corner, i) => (
        <div
          key={i}
          className={`pointer-events-none absolute z-[2] h-10 w-10 border-cyan-500/20 opacity-40 ${corner.pos} ${corner.borders}`}
          aria-hidden
        />
      ))}
    </>
  );
});

const FilmVignette = memo(function FilmVignette({ soft }: { soft?: boolean }) {
  return (
    <div
      className="absolute inset-0 z-[1] pointer-events-none"
      style={{
        background: soft
          ? 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.28) 100%)'
          : 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.38) 100%)',
      }}
      aria-hidden
    />
  );
});

/**
 * Общая оболочка игровой фазы: Matrix / Blade Runner / терминал.
 * На мобильных — статичный фон + лёгкая виньетка без canvas/scanline/CRT поверх UI.
 */
export function CyberGameShell({
  children,
  sceneId: _sceneId,
  stability = 72,
}: {
  children: React.ReactNode;
  /** Для зерна / будущих глобальных эффектов по сцене */
  sceneId?: SceneId;
  /** Чем ниже стабильность — сильнее film grain */
  stability?: number;
}) {
  const lite = useMobileVisualPerf();
  const reduceMotion = useReducedMotion();

  const grainIntensity = useMemo(() => {
    const s = Math.max(0, Math.min(100, stability));
    return Math.min(0.48, 0.1 + ((100 - s) / 100) * 0.38);
  }, [stability]);

  return (
    <div
      className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-full overflow-hidden overscroll-none bg-[#030308]"
      style={{
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        {lite ? (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(165deg, #05050a 0%, #0c0812 35%, #061018 65%, #08060c 100%)',
            }}
            aria-hidden
          />
        ) : (
          <>
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(135deg, #05050a 0%, #120818 25%, #061018 50%, #100818 75%, #030308 100%)',
                backgroundSize: '200% 200%',
              }}
              animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
              transition={{ duration: 28, repeat: Infinity, repeatType: 'reverse' }}
              aria-hidden
            />
            <HorizonGlow />
            <MatrixRainBackdrop />
            <SynthGrid />
          </>
        )}
        {lite && <HorizonGlowStatic />}
      </div>

      {!lite && !reduceMotion && (
        <FilmGrain layout="fixed" zIndex={18} intensity={grainIntensity} animated={!reduceMotion} />
      )}

      <div className="relative z-[5] h-full w-full">{children}</div>

      <div
        className="pointer-events-none absolute inset-0 z-[22]"
        style={{
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
        }}
      >
        {lite ? (
          <>
            <FilmVignette soft />
            <CornerBracketsStatic />
          </>
        ) : (
          <>
            <CrtSweep />
            <Scanlines />
            <FilmVignette />
            <CornerBrackets />
          </>
        )}
      </div>
    </div>
  );
}
