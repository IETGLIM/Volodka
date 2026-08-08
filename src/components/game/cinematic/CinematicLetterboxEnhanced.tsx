/* ─── Volodka RPG – Enhanced Cinematic Letterbox ───
   Upgraded letterbox bars with:
   - Subtle CSS-only noise texture on bars
   - Smooth eased transitions (not linear)
   - Optional gradient edges (fade from black)
   - Support for "thin" (widescreen) and "thick" (full cinematic)
   - Ambient particle overlay (dust motes / embers / code rain)
   - Subtle vignette overlay during cutscenes
*/

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/* ══════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════ */

export type LetterboxVariant = 'thin' | 'thick' | 'none';
export type ParticleStyle = 'dust_motes' | 'embers' | 'code_rain' | 'none';

export interface CinematicLetterboxEnhancedProps {
  /** Bar thickness: thin = widescreen, thick = full cinematic */
  variant?: LetterboxVariant;
  /** Particle overlay style during letterbox */
  particleStyle?: ParticleStyle;
  /** Accent color for particles and glow effects */
  accentColor?: string;
  /** Whether letterbox bars should use gradient edge fade */
  gradientEdges?: boolean;
  /** Show subtle vignette overlay */
  showVignette?: boolean;
  /** External visibility control — when false, bars animate out */
  visible?: boolean;
}

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════ */

/** Eased cubic-bezier for cinematic letterbox appearance */
const LETTERBOX_EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/** Noise texture — tiny SVG data URI for film grain on bars */
const NOISE_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

/** Bar height classes */
const BAR_HEIGHTS: Record<'thin' | 'thick', string> = {
  thin: 'h-[4dvh] min-h-[16px]',
  thick: 'h-[8dvh] min-h-[32px]',
};

/* ══════════════════════════════════════════════════════════════
   SEEDED RANDOM — deterministic particle positions
   ══════════════════════════════════════════════════════════════ */

const seededRand = (seed: number): number => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  const fract = x - Math.floor(x);
  return Number.isFinite(fract) ? fract : 0;
};

interface Particle {
  id: number;
  x: string;
  delay: string;
  duration: string;
  size: string;
  drift: string;
  opacity: string;
  char?: string;
}

/* ══════════════════════════════════════════════════════════════
   AMBIENT PARTICLES
   ══════════════════════════════════════════════════════════════ */

const CODE_RAIN_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

const AmbientParticles = memo(function AmbientParticles({
  style,
  accentColor,
  count = 16,
}: {
  style: Exclude<ParticleStyle, 'none'>;
  accentColor: string;
  count?: number;
}) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const x = (seededRand(i) * 100).toFixed(2);
      const delay = (seededRand(i + 100) * 10).toFixed(2);
      const duration = (style === 'code_rain'
        ? 2 + seededRand(i + 200) * 3
        : 4 + seededRand(i + 200) * 6
      ).toFixed(2);
      const size = (style === 'code_rain'
        ? 8 + seededRand(i + 300) * 6
        : 1 + seededRand(i + 300) * 2.5
      ).toFixed(1);
      const drift = ((seededRand(i + 400) - 0.5) * 30).toFixed(1);
      const opacity = (0.2 + seededRand(i + 500) * 0.4).toFixed(2);
      const char = style === 'code_rain'
        ? CODE_RAIN_CHARS[Math.floor(seededRand(i + 600) * CODE_RAIN_CHARS.length)]
        : undefined;
      return { id: i, x, delay, duration, size, drift, opacity, char };
    });
  }, [count, style]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            color: accentColor,
            fontSize: style === 'code_rain' ? `${p.size}px` : undefined,
            fontFamily: style === 'code_rain' ? 'monospace' : undefined,
            opacity: 0,
            animation: style === 'code_rain'
              ? `code-rain-fall ${p.duration}s linear infinite`
              : `cinematic-ember ${p.duration}s ease-out infinite`,
            animationDelay: `${p.delay}s`,
            '--ember-drift': `${p.drift}px`,
            ...(style !== 'code_rain'
              ? {
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  borderRadius: '50%',
                  background: accentColor,
                  boxShadow: style === 'embers'
                    ? `0 0 ${parseFloat(p.size) * 3}px ${accentColor}, 0 0 ${parseFloat(p.size) * 6}px ${accentColor}40`
                    : `0 0 ${parseFloat(p.size) * 2}px ${accentColor}60`,
                  bottom: '-5px',
                  top: 'auto',
                }
              : {}),
          } as React.CSSProperties}
          aria-hidden="true"
        >
          {p.char}
        </div>
      ))}
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   VIGNETTE OVERLAY
   ══════════════════════════════════════════════════════════════ */

