"use client";

import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = memo(function LoadingScreen() {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);
  const [glitchText, setGlitchText] = useState('INITIALIZING SYSTEM');

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 100));
    }, 150);

    const glitchMessages = [
      'INITIALIZING SYSTEM',
      'LOADING ASSETS',
      'BOOTING KERNEL',
      'ACCESSING MEMORY',
      'STARTING VOLODYA.exe'
    ];

    const glitchInterval = setInterval(() => {
      setGlitchText(glitchMessages[Math.floor(Math.random() * glitchMessages.length)]);
    }, 800);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(progressInterval);
      clearInterval(glitchInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden relative">
      {/* CRT Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-50"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center relative z-50"
      >
        {/* Glitch title */}
        <motion.div
          animate={{
            textShadow: [
              '0 0 10px #00ffff',
              '0 0 20px #ff00ff',
              '0 0 10px #00ffff',
            ]
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="text-cyan-400 font-mono text-2xl mb-4 tracking-widest"
        >
          {glitchText}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {dots}
          </motion.span>
        </motion.div>

        {/* Progress bar */}
        <div className="w-80 h-2 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/30">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Progress percentage */}
        <motion.div
          className="mt-2 text-cyan-400 font-mono text-sm"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {progress}%
        </motion.div>

        {/* Random hex data */}
        <div className="mt-4 text-slate-600 font-mono text-xs h-4 overflow-hidden">
          <motion.div
            animate={{ y: [0, -100] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>0x{i.toString(16).padStart(8, '0').toUpperCase()}</div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Matrix rain in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-green-500 font-mono text-xs"
            style={{ left: `${i * 10}%` }}
            initial={{ y: -100 }}
            animate={{ y: '110vh' }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {Array.from({ length: 20 }).map((_, j) => (
              <div key={j}>{Math.random() > 0.5 ? '1' : '0'}</div>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
});

export default LoadingScreen;
