import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { APP_VERSION } from '@/shared/constants/appVersion';
import { CRTSweep } from '@/components/game/loading/CRTSweep';
import { CyberSpinner } from '@/components/game/loading/CyberSpinner';
import { GlitchTitle } from '@/components/game/loading/GlitchTitle';
import { HexDumpOverlay } from '@/components/game/loading/HexDumpOverlay';
import { MatrixRainLayer } from '@/components/game/loading/MatrixRainLayer';
import { TerminalBootText } from '@/components/game/loading/TerminalBootText';
import type { LoadingScreenFx } from '@/engine/loading/loadingFxTier';
import {
  LOADING_DEDICATION_TEXT,
  LOADING_DEFAULT_MESSAGE,
  LOADING_MESSAGE_ID,
  LOADING_QUOTE_SEED,
  LOADING_SUBTITLE_TEXT,
  LOADING_TITLE_TEXT,
  POEM_QUOTES,
  TIPS,
} from '@/engine/loading/loadingConstants';
import {
  clampLoadingProgress,
  formatLoadingStatusText,
  getBootTextDismissMs,
  pickDeterministicIndex,
} from '@/engine/loading/loadingPresentation';
import { useLoadingScreenFx } from '@/hooks/useLoadingScreenFx';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

const CinematicBars = memo(function CinematicBars() {
  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-[65] h-[6dvh] min-h-[24px] bg-black pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 z-[65] h-[6dvh] min-h-[24px] bg-black pointer-events-none" />
    </>
  );
});

export interface LoadingScreenProps {
  progress?: number;
  message?: string;
  showTitle?: boolean;
}

type MotionBoxProps = {
  fx: LoadingScreenFx;
  className?: string;
  children: ReactNode;
  delay?: number;
};

