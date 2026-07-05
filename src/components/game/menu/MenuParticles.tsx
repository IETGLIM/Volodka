import { memo, useEffect, useMemo, useState } from 'react';
import { seededRand } from '@/shared/utils/seededRand';

type ParticleCounts = {
  drift: number;
  stream: number;
};

type MenuParticlesProps = {
  counts: ParticleCounts;
};

export const MenuParticles = memo(function MenuParticles({ counts }: MenuParticlesProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => {
    const items: Array<{
      id: string;
      x: string;
      y: string;
      size: string;
      color: string;
      opacity: number;
      delay: string;
      duration: string;
      boxShadow: string;
      type: 'drift' | 'stream';
    }> = [];

    for (let i = 0; i < counts.drift; i++) {
      const color =
        i % 3 === 0
          ? 'rgb(var(--cyber-cyan-rgb) / 0.7)'
          : i % 3 === 1
            ? 'rgba(255, 171, 0, 0.6)'
            : 'rgba(255, 255, 255, 0.5)';
      const size = 1 + seededRand(i * 3 + 500) * 2;
      items.push({
        id: `md${i}`,
        x: (seededRand(i * 7 + 300) * 100).toFixed(2),
        y: (seededRand(i * 11 + 400) * 100).toFixed(2),
        size: size.toFixed(1),
        color,
        opacity: +(0.2 + seededRand(i * 5 + 600) * 0.3).toFixed(3),
        delay: (seededRand(i * 13 + 700) * 6).toFixed(2),
        duration: (8 + seededRand(i * 9 + 800) * 12).toFixed(1),
        boxShadow: `0 0 ${(size * 2).toFixed(1)}px ${color}`,
        type: 'drift',
      });
    }

    for (let i = 0; i < counts.stream; i++) {
      const size = 1 + seededRand(i * 19 + 1000) * 1.5;
      const color = 'rgb(var(--cyber-cyan-rgb) / 0.5)';
      items.push({
        id: `ms${i}`,
        x: (seededRand(i * 17 + 900) * 100).toFixed(2),
        y: '0',
        size: size.toFixed(1),
        color,
        opacity: +(0.15 + seededRand(i * 23 + 1100) * 0.15).toFixed(3),
        delay: (seededRand(i * 29 + 1200) * 10).toFixed(2),
        duration: (6 + seededRand(i * 31 + 1300) * 8).toFixed(1),
        boxShadow: `0 0 ${(size * 2).toFixed(1)}px ${color}`,
        type: 'stream',
      });
    }

    return items;
  }, [counts.drift, counts.stream]);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${p.type === 'stream' ? 'menu-particle-stream' : 'menu-particle-drift'}`}
          style={{
            left: `${p.x}%`,
            top: p.type === 'stream' ? `${p.y}` : `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            boxShadow: p.boxShadow,
            animation: `${p.type === 'stream' ? 'menu-particle-stream' : 'menu-particle-drift'} ${p.duration}s ${p.type === 'stream' ? 'linear' : 'ease-in-out'} infinite`,
            animationDelay: `${p.delay}s`,
            ['--mp-opacity' as string]: p.opacity,
          }}
        />
      ))}
    </div>
  );
});
