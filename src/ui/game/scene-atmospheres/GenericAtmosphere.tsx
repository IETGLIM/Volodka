'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

export const GenericAtmosphere = memo(function GenericAtmosphere() {
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
