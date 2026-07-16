import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const BOOT_LINES = [
  '> volodka://system/init...',
  '> загружаю мир...',
  '> HUD онлайн',
  '> готов',
];

const LINE_STAGGER_MS = 350;
const POST_COMPLETE_DELAY_MS = 400;
const FADE_OUT_DURATION = 0.5;

export function HUDBootSequence() {
  const reducedMotion = useEffectiveReducedMotion();
  const [visibleLines, setVisibleLines] = useState(0);
  const [phase, setPhase] = useState<'booting' | 'fading' | 'done'>('booting');

  useEffect(() => {
    if (reducedMotion) {
      setPhase('done');
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Stagger lines appearing
    BOOT_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleLines(i + 1);
      }, i * LINE_STAGGER_MS));
    });

    // After all lines, start fade
    const totalTime = BOOT_LINES.length * LINE_STAGGER_MS + POST_COMPLETE_DELAY_MS;
    timers.push(setTimeout(() => {
      setPhase('fading');
    }, totalTime));

    // Mark done after fade
    timers.push(setTimeout(() => {
      setPhase('done');
    }, totalTime + FADE_OUT_DURATION * 1000));

    return () => timers.forEach(clearTimeout);
  }, [reducedMotion]);

  if (phase === 'done' || reducedMotion) return null;

  return (
    <AnimatePresence>
      {(phase === 'booting' || phase === 'fading') && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === 'fading' ? 0 : 1 }}
          transition={{ duration: FADE_OUT_DURATION }}
          className="absolute inset-0 z-[100] flex items-end justify-start p-6 sm:p-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 0% 100%, rgba(0,20,30,0.6) 0%, transparent 60%)' }}
        >
          <div className="flex flex-col gap-1.5">
            {BOOT_LINES.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: i < visibleLines ? 0.9 : 0, x: i < visibleLines ? 0 : -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="hud-boot-line text-xs sm:text-sm font-mono tracking-wide"
              >
                <span className={i === BOOT_LINES.length - 1 && i < visibleLines ? 'text-emerald-400' : 'text-cyan-500/80'}>
                  {line}
                </span>
                {i < visibleLines && (
                  <span className="hud-boot-cursor inline-block w-2 h-4 ml-0.5 align-middle bg-cyan-400/70" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}