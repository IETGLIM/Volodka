'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

export const BattleAtmosphere = memo(function BattleAtmosphere() {
  const sparks = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 0.5 + Math.random() * 1.5,
      delay: Math.random() * 6,
    })),
  []);

  const smokePuffs = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 40 + Math.random() * 40,
      size: 30 + Math.random() * 50,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 8,
    })),
  []);

  return (
    <>
      {/* Red warning flashes */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(220,38,38,0.03)' }}
        animate={{
          opacity: [0, 0.3, 0, 0.15, 0],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Intense red flash */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(220,38,38,0.08)' }}
        animate={{
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatDelay: 4,
          ease: 'easeOut',
        }}
      />

      {/* Sparks */}
      {sparks.map(spark => (
        <motion.div
          key={spark.id}
          className="absolute rounded-full"
          style={{
            left: `${spark.x}%`,
            top: `${spark.y}%`,
            width: spark.size,
            height: spark.size,
            background: 'radial-gradient(circle, rgba(255,200,50,0.8) 0%, rgba(255,100,0,0.4) 50%, transparent 70%)',
            boxShadow: '0 0 4px rgba(255,200,50,0.5)',
          }}
          animate={{
            y: [0, -20, -40],
            x: [0, 5 + Math.random() * 10, 10 + Math.random() * 20],
            opacity: [0.8, 0.4, 0],
            scale: [1, 0.5, 0],
          }}
          transition={{
            duration: spark.duration,
            delay: spark.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Smoke particles */}
      {smokePuffs.map(smoke => (
        <motion.div
          key={smoke.id}
          className="absolute rounded-full"
          style={{
            left: `${smoke.x}%`,
            top: `${smoke.y}%`,
            width: smoke.size,
            height: smoke.size,
            background: 'radial-gradient(circle, rgba(80,80,80,0.06) 0%, rgba(60,60,60,0.03) 50%, transparent 70%)',
            filter: 'blur(6px)',
          }}
          animate={{
            y: [0, -30, -60],
            x: [0, 10, -5],
            opacity: [0, 0.4, 0],
            scale: [1, 1.5, 2],
          }}
          transition={{
            duration: smoke.duration,
            delay: smoke.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Red scanline */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(220,38,38,0.015) 3px, rgba(220,38,38,0.015) 6px)',
        }}
      />
    </>
  );
});
