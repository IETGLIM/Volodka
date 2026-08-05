/**
 * ProloguePerfectionOverlay — АБСОЛЮТНЫЙ ИДЕАЛ после "Начать с пролога".
 * ИСПРАВЛЕНО: единый источник истины — outer phase boot->breath->title->handoff
 * eyeOpen теперь subPhase внутри breath, глаза показывают строки.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { PrologueBootConsole } from './PrologueBootConsole';
import { PrologueBreathVoid } from './PrologueBreathVoid';
import { useProloguePerfection } from './useProloguePerfection';
import { CinematicTitleCard } from '@/components/game/cinematic/CinematicTitleCard';
import { CinematicBars } from '@/components/game/cinematic/CinematicBars';
import { PrologueAudioDirector } from './PrologueAudioDirector';
import { PrologueVolumetric } from './PrologueVolumetric';

interface Props {
  onComplete: () => void;
}

export function ProloguePerfectionOverlay({ onComplete }: Props) {
  const reducedMotion = useEffectiveReducedMotion();
  const { phase, progress, innerText, goNext, skipAll } = useProloguePerfection(onComplete);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion || phase !== 'title') return;
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setParallax({
        x: ((e.clientX - cx) / cx) * 14,
        y: ((e.clientY - cy) / cy) * 8,
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [reducedMotion, phase]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        skipAll();
      }
    },
    [skipAll],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem('volodka_prologue_phase', phase);
    } catch {}
  }, [phase]);

  const titleSubtitle = useMemo(() => {
    const now = new Date();
    const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    return `Комната 3×4. ${time}. Кофе холодный. Снаружи — дождь.`;
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black overflow-hidden select-none"
      style={{ zIndex: UI_LAYERS.LOADING + 10 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
      role="dialog"
      aria-modal="true"
      aria-label="Пролог — пробуждение"
    >
      <PrologueAudioDirector phase={phase} reducedMotion={reducedMotion} />
      <PrologueVolumetric phase={phase} />

      <div className="absolute inset-0 pointer-events-none z-[5] opacity-[0.03] mix-blend-soft-light" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {(phase === 'title' || phase === 'handoff') && <CinematicBars variant="intro" />}

      <AnimatePresence mode="wait">
        {phase === 'boot' && (
          <motion.div
            key="boot"
            initial={reducedMotion ? false : { opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.02, y: -18 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <PrologueBootConsole onComplete={goNext} loadingProgress={progress} />
          </motion.div>
        )}

        {phase === 'breath' && (
          <motion.div
            key="breath"
            initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <PrologueBreathVoid onComplete={goNext} innerText={innerText} />
          </motion.div>
        )}

        {/* legacy eyeOpen — не используется в идеальном пути, но оставлен для resilience */}
        {phase === 'eyeOpen' && (
          <motion.div
            key="eyeOpen-legacy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black flex items-center justify-center"
          >
            <div className="text-center px-8">
              <p className="font-serif text-base text-stone-200/80">{innerText}</p>
              <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-cyan-200/40 mt-4">legacy eyeOpen → title</p>
            </div>
          </motion.div>
        )}

        {phase === 'title' && (
          <motion.div
            key="title"
            initial={{ opacity: 0, scale: 0.96, filter: 'blur(14px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.06, filter: 'blur(16px)', y: -24 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 bg-black flex items-center justify-center"
            style={{ transform: `translate(${parallax.x}px, ${parallax.y}px)` }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,255,0.09)_0%,rgba(0,0,0,1)_72%)]" aria-hidden />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full max-w-3xl h-[40vh] mt-[34vh] opacity-[0.07] blur-[0.8px] scale-y-[-0.52] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.45)_0%,transparent_58%)]" aria-hidden>
                <CinematicTitleCard title="ПРОБУЖДЕНИЕ" subtitle={titleSubtitle} accentColor="#44ffcc" type="act_transition" reducedMotion={true} />
              </div>
            </div>
            <div className="relative z-10">
              <CinematicTitleCard title="ПРОБУЖДЕНИЕ" subtitle={titleSubtitle} accentColor="#44ffcc" type="act_transition" reducedMotion={reducedMotion} />
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 0.52, y: 0 }} transition={{ delay: 0.9, duration: 0.9 }} className="mt-8 text-center font-mono text-[10px] tracking-[0.24em] uppercase text-stone-500/50">
                <span className="inline-block px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm">volodka://wake --mode=prologue --soul=0</span>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.28 }} transition={{ delay: 1.4, duration: 1 }} className="absolute bottom-[14vh] left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.18em] text-stone-500/40 whitespace-nowrap hidden md:block" aria-hidden>
              MEM 37% FRAG • PHYSICS WASM STREAMED • WORLD CHUNKS READY • 13 POEMS IN L2 CACHE
            </motion.div>
          </motion.div>
        )}

        {phase === 'handoff' && (
          <motion.div key="handoff" initial={{ opacity: 1 }} animate={{ opacity: 0, filter: 'blur(18px)', scale: 1.08 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-0 bg-black" aria-hidden />
        )}
      </AnimatePresence>

      <motion.button type="button" onClick={skipAll} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 0.58, y: 0 }} whileHover={{ opacity: 1, scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ delay: 1.4, duration: 0.6 }} className="absolute bottom-7 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 hover:border-white/15 text-[11px] tracking-[0.18em] uppercase text-stone-300/75 hover:text-stone-100 backdrop-blur-[16px] shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all">
        <span className="flex items-center gap-2">Пропустить<span className="px-[6px] py-[2px] rounded bg-white/10 text-[9px] tracking-[0.1em] border border-white/10">Esc</span></span>
      </motion.button>

      <div className="absolute top-7 left-1/2 -translate-x-1/2 z-30 flex items-center gap-[10px]">
        {(['boot', 'breath', 'title'] as const).map((p) => {
          const phases = ['boot', 'breath', 'title', 'handoff'] as const;
          const curIdx = phases.indexOf(phase as any);
          const thisIdx = phases.indexOf(p as any);
          const active = thisIdx === curIdx;
          const done = thisIdx < curIdx;
          return (
            <div key={p} className="relative">
              <div className="h-[3px] rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ width: active ? 32 : done ? 16 : 10, background: done ? 'rgba(255,255,255,0.55)' : active ? 'rgba(0,255,200,0.95)' : 'rgba(255,255,255,0.14)', boxShadow: active ? '0 0 10px rgba(0,255,200,0.6), 0 0 22px rgba(0,255,200,0.18)' : undefined }} aria-hidden />
              {active && <motion.div layoutId="prologue-active-dot-glow" className="absolute inset-0 rounded-full bg-cyan-200/20 blur-[3px] -z-10" transition={{ type: 'spring', stiffness: 420, damping: 28 }} />}
            </div>
          );
        })}
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">Фаза пролога: {phase}, прогресс {Math.round(progress * 100)}%</div>
    </motion.div>
  );
}
