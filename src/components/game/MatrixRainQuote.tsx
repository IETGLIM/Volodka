
/* ─── Volodka RPG – MatrixRainQuote ─── */
/* Full-screen matrix rain overlay with typewriter quote text.
 * Appears during story moments (act transitions, key choices, poem discoveries).
 * Auto-dismisses after 5 seconds or on click. */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

interface MatrixRainQuoteProps {
  text: string;
  actNumber?: number;
  chapterTitle?: string;
  duration?: number;
  onDismiss: () => void;
}

export function MatrixRainQuote({
  text,
  actNumber = 1,
  chapterTitle,
  duration = 5000,
  onDismiss,
}: MatrixRainQuoteProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const [visible, setVisible] = useState(true);
  const bodyText = text.trim() || chapterTitle?.trim() || '';
  const showChapterSubtitle = Boolean(chapterTitle?.trim() && text.trim());
  const typeSpeed = reducedMotion ? 0 : 35;
  const { displayed, done, skip } = useTypewriter(bodyText, typeSpeed);

  useEffect(() => {
    if (reducedMotion && bodyText) skip();
  }, [reducedMotion, bodyText, skip]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, reducedMotion ? 0 : 500);
  }, [onDismiss, reducedMotion]);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(handleDismiss, duration);
    return () => clearTimeout(timer);
  }, [done, duration, handleDismiss]);

  const themeColor = useMemo(() => {
    switch (actNumber) {
      case 1: return '#00ffee';
      case 2: return '#00ff66';
      case 3: return '#ff6644';
      case 4: return '#ffcc00';
      case 5: return '#cc88ff';
      case 6: return '#ff88cc';
      case 7: return '#aaddff';
      default: return '#00ffee';
    }
  }, [actNumber]);

  const fadeDuration = reducedMotion ? 0 : 0.5;

  if (!bodyText) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: fadeDuration }}
          className="fixed inset-0 flex items-center justify-center cursor-pointer"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION, background: 'rgba(0,0,0,0.92)' }}
          onClick={handleDismiss}
          role="dialog"
          aria-live="polite"
          aria-label={chapterTitle ? `Акт ${actNumber}: ${chapterTitle}` : `Акт ${actNumber}`}
        >
          {!reducedMotion ? <MatrixRainColumns color={themeColor} /> : null}

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
            transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeOut' }}
            className="relative z-10 text-center px-8 max-w-2xl"
          >
            <div
              className="absolute inset-0 -m-8 rounded-xl pointer-events-none"
              style={{
                background: `radial-gradient(ellipse, ${themeColor}08 0%, transparent 70%)`,
                filter: 'blur(20px)',
              }}
            />

            {showChapterSubtitle ? (
              <p
                className="mb-4 text-sm md:text-base font-mono tracking-[0.25em] uppercase"
                style={{ color: `${themeColor}cc` }}
              >
                Акт {actNumber} — {chapterTitle}
              </p>
            ) : null}

            <p
              className="text-xl md:text-2xl font-mono leading-relaxed tracking-wide"
              style={{
                color: themeColor,
                textShadow: `0 0 20px ${themeColor}66, 0 0 40px ${themeColor}33, 0 0 60px ${themeColor}11`,
              }}
            >
              {displayed}
              {!done && !reducedMotion ? (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  style={{ color: themeColor }}
                >
                  |
                </motion.span>
              ) : null}
            </p>

            {!showChapterSubtitle ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: reducedMotion ? 0 : 1 }}
                className="mt-6 text-xs font-mono tracking-[0.3em]"
                style={{ color: themeColor }}
              >
                АКТ {actNumber}
                {chapterTitle ? ` · ${chapterTitle.toUpperCase()}` : ''}
              </motion.div>
            ) : null}

            {done ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: reducedMotion ? 0 : 0.5 }}
                className="mt-4 text-[10px] font-mono"
                style={{ color: '#666' }}
              >
                нажмите чтобы продолжить
              </motion.div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MatrixRainColumns({ color }: { color: string }) {
  const columns = useMemo(() => {
    const CHARS = '0123456789ABCDEF{}[]<>/\\|#$@!клмнопрстуфхцчшщъыьэюя';
    const count = Math.min(Math.ceil(typeof window !== 'undefined' ? window.innerWidth / 18 : 60), 80);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: i * 18,
      chars: Array.from({ length: 15 + Math.floor(Math.random() * 10) }, () =>
        CHARS[Math.floor(Math.random() * CHARS.length)],
      ),
      duration: 3 + Math.random() * 6,
      delay: Math.random() * 4,
    }));
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ opacity: 0.15, mixBlendMode: 'screen' }}
    >
      {columns.map((col) => (
        <div
          key={col.id}
          style={{
            position: 'absolute',
            left: col.x,
            top: '-100%',
            animation: `matrixFallQuote ${col.duration}s linear ${col.delay}s infinite`,
            whiteSpace: 'nowrap',
            fontFamily: '"Courier New", monospace',
            fontSize: '14px',
            lineHeight: '14px',
          }}
        >
          {col.chars.map((char, ci) => (
            <div
              key={ci}
              style={{
                color: ci === col.chars.length - 1 ? '#ffffff' : color,
                opacity: ci === col.chars.length - 1 ? 1 : Math.max(0.1, 1 - (col.chars.length - 1 - ci) * 0.07),
                textShadow: ci === col.chars.length - 1
                  ? `0 0 8px ${color}`
                  : 'none',
              }}
            >
              {char}
            </div>
          ))}
        </div>
      ))}
      <style>{`
        @keyframes matrixFallQuote {
          0% { transform: translateY(0); }
          100% { transform: translateY(calc(200vh + 100%)); }
        }
      `}</style>
    </div>
  );
}
