'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

export const HomeEveningAtmosphere = memo(function HomeEveningAtmosphere() {
  const dustParticles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      y: 30 + Math.random() * 50,
      size: 1 + Math.random() * 2,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 10,
    })),
  []);

  return (
    <>
      {/* Amber lamp glow - warm radial light */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, rgba(212,148,10,0.1) 0%, rgba(212,148,10,0.03) 30%, transparent 65%)',
        }}
        animate={{ opacity: [1, 0.8, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Warm lamp light source */}
      <div
        className="absolute"
        style={{
          top: '35%',
          left: '50%',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'rgba(255,200,50,0.4)',
          boxShadow: '0 0 30px rgba(255,180,50,0.3), 0 0 60px rgba(255,150,30,0.15), 0 0 100px rgba(212,148,10,0.08)',
        }}
      />

      {/* Faint window light from right */}
      <div
        className="absolute top-[10%] right-[8%] w-[2px] h-[40%]"
        style={{
          background: 'linear-gradient(180deg, rgba(100,120,160,0.15), rgba(100,120,160,0.05), transparent)',
          boxShadow: '-20px 0 40px rgba(100,120,160,0.05)',
        }}
      />

      {/* Floating dust particles in lamplight */}
      {dustParticles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'rgba(255,200,100,0.25)',
            boxShadow: '0 0 2px rgba(255,200,100,0.15)',
          }}
          animate={{
            x: [0, 10, -5, 8, 0],
            y: [0, -15, -5, -20, 0],
            opacity: [0, 0.4, 0.2, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Warm shadow layer at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[30%]"
        style={{
          background: 'linear-gradient(to top, rgba(30,15,0,0.3), transparent)',
        }}
      />
    </>
  );
});
