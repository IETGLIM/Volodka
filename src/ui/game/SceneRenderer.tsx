'use client';

/**
 * Визуальная оболочка сцен: фон, ASCII-слой, атмосферные оверлеи, виньетка, реакции на статы.
 *
 * Слои намеренно разделены: `AsciiCyberBackdrop` — «цифровая матрица» и силуэты; `SceneAtmosphere` и
 * `GlobalNeoNoirLayer` — дополнительный 2D-неон/горизонт в DOM. Это не дубль `RainCanvasLayer` из
 * 3D-слоя: дождь в уличных сценах подключается внутри соответствующих атмосфер как лёгкий canvas.
 *
 * Многие позиции заданы в % / px «на глаз» под текущий макет; при жёсткой адаптивности имеет смысл
 * вынести якоря в константы или `clamp()`.
 */

import { useMemo, memo, useRef, useCallback, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { sceneManager } from '@/engine/SceneManager';
import { useMobileVisualPerf } from '@/hooks/useMobileVisualPerf';
import { AsciiCyberBackdrop } from './AsciiCyberBackdrop';
import { SceneAtmosphere, GlobalNeoNoirLayer } from './scene-atmospheres';
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

// ============================================
// OFFICE FLUORESCENT (остаётся рядом с корнем сцены)
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

// ============================================
// CREATIVITY PARTICLES
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
    <div className="pointer-events-none absolute inset-0 z-5 overflow-hidden">
      {particles.map((p) => (
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
// MAIN SCENE RENDERER
// ============================================

export default function SceneRenderer({ sceneId, playerState }: SceneRendererProps) {
  const sceneConfig = useMemo(() => sceneManager.getSceneVisualConfig(sceneId), [sceneId]);
  const visualLite = useMobileVisualPerf();
  const reduceMotion = useReducedMotion();

  const visualEffects = useMemo(() => {
    const effects: string[] = [];

    if (playerState.stress > 70) effects.push('stress-high');
    if (playerState.stability < 30) effects.push('stability-low');
    if (playerState.creativity > 70) effects.push('creativity-high');
    if (playerState.panicMode) effects.push('panic-mode');
    if (playerState.mood < 20) effects.push('mood-low');

    return effects;
  }, [
    playerState.stress,
    playerState.stability,
    playerState.creativity,
    playerState.panicMode,
    playerState.mood,
  ]);

  const effectClasses = useMemo(() => {
    const classes: string[] = [];
    if (visualEffects.includes('stress-high')) classes.push('glitch-mild');
    if (visualEffects.includes('panic-mode')) classes.push('glitch-intense');
    return classes.join(' ');
  }, [visualEffects]);

  const overlayStyles = useMemo(() => {
    const styles: CSSProperties = {};

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
  }, [playerState.stress, playerState.creativity, playerState.stability]);

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

      {sceneConfig.overlay && <div className={`absolute inset-0 ${sceneConfig.overlay}`} />}

      {sceneConfig.extraClasses && <div className={`absolute inset-0 ${sceneConfig.extraClasses}`} />}

      <SceneAtmosphere sceneId={sceneId} />

      <GlobalNeoNoirLayer sceneId={sceneId} />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${0.3 + (playerState.stability < 30 ? 0.3 : 0)}) 100%)`,
        }}
      />

      {(playerState.stress > 70 || playerState.panicMode) && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,${playerState.panicMode ? 0.05 : 0.02}) 2px, rgba(0,255,255,${playerState.panicMode ? 0.05 : 0.02}) 4px)`,
            animation: playerState.panicMode ? 'glitch 0.2s infinite' : undefined,
          }}
        />
      )}

      {playerState.panicMode && <div className="pointer-events-none absolute inset-0 z-10 kernel-panic-overlay" />}

      {playerState.creativity > 70 && (
        <CreativityParticles intensity={(playerState.creativity - 70) / 30} />
      )}

      <motion.div
        className="absolute left-4 top-16 z-20"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <div
          className="border border-cyan-500/25 bg-black/45 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/80 backdrop-blur-sm"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.08), inset 0 0 24px rgba(0, 255, 255, 0.04)',
          }}
        >
          <span className="text-cyan-500/50">LOC //</span> <span className="text-slate-200/90">{sceneConfig.name}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
