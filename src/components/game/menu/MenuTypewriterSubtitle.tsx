import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';

/**
 * v4.43.0 — субтитр меню переведён на filmic-язык: сериф, мягкий камень
 * вместо неонового моно с градиентом cyan→orange. Печатная машинка
 * осталась (шарм «сказки, рассказанной вполголоса»), курсор — тонкий,
 * приглушённый. Поддержка доступности (--subtitle-scale) сохранена.
 */
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
      <p className="mt-4 font-serif text-base md:text-xl tracking-[0.3em] uppercase" style={{ color: 'rgba(234,228,214,0.85)' }}>{text}</p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(delay, 0.4), duration: 0.45 }}
      className={`mt-4 font-serif text-base md:text-xl tracking-[0.3em] uppercase ${done && started ? 'typing-cursor' : ''}`}
      style={{
        color: 'rgba(234,228,214,0.85)',
        // Accessibility: scale subtitle with the --subtitle-scale CSS var
        // set by AccessibilityManager on <html> (default 1 = no scaling).
        fontSize: 'calc(1rem * var(--subtitle-scale, 1))',
        textShadow: '0 1px 12px rgba(0,0,0,0.65)',
      }}
    >
      {displayed}
      <span
        className="inline-block w-[2px] h-[0.9em] ml-1 align-middle"
        style={{
          backgroundColor: done || !started ? 'transparent' : 'rgba(214, 211, 209, 0.55)',
          animation: done || !started ? 'none' : 'cursor-blink 0.9s step-end infinite',
        }}
        aria-hidden="true"
      />
    </motion.div>
  );
}
