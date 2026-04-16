'use client';

import { useMemo, memo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { sceneManager, type SceneVisualConfig } from '@/engine/SceneManager';
import { useMobileVisualPerf } from '@/hooks/useMobileVisualPerf';
import { AsciiCyberBackdrop } from './AsciiCyberBackdrop';
import { RainCanvasLayer } from './RainCanvasLayer';
import type { SceneId } from '@/data/types';
import type { PlayerState } from '@/data/types';

// ============================================
// TYPES
// ============================================

interface SceneRendererProps {
  sceneId: SceneId;
  playerState: PlayerState;
  isTransitioning?: boolean;
}

interface ParticleConfig {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface NeonSignConfig {
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize?: number;
  flickerSpeed?: number;
}

// ============================================
// UTILITY HOOKS
// ============================================

function useSeededRandom(seed: number) {
  return useCallback(() => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }, [seed]);
}

function hashSceneId(sceneId: string): number {
  let h = 0;
  for (let i = 0; i < sceneId.length; i++) {
    h = (h * 31 + sceneId.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Горизонт: сетка + силуэт мегаполиса (Blade Runner / Matrix), стабильный seed по сцене */
const GlobalNeoNoirLayer = memo(function GlobalNeoNoirLayer({ sceneId }: { sceneId: SceneId }) {
  const seed = hashSceneId(sceneId);

  const buildings = useMemo(() => {
    const prng = (i: number) => ((seed + i * 7919) % 1000) / 1000;
    const count = 28;
    return Array.from({ length: count }, (_, i) => {
      const w = 2.2 + prng(i) * 5.5;
      const slot = (i / count) * 100;
      const left = slot - w * 0.15 + (prng(i + 120) - 0.5) * 2.2;
      const hPct = 24 + prng(i + 50) * 62;
      const isCyan = prng(i + 99) > 0.4;
      return {
        id: i,
        left: Math.max(-2, Math.min(102 - w, left)),
        width: w,
        heightPct: hPct,
        glow: isCyan ? 'rgba(0, 255, 200, 0.14)' : 'rgba(255, 60, 140, 0.08)',
      };
    });
  }, [seed]);

  const windowDots = useMemo(() => {
    const prng = (i: number) => ((seed + i * 7919) % 1000) / 1000;
    return Array.from({ length: 48 }, (_, i) => ({
      id: i,
      left: prng(i + 200) * 100,
      bottom: 8 + prng(i + 250) * 28,
      size: 1 + prng(i + 300) * 2,
      opacity: 0.12 + prng(i + 350) * 0.35,
      delay: prng(i + 400) * 4,
    }));
  }, [seed]);

  return (
    <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
      {/* Линия горизонта */}
      <div
        className="absolute left-[6%] right-[6%] top-[58%] h-px opacity-40"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(0,255,255,0.35), rgba(255,140,0,0.25), transparent)',
          boxShadow: '0 0 18px rgba(0, 255, 255, 0.15)',
        }}
      />

      {/* Силуэт зданий */}
      <div className="absolute inset-x-0 bottom-0 h-[36%] opacity-[0.58]">
        {buildings.map((b) => (
          <div
            key={b.id}
            className="absolute bottom-0 rounded-t-[2px]"
            style={{
              left: `${b.left}%`,
              width: `${b.width}%`,
              height: `${b.heightPct}%`,
              background: `linear-gradient(180deg, ${b.glow}, rgba(2,4,12,0.98))`,
              boxShadow: '0 -2px 28px rgba(0, 255, 255, 0.05)',
            }}
          />
        ))}
      </div>

      {/* Окна в небе / дождь неона */}
      {windowDots.map((w) => (
        <motion.div
          key={w.id}
          className="absolute rounded-full"
          style={{
            left: `${w.left}%`,
            bottom: `${w.bottom}%`,
            width: w.size,
            height: w.size,
            background: 'radial-gradient(circle, rgba(0,255,255,0.5), transparent 70%)',
            opacity: w.opacity,
          }}
          animate={{ opacity: [w.opacity * 0.4, w.opacity, w.opacity * 0.5] }}
          transition={{ duration: 2 + (w.id % 5) * 0.3, repeat: Infinity, delay: w.delay }}
        />
      ))}
    </div>
  );
});

// ============================================
// MAIN SCENE RENDERER
// ============================================

/** Мерцание «люминесцентных» ламп в офисных сценах */
const OfficeFluorescentFlicker = memo(function OfficeFluorescentFlicker() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[2]"
      aria-hidden
      style={{
        mixBlendMode: 'screen' as const,
        background:
          'radial-gradient(ellipse 120% 35% at 50% 0%, rgba(220,235,255,0.14), transparent 58%), radial-gradient(ellipse 80% 25% at 20% 12%, rgba(180,200,255,0.06), transparent 50%)',
      }}
      animate={{ opacity: [0.35, 0.72, 0.28, 0.68, 0.4, 0.8, 0.32] }}
      transition={{
        duration: 9.5,
        repeat: Infinity,
        ease: 'easeInOut',
        times: [0, 0.15, 0.28, 0.42, 0.55, 0.72, 1],
      }}
    />
  );
});

