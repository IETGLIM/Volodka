'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMobileVisualPerf } from '@/hooks/useMobileVisualPerf';
import { RainCanvasLayer } from '../RainCanvasLayer';
import { NeonSign } from './NeonSign';

export const StreetNightAtmosphere = memo(function StreetNightAtmosphere() {
  const lite = useMobileVisualPerf();
  return (
    <>
      {!lite && (
        <RainCanvasLayer intensity={0.6} color="rgba(150,170,200,0.25)" className="absolute inset-0" />
      )}

      {/* Neon sign reflections on wet ground */}
      <NeonSign
        text="КАФЕ"
        x={8}
        y={10}
        color="#ff00ff"
        fontSize={16}
        flickerSpeed={4}
      />
      <NeonSign
        text="ВЫХОД"
        x={72}
        y={15}
        color="#00ffff"
        fontSize={12}
        flickerSpeed={6}
      />

      {/* Wet ground neon reflections */}
      <div className="absolute bottom-[5%] left-0 right-0 h-[15%]" style={{ overflow: 'hidden' }}>
        {/* Magenta reflection */}
        <motion.div
          className="absolute"
          style={{
            left: '5%',
            bottom: 0,
            width: '25%',
            height: '100%',
            background: 'linear-gradient(to top, rgba(255,0,255,0.06), transparent)',
            filter: 'blur(8px)',
            transform: 'scaleY(-0.6)',
          }}
          animate={{ opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Cyan reflection */}
        <motion.div
          className="absolute"
          style={{
            right: '5%',
            bottom: 0,
            width: '20%',
            height: '100%',
            background: 'linear-gradient(to top, rgba(0,255,255,0.05), transparent)',
            filter: 'blur(8px)',
            transform: 'scaleY(-0.6)',
          }}
          animate={{ opacity: [0.5, 0.25, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      {/* Amber streetlight pools */}
      {[
        { x: '20%', y: '75%', w: 120, h: 80 },
        { x: '55%', y: '80%', w: 100, h: 60 },
        { x: '80%', y: '70%', w: 80, h: 50 },
      ].map((pool, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: pool.x,
            top: pool.y,
            width: pool.w,
            height: pool.h,
            background: 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)',
            filter: 'blur(4px)',
          }}
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
        />
      ))}

      {/* Passing car lights */}
      <motion.div
        className="absolute"
        style={{
          top: '65%',
          height: 4,
          width: 60,
          background: 'linear-gradient(90deg, transparent, rgba(255,240,200,0.15), rgba(255,240,200,0.3), rgba(255,240,200,0.15), transparent)',
          filter: 'blur(2px)',
          boxShadow: '0 0 15px rgba(255,240,200,0.1)',
        }}
        animate={{
          x: ['-100px', '110vw'],
        }}
        transition={{
          duration: 8,
          delay: 3,
          repeat: Infinity,
          repeatDelay: 12,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute"
        style={{
          top: '68%',
          height: 3,
          width: 40,
          background: 'linear-gradient(90deg, transparent, rgba(255,50,50,0.15), rgba(255,50,50,0.25), rgba(255,50,50,0.15), transparent)',
          filter: 'blur(2px)',
          boxShadow: '0 0 10px rgba(255,50,50,0.08)',
        }}
        animate={{
          x: ['110vw', '-100px'],
        }}
        transition={{
          duration: 10,
          delay: 10,
          repeat: Infinity,
          repeatDelay: 15,
          ease: 'linear',
        }}
      />
    </>
  );
});
