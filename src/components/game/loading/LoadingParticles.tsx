/* ─── Volodka RPG – Loading Screen Particle Background ─── *
 * CSS-only floating particles with cyberpunk aesthetic.
 * Zero JS runtime cost — pure CSS keyframes.
 * Renders ~30 small dots drifting upward with fade.
 */

import { memo } from 'react';

const PARTICLE_COUNT = 24;

/** Deterministic pseudo-random for consistent particle positions */
function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return Math.abs(s) / 2147483647;
  };
}

const LoadingParticles = memo(function LoadingParticles() {
  const rand = createRng(0xcafe_beef);

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const left = rand() * 100;
    const delay = rand() * 12;
    const duration = 8 + rand() * 10;
    const size = 1 + rand() * 2;
    const opacity = 0.08 + rand() * 0.15;
    const hue = rand() > 0.7 ? '180' : rand() > 0.4 ? '45' : '160';

    return (
      <div
        key={i}
        className="loading-particle"
        style={{
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          opacity,
          '--loading-particle-duration': `${duration}s`,
          '--loading-particle-delay': `${delay}s`,
          '--loading-particle-hue': `${hue}`,
        } as React.CSSProperties}
      />
    );
  });

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 3 }}
      aria-hidden="true"
    >
      {particles}
    </div>
  );
});

export { LoadingParticles };
