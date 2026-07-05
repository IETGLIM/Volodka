import { memo, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FilmGrain, CinematicBars } from '@/components/game/cinematic';
import { MenuParticles } from '@/components/game/menu/MenuParticles';
import { CanvasMatrixRain } from '@/components/game/shared/CanvasMatrixRain';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { MenuScreenFx } from '@/engine/menu/menuFxTier';
import { getMenuParticleCounts } from '@/engine/menu/menuFxTier';
import { SYSTEM_MESSAGES } from '@/engine/menu/menuConstants';
import type { DeviceTier } from '@/hooks/useDeviceTier';
import { seededRand } from '@/shared/utils/seededRand';

type MenuBackgroundEffectsProps = {
  fx: MenuScreenFx;
  tier: DeviceTier;
  matrixRainEnabled: boolean;
  contentMotion: boolean;
};

const CircuitGridLines = memo(function CircuitGridLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[3]" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={`${(i + 1) * 8}%`}
            x2="100%"
            y2={`${(i + 1) * 8}%`}
            stroke="rgb(var(--cyber-cyan-rgb) / 0.6)"
            strokeWidth="0.5"
            style={{ animation: `menu-circuit-grid ${3 + i * 0.5}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }}
          />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={`${(i + 1) * 6}%`}
            y1="0"
            x2={`${(i + 1) * 6}%`}
            y2="100%"
            stroke="rgb(var(--cyber-cyan-rgb) / 0.4)"
            strokeWidth="0.5"
            style={{ animation: `menu-circuit-grid ${4 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </svg>
    </div>
  );
});

const FullScreenScanLine = memo(function FullScreenScanLine() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[45]" aria-hidden="true">
      <div
        className="absolute left-0 right-0 h-px menu-fullscan-line"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgb(var(--cyber-cyan-rgb) / 0.08) 20%, rgb(var(--cyber-cyan-rgb) / 0.12) 50%, rgb(var(--cyber-cyan-rgb) / 0.08) 80%, transparent 100%)',
          boxShadow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.05)',
        }}
      />
    </div>
  );
});

const MenuParticleSystem = memo(function MenuParticleSystem({ emberCount, sparkleCount }: { emberCount: number; sparkleCount: number }) {
  const particles = useMemo(() => {
    const embers = Array.from({ length: emberCount }, (_, i) => {
      const x = (seededRand(i) * 100).toFixed(2);
      const delay = (seededRand(i + 60) * 8).toFixed(2);
      const duration = (4 + seededRand(i + 120) * 6).toFixed(2);
      const size = (1 + seededRand(i + 180) * 3).toFixed(1);
      const glow = (parseFloat(size) * 3).toFixed(1);
      const color = i % 3 === 0 ? 'rgba(255, 0, 128, 0.5)' : i % 3 === 1 ? 'rgba(255, 140, 0, 0.4)' : 'rgba(0, 255, 255, 0.5)';
      return { id: `e${i}`, x, delay, duration, size, glow, color, type: 'ember' as const };
    });
    const sparkles = Array.from({ length: sparkleCount }, (_, i) => {
      const idx = i + 200;
      const x = (seededRand(idx) * 100).toFixed(2);
      const y = (seededRand(idx + 50) * 100).toFixed(2);
      const delay = (seededRand(idx + 100) * 12).toFixed(2);
      const duration = (6 + seededRand(idx + 150) * 8).toFixed(2);
      const size = (0.5 + seededRand(idx + 200) * 1.5).toFixed(1);
      const color = i % 2 === 0 ? 'rgba(0, 255, 255, 0.8)' : 'rgba(255, 200, 100, 0.7)';
      return { id: `s${i}`, x, y, delay, duration, size, color, type: 'sparkle' as const };
    });
    return [...embers, ...sparkles];
  }, [emberCount, sparkleCount]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map((p) =>
        p.type === 'sparkle' ? (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              boxShadow: `0 0 ${p.size}px ${p.color}`,
              animation: `sparkle-float ${p.duration}s ease-out infinite`,
              animationDelay: `${p.delay}s`,
              willChange: 'transform, opacity',
            }}
          />
        ) : (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              bottom: '-10px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              boxShadow: `0 0 ${p.glow}px ${p.color}`,
              animation: `ember-float ${p.duration}s ease-out infinite`,
              animationDelay: `${p.delay}s`,
              willChange: 'transform, opacity',
            }}
          />
        ),
      )}
    </div>
  );
});

