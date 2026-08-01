import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type GlitchTitleProps = {
  text: string;
  animate: boolean;
};

export function GlitchTitle({ text, animate }: GlitchTitleProps) {
  const [glitching, setGlitching] = useState(false);
  const mainTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glitchOffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!animate) return;

    cancelledRef.current = false;
    const scheduleGlitch = () => {
      mainTimerRef.current = setTimeout(() => {
        if (cancelledRef.current) return;
        setGlitching(true);
        glitchOffTimerRef.current = setTimeout(() => {
          if (!cancelledRef.current) setGlitching(false);
        }, 200);
        scheduleGlitch();
      }, 2000 + Math.random() * 4000);
    };

    scheduleGlitch();
    return () => {
      cancelledRef.current = true;
      if (mainTimerRef.current) clearTimeout(mainTimerRef.current);
      if (glitchOffTimerRef.current) clearTimeout(glitchOffTimerRef.current);
    };
  }, [animate]);

  const titleClassName = `relative text-6xl sm:text-8xl font-black tracking-[0.2em] boot-glitch-text ${glitching ? 'title-glitch' : ''}`;
  const titleStyle = {
    textShadow: glitching
      ? '-3px 0 #ff0000, 3px 0 #00ffff, 0 0 80px rgba(0,255,255,0.7)'
      : '0 0 60px rgba(0,255,255,0.5), 0 0 120px rgba(0,255,255,0.3), 0 0 200px rgba(255,140,0,0.1)',
  } as const;

  return (
    <div className="text-center relative">
      <div className="absolute inset-0 blur-3xl pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,255,255,0.15)_0%,rgba(255,140,0,0.05)_40%,transparent_60%)]" />

      {animate ? (
        <motion.h1
          className={titleClassName}
          style={titleStyle}
          initial={{ opacity: 0, y: -30, scale: 0.9, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 via-cyan-400 to-emerald-500 menu-title-breathe">
            {text}
          </span>
        </motion.h1>
      ) : (
        <h1 className={titleClassName} style={titleStyle}>
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 via-cyan-400 to-emerald-500">
            {text}
          </span>
        </h1>
      )}

      {animate && (
        <div
          className="relative text-6xl sm:text-8xl font-black tracking-[0.2em] pointer-events-none select-none -mt-3 animate-[neon-reflection_4s_ease-in-out_infinite] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.2)_0%,transparent_30%)]"
          aria-hidden
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-500/15 to-transparent">{text}</span>
        </div>
      )}
    </div>
  );
}
