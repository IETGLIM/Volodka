import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useLevelUpBannerTimer } from '@/components/game/microAnimations/useLevelUpBanner';
import {
  LEVEL_UP_FOOTER,
  LEVEL_UP_SUBTITLE,
} from '@/engine/microAnimations/microAnimationsConstants';
import {
  buildLevelUpAnnouncement,
  getLevelUpParticleCount,
} from '@/engine/microAnimations/microAnimationsPresentation';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export type LevelUpBannerProps = {
  level: number;
  visible: boolean;
  onHide?: () => void;
};

const LevelUpParticle = memo(function LevelUpParticle({
  delay,
  color,
  angle,
  distance,
}: {
  delay: number;
  color: string;
  angle: number;
  distance: number;
}) {
  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full"
      style={{
        background: color,
        left: '50%',
        top: '50%',
        boxShadow: `0 0 4px ${color}`,
        willChange: 'transform, opacity',
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        opacity: 0,
        scale: 0.2,
      }}
      transition={{ duration: 1.2, delay, ease: 'easeOut' }}
      aria-hidden="true"
    />
  );
});

function LevelUpBannerPanel({ level, visible, onHide }: LevelUpBannerProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const deviceTier = useDeviceTier();
  const { internalVisible, dismiss } = useLevelUpBannerTimer(visible, onHide, reducedMotion);

  const particleCount = getLevelUpParticleCount(deviceTier, reducedMotion);
  const particles = useMemo(() => {
    if (particleCount === 0) return [];
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
      const distance = 40 + Math.random() * 60;
      return {
        id: i,
        delay: 0.1 + i * 0.05,
        color: i % 2 === 0 ? '#fbbf24' : 'var(--cyber-cyan)',
        angle,
        distance,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [level, particleCount]);

  return (
    <AnimatePresence>
      {internalVisible ? (
        <motion.div
          role="alertdialog"
          aria-modal="true"
          aria-label={buildLevelUpAnnouncement(level)}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: reducedMotion ? 0.01 : 0.5 }}
          className="fixed top-1/4 left-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer"
          style={{ zIndex: UI_LAYERS.TOASTS + 5 }}
          onClick={dismiss}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              dismiss();
            }
          }}
          tabIndex={-1}
        >
          <span className="sr-only" aria-live="polite">
            {buildLevelUpAnnouncement(level)}. Нажмите Enter или пробел, чтобы закрыть.
          </span>

          <div
            className="relative flex flex-col items-center px-10 py-6 rounded-xl border backdrop-blur-md overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(0,0,0,0.9) 50%, rgba(251,191,36,0.1) 100%)',
              borderColor: 'rgba(251,191,36,0.5)',
              boxShadow: '0 0 50px rgba(251,191,36,0.2), 0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            {!reducedMotion && particles.length > 0 ? (
              <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                {particles.map((p) => (
                  <LevelUpParticle key={p.id} delay={p.delay} color={p.color} angle={p.angle} distance={p.distance} />
                ))}
              </div>
            ) : null}

            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/80 mb-1">
              {LEVEL_UP_SUBTITLE}
            </span>
            <div
              className="text-4xl font-black font-mono text-amber-300"
              style={{ textShadow: '0 0 20px rgba(251,191,36,0.6)' }}
            >
              {level}
            </div>
            <span className="text-xs font-mono text-amber-400/60 mt-1">{LEVEL_UP_FOOTER}</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function LevelUpBanner(props: LevelUpBannerProps) {
  return (
    <ErrorBoundary name="level-up-banner" fallback={null}>
      <LevelUpBannerPanel {...props} />
    </ErrorBoundary>
  );
}
