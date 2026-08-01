import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type MenuGlitchTitleProps = {
  text: string;
  animate: boolean;
  parallax: boolean;
};

export function MenuGlitchTitle({ text, animate, parallax }: MenuGlitchTitleProps) {
  const [glitching, setGlitching] = useState(false);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!animate) return;

    let cancelled = false;
    let outerTimer: ReturnType<typeof setTimeout> | undefined;
    let innerTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleGlitch = () => {
      outerTimer = setTimeout(() => {
        if (cancelled) return;
        setGlitching(true);
        innerTimer = setTimeout(() => {
          if (cancelled) return;
          setGlitching(false);
          scheduleGlitch();
        }, 250);
      }, 5000 + Math.random() * 3000);
    };

    scheduleGlitch();
    return () => {
      cancelled = true;
      clearTimeout(outerTimer);
      clearTimeout(innerTimer);
    };
  }, [animate]);

  useEffect(() => {
    if (!parallax) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const el = parallaxRef.current;
        if (!el) return;
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const x = ((event.clientX - cx) / cx) * 8;
        const y = ((event.clientY - cy) / cy) * 4;
        el.style.setProperty('--menu-parallax-x', `${x}px`);
        el.style.setProperty('--menu-parallax-y', `${y}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [parallax]);

  const titleClassName = `relative text-6xl md:text-8xl lg:text-9xl font-bold tracking-widest menu-glitch-title glitch-text-hover menu-title-cyberglow ${glitching ? 'title-glitch glitch-skew' : ''} ${glitching ? 'menu-glitch-color-shift' : ''}`;
  const titleStyle = {
    textShadow: glitching
      ? '-2px 0 #ff0000, 2px 0 #00ffff, 0 0 80px rgba(0, 255, 255, 0.6)'
      : '0 0 60px rgba(0, 255, 255, 0.5), 0 0 120px rgba(0, 255, 255, 0.3), 0 0 200px rgba(255, 140, 0, 0.1)',
  } as const;

  const titleInner = (
    <div
      ref={parallaxRef}
      className={parallax ? 'menu-title-parallax' : undefined}
      style={parallax ? undefined : { transition: 'transform 0.3s ease-out' }}
    >
      <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 via-cyan-400 to-emerald-500 menu-title-breathe neon-text-cyan">
        {text}
      </span>
    </div>
  );

  return (
    <div className="text-center">
      <div className="absolute inset-0 blur-3xl pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,255,255,0.2)_0%,rgba(255,140,0,0.06)_40%,transparent_60%)]" />

      {animate ? (
        <motion.h1
          className={titleClassName}
          style={titleStyle}
          initial={{ opacity: 0, y: -40, scale: 0.9, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {titleInner}
        </motion.h1>
      ) : (
        <h1 className={titleClassName} style={titleStyle}>
          {titleInner}
        </h1>
      )}

      {animate ? (
        <div
          className="relative text-6xl md:text-8xl lg:text-9xl font-bold tracking-widest pointer-events-none select-none -mt-2 animate-[neon-reflection_4s_ease-in-out_infinite] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.25)_0%,transparent_35%)]"
          aria-hidden
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-cyan-500/20 to-transparent">{text}</span>
        </div>
      ) : null}
    </div>
  );
}
