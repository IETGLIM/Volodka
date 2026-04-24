'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMobileVisualPerf } from '@/hooks/useMobileVisualPerf';
import { RainCanvasLayer } from '../RainCanvasLayer';

export const RooftopNightAtmosphere = memo(function RooftopNightAtmosphere() {
  const lite = useMobileVisualPerf();
  const stars = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 45,
      size: 0.5 + Math.random() * 1.5,
      duration: 2 + Math.random() * 4,
      delay: Math.random() * 5,
    })),
  []);

  const cityLights = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 8,
      duration: 3 + Math.random() * 4,
      color: i % 3 === 0 ? 'rgba(255,200,50,0.4)' : i % 3 === 1 ? 'rgba(0,255,255,0.3)' : 'rgba(255,0,255,0.25)',
    })),
  []);

  const windParticles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      y: 20 + Math.random() * 60,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 6,
      width: 15 + Math.random() * 25,
    })),
  []);

  return (
    <>
      {!lite && (
        <RainCanvasLayer intensity={0.38} color="rgba(170,190,220,0.2)" className="absolute inset-0" />
      )}

      {/* Stars */}
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            background: 'rgba(220,230,255,0.7)',
            boxShadow: '0 0 3px rgba(220,230,255,0.4)',
          }}
          animate={{
            opacity: [0.3, 1, 0.5, 0.8, 0.3],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* City lights below horizon */}
      <div className="absolute bottom-[8%] left-0 right-0 h-[20%]">
        {cityLights.map(light => (
          <motion.div
            key={light.id}
            className="absolute rounded-full"
            style={{
              left: `${light.x}%`,
              bottom: 0,
              width: light.size,
              height: light.size,
              background: light.color,
              boxShadow: `0 0 4px ${light.color}`,
            }}
            animate={{
              opacity: [0.3, 0.7, 0.4, 0.9, 0.3],
            }}
            transition={{
              duration: light.duration,
              delay: light.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
        {/* City glow */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(245,158,11,0.04), transparent 60%)',
          }}
        />
      </div>

      {/* Distant neon reflections */}
      <div
        className="absolute bottom-[12%] left-[20%] w-[30%] h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,0,255,0.08), rgba(0,255,255,0.06), transparent)',
          filter: 'blur(2px)',
        }}
      />

      {/* Wind particles */}
      {windParticles.map(wp => (
        <motion.div
          key={wp.id}
          className="absolute h-[1px]"
          style={{
            top: `${wp.y}%`,
            left: '-5%',
            width: wp.width,
            background: 'linear-gradient(90deg, transparent, rgba(200,210,230,0.08), transparent)',
          }}
          animate={{
            x: ['-5vw', '110vw'],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: wp.duration,
            delay: wp.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </>
  );
});