export default function SceneRenderer({ sceneId, playerState, isTransitioning }: SceneRendererProps) {
  const sceneConfig = useMemo(() => sceneManager.getSceneConfig(sceneId), [sceneId]);
  const visualLite = useMobileVisualPerf();
  const reduceMotion = useReducedMotion();

  // Calculate visual effects based on player state
  const visualEffects = useMemo(() => {
    const effects: string[] = [];

    if (playerState.stress > 70) effects.push('stress-high');
    if (playerState.stability < 30) effects.push('stability-low');
    if (playerState.creativity > 70) effects.push('creativity-high');
    if (playerState.panicMode) effects.push('panic-mode');
    if (playerState.mood < 20) effects.push('mood-low');

    return effects;
  }, [playerState]);

  // Build CSS classes based on effects
  const effectClasses = useMemo(() => {
    const classes: string[] = [];
    if (visualEffects.includes('stress-high')) classes.push('glitch-mild');
    if (visualEffects.includes('panic-mode')) classes.push('glitch-intense');
    return classes.join(' ');
  }, [visualEffects]);

  // Build inline styles for overlays
  const overlayStyles = useMemo(() => {
    const styles: React.CSSProperties = {};

    if (playerState.stress > 70) {
      const intensity = (playerState.stress - 70) / 30;
      styles.boxShadow = `inset 0 0 ${100 + intensity * 100}px rgba(220, 38, 38, ${0.05 + intensity * 0.1})`;
    }

    if (playerState.creativity > 70) {
      const intensity = (playerState.creativity - 70) / 30;
      styles.boxShadow = `${styles.boxShadow || ''} inset 0 0 ${50 + intensity * 50}px rgba(255, 215, 0, ${0.02 + intensity * 0.03})`;
    }

    if (playerState.stability < 30) {
      const intensity = (30 - playerState.stability) / 30;
      styles.filter = `saturate(${1 - intensity * 0.5})`;
    }

    return styles;
  }, [playerState]);

  return (
    <motion.div
      className={`fixed inset-0 z-10 ${effectClasses}`}
      style={{
        background: sceneConfig.background,
        ...overlayStyles,
      }}
      key={sceneId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <AsciiCyberBackdrop sceneId={sceneId} playerState={playerState} visualLite={visualLite} />

      {(sceneId === 'office_morning' || sceneId === 'psychologist_office') &&
        !visualLite &&
        !reduceMotion && <OfficeFluorescentFlicker />}

      {/* Scene overlay (gradient atmosphere) */}
      {sceneConfig.overlay && (
        <div className={`absolute inset-0 ${sceneConfig.overlay}`} />
      )}

      {/* Extra classes (radial gradients for light sources) */}
      {sceneConfig.extraClasses && (
        <div className={`absolute inset-0 ${sceneConfig.extraClasses}`} />
      )}

      {/* ===== SCENE-SPECIFIC ATMOSPHERIC OVERLAYS ===== */}
      <SceneAtmosphere sceneId={sceneId} />

      {/* Неон + силуэт города — общий слой «окружения» под виньеткой */}
      <GlobalNeoNoirLayer sceneId={sceneId} />

      {/* Vignette effect - always present, stronger when stability low */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${0.3 + (playerState.stability < 30 ? 0.3 : 0)}) 100%)`,
        }}
      />

      {/* Scanlines for stress/panic */}
      {(playerState.stress > 70 || playerState.panicMode) && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,${playerState.panicMode ? 0.05 : 0.02}) 2px, rgba(0,255,255,${playerState.panicMode ? 0.05 : 0.02}) 4px)`,
            animation: playerState.panicMode ? 'glitch 0.2s infinite' : undefined,
          }}
        />
      )}

      {/* Panic mode red flash */}
      {playerState.panicMode && (
        <div className="absolute inset-0 pointer-events-none z-10 kernel-panic-overlay" />
      )}

      {/* Creativity particles */}
      {playerState.creativity > 70 && (
        <CreativityParticles intensity={(playerState.creativity - 70) / 30} />
      )}

      {/* Scene name indicator — терминал / LOC */}
      <motion.div
        className="absolute top-16 left-4 z-20"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <div
          className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/80 backdrop-blur-sm px-3 py-1.5 border border-cyan-500/25 bg-black/45"
          style={{
            clipPath:
              'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            boxShadow:
              '0 0 20px rgba(0, 255, 255, 0.08), inset 0 0 24px rgba(0, 255, 255, 0.04)',
          }}
        >
          <span className="text-cyan-500/50">LOC //</span>{' '}
          <span className="text-slate-200/90">{sceneConfig.name}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// CREATIVITY PARTICLES (existing)
// ============================================

function CreativityParticles({ intensity }: { intensity: number }) {
  const particles = useMemo(() => {
    const count = Math.floor(5 + intensity * 10);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 5,
    }));
  }, [intensity]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-5">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)',
          }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -30, -60],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// SCENE ATMOSPHERE - MAIN ROUTER
// ============================================

