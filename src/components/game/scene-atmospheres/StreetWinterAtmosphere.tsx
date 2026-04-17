'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { NeonSign } from './NeonSign';

export const StreetWinterAtmosphere = memo(function StreetWinterAtmosphere() {
  const snowflakes = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 1 + Math.random() * 3,
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 8,
      drift: -20 + Math.random() * 40,
    })),
  []);

  return (
    <>
      {/* Cold blue atmospheric overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(148,163,184,0.04) 0%, transparent 60%)',
        }}
      />

      {/* Snowfall */}
      {snowflakes.map(flake => (
        <motion.div
          key={flake.id}
          className="absolute rounded-full"
          style={{
            left: `${flake.x}%`,
            top: '-2%',
            width: flake.size,
            height: flake.size,
            background: 'rgba(200,210,230,0.4)',
            boxShadow: '0 0 3px rgba(200,210,230,0.2)',
          }}
          animate={{
            y: ['-2vh', '105vh'],
            x: [0, flake.drift, flake.drift * 0.5],
            opacity: [0, 0.6, 0.4, 0],
          }}
          transition={{
            duration: flake.duration,
            delay: flake.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      {/* Streetlight glow in cold */}
      <div
        className="absolute"
        style={{
          top: '70%',
          left: '30%',
          width: 100,
          height: 60,
          background: 'radial-gradient(ellipse, rgba(200,200,220,0.04) 0%, transparent 70%)',
          filter: 'blur(4px)',
        }}
      />

      {/* Neon sign - dim winter */}
      <NeonSign
        text="ВХОД"
        x={60}
        y={18}
        color="#00ffff"
        fontSize={10}
        flickerSpeed={8}
      />
    </>
  );
});
