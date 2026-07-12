import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { ParticleSpec } from '@/engine/levelUp/levelUpPresentation';

type LevelUpParticlesProps = {
  particles: ParticleSpec[];
};

const PARTICLE_COLORS = {
  gold: {
    background: 'rgba(251,191,36,0.9)',
    boxShadow: '0 0 6px rgba(251,191,36,0.6)',
  },
  cyan: {
    background: 'rgb(var(--cyber-cyan-rgb) / 0.8)',
    boxShadow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.5)',
  },
} as const;

export function LevelUpParticles({ particles }: LevelUpParticlesProps) {
  const specs = useMemo(() => particles, [particles]);

  if (specs.length === 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {specs.map((particle) => {
        const colors = PARTICLE_COLORS[particle.variant];
        const radians = (particle.angle * Math.PI) / 180;
        return (
          <motion.div
            key={particle.id}
            className="absolute rounded-full will-change-transform"
            style={{
              width: particle.size,
              height: particle.size,
              background: colors.background,
              boxShadow: colors.boxShadow,
              willChange: 'transform, opacity',
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: Math.cos(radians) * particle.distance,
              y: Math.sin(radians) * particle.distance,
              opacity: 0,
              scale: 0.3,
            }}
            transition={{
              duration: 1.2,
              delay: particle.delay,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
}
