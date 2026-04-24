'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FloatingHolographicFragments } from './FloatingHolographicFragments';

export const DreamAtmosphere = memo(function DreamAtmosphere() {
  const poemFragments = useMemo(() => [
    '...тишина...',
    '...свет...',
    '...память...',
    '...звук...',
    '...тень...',
    '...дождь...',
    '...ветер...',
    '...сон...',
    '...нить...',
    '...пепел...',
  ], []);

  const fragments = useMemo(() =>
    poemFragments.map((text, i) => ({
      id: i,
      text,
      x: 5 + Math.random() * 85,
      y: 10 + Math.random() * 75,
      duration: 8 + Math.random() * 8,
      delay: Math.random() * 12,
      rotation: -15 + Math.random() * 30,
    })),
  [poemFragments]);

  const purpleParticles = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 5 + Math.random() * 7,
      delay: Math.random() * 8,
    })),
  []);

  return (
    <>
      {/* Swirling purple overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 40% 50%, rgba(168,85,247,0.06) 0%, transparent 50%)',
        }}
        animate={{
          background: [
            'radial-gradient(ellipse at 40% 50%, rgba(168,85,247,0.06) 0%, transparent 50%)',
            'radial-gradient(ellipse at 60% 40%, rgba(168,85,247,0.08) 0%, transparent 50%)',
            'radial-gradient(ellipse at 35% 60%, rgba(168,85,247,0.05) 0%, transparent 50%)',
            'radial-gradient(ellipse at 40% 50%, rgba(168,85,247,0.06) 0%, transparent 50%)',
          ],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Reality glitch - periodic horizontal tear */}
      <motion.div
        className="absolute left-0 right-0 h-[2px]"
        style={{
          top: '40%',
          background: 'linear-gradient(90deg, transparent 10%, rgba(168,85,247,0.15) 30%, rgba(255,0,255,0.1) 50%, rgba(168,85,247,0.15) 70%, transparent 90%)',
        }}
        animate={{
          top: ['30%', '50%', '35%', '45%', '30%'],
          opacity: [0, 0.8, 0, 0.6, 0],
          scaleX: [0.5, 1.2, 0.8, 1.1, 0.5],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', repeatDelay: 4 }}
      />

      {/* Second glitch line */}
      <motion.div
        className="absolute left-0 right-0 h-[1px]"
        style={{
          top: '65%',
          background: 'linear-gradient(90deg, transparent 20%, rgba(0,255,255,0.1) 45%, rgba(168,85,247,0.08) 55%, transparent 80%)',
        }}
        animate={{
          top: ['60%', '70%', '55%', '65%', '60%'],
          opacity: [0, 0.5, 0, 0.7, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 5, delay: 2 }}
      />

      {/* Floating holographic text fragments */}
      <FloatingHolographicFragments fragments={fragments} />

      {/* Swirling purple particles */}
      {purpleParticles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(255,0,255,0.1) 50%, transparent 70%)',
            boxShadow: '0 0 6px rgba(168,85,247,0.2)',
          }}
          animate={{
            x: [0, 20, -15, 10, 0],
            y: [0, -15, 10, -20, 0],
            opacity: [0, 0.6, 0.3, 0.5, 0],
            scale: [0.5, 1, 0.8, 1.2, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Distant voices indicator - subtle wave */}
      <div className="absolute bottom-[15%] left-[10%] flex gap-[3px] items-end">
        {[0.3, 0.6, 1, 0.8, 0.5, 0.7, 0.4].map((h, i) => (
          <motion.div
            key={i}
            style={{
              width: 2,
              height: 8,
              background: 'rgba(168,85,247,0.12)',
              borderRadius: 1,
            }}
            animate={{
              scaleY: [h * 0.3, h, h * 0.5, h * 0.8, h * 0.3],
            }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Dream haze overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(168,85,247,0.02) 0%, rgba(255,0,255,0.01) 50%, rgba(168,85,247,0.03) 100%)',
        }}
      />
    </>
  );
});
