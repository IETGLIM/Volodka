/**
 * Boot консоль — показывает BOOT_LINES, пока в фоне грузится WASM.
 * Оптимизация: маскирует 1.5MB Rapier + story nodes.
 * Красота: film grain + scanlines + matrix rain призрак + дрожание строк.
 *
 * FIX v4.48.16 (репорт игрока: «экран очень долгий и бесполезный»):
 * старый посимвольный typewriter (~12мс/символ × ~2700 символов ≈ 34с)
 * игнорировал bootTotalTargetMs. Теперь reveal пропорционален времени:
 * весь лог гарантированно дописывается за bootTotalTargetMs (2.4с)
 * независимо от троттлинга таймеров и длины лога.
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

/** Шаг тика reveal-цикла. 40мс ≈ 25fps — глазу читается как быстрый поток. */
const REVEAL_TICK_MS = 40;

export function PrologueBootConsole({ onComplete, loadingProgress }: Props) {
  const reducedMotion = useEffectiveReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Общий объём лога (+1 условный перевод строки на строку) — единая шкала reveal.
  const totalChars = useMemo(
    () => BOOT_LINES.reduce((n, line) => n + line.length + 1, 0),
    [],
  );
  const [revealedChars, setRevealedChars] = useState(() => (reducedMotion ? totalChars : 0));

  const ghostPoem = useMemo(() => {
    const idx = Math.floor(Math.random() * PROLOGUE_PERFECTION.poemGhosts.length);
    return PROLOGUE_PERFECTION.poemGhosts[idx];
  }, []);

  // Time-proportional reveal: elapsed/bootTotalTargetMs × totalChars.
  // Гарантия хронометража: даже при троттлинге интервала раскрываем по
  // фактическому времени, а не по числу тиков — экран никогда не висит дольше
  // bootTotalTargetMs (+420мс хвост) без нажатия «Пропустить».
  useEffect(() => {
    if (reducedMotion) {
      onComplete();
      return;
    }

    let interval: ReturnType<typeof setInterval> | undefined;
    let doneTimer: ReturnType<typeof setTimeout> | undefined;
    const start = performance.now();
    const targetMs = PROLOGUE_PERFECTION.bootTotalTargetMs;

    interval = setInterval(() => {
      const elapsed = performance.now() - start;
      const next = Math.min(totalChars, Math.ceil((elapsed / targetMs) * totalChars));
      setRevealedChars(next);
      if (next >= totalChars) {
        if (interval) clearInterval(interval);
        interval = undefined;
        doneTimer = setTimeout(onComplete, 420);
      }
    }, REVEAL_TICK_MS);

    return () => {
      if (interval) clearInterval(interval);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [reducedMotion, onComplete, totalChars]);

  // Производные строки: полные + одна частичная (текущая).
  const { fullLines, partialLine } = useMemo(() => {
    const full: string[] = [];
    let remaining = revealedChars;
    let partial: string | null = null;
    for (const line of BOOT_LINES) {
      if (remaining <= 0) break;
      if (remaining >= line.length + 1) {
        full.push(line);
        remaining -= line.length + 1;
      } else {
        partial = line.slice(0, Math.max(0, remaining));
        remaining = 0;
      }
    }
    return { fullLines: full, partialLine: partial };
  }, [revealedChars]);

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
  }, [revealedChars]);

  return (
    <div className="relative h-full w-full bg-black overflow-hidden font-mono">
      {/* Матричный призрак + поэма на фоне */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(transparent_0%,rgba(70,185,110,0.18)_50%,transparent_100%)] animate-pulse" />
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
          {fullLines.map((line, i) => (
            <div key={i} className="text-emerald-300/85 tracking-[0.02em] [text-shadow:0_0_8px_rgba(70,185,110,0.35)]">
              {line}
            </div>
          ))}
          {partialLine !== null && (
            <div className="text-emerald-200/90 tracking-[0.02em] [text-shadow:0_0_12px_rgba(70,185,110,0.5)]">
              {partialLine}
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

      {/* Skip hint — v4.44: убран. Кнопку «Пропустить [Esc]» рисует
          ProloguePerfectionOverlay поверх консоли; угловая текстовая
          подсказка дублировала её и путала (два «Esc» на экране). */}
    </div>
  );
}