const SceneAtmosphere = memo(function SceneAtmosphere({ sceneId }: { sceneId: SceneId }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={sceneId}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          {(() => {
            switch (sceneId) {
              case 'office_morning':
                return <OfficeAtmosphere />;
              case 'home_evening':
                return <HomeEveningAtmosphere />;
              case 'kitchen_night':
                return <KitchenNightAtmosphere />;
              case 'cafe_evening':
                return <CafeEveningAtmosphere />;
              case 'street_night':
                return <StreetNightAtmosphere />;
              case 'street_winter':
                return <StreetWinterAtmosphere />;
              case 'memorial_park':
                return <MemorialParkAtmosphere />;
              case 'rooftop_night':
                return <RooftopNightAtmosphere />;
              case 'dream':
                return <DreamAtmosphere />;
              case 'battle':
                return <BattleAtmosphere />;
              case 'server_room':
                return <ServerRoomAtmosphere />;
              case 'underground_club':
                return <UndergroundClubAtmosphere />;
              default:
                return <GenericAtmosphere />;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

// ============================================
// OFFICE MORNING ATMOSPHERE
// ============================================

const OfficeAtmosphere = memo(function OfficeAtmosphere() {
  const terminalLines = useMemo(() => [
    'SYS: auth_check [OK]',
    'NET: node_7 responding... 23ms',
    'DB: query_pool 12/20 active',
    'LOG: [INFO] backup_sync complete',
    'SYS: mem_alloc 2.4GB / 8GB',
    'NET: packet_loss 0.02%',
    'API: rate_limit 847/1000',
    'LOG: [WARN] latency spike 340ms',
    'SYS: cron_job midnight_backup OK',
    'NET: ssl_cert expires 47d',
    'DB: replica_lag 0.3s',
    'LOG: [INFO] rotation complete',
  ], []);

  const ledBlinks = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: 75 + (i % 7) * 3.5,
      y: 15 + Math.floor(i / 7) * 30,
      delay: Math.random() * 3,
      duration: 0.8 + Math.random() * 2,
      color: i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#ff8c00' : '#00ffff',
    })),
  []);

  return (
    <>
      {/* Blue fluorescent light flicker */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 10%, rgba(148,163,184,0.08) 0%, transparent 60%)' }}
        animate={{ opacity: [1, 0.7, 1, 0.9, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Terminal window overlay - left side */}
      <TerminalWindowOverlay
        lines={terminalLines}
        x={3}
        y={20}
        width={220}
        height={180}
        borderColor="rgba(0,255,255,0.2)"
        textColor="rgba(0,255,255,0.35)"
        headerText="SYS_MONITOR"
      />

      {/* Terminal window overlay - right side */}
      <TerminalWindowOverlay
        lines={terminalLines.slice().reverse()}
        x={-3}
        y={45}
        width={180}
        height={140}
        borderColor="rgba(0,255,41,0.15)"
        textColor="rgba(0,255,41,0.3)"
        headerText="NET_STATUS"
        align="right"
      />

      {/* Server rack LED blinks */}
      {ledBlinks.map(led => (
        <motion.div
          key={led.id}
          className="absolute rounded-full"
          style={{
            left: `${led.x}%`,
            top: `${led.y}%`,
            width: 3,
            height: 3,
            background: led.color,
            boxShadow: `0 0 4px ${led.color}, 0 0 8px ${led.color}`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: led.duration,
            delay: led.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Fluorescent light bar at top */}
      <motion.div
        className="absolute top-0 left-[15%] right-[15%] h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.3), rgba(148,163,184,0.5), rgba(148,163,184,0.3), transparent)',
          boxShadow: '0 0 20px rgba(148,163,184,0.2), 0 0 40px rgba(148,163,184,0.1)',
        }}
        animate={{ opacity: [1, 0.6, 1, 0.85, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Scanline overlay for digital feel */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(148,163,184,0.015) 3px, rgba(148,163,184,0.015) 6px)',
        }}
      />
    </>
  );
});

// ============================================
// HOME EVENING ATMOSPHERE
// ============================================

const HomeEveningAtmosphere = memo(function HomeEveningAtmosphere() {
  const dustParticles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      y: 30 + Math.random() * 50,
      size: 1 + Math.random() * 2,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 10,
    })),
  []);

  return (
    <>
      {/* Amber lamp glow - warm radial light */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, rgba(212,148,10,0.1) 0%, rgba(212,148,10,0.03) 30%, transparent 65%)',
        }}
        animate={{ opacity: [1, 0.8, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Warm lamp light source */}
      <div
        className="absolute"
        style={{
          top: '35%',
          left: '50%',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'rgba(255,200,50,0.4)',
          boxShadow: '0 0 30px rgba(255,180,50,0.3), 0 0 60px rgba(255,150,30,0.15), 0 0 100px rgba(212,148,10,0.08)',
        }}
      />

      {/* Faint window light from right */}
      <div
        className="absolute top-[10%] right-[8%] w-[2px] h-[40%]"
        style={{
          background: 'linear-gradient(180deg, rgba(100,120,160,0.15), rgba(100,120,160,0.05), transparent)',
          boxShadow: '-20px 0 40px rgba(100,120,160,0.05)',
        }}
      />

      {/* Floating dust particles in lamplight */}
      {dustParticles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'rgba(255,200,100,0.25)',
            boxShadow: '0 0 2px rgba(255,200,100,0.15)',
          }}
          animate={{
            x: [0, 10, -5, 8, 0],
            y: [0, -15, -5, -20, 0],
            opacity: [0, 0.4, 0.2, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Warm shadow layer at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[30%]"
        style={{
          background: 'linear-gradient(to top, rgba(30,15,0,0.3), transparent)',
        }}
      />
    </>
  );
});

// ============================================
// KITCHEN NIGHT ATMOSPHERE
// ============================================

const KitchenNightAtmosphere = memo(function KitchenNightAtmosphere() {
  const steamParticles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 38 + Math.random() * 8,
      startY: 55,
      size: 3 + Math.random() * 6,
      duration: 3 + Math.random() * 3,
      delay: Math.random() * 4,
    })),
  []);

  return (
    <>
      {/* Blue monitor glow from left */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 20% 40%, rgba(100,150,255,0.08) 0%, transparent 50%)',
        }}
        animate={{ opacity: [1, 0.7, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Cold window light from right */}
      <div
        className="absolute top-[5%] right-[5%] w-[30%] h-[50%]"
        style={{
          background: 'linear-gradient(180deg, rgba(80,120,180,0.06), transparent)',
          clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)',
        }}
      />

      {/* Steam rising from cup */}
      {steamParticles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.startY}%`,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, rgba(180,180,200,0.12) 0%, transparent 70%)',
          }}
          animate={{
            y: [0, -40, -80],
            x: [0, 3, -2],
            opacity: [0, 0.3, 0],
            scale: [0.5, 1.5, 2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Cup indicator - faint warm spot */}
      <div
        className="absolute"
        style={{
          top: '55%',
          left: '40%',
          width: 12,
          height: 6,
          background: 'rgba(180,140,80,0.08)',
          borderRadius: '0 0 50% 50%',
          boxShadow: '0 0 15px rgba(180,140,80,0.05)',
        }}
      />

      {/* Sound wave indicator - faint */}
      <div className="absolute bottom-[20%] right-[15%] flex gap-[2px] items-end">
        {[0.4, 0.7, 1, 0.6, 0.3].map((h, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: 1.5,
              height: 6,
              background: 'rgba(100,150,255,0.12)',
            }}
            animate={{ scaleY: [h * 0.5, h, h * 0.5] }}
            transition={{
              duration: 1.5,
              delay: i * 0.15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Scanline */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(100,150,255,0.01) 4px, rgba(100,150,255,0.01) 8px)',
        }}
      />
    </>
  );
});

// ============================================
// CAFE EVENING ATMOSPHERE
// ============================================

const CafeEveningAtmosphere = memo(function CafeEveningAtmosphere() {
  const musicNotes = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      y: 40 + Math.random() * 30,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 8,
      symbol: ['\u266A', '\u266B', '\u2669'][i % 3],
    })),
  []);

  return (
    <>
      {/* Warm amber spotlight from above */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(217,119,6,0.1) 0%, rgba(217,119,6,0.03) 40%, transparent 70%)',
        }}
        animate={{ opacity: [1, 0.8, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Candle glow spots */}
      {[
        { x: '25%', y: '65%', size: 40, opacity: 0.06 },
        { x: '60%', y: '60%', size: 30, opacity: 0.05 },
        { x: '45%', y: '70%', size: 35, opacity: 0.04 },
      ].map((candle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: candle.x,
            top: candle.y,
            width: candle.size,
            height: candle.size,
            background: `radial-gradient(circle, rgba(255,180,50,${candle.opacity}) 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.1, 0.95, 1.05, 1],
            opacity: [1, 0.8, 1, 0.9, 1],
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Neon sign - CAFE name */}
      <NeonSign
        text="СИНЯЯ ЯМА"
        x={12}
        y={8}
        color="#ff8c00"
        fontSize={14}
        flickerSpeed={5}
      />

      {/* Neon sign - OPEN */}
      <NeonSign
        text="ОТКРЫТО"
        x={70}
        y={12}
        color="#00ffff"
        fontSize={10}
        flickerSpeed={7}
      />

      {/* Floating music note particles */}
      {musicNotes.map(note => (
        <motion.div
          key={note.id}
          className="absolute text-amber-600/15 select-none"
          style={{
            left: `${note.x}%`,
            top: `${note.y}%`,
            fontSize: 12,
          }}
          animate={{
            y: [0, -30, -60],
            x: [0, 5, -3],
            opacity: [0, 0.4, 0],
            rotate: [0, 10, -5],
          }}
          transition={{
            duration: note.duration,
            delay: note.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        >
          {note.symbol}
        </motion.div>
      ))}

      {/* Soft ambient glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(217,119,6,0.03), transparent 50%)',
        }}
      />
    </>
  );
});

// ============================================
// STREET NIGHT ATMOSPHERE
// ============================================

const StreetNightAtmosphere = memo(function StreetNightAtmosphere() {
  const lite = useMobileVisualPerf();
  return (
    <>
      {!lite && (
        <RainCanvasLayer intensity={0.6} color="rgba(150,170,200,0.25)" className="absolute inset-0" />
      )}

      {/* Neon sign reflections on wet ground */}
      <NeonSign
        text="КАФЕ"
        x={8}
        y={10}
        color="#ff00ff"
        fontSize={16}
        flickerSpeed={4}
      />
      <NeonSign
        text="ВЫХОД"
        x={72}
        y={15}
        color="#00ffff"
        fontSize={12}
        flickerSpeed={6}
      />

      {/* Wet ground neon reflections */}
      <div className="absolute bottom-[5%] left-0 right-0 h-[15%]" style={{ overflow: 'hidden' }}>
        {/* Magenta reflection */}
        <motion.div
          className="absolute"
          style={{
            left: '5%',
            bottom: 0,
            width: '25%',
            height: '100%',
            background: 'linear-gradient(to top, rgba(255,0,255,0.06), transparent)',
            filter: 'blur(8px)',
            transform: 'scaleY(-0.6)',
          }}
          animate={{ opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Cyan reflection */}
        <motion.div
          className="absolute"
          style={{
            right: '5%',
            bottom: 0,
            width: '20%',
            height: '100%',
            background: 'linear-gradient(to top, rgba(0,255,255,0.05), transparent)',
            filter: 'blur(8px)',
            transform: 'scaleY(-0.6)',
          }}
          animate={{ opacity: [0.5, 0.25, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      {/* Amber streetlight pools */}
      {[
        { x: '20%', y: '75%', w: 120, h: 80 },
        { x: '55%', y: '80%', w: 100, h: 60 },
        { x: '80%', y: '70%', w: 80, h: 50 },
      ].map((pool, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: pool.x,
            top: pool.y,
            width: pool.w,
            height: pool.h,
            background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)',
            filter: 'blur(4px)',
          }}
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
        />
      ))}

      {/* Passing car lights */}
      <motion.div
        className="absolute"
        style={{
          top: '65%',
          height: 4,
          width: 60,
          background: 'linear-gradient(90deg, transparent, rgba(255,240,200,0.15), rgba(255,240,200,0.3), rgba(255,240,200,0.15), transparent)',
          filter: 'blur(2px)',
          boxShadow: '0 0 15px rgba(255,240,200,0.1)',
        }}
        animate={{
          x: ['-100px', '110vw'],
        }}
        transition={{
          duration: 8,
          delay: 3,
          repeat: Infinity,
          repeatDelay: 12,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute"
        style={{
          top: '68%',
          height: 3,
          width: 40,
          background: 'linear-gradient(90deg, transparent, rgba(255,50,50,0.15), rgba(255,50,50,0.25), rgba(255,50,50,0.15), transparent)',
          filter: 'blur(2px)',
          boxShadow: '0 0 10px rgba(255,50,50,0.08)',
        }}
        animate={{
          x: ['110vw', '-100px'],
        }}
        transition={{
          duration: 10,
          delay: 10,
          repeat: Infinity,
          repeatDelay: 15,
          ease: 'linear',
        }}
      />
    </>
  );
});

// ============================================
// STREET WINTER ATMOSPHERE
// ============================================

const StreetWinterAtmosphere = memo(function StreetWinterAtmosphere() {
  const snowflakes = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 1 + Math.random() * 3,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 8,
      drift: -20 + Math.random() * 40,
    })),
  []);

  return (
    <>
      {/* Cold blue atmospheric overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(148,163,184,0.04) 0%, transparent 60%)',
        }}
      />

      {/* Snowfall */}
      {snowflakes.map(flake => (
        <motion.div
          key={flake.id}
          className="absolute rounded-full"
          style={{
            left: `${flake.x}%`,
            top: '-2%',
            width: flake.size,
            height: flake.size,
            background: 'rgba(200,210,230,0.4)',
            boxShadow: '0 0 3px rgba(200,210,230,0.2)',
          }}
          animate={{
            y: ['-2vh', '105vh'],
            x: [0, flake.drift, flake.drift * 0.5],
            opacity: [0, 0.6, 0.4, 0],
          }}
          transition={{
            duration: flake.duration,
            delay: flake.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Streetlight glow in cold */}
      <div
        className="absolute"
        style={{
          top: '70%',
          left: '30%',
          width: 100,
          height: 60,
          background: 'radial-gradient(ellipse, rgba(200,200,220,0.04) 0%, transparent 70%)',
          filter: 'blur(4px)',
        }}
      />

      {/* Neon sign - dim winter */}
      <NeonSign
        text="ВХОД"
        x={60}
        y={18}
        color="#00ffff"
        fontSize={10}
        flickerSpeed={8}
      />
    </>
  );
});

// ============================================
// MEMORIAL PARK ATMOSPHERE
// ============================================

const MemorialParkAtmosphere = memo(function MemorialParkAtmosphere() {
  const fireflies = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
      size: 2 + Math.random() * 2,
      duration: 4 + Math.random() * 5,
      delay: Math.random() * 6,
    })),
  []);

  return (
    <>
      {/* Fog between trees - bottom */}
      <motion.div
        className="absolute bottom-0 left-[-10%] right-[-10%] h-[40%]"
        style={{
          background: 'linear-gradient(to top, rgba(100,140,100,0.08), rgba(80,120,80,0.04) 40%, transparent)',
          filter: 'blur(10px)',
        }}
        animate={{
          x: ['-2%', '2%', '-1%', '3%', '-2%'],
          opacity: [0.8, 1, 0.7, 0.9, 0.8],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Second fog layer */}
      <motion.div
        className="absolute bottom-[-5%] left-[-15%] right-[-15%] h-[30%]"
        style={{
          background: 'linear-gradient(to top, rgba(80,120,80,0.06), transparent 60%)',
          filter: 'blur(15px)',
        }}
        animate={{
          x: ['3%', '-3%', '2%', '-1%', '3%'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Moonlight shaft from top-right */}
      <div
        className="absolute top-0 right-[10%] w-[25%] h-[70%]"
        style={{
          background: 'linear-gradient(160deg, rgba(180,200,220,0.04) 0%, rgba(180,200,220,0.02) 30%, transparent 60%)',
          clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0% 100%)',
        }}
      />

      {/* Firefly particles */}
      {fireflies.map(ff => (
        <motion.div
          key={ff.id}
          className="absolute rounded-full"
          style={{
            left: `${ff.x}%`,
            top: `${ff.y}%`,
            width: ff.size,
            height: ff.size,
            background: 'radial-gradient(circle, rgba(150,255,100,0.5) 0%, rgba(150,255,100,0.1) 50%, transparent 70%)',
            boxShadow: '0 0 4px rgba(150,255,100,0.3)',
          }}
          animate={{
            opacity: [0, 0.8, 0.3, 0.7, 0],
            x: [0, 8, -5, 3, 0],
            y: [0, -5, 3, -8, 0],
          }}
          transition={{
            duration: ff.duration,
            delay: ff.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
});

// ============================================
// ROOFTOP NIGHT ATMOSPHERE
// ============================================

const RooftopNightAtmosphere = memo(function RooftopNightAtmosphere() {
  const lite = useMobileVisualPerf();
  const stars = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 45,
      size: 0.5 + Math.random() * 1.5,
      duration: 2 + Math.random() * 4,
      delay: Math.random() * 5,
    })),
  []);

  const cityLights = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 8,
      duration: 3 + Math.random() * 4,
      color: i % 3 === 0 ? 'rgba(255,200,50,0.4)' : i % 3 === 1 ? 'rgba(0,255,255,0.3)' : 'rgba(255,0,255,0.25)',
    })),
  []);

  const windParticles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      y: 20 + Math.random() * 60,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 6,
      width: 15 + Math.random() * 25,
    })),
  []);

  return (
    <>
      {!lite && (
        <RainCanvasLayer intensity={0.38} color="rgba(170,190,220,0.2)" className="absolute inset-0" />
      )}

      {/* Stars */}
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            background: 'rgba(220,230,255,0.7)',
            boxShadow: '0 0 3px rgba(220,230,255,0.4)',
          }}
          animate={{
            opacity: [0.3, 1, 0.5, 0.8, 0.3],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* City lights below horizon */}
      <div className="absolute bottom-[8%] left-0 right-0 h-[20%]">
        {cityLights.map(light => (
          <motion.div
            key={light.id}
            className="absolute rounded-full"
            style={{
              left: `${light.x}%`,
              bottom: 0,
              width: light.size,
              height: light.size,
              background: light.color,
              boxShadow: `0 0 4px ${light.color}`,
            }}
            animate={{
              opacity: [0.3, 0.7, 0.4, 0.9, 0.3],
            }}
            transition={{
              duration: light.duration,
              delay: light.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        {/* City glow */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(245,158,11,0.04), transparent 60%)',
          }}
        />
      </div>

      {/* Distant neon reflections */}
      <div
        className="absolute bottom-[12%] left-[20%] w-[30%] h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,0,255,0.08), rgba(0,255,255,0.06), transparent)',
          filter: 'blur(2px)',
        }}
      />

      {/* Wind particles */}
      {windParticles.map(wp => (
        <motion.div
          key={wp.id}
          className="absolute h-[1px]"
          style={{
            top: `${wp.y}%`,
            left: '-5%',
            width: wp.width,
            background: 'linear-gradient(90deg, transparent, rgba(200,210,230,0.08), transparent)',
          }}
          animate={{
            x: ['-5vw', '110vw'],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: wp.duration,
            delay: wp.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </>
  );
});

// ============================================
// DREAM ATMOSPHERE
// ============================================

const DreamAtmosphere = memo(function DreamAtmosphere() {
  const poemFragments = useMemo(() => [
    '...тишина...',
    '...свет...',
    '...память...',
    '...звук...',
    '...тень...',
    '...дождь...',
    '...ветер...',
    '...сон...',
    '...нить...',
    '...пепел...',
  ], []);

  const fragments = useMemo(() =>
    poemFragments.map((text, i) => ({
      id: i,
      text,
      x: 5 + Math.random() * 85,
      y: 10 + Math.random() * 75,
      duration: 8 + Math.random() * 8,
      delay: Math.random() * 12,
      rotation: -15 + Math.random() * 30,
    })),
  [poemFragments]);

  const purpleParticles = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 5 + Math.random() * 7,
      delay: Math.random() * 8,
    })),
  []);

  return (
    <>
      {/* Swirling purple overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 40% 50%, rgba(168,85,247,0.06) 0%, transparent 50%)',
        }}
        animate={{
          background: [
            'radial-gradient(ellipse at 40% 50%, rgba(168,85,247,0.06) 0%, transparent 50%)',
            'radial-gradient(ellipse at 60% 40%, rgba(168,85,247,0.08) 0%, transparent 50%)',
            'radial-gradient(ellipse at 35% 60%, rgba(168,85,247,0.05) 0%, transparent 50%)',
            'radial-gradient(ellipse at 40% 50%, rgba(168,85,247,0.06) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Reality glitch - periodic horizontal tear */}
      <motion.div
        className="absolute left-0 right-0 h-[2px]"
        style={{
          top: '40%',
          background: 'linear-gradient(90deg, transparent 10%, rgba(168,85,247,0.15) 30%, rgba(255,0,255,0.1) 50%, rgba(168,85,247,0.15) 70%, transparent 90%)',
        }}
        animate={{
          top: ['30%', '50%', '35%', '45%', '30%'],
          opacity: [0, 0.8, 0, 0.6, 0],
          scaleX: [0.5, 1.2, 0.8, 1.1, 0.5],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 4 }}
      />

      {/* Second glitch line */}
      <motion.div
        className="absolute left-0 right-0 h-[1px]"
        style={{
          top: '65%',
          background: 'linear-gradient(90deg, transparent 20%, rgba(0,255,255,0.1) 45%, rgba(168,85,247,0.08) 55%, transparent 80%)',
        }}
        animate={{
          top: ['60%', '70%', '55%', '65%', '60%'],
          opacity: [0, 0.5, 0, 0.7, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 5, delay: 2 }}
      />

      {/* Floating holographic text fragments */}
      <FloatingHolographicFragments fragments={fragments} />

      {/* Swirling purple particles */}
      {purpleParticles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(255,0,255,0.1) 50%, transparent 70%)',
            boxShadow: '0 0 6px rgba(168,85,247,0.2)',
          }}
          animate={{
            x: [0, 20, -15, 10, 0],
            y: [0, -15, 10, -20, 0],
            opacity: [0, 0.6, 0.3, 0.5, 0],
            scale: [0.5, 1, 0.8, 1.2, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Distant voices indicator - subtle wave */}
      <div className="absolute bottom-[15%] left-[10%] flex gap-[3px] items-end">
        {[0.3, 0.6, 1, 0.8, 0.5, 0.7, 0.4].map((h, i) => (
          <motion.div
            key={i}
            style={{
              width: 2,
              height: 8,
              background: 'rgba(168,85,247,0.12)',
              borderRadius: 1,
            }}
            animate={{
              scaleY: [h * 0.3, h, h * 0.5, h * 0.8, h * 0.3],
            }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Dream haze overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(168,85,247,0.02) 0%, rgba(255,0,255,0.01) 50%, rgba(168,85,247,0.03) 100%)',
        }}
      />
    </>
  );
});

// ============================================
// BATTLE ATMOSPHERE
// ============================================

const BattleAtmosphere = memo(function BattleAtmosphere() {
  const sparks = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 0.5 + Math.random() * 1.5,
      delay: Math.random() * 6,
    })),
  []);

  const smokePuffs = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 40 + Math.random() * 40,
      size: 30 + Math.random() * 50,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 8,
    })),
  []);

  return (
    <>
      {/* Red warning flashes */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(220,38,38,0.03)' }}
        animate={{
          opacity: [0, 0.3, 0, 0.15, 0],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Intense red flash */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(220,38,38,0.08)' }}
        animate={{
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatDelay: 4,
          ease: 'easeOut',
        }}
      />

      {/* Sparks */}
      {sparks.map(spark => (
        <motion.div
          key={spark.id}
          className="absolute rounded-full"
          style={{
            left: `${spark.x}%`,
            top: `${spark.y}%`,
            width: spark.size,
            height: spark.size,
            background: 'radial-gradient(circle, rgba(255,200,50,0.8) 0%, rgba(255,100,0,0.4) 50%, transparent 70%)',
            boxShadow: '0 0 4px rgba(255,200,50,0.5)',
          }}
          animate={{
            y: [0, -20, -40],
            x: [0, 5 + Math.random() * 10, 10 + Math.random() * 20],
            opacity: [0.8, 0.4, 0],
            scale: [1, 0.5, 0],
          }}
          transition={{
            duration: spark.duration,
            delay: spark.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Smoke particles */}
      {smokePuffs.map(smoke => (
        <motion.div
          key={smoke.id}
          className="absolute rounded-full"
          style={{
            left: `${smoke.x}%`,
            top: `${smoke.y}%`,
            width: smoke.size,
            height: smoke.size,
            background: 'radial-gradient(circle, rgba(80,80,80,0.06) 0%, rgba(60,60,60,0.03) 50%, transparent 70%)',
            filter: 'blur(6px)',
          }}
          animate={{
            y: [0, -30, -60],
            x: [0, 10, -5],
            opacity: [0, 0.4, 0],
            scale: [1, 1.5, 2],
          }}
          transition={{
            duration: smoke.duration,
            delay: smoke.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Red scanline */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(220,38,38,0.015) 3px, rgba(220,38,38,0.015) 6px)',
        }}
      />
    </>
  );
});

// ============================================
// SERVER ROOM ATMOSPHERE
// ============================================

const ServerRoomAtmosphere = memo(function ServerRoomAtmosphere() {
  const terminalLines = useMemo(() => [
    '> ssh root@node-7',
    '> Authentication OK',
    '> sysctl -w net.ipv4.forward=1',
    '> docker ps -a | grep api',
    '> api_server    Up 3 days   0.0.0.0:8080',
    '> tail -f /var/log/syslog',
    '> [UFW BLOCK] SRC=10.0.0.42',
    '> ping gateway -c 4',
    '> 64 bytes: icmp_seq=1 ttl=64',
    '> systemctl status nginx',
    '> active (running) since Mon',
    '> crontab -l | head -5',
  ], []);

  const leds = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 65 + (i % 6) * 4.5,
      y: 10 + Math.floor(i / 6) * 22,
      delay: Math.random() * 2,
      duration: 0.5 + Math.random() * 3,
      color: i % 4 === 0 ? '#ff8c00' : '#00ff41',
    })),
  []);

  return (
    <>
      {/* Terminal window overlay */}
      <TerminalWindowOverlay
        lines={terminalLines}
        x={3}
        y={15}
        width={200}
        height={200}
        borderColor="rgba(0,255,41,0.2)"
        textColor="rgba(0,255,41,0.35)"
        headerText="ROOT@SERVER-7"
      />

      {/* LED indicators - server rack */}
      {leds.map(led => (
        <motion.div
          key={led.id}
          className="absolute rounded-full"
          style={{
            left: `${led.x}%`,
            top: `${led.y}%`,
            width: 3,
            height: 3,
            background: led.color,
            boxShadow: `0 0 3px ${led.color}, 0 0 6px ${led.color}`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
          }}
          transition={{
            duration: led.duration,
            delay: led.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Server rack vertical lines */}
      {[68, 73, 78, 83].map((x, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${x}%`,
            top: '8%',
            width: 1,
            height: '80%',
            background: 'linear-gradient(180deg, rgba(0,255,41,0.04), rgba(0,255,41,0.02), rgba(0,255,41,0.04))',
          }}
        />
      ))}

      {/* Green ambient glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 75% 40%, rgba(0,255,41,0.04) 0%, transparent 50%)',
        }}
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* CRT scanlines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,41,0.01) 2px, rgba(0,255,41,0.01) 4px)',
        }}
      />
    </>
  );
});

// ============================================
// UNDERGROUND CLUB ATMOSPHERE
// ============================================

const UndergroundClubAtmosphere = memo(function UndergroundClubAtmosphere() {
  const neonBars = useMemo(() => [
    { x: 5, y: 30, width: 3, height: 120, color: '#ff00ff' },
    { x: 92, y: 20, width: 3, height: 150, color: '#00ffff' },
    { x: 15, y: 60, width: 3, height: 80, color: '#ff00ff' },
    { x: 85, y: 50, width: 3, height: 100, color: '#ff8c00' },
  ], []);

  const smokeClouds = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 50 + Math.random() * 30,
      size: 50 + Math.random() * 80,
      duration: 6 + Math.random() * 6,
      delay: Math.random() * 8,
    })),
  []);

  return (
    <>
      {/* Pulsing neon bars */}
      {neonBars.map((bar, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${bar.x}%`,
            top: `${bar.y}px`,
            width: bar.width,
            height: bar.height,
            background: bar.color,
            boxShadow: `0 0 10px ${bar.color}, 0 0 20px ${bar.color}, 0 0 40px ${bar.color}40`,
            opacity: 0.15,
          }}
          animate={{
            opacity: [0.08, 0.2, 0.08],
            scaleX: [1, 1.3, 1],
          }}
          transition={{
            duration: 1 + i * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Strobe light effect */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(255,255,255,0.02)' }}
        animate={{
          opacity: [0, 0, 0, 0.3, 0, 0, 0, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Second strobe - different timing */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(255,0,255,0.04) 0%, transparent 60%)',
        }}
        animate={{
          opacity: [0, 0, 0.4, 0, 0, 0.2, 0, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
          delay: 1.5,
        }}
      />

      {/* Smoke machine clouds */}
      {smokeClouds.map(smoke => (
        <motion.div
          key={smoke.id}
          className="absolute rounded-full"
          style={{
            left: `${smoke.x}%`,
            top: `${smoke.y}%`,
            width: smoke.size,
            height: smoke.size * 0.5,
            background: 'radial-gradient(ellipse, rgba(100,100,120,0.04) 0%, transparent 70%)',
            filter: 'blur(10px)',
          }}
          animate={{
            x: [-20, 20, -10, 15, -20],
            y: [0, -10, -5, -15, 0],
            opacity: [0, 0.3, 0.2, 0.35, 0],
            scale: [0.8, 1.2, 1, 1.3, 0.8],
          }}
          transition={{
            duration: smoke.duration,
            delay: smoke.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Dance floor glow */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[25%]"
        style={{
          background: 'linear-gradient(to top, rgba(255,0,255,0.03), transparent)',
        }}
        animate={{
          background: [
            'linear-gradient(to top, rgba(255,0,255,0.03), transparent)',
            'linear-gradient(to top, rgba(0,255,255,0.03), transparent)',
            'linear-gradient(to top, rgba(255,140,0,0.03), transparent)',
            'linear-gradient(to top, rgba(255,0,255,0.03), transparent)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  );
});

// ============================================
// GENERIC CYBERPUNK ATMOSPHERE
// ============================================

const GenericAtmosphere = memo(function GenericAtmosphere() {
  const particles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 6,
    })),
  []);

  return (
    <>
      {/* Subtle scanlines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,255,0.008) 3px, rgba(0,255,255,0.008) 6px)',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.15) 100%)',
        }}
      />

      {/* Subtle floating particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, rgba(0,255,255,0.15) 0%, transparent 70%)',
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Cyber scan sweep */}
      <motion.div
        className="absolute left-0 right-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent 10%, rgba(0,255,255,0.06) 30%, rgba(0,255,255,0.1) 50%, rgba(0,255,255,0.06) 70%, transparent 90%)',
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </>
  );
});

// ============================================
// NEON SIGN COMPONENT
// ============================================

interface NeonSignProps {
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize?: number;
  flickerSpeed?: number;
}

const NeonSign = memo(function NeonSign({ text, x, y, color, fontSize = 14, flickerSpeed = 5 }: NeonSignProps) {
  // Parse color for opacity variants
  const glowShadow = useMemo(() => {
    return `0 0 7px ${color}, 0 0 14px ${color}, 0 0 28px ${color}80, 0 0 50px ${color}40`;
  }, [color]);

  const dimShadow = useMemo(() => {
    return `0 0 2px ${color}80, 0 0 5px ${color}40`;
  }, [color]);

  return (
    <motion.div
      className="absolute select-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        fontFamily: 'var(--font-geist-mono), monospace',
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.15em',
        color,
      }}
      animate={{
        textShadow: [glowShadow, dimShadow, glowShadow, dimShadow, glowShadow],
        opacity: [1, 0.7, 1, 0.85, 1],
      }}
      transition={{
        duration: flickerSpeed,
        repeat: Infinity,
        ease: 'easeInOut',
        times: [0, 0.15, 0.16, 0.7, 1],
      }}
    >
      {text}
    </motion.div>
  );
});

// ============================================
// FLOATING HOLOGRAPHIC FRAGMENTS
// ============================================

interface FloatingFragment {
  id: number;
  text: string;
  x: number;
  y: number;
  duration: number;
  delay: number;
  rotation: number;
}

const FloatingHolographicFragments = memo(function FloatingHolographicFragments({
  fragments,
}: {
  fragments: FloatingFragment[];
}) {
  return (
    <>
      {fragments.map(frag => (
        <motion.div
          key={frag.id}
          className="absolute select-none"
          style={{
            left: `${frag.x}%`,
            top: `${frag.y}%`,
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: 10,
            color: 'rgba(168,85,247,0.2)',
            fontStyle: 'italic',
          }}
          animate={{
            y: [0, -25, 10, -15, 0],
            x: [0, 10, -8, 5, 0],
            opacity: [0, 0.5, 0.2, 0.4, 0],
            rotate: [frag.rotation, frag.rotation + 2, frag.rotation - 1, frag.rotation],
          }}
          transition={{
            duration: frag.duration,
            delay: frag.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {frag.text}
        </motion.div>
      ))}
    </>
  );
});

// ============================================
// TERMINAL WINDOW OVERLAY
// ============================================

interface TerminalWindowOverlayProps {
  lines: string[];
  x: number; // percentage from left (negative = from right)
  y: number; // px from top
  width: number;
  height: number;
  borderColor: string;
  textColor: string;
  headerText: string;
  align?: 'left' | 'right';
}

const TerminalWindowOverlay = memo(function TerminalWindowOverlay({
  lines,
  x,
  y,
  width,
  height,
  borderColor,
  textColor,
  headerText,
  align = 'left',
}: TerminalWindowOverlayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // scrollOffset was unused; removed broken useRef(0).current destructuring that caused TypeError

  // Auto-scroll effect
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      if (container.scrollTop < container.scrollHeight - container.clientHeight) {
        container.scrollTop += 1;
      } else {
        container.scrollTop = 0;
      }
    }, 120);

    return () => clearInterval(interval);
  }, []);

  const positionStyle = align === 'right'
    ? { right: `${Math.abs(x)}%`, top: y }
    : { left: `${x}%`, top: y };

  // Duplicate lines for continuous scroll
  const displayLines = useMemo(() => [...lines, ...lines], [lines]);

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        ...positionStyle,
        width,
        height,
        border: `1px solid ${borderColor}`,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(2px)',
        clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-1 px-2 py-1"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <div className="flex gap-1">
          <div className="w-[5px] h-[5px] rounded-full bg-red-500/40" />
          <div className="w-[5px] h-[5px] rounded-full bg-yellow-500/40" />
          <div className="w-[5px] h-[5px] rounded-full bg-green-500/40" />
        </div>
        <span
          className="text-[8px] ml-2 uppercase tracking-wider"
          style={{ color: textColor, fontFamily: 'var(--font-geist-mono), monospace' }}
        >
          {headerText}
        </span>
      </div>

      {/* Scrolling content */}
      <div
        ref={scrollRef}
        className="overflow-hidden px-2 py-1"
        style={{ height: height - 24 }}
      >
        {displayLines.map((line, i) => (
          <div
            key={i}
            className="text-[8px] leading-[12px] whitespace-nowrap"
            style={{
              color: textColor,
              fontFamily: 'var(--font-geist-mono), monospace',
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
});
