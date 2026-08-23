/**
 * Boot консоль — показывает BOOT_LINES с typewriter, пока в фоне грузится WASM.
 * Оптимизация: маскирует 1.5MB Rapier + story nodes.
 * Красота: film grain + scanlines + matrix rain призрак + дрожание строк.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BOOT_LINES } from '@/engine/loading/loadingConstants';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { PROLOGUE_PERFECTION } from './prologuePerfectionConstants';

interface Props {
  onComplete: () => void;
  loadingProgress: number; // 0-1, из preload hook
}

export function PrologueBootConsole({ onComplete, loadingProgress }: Props) {
  const reducedMotion = useEffectiveReducedMotion();
  const [visibleCount, setVisibleCount] = useState(() => (reducedMotion ? BOOT_LINES.length : 0));
  const [charIndex, setCharIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const ghostPoem = useMemo(() => {
    const idx = Math.floor(Math.random() * PROLOGUE_PERFECTION.poemGhosts.length);
    return PROLOGUE_PERFECTION.poemGhosts[idx];
  }, []);

  // Typewriter для boot линий
  useEffect(() => {
    if (reducedMotion) {
      onComplete();
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    let raf: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (visibleCount >= BOOT_LINES.length) {
        timeout = setTimeout(onComplete, 420);
        return;
      }

      const currentLine = BOOT_LINES[visibleCount] ?? '';
      if (charIndex < currentLine.length) {
        setCharIndex((c) => c + 1);
        timeout = setTimeout(tick, PROLOGUE_PERFECTION.bootLinesPerCharMs + Math.random() * 6);
      } else {
        // линия дописана
        setVisibleCount((v) => v + 1);
        setCharIndex(0);
        timeout = setTimeout(tick, PROLOGUE_PERFECTION.bootLinePauseMs);
      }
    };

    raf = setTimeout(tick, 120);
    return () => {
      clearTimeout(timeout);
      clearTimeout(raf);
    };
  }, [visibleCount, charIndex, reducedMotion, onComplete]);

  // Device info для immersion — реальные данные браузера
  const deviceInfo = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const gpu = navigator.gpu ? 'WebGPU' : 'WebGL2';
    const cores = navigator.hardwareConcurrency ?? 4;
    const mem = navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'unknown';
    const dpr = window.devicePixelRatio?.toFixed(2) ?? '1';
    return { gpu, cores, mem, dpr };
  }, []);

  // Автоскролл вниз
  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
  }, [visibleCount, charIndex]);

  return (
    <div className="relative h-full w-full bg-black overflow-hidden font-mono">
      {/* Матричный призрак + поэма на фоне */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(transparent_0%,rgba(0,255,180,0.18)_50%,transparent_100%)] animate-pulse" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.06 }}
          transition={{ duration: 2.2, delay: 0.8 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-[8vw] md:text-[6vw] leading-none tracking-[0.22em] text-cyan-100/40 blur-[0.6px] select-none whitespace-nowrap"
          aria-hidden
        >
          {ghostPoem}
        </motion.div>
      </div>

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,${PROLOGUE_PERFECTION.scanlineOpacity}) 2px, transparent 3px)`,
        }}
        aria-hidden
      />

      {/* Film grain */}
      <div
        className="absolute inset-0 pointer-events-none z-10 mix-blend-soft-light"
        style={{
          opacity: PROLOGUE_PERFECTION.filmGrainOpacity,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.78)_100%)]" aria-hidden />

      {/* Консоль */}
      <div
        ref={containerRef}
        className="relative z-20 h-full w-full overflow-y-auto p-4 sm:p-6 md:p-8 text-[11px] sm:text-[12px] leading-[1.6] scrollbar-thin scrollbar-thumb-white/10"
        aria-label="Загрузочная консоль"
      >
        <div className="max-w-4xl mx-auto space-y-[2px]">
          {BOOT_LINES.slice(0, visibleCount).map((line, i) => (
            <div key={i} className="text-emerald-300/85 tracking-[0.02em] [text-shadow:0_0_8px_rgba(52,211,153,0.35)]">
              {line}
            </div>
          ))}
          {visibleCount < BOOT_LINES.length && (
            <div className="text-emerald-200/90 tracking-[0.02em] [text-shadow:0_0_12px_rgba(52,211,153,0.5)]">
              {BOOT_LINES[visibleCount]?.slice(0, charIndex)}
              <span className="inline-block w-[0.6em] h-[1.1em] bg-emerald-300/70 ml-[1px] -mb-[2px] animate-pulse" aria-hidden>
                _
              </span>
            </div>
          )}
        </div>

        {/* Прогресс-бар WASM загрузки, замаскированный под kernel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 max-w-4xl mx-auto space-y-3"
        >
          <div className="flex items-center gap-3 text-[10px] tracking-[0.18em] uppercase text-stone-500/60">
            <span>volodka://physics init</span>
            <div className="flex-1 h-px bg-stone-800 relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400/60 via-cyan-300/60 to-amber-200/60"
                initial={{ width: '0%' }}
                animate={{ width: `${Math.round(loadingProgress * 100)}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <span>{Math.round(loadingProgress * 100)}%</span>
          </div>
          <div className="text-[10px] text-stone-600/50 tracking-[0.16em]">
            {loadingProgress < 0.3
              ? 'DECODING WASM... STREAMING COMPILE (external /rapier/ + immutable)'
              : loadingProgress < 0.7
                ? 'WORLD CHUNKS + STORY NODES PREFETCH (start, explore_mode)'
                : 'VOLUMETRIC LIGHT + DUST PARTICLES READY'}
          </div>
          {deviceInfo && (
            <div className="text-[9px] text-stone-700/40 tracking-[0.14em] font-mono flex flex-wrap gap-x-3 gap-y-1">
              <span>GPU: {deviceInfo.gpu}</span>
              <span>CORES: {deviceInfo.cores}</span>
              <span>MEM: {deviceInfo.mem}</span>
              <span>DPR: {deviceInfo.dpr}</span>
              <span className="text-emerald-600/40">WASM: streaming + cache-immutable</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Skip hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-6 right-6 z-30 text-[10px] tracking-[0.22em] uppercase text-stone-500/60 hidden md:block"
        aria-hidden
      >
        Esc — пропустить
      </motion.div>
    </div>
  );
}