const CinematicVignette = memo(function CinematicVignette({
  accentColor,
  intensity = 0.4,
}: {
  accentColor?: string;
  intensity?: number;
}) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 10,
        background: `radial-gradient(
          ellipse at center,
          transparent 40%,
          rgba(0, 0, 0, ${intensity}) 80%,
          rgba(0, 0, 0, ${intensity + 0.2}) 100%
        )${
          accentColor
            ? `, radial-gradient(ellipse at center, transparent 60%, ${accentColor}08 100%)`
            : ''
        }`,
      }}
      aria-hidden="true"
    />
  );
});

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */

export const CinematicLetterboxEnhanced = memo(
  function CinematicLetterboxEnhanced({
    variant = 'thick',
    particleStyle = 'none',
    accentColor = 'var(--cyber-cyan)',
    gradientEdges = true,
    showVignette = false,
    visible = true,
  }: CinematicLetterboxEnhancedProps) {
    const reducedMotion = useEffectiveReducedMotion();

    if (variant === 'none') return null;

    const h = BAR_HEIGHTS[variant];
    const duration = reducedMotion ? 0 : 0.9;
    const initial = reducedMotion
      ? { scaleY: 1 }
      : { scaleY: visible ? 1 : 0 };
    const animate = { scaleY: visible ? 1 : 0 };

    const topGradient = gradientEdges
      ? 'linear-gradient(180deg, #000 0%, #050810 65%, rgba(10, 20, 32, 0) 100%)'
      : 'linear-gradient(180deg, #000 0%, #050810 70%, #0a1420 100%)';
    const bottomGradient = gradientEdges
      ? 'linear-gradient(0deg, #000 0%, #050810 65%, rgba(10, 20, 32, 0) 100%)'
      : 'linear-gradient(0deg, #000 0%, #050810 70%, #0a1420 100%)';

    const barBaseStyle: React.CSSProperties = {
      zIndex: 12,
      backgroundImage: `${NOISE_TEXTURE}, ${topGradient}`,
      backgroundSize: '256px 256px, 100% 100%',
      boxShadow: 'inset 0 -1px 0 rgba(0, 255, 200, 0.06)',
    };

    return (
      <>
        {/* Top letterbox bar */}
        <motion.div
          className={`absolute top-0 left-0 right-0 ${h} pointer-events-none hud-filmic-letterbox-gradient`}
          style={{
            ...barBaseStyle,
            backgroundImage: `${NOISE_TEXTURE}, ${topGradient}`,
            transformOrigin: 'top',
          }}
          initial={initial}
          animate={animate}
          transition={{ duration, ease: LETTERBOX_EASE }}
          aria-hidden="true"
        />

        {/* Bottom letterbox bar */}
        <motion.div
          className={`absolute bottom-0 left-0 right-0 ${h} pointer-events-none hud-filmic-letterbox-gradient`}
          style={{
            ...barBaseStyle,
            backgroundImage: `${NOISE_TEXTURE}, ${bottomGradient}`,
            boxShadow: 'inset 0 1px 0 rgba(0, 255, 200, 0.06)',
            transformOrigin: 'bottom',
          }}
          initial={initial}
          animate={animate}
          transition={{ duration, ease: LETTERBOX_EASE }}
          aria-hidden="true"
        />

        {/* Ambient particles */}
        {particleStyle !== 'none' && visible && (
          <AmbientParticles
            style={particleStyle}
            accentColor={accentColor}
            count={particleStyle === 'code_rain' ? 24 : 14}
          />
        )}

        {/* Vignette */}
        {showVignette && visible && (
          <CinematicVignette accentColor={accentColor} />
        )}
      </>
    );
  },
);