function MotionBox({ fx, className, children, delay = 0 }: MotionBoxProps) {
  if (!fx.contentMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
}

export function LoadingScreen({
  progress,
  message = LOADING_DEFAULT_MESSAGE,
  showTitle = false,
}: LoadingScreenProps) {
  const fx = useLoadingScreenFx();
  const clampedProgress = clampLoadingProgress(progress);
  const statusText = formatLoadingStatusText(message, clampedProgress);
  const [showTip, setShowTip] = useState(true);
  const [showBootText, setShowBootText] = useState(fx.bootText);

  const quoteIndex = useMemo(
    () => pickDeterministicIndex(LOADING_QUOTE_SEED, POEM_QUOTES.length),
    [],
  );
  const [tipIndex, setTipIndex] = useState(0);

  const tipCycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setShowBootText(fx.bootText);
  }, [fx.bootText]);

  useEffect(() => {
    if (!fx.tipRotation) {
      setShowTip(true);
      return;
    }

    const clearTimers = () => {
      if (tipCycleTimerRef.current) clearTimeout(tipCycleTimerRef.current);
      if (tipHideTimerRef.current) clearTimeout(tipHideTimerRef.current);
    };

    const scheduleNext = () => {
      tipCycleTimerRef.current = setTimeout(() => {
        setShowTip(false);
        tipHideTimerRef.current = setTimeout(() => {
          setTipIndex((prev) => (prev + 1) % TIPS.length);
          setShowTip(true);
          scheduleNext();
        }, 300);
      }, 4000);
    };

    scheduleNext();
    return clearTimers;
  }, [fx.tipRotation]);

  useEffect(() => {
    if (!fx.bootText) return;
    const timer = setTimeout(() => setShowBootText(false), getBootTextDismissMs());
    return () => clearTimeout(timer);
  }, [fx.bootText]);

  const currentQuote = POEM_QUOTES[quoteIndex] ?? POEM_QUOTES[0];
  const currentTip = TIPS[tipIndex] ?? TIPS[0];

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-black overflow-hidden loading-screen-fade-in"
      style={{ zIndex: UI_LAYERS.LOADING }}
      aria-busy="true"
    >
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {statusText}
      </span>

      {fx.matrixRain && <MatrixRainLayer />}

      {fx.filmGrain && (
        <div
          className="absolute inset-0 pointer-events-none z-[2] opacity-[0.04] mix-blend-overlay animate-[cinematic-grain_0.4s_steps(8)_infinite]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            backgroundSize: '128px 128px',
          }}
        />
      )}

      <div
        className="absolute inset-0 pointer-events-none z-[4] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.07)_2px,rgba(0,0,0,0.07)_4px)]"
      />

      {fx.hexDump && <HexDumpOverlay />}

      <AnimatePresence>
        {showBootText && fx.bootText && (
          <motion.div
            initial={fx.contentMotion ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={fx.contentMotion ? { opacity: 0 } : undefined}
            transition={{ duration: fx.contentMotion ? 1 : 0 }}
            className="absolute inset-0 z-[5]"
          >
            <TerminalBootText />
          </motion.div>
        )}
      </AnimatePresence>

      {fx.breathingGlow && (
        <>
          <motion.div
            className="absolute inset-0 pointer-events-none z-[6]"
            animate={{
              background: [
                'radial-gradient(ellipse at 40% 50%, rgb(var(--cyber-cyan-rgb) / 0.03) 0%, transparent 70%)',
                'radial-gradient(ellipse at 60% 50%, rgb(var(--cyber-cyan-rgb) / 0.06) 0%, transparent 70%)',
                'radial-gradient(ellipse at 40% 50%, rgb(var(--cyber-cyan-rgb) / 0.03) 0%, transparent 70%)',
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, repeatType: 'reverse' }}
          />
          <motion.div
            className="absolute inset-0 pointer-events-none z-[6]"
            animate={{
              background: [
                'radial-gradient(ellipse at 70% 60%, rgba(251,191,36,0.015) 0%, transparent 50%)',
                'radial-gradient(ellipse at 30% 40%, rgba(251,191,36,0.03) 0%, transparent 50%)',
                'radial-gradient(ellipse at 70% 60%, rgba(251,191,36,0.015) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
          />
        </>
      )}

      {fx.crtSweep && <CRTSweep />}

      <div className="absolute inset-0 pointer-events-none z-[55] bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.7)_100%)]" />

      {fx.cinematicBars && <CinematicBars />}

      {fx.cornerDecor && (
        <>
          <motion.div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-cyan-500/20 z-[70]" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 3, repeat: Infinity }} />
          <motion.div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-cyan-500/20 z-[70]" animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />
          <motion.div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-amber-500/15 z-[70]" animate={{ opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
          <motion.div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-amber-500/15 z-[70]" animate={{ opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 3, repeat: Infinity, delay: 1.5 }} />
        </>
      )}

      <div className="relative z-[60] flex flex-col items-center gap-5">
        {showTitle && (
          <GlitchTitle text={LOADING_TITLE_TEXT} animate={fx.glitchTitle} />
        )}

        {showTitle && (
          <MotionBox fx={fx} className="font-mono text-sm sm:text-base tracking-[0.4em] uppercase bg-[linear-gradient(90deg,rgba(0,255,255,0.8),rgba(255,140,0,0.6),rgba(0,255,255,0.8))] bg-clip-text text-transparent" delay={0.8}>
            {LOADING_SUBTITLE_TEXT}
          </MotionBox>
        )}

        <MotionBox fx={fx} className="loading-spinner-pulse">
          <CyberSpinner pulse={fx.spinnerPulse} />
        </MotionBox>

        <MotionBox fx={fx} className="w-72 flex flex-col items-center gap-3" delay={0.5}>
          <div
            className="w-full h-2 bg-slate-900/80 rounded-sm overflow-hidden relative border border-cyan-900/30 shadow-[inset_0_0_6px_rgb(var(--cyber-cyan-rgb)/0.1)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={clampedProgress ?? undefined}
            aria-labelledby={LOADING_MESSAGE_ID}
          >
            <div className="absolute inset-0 flex items-center pointer-events-none">
              {[25, 50, 75].map((mark) => (
                <div key={mark} className="absolute top-0 bottom-0 w-px bg-cyan-900/20" style={{ left: `${mark}%` }} />
              ))}
            </div>
            {clampedProgress !== undefined ? (
              <div
                className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgb(var(--cyber-cyan-rgb)/0.4),0_0_4px_rgba(52,211,153,0.2)]"
                style={{ width: `${clampedProgress}%` }}
              />
            ) : (
              fx.contentMotion ? (
                <motion.div
                  className="h-full w-[40%] bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgb(var(--cyber-cyan-rgb)/0.4),0_0_4px_rgba(52,211,153,0.2)]"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              ) : (
                <div className="h-full w-2/5 bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-400" />
              )
            )}
          </div>

          <div className="w-full flex items-center justify-between">
            <p id={LOADING_MESSAGE_ID} className="text-[11px] text-cyan-500/70 tracking-wider font-mono">
              {message}<span className="loading-dots" />
            </p>
            {clampedProgress !== undefined && (
              <span className="text-[11px] text-cyan-400/60 font-mono tabular-nums">
                {clampedProgress}%
              </span>
            )}
          </div>
        </MotionBox>

        <MotionBox fx={fx} className="flex items-center gap-2 mt-1" delay={1}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
          <span className="text-[9px] font-mono text-cyan-500/30 uppercase tracking-[0.2em]">volodka://boot</span>
        </MotionBox>

        <MotionBox fx={fx} className="max-w-sm text-center mt-3" delay={2.5}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-px w-8 bg-[linear-gradient(90deg,transparent,rgb(var(--cyber-cyan-rgb)/0.4))]" />
            <span className="text-[10px] text-cyan-500/50 uppercase tracking-[0.2em] font-mono">Цитата</span>
            <div className="h-px w-8 bg-[linear-gradient(90deg,rgb(var(--cyber-cyan-rgb)/0.4),transparent)]" />
          </div>
          <p
            className="text-sm text-slate-400/60 italic leading-relaxed font-serif shadow-[0_0_15px_rgb(var(--cyber-cyan-rgb)/0.08)]"
            aria-live="polite"
            aria-atomic="true"
          >
            &laquo;{currentQuote}&raquo;
          </p>
        </MotionBox>

        <MotionBox fx={fx} className="max-w-xs text-center mt-1" delay={3.5}>
          <AnimatePresence mode="wait">
            {showTip && (
              fx.contentMotion ? (
                <motion.div
                  key={tipIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.4 }}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <div className="h-px w-6 bg-[linear-gradient(90deg,transparent,rgba(251,191,36,0.4))]" />
                    <span className="text-[10px] text-amber-500/50 uppercase tracking-[0.2em] font-mono">Совет</span>
                    <div className="h-px w-6 bg-[linear-gradient(90deg,rgba(251,191,36,0.4),transparent)]" />
                  </div>
                  <p className="text-xs text-slate-500/50 leading-relaxed">{currentTip}</p>
                </motion.div>
              ) : (
                <div key={tipIndex} aria-live="polite" aria-atomic="true">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <span className="text-[10px] text-amber-500/50 uppercase tracking-[0.2em] font-mono">Совет</span>
                  </div>
                  <p className="text-xs text-slate-500/50 leading-relaxed">{currentTip}</p>
                </div>
              )
            )}
          </AnimatePresence>
        </MotionBox>
      </div>

      <MotionBox fx={fx} className="absolute bottom-8 right-6 z-[70] flex flex-col items-end gap-0.5" delay={2}>
        <span className="font-mono text-[10px] tracking-[0.15em] text-cyan-500/25">v{APP_VERSION}</span>
        <span className="font-mono text-[8px] tracking-[0.1em] text-slate-700/40">build.2026</span>
      </MotionBox>

      <MotionBox
        fx={fx}
        className="absolute bottom-8 left-6 font-serif text-[10px] text-slate-500/30 tracking-wider z-[70] italic dedication-glow"
        delay={3}
      >
        {LOADING_DEDICATION_TEXT}
      </MotionBox>
    </div>
  );
}
