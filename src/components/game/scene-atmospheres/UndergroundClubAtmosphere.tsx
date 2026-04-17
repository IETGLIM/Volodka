'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

export const UndergroundClubAtmosphere = memo(function UndergroundClubAtmosphere() {
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