const TerminalCorners = memo(function TerminalCorners() {
  const corners = [
    { pos: 'top-3 left-3', bracket: 'border-t border-l', dotPos: 'top-0 left-0' },
    { pos: 'top-3 right-3', bracket: 'border-t border-r', dotPos: 'top-0 right-0' },
    { pos: 'bottom-3 left-3', bracket: 'border-b border-l', dotPos: 'bottom-0 left-0' },
    { pos: 'bottom-3 right-3', bracket: 'border-b border-r', dotPos: 'bottom-0 right-0' },
  ];

  return (
    <>
      {corners.map((c, i) => (
        <div key={c.pos} className={`absolute ${c.pos} w-5 h-5 border-cyan-400/20 ${c.bracket} z-30 pointer-events-none`}>
          <div
            className={`absolute ${c.dotPos} w-1 h-1 rounded-full bg-cyan-400/60`}
            style={{
              boxShadow: '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.4)',
              animation: `menu-corner-dot-blink ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        </div>
      ))}
    </>
  );
});

const AsciiDecoration = memo(function AsciiDecoration() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.12 }}
      transition={{ delay: 2.5, duration: 2 }}
      className="absolute top-1/2 right-4 md:right-8 -translate-y-1/2 z-20 pointer-events-none hidden md:block"
      aria-hidden="true"
    >
      <pre className="font-mono text-[6px] md:text-[8px] leading-tight text-cyan-400">{`  ╔═══════════╗
  ║  ▓▓▓▓▓▓  ║
  ║  ▓  ◈  ▓  ║
  ║  ▓▓▓▓▓▓  ║
  ╠═══════════╣
  ║ VOL0DKA  ║
  ╚═══════════╝`}</pre>
    </motion.div>
  );
});

const DataStream = memo(function DataStream() {
  const lines = ['SYS:INIT_OK', 'MEM:0xFF00', 'NET:CONNECTED', 'POEM:LOADED', 'SCENE:READY'];
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 0.08, x: 0 }}
      transition={{ delay: 2, duration: 1.5 }}
      className="absolute top-1/2 left-4 md:left-8 -translate-y-1/2 z-20 pointer-events-none hidden md:block"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-1">
        {lines.map((line) => (
          <span key={line} className="font-mono text-[7px] md:text-[9px] tracking-wider text-cyan-400">
            <span className="text-amber-500/60">&gt;</span> {line}
          </span>
        ))}
      </div>
    </motion.div>
  );
});

const SystemStatusReadout = memo(function SystemStatusReadout() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMsgIndex((prev) => (prev + 1) % SYSTEM_MESSAGES.length), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2.5, duration: 0.8 }}
      className="absolute top-8 left-8 z-30 pointer-events-none flex items-center gap-2"
      aria-hidden="true"
    >
      <span className="font-mono text-[8px] tracking-[0.15em] text-cyan-400/30 type-cursor">{SYSTEM_MESSAGES[msgIndex]}</span>
    </motion.div>
  );
});

function MatrixRainFallback() {
  return null;
}

export const MenuBackgroundEffects = memo(function MenuBackgroundEffects({
  fx,
  tier,
  matrixRainEnabled,
  contentMotion,
}: MenuBackgroundEffectsProps) {
  const particleCounts = getMenuParticleCounts(tier);

  return (
    <>
      {fx.atmosphericPan ? (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <motion.div
            className="absolute"
            style={{ width: '120%', height: '120%', top: '-10%', left: '-10%', background: 'radial-gradient(ellipse at 30% 50%, rgba(0,255,255,0.03) 0%, transparent 50%)' }}
            animate={contentMotion ? { x: ['-5%', '5%', '-5%'], y: ['-3%', '3%', '-3%'] } : false}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      ) : null}

      {fx.circuitGridLines ? <CircuitGridLines /> : null}

      {fx.matrixRain && matrixRainEnabled ? (
        <ErrorBoundary name="menu-matrix-rain" fallback={<MatrixRainFallback />}>
          <CanvasMatrixRain opacity={0.25} charOpacity={0.8} chars="アイウエオカキクケコ0123456789ABCDEF" />
        </ErrorBoundary>
      ) : null}

      {fx.menuParticles ? <MenuParticles counts={{ drift: particleCounts.drift, stream: particleCounts.stream }} /> : null}
      {fx.filmGrain ? <FilmGrain opacity={0.035} zIndex={49} /> : null}

      <div
        className="absolute inset-0 pointer-events-none z-50"
        style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.07) 2px, rgba(0, 0, 0, 0.07) 4px)' }}
        aria-hidden="true"
      />

      {fx.fullScreenScanLine ? <FullScreenScanLine /> : null}

      {fx.crtSweep && contentMotion ? (
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden" aria-hidden="true">
          <motion.div
            className="absolute left-0 right-0 h-[2px]"
            style={{
              background: 'linear-gradient(90deg, transparent 5%, rgba(0, 255, 255, 0.15) 30%, rgba(0, 255, 255, 0.2) 50%, rgba(0, 255, 255, 0.15) 70%, transparent 95%)',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.12)',
              willChange: 'transform',
            }}
            animate={{ y: ['0vh', '100vh'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : null}

      {fx.fogLayers ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-orange-500/10 to-transparent" />
          {contentMotion ? (
            <>
              <motion.div
                className="absolute top-0 left-0 w-1/2 h-1/3"
                style={{ background: 'radial-gradient(ellipse, rgba(0,255,255,0.06) 0%, transparent 70%)' }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 8, repeat: Infinity }}
              />
              <motion.div
                className="absolute top-0 right-0 w-1/3 h-1/3"
                style={{ background: 'radial-gradient(ellipse, rgba(255,0,128,0.05) 0%, transparent 70%)' }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 6, repeat: Infinity, delay: 2 }}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {fx.particleSystem ? (
        <MenuParticleSystem emberCount={particleCounts.ember} sparkleCount={particleCounts.sparkle} />
      ) : null}

      {fx.dustField ? <div className="menu-dust-field" aria-hidden="true" /> : null}
      {fx.cinematicBars ? <CinematicBars /> : null}

      {fx.pulsingVignette && contentMotion ? (
        <motion.div
          className="absolute inset-0 pointer-events-none z-30"
          aria-hidden="true"
          animate={{
            background: [
              'radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, 0.75) 100%)',
              'radial-gradient(ellipse at center, transparent 30%, rgba(0, 0, 0, 0.85) 100%)',
              'radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, 0.75) 100%)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, 0.75) 100%)' }}
          aria-hidden="true"
        />
      )}

      <div className="menu-vignette-overlay" aria-hidden="true" />
      {fx.asciiDecoration ? <AsciiDecoration /> : null}
      {fx.dataStream ? <DataStream /> : null}
      {fx.terminalCorners ? <TerminalCorners /> : null}
      {fx.systemStatus ? <SystemStatusReadout /> : null}
    </>
  );
});
