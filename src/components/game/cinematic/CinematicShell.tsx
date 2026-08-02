import { memo, useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { CinematicNarrativePresentation } from './cinematicNarrativeStyles';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const LETTERBOX_GRADIENT =
  'linear-gradient(180deg, #000 0%, #050810 70%, #0a1420 100%)';

const seededRand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  const fract = x - Math.floor(x);
  return Number.isFinite(fract) ? fract : 0;
};

export const CinematicEmbers = memo(function CinematicEmbers({
  count = 12,
  accentColor,
}: {
  count?: number;
  accentColor: string;
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (seededRand(i) * 100).toFixed(2),
        delay: (seededRand(i + 100) * 8).toFixed(2),
        duration: (4 + seededRand(i + 200) * 6).toFixed(2),
        size: (1 + seededRand(i + 300) * 2).toFixed(1),
        drift: ((seededRand(i + 400) - 0.5) * 30).toFixed(1),
      })),
    [count],
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: '-5px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: accentColor,
            boxShadow: `0 0 ${parseFloat(p.size) * 3}px ${accentColor}`,
            opacity: 0,
            animation: `cinematic-ember ${p.duration}s ease-out infinite`,
            animationDelay: `${p.delay}s`,
            '--ember-drift': `${p.drift}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
});

export const CinematicLetterboxBars = memo(function CinematicLetterboxBars({
  style,
}: {
  style: CinematicNarrativePresentation['letterboxStyle'];
}) {
  const reducedMotion = useEffectiveReducedMotion();
  if (style === 'none') return null;
  const h = style === 'full' ? 'h-[8dvh] min-h-[32px]' : 'h-[4dvh] min-h-[16px]';
  const barStyle: React.CSSProperties = {
    zIndex: 12,
    background: LETTERBOX_GRADIENT,
    boxShadow: 'inset 0 -1px 0 rgba(0, 255, 200, 0.06)',
  };
  // Reduced motion: snap bars to final state instantly (no scaleY animation).
  const duration = reducedMotion ? 0 : 0.7;
  const initial = reducedMotion ? { scaleY: 1 } : { scaleY: 0 };
  return (
    <>
      <motion.div
        className={`absolute top-0 left-0 right-0 ${h} pointer-events-none hud-filmic-letterbox-gradient`}
        style={{ ...barStyle, transformOrigin: 'top' }}
        initial={initial}
        animate={{ scaleY: 1 }}
        transition={{ duration, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
      <motion.div
        className={`absolute bottom-0 left-0 right-0 ${h} pointer-events-none hud-filmic-letterbox-gradient`}
        style={{
          ...barStyle,
          background: 'linear-gradient(0deg, #000 0%, #050810 70%, #0a1420 100%)',
          boxShadow: 'inset 0 1px 0 rgba(0, 255, 200, 0.06)',
          transformOrigin: 'bottom',
        }}
        initial={initial}
        animate={{ scaleY: 1 }}
        transition={{ duration, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </>
  );
});

export function CinematicBackdrop({
  variant = 'default',
}: {
  variant?: 'default' | 'revelation' | 'transition';
}) {
  const background =
    variant === 'revelation'
      ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.88) 82%)'
      : variant === 'transition'
        ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.92) 85%)'
        : 'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.78) 85%)';

  return <div className="absolute inset-0" style={{ background }} />;
}

export function CinematicAmbientGlow({ accentColor }: { accentColor: string }) {
  const reducedMotion = useEffectiveReducedMotion();
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: '420px',
        height: '420px',
        borderRadius: '50%',
        background: `radial-gradient(ellipse at center, ${accentColor}18 0%, transparent 70%)`,
        filter: 'blur(60px)',
      }}
      initial={reducedMotion ? { opacity: 1, scale: 1.2 } : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1.2 }}
      transition={{ duration: reducedMotion ? 0 : 1.6, ease: 'easeOut' }}
    />
  );
}

export function CinematicGlitchScanlines({ intensity }: { intensity: number }) {
  if (intensity <= 0) return null;
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 11,
        opacity: intensity,
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
      }}
    />
  );
}

export interface CinematicShellProps {
  presentation: Pick<
    CinematicNarrativePresentation,
    'accentColor' | 'letterboxStyle' | 'showEmbers' | 'glitchIntensity' | 'type'
  >;
  backdropVariant?: 'default' | 'revelation' | 'transition';
  children?: ReactNode;
}

/** Shared AAA backdrop: vignette, letterbox, embers, glow. */
export function CinematicShell({
  presentation,
  backdropVariant = 'default',
  children,
}: CinematicShellProps) {
  const { accentColor, letterboxStyle, showEmbers, glitchIntensity, type } = presentation;

  return (
    <>
      <CinematicBackdrop
        variant={type === 'revelation' ? 'revelation' : backdropVariant}
      />
      <CinematicLetterboxBars style={letterboxStyle} />
      {showEmbers && (
        <CinematicEmbers accentColor={accentColor} count={type === 'revelation' ? 24 : 14} />
      )}
      <CinematicGlitchScanlines intensity={glitchIntensity} />
      <CinematicAmbientGlow accentColor={accentColor} />
      {children}
    </>
  );
}
