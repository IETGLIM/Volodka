import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';

export function MenuTypewriterSubtitle({ text, delay = 0, enabled = true }: { text: string; delay?: number; enabled?: boolean }) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay, enabled]);

  const { displayed, done } = useTypewriter(started ? text : '', enabled ? 35 : 0);

  if (!enabled) {
    return (
      <p className="mt-3 font-mono text-base md:text-lg tracking-[0.4em] uppercase text-cyan-300/80">{text}</p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`mt-3 font-mono text-base md:text-lg tracking-[0.4em] uppercase menu-subtitle-flicker ${done && started ? 'typing-cursor' : ''}`}
      style={{
        background: 'linear-gradient(90deg, rgba(0,255,255,0.8), rgba(255,140,0,0.6), rgba(0,255,255,0.8))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {displayed}
      <span
        className="inline-block w-[2px] h-[1em] ml-0.5 align-middle"
        style={{
          backgroundColor: done || !started ? 'transparent' : 'rgba(0, 255, 255, 0.8)',
          animation: done || !started ? 'none' : 'cursor-blink 0.8s step-end infinite',
        }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
