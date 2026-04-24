'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SceneId } from '@/data/types';
import { hashSceneId } from './hashSceneId';

export const GlobalNeoNoirLayer = memo(function GlobalNeoNoirLayer({ sceneId }: { sceneId: SceneId }) {
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
