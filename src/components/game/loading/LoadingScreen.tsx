import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { APP_VERSION } from '@/shared/constants/appVersion';
import { CRTSweep } from '@/components/game/loading/CRTSweep';
import { CyberSpinner } from '@/components/game/loading/CyberSpinner';
import { GlitchTitle } from '@/components/game/loading/GlitchTitle';
import { HexDumpOverlay } from '@/components/game/loading/HexDumpOverlay';
import { LoadingParticles } from '@/components/game/loading/LoadingParticles';
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
  SCENE_TIPS as _SCENE_TIPS,
  TIPS,
  getLoadingTips,
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
      <div className="absolute top-0 left-0 right-0 h-[6dvh] min-h-[24px] bg-black pointer-events-none" style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }} />
      <div className="absolute bottom-0 left-0 right-0 h-[6dvh] min-h-[24px] bg-black pointer-events-none" style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }} />
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
  style?: React.CSSProperties;
};

function MotionBox({ fx, className, children, delay = 0, style }: MotionBoxProps) {
  if (!fx.contentMotion) {
    return <div className={className} style={style}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
}

/** Estimated seconds remaining based on linear extrapolation */
function useEstimatedTimeRemaining(progress: number | undefined): string | null {
  const startRef = useRef<number>(performance.now());
  const [eta, setEta] = useState<string | null>(null);

  useEffect(() => {
    if (progress === undefined || progress === 0) {
      startRef.current = performance.now();
      setEta(null);
      return;
    }
    if (progress >= 100) {
      setEta(null);
      return;
    }

    const elapsed = (performance.now() - startRef.current) / 1000;
    if (elapsed < 0.5) return;

    const totalEstimate = elapsed / (progress / 100);
    const remaining = Math.max(0, totalEstimate - elapsed);

    if (remaining < 1) setEta('< 1с');
    else if (remaining < 60) setEta(`~${Math.ceil(remaining)}с`);
    else setEta(`~${Math.ceil(remaining / 60)}м`);
  }, [progress]);

  return eta;
}

export function LoadingScreen({
  progress,
  message = LOADING_DEFAULT_MESSAGE,
  showTitle = false,
}: LoadingScreenProps) {
  const fx = useLoadingScreenFx();
  const clampedProgress = clampLoadingProgress(progress);
  const statusText = formatLoadingStatusText(message, clampedProgress);
  const eta = useEstimatedTimeRemaining(clampedProgress);
  const [showTip, setShowTip] = useState(true);
  const [showBootText, setShowBootText] = useState(fx.bootText);
  const [milestoneBurst, setMilestoneBurst] = useState<number | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevProgressRef = useRef<number | undefined>(undefined);
  const retryCountRef = useRef(0);

  const quoteIndex = useMemo(
    () => pickDeterministicIndex(LOADING_QUOTE_SEED, POEM_QUOTES.length),
    [],
  );

  // Scene-aware tips based on loading message
  const sceneTips = useMemo(() => getLoadingTips(message), [message]);
  const [tipIndex, setTipIndex] = useState(0);

  const tipCycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Milestone burst effects at 50%, 75%, 100% ──
  useEffect(() => {
    if (clampedProgress === undefined) return;
    const prev = prevProgressRef.current ?? 0;
    const milestones = [50, 75, 100] as const;
    for (const m of milestones) {
      if (prev < m && clampedProgress >= m) {
        setMilestoneBurst(m);
        const timer = setTimeout(() => setMilestoneBurst(null), 800);
        return () => clearTimeout(timer);
      }
    }
    prevProgressRef.current = clampedProgress;
  }, [clampedProgress]);

  // ── Error recovery: show retry after 10s stall ──
  useEffect(() => {
    if (clampedProgress === undefined || clampedProgress >= 100) {
      setShowRetry(false);
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
      return;
    }
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    stallTimerRef.current = setTimeout(() => setShowRetry(true), 10000);
    return () => { if (stallTimerRef.current) clearTimeout(stallTimerRef.current); };
  }, [message, clampedProgress]);

  useEffect(() => {
    if (clampedProgress !== undefined && clampedProgress > 0) setShowRetry(false);
  }, [clampedProgress]);

  const handleRetry = useCallback(() => {
    retryCountRef.current += 1;
    setShowRetry(false);
    window.dispatchEvent(new CustomEvent('volodka:loading-retry', {
      detail: { attempt: retryCountRef.current },
    }));
  }, []);

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
          setTipIndex((prev) => (prev + 1) % sceneTips.length);
          setShowTip(true);
          scheduleNext();
        }, 300);
      }, 4000);
    };

    scheduleNext();
    return clearTimers;
  }, [fx.tipRotation, sceneTips.length]);

  useEffect(() => {
    if (!fx.bootText) return;
    const timer = setTimeout(() => setShowBootText(false), getBootTextDismissMs());
    return () => clearTimeout(timer);
  }, [fx.bootText]);

  const currentQuote = POEM_QUOTES[quoteIndex] ?? POEM_QUOTES[0];
  const currentTip = sceneTips[tipIndex] ?? sceneTips[0] ?? TIPS[0];

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

      {/* Subtle floating particles — CSS-only, cyberpunk atmosphere */}
      <LoadingParticles />

      {fx.filmGrain && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay animate-[cinematic-grain_0.4s_steps(8)_infinite]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            backgroundSize: '128px 128px',
            zIndex: 2,
          }}
        />
      )}

      {/* Scan-line overlay — CSS only, subtle CRT aesthetic */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 4,
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(0,0,0,0.05) 1px, rgba(0,0,0,0.05) 2px)',
          animation: 'loading-scanline-scroll 8s linear infinite',
        }}
      />
      {/* Moving scan-line bar — single bright line sweeping down */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 4, animation: 'loading-scanline-bar 4s ease-in-out infinite' }}
      >
        <div
          className="absolute left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,255,0.08) 30%, rgba(0,255,255,0.15) 50%, rgba(0,255,255,0.08) 70%, transparent 100%)',
            boxShadow: '0 0 8px rgba(0,255,255,0.1), 0 0 20px rgba(0,255,255,0.05)',
          }}
        />
      </div>

      {fx.hexDump && <HexDumpOverlay />}

      <AnimatePresence>
        {showBootText && fx.bootText && (
          <motion.div
            initial={fx.contentMotion ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={fx.contentMotion ? { opacity: 0 } : undefined}
            transition={{ duration: fx.contentMotion ? 1 : 0 }}
            className="absolute inset-0"
            style={{ zIndex: 5 }}
          >
            <TerminalBootText />
          </motion.div>
        )}
      </AnimatePresence>

      {fx.breathingGlow && (
        <>
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 6 }}
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
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 6 }}
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

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.7)_100%)]" style={{ zIndex: 55 }} />

      {fx.cinematicBars && <CinematicBars />}

      {fx.cornerDecor && (
        <>
          <motion.div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-cyan-500/20" style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }} animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 3, repeat: Infinity }} />
          <motion.div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-cyan-500/20" style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }} animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }} />
          <motion.div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-amber-500/15" style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }} animate={{ opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }} />
          <motion.div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-amber-500/15" style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }} animate={{ opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 3, repeat: Infinity, delay: 1.5 }} />
        </>
      )}

      <div className="relative flex flex-col items-center gap-5" style={{ zIndex: UI_LAYERS.LOADING }}>
        {showTitle && (
          /* hud-filmic-boot-flicker — wrapper applies CRT-style boot flicker
             to the title. GlitchTitle's motion.h1 still fades in via framer-motion;
             the wrapper opacity multiplies, ending at 1 (forwards). */
          <div className="hud-filmic-boot-flicker">
            <GlitchTitle text={LOADING_TITLE_TEXT} animate={fx.glitchTitle} />
          </div>
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
                className="h-full overflow-hidden relative"
                style={{ width: `${clampedProgress}%` }}
              >
                {/* Pulsing gradient bar: cyan → amber matching game theme */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, #0891b2, #06b6d4, #22d3ee, #f59e0b, #fbbf24)',
                    backgroundSize: '200% 100%',
                    animation: 'loading-bar-pulse 2s ease-in-out infinite',
                  }}
                />
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 55%, transparent 100%)',
                    backgroundSize: '250% 100%',
                    animation: 'loading-bar-shimmer 1.8s ease-in-out infinite',
                  }}
                />
                {/* Glow effect */}
                <div
                  className="absolute inset-0"
                  style={{
                    boxShadow: '0 0 12px rgba(6,182,212,0.4), 0 0 4px rgba(245,158,11,0.2)',
                  }}
                />
              </div>
            ) : (
              fx.contentMotion ? (
                <motion.div
                  className="h-full w-[40%] overflow-hidden relative"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, #0891b2, #06b6d4, #22d3ee, #f59e0b, #fbbf24)',
                      backgroundSize: '200% 100%',
                      animation: 'loading-bar-pulse 2s ease-in-out infinite',
                    }}
                  />
                </motion.div>
              ) : (
                <div className="h-full w-2/5" style={{ background: 'linear-gradient(90deg, #0891b2, #06b6d4, #f59e0b)' }} />
              )
            )}
          </div>

          <div className="w-full flex items-center justify-between">
            <p id={LOADING_MESSAGE_ID} className="text-[11px] tracking-wider font-mono" style={{ color: 'var(--hud-filmic-ink-meta)' }}>
              {message}<span className="loading-dots" />
            </p>
            {clampedProgress !== undefined && (
              <span className="text-[11px] font-mono tabular-nums" style={{
                background: 'linear-gradient(90deg, rgba(6,182,212,0.6), rgba(245,158,11,0.5))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {clampedProgress}%{eta ? ` · ${eta}` : ''}
              </span>
            )}
          </div>

          {/* Milestone burst effects */}
          <AnimatePresence>
            {milestoneBurst !== null && (
              <motion.div
                key={milestoneBurst}
                className="loading-milestone-burst"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.3 }}
              >
                <span className="loading-milestone-text">
                  {milestoneBurst === 50 ? '◆ 50%' : milestoneBurst === 75 ? '◆◆ 75%' : '✦ 100%'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Retry button — shown after 10s stall */}
          <AnimatePresence>
            {showRetry && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                onClick={handleRetry}
                className="loading-retry-btn"
                aria-label="Повторить загрузку"
              >
                ↻ Повторить загрузку
              </motion.button>
            )}
          </AnimatePresence>
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
            className="text-sm italic leading-relaxed font-serif shadow-[0_0_15px_rgb(var(--cyber-cyan-rgb)/0.08)]"
            style={{ color: 'var(--hud-filmic-ink-muted)' }}
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
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--hud-filmic-ink-dim)' }}>{currentTip}</p>
                </motion.div>
              ) : (
                <div key={tipIndex} aria-live="polite" aria-atomic="true">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <span className="text-[10px] text-amber-500/50 uppercase tracking-[0.2em] font-mono">Совет</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--hud-filmic-ink-dim)' }}>{currentTip}</p>
                </div>
              )
            )}
          </AnimatePresence>
        </MotionBox>
      </div>

      <MotionBox fx={fx} className="absolute bottom-8 right-6 flex flex-col items-end gap-0.5" style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }} delay={2}>
        <span className="font-mono text-[10px] tracking-[0.15em] text-cyan-500/25">v{APP_VERSION}</span>
        <span className="font-mono text-[8px] tracking-[0.1em] text-slate-700/40">build.2026</span>
      </MotionBox>

      <MotionBox
        fx={fx}
        className="absolute bottom-8 left-6 font-serif text-[10px] text-slate-500/30 tracking-wider italic dedication-glow" style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }}
        delay={3}
      >
        {LOADING_DEDICATION_TEXT}
      </MotionBox>
    </div>
  );
}
