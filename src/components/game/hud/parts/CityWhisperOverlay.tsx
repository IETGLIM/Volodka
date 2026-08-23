/* ─── Volodka RPG – «Шёпот города»: кинематографичный оверлей ───
 *
 * При высоком стрессе (≥70, см. useCityWhisper) город шепчет игроку —
 * короткая тревожная строка от первого лица (FreeRouter, режим
 * matrix-quote?mode=whisper; при недоступности API сервер сам
 * возвращает атмосферный фолбэк).
 *
 * Подача — «тихий голос города»: Cormorant italic, зыбкий полупрозрачный
 * текст с медленным «дыханием» межбуквенного расстояния, мягкое свечение,
 * появление из размытия в нижней трети экрана. Полностью poiner-events:
 * none — оверлей никогда не мешает вводу. Уважает prefers-reduced-motion
 * (простое затухание без анимаций) и единожды объявляется скрин-ридеру
 * (aria-live=polite на время показа).
 */

import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useCityWhisper } from '@/hooks/useCityWhisper';

export const CityWhisperOverlay = memo(function CityWhisperOverlay() {
  const { whisper, displayActive } = useCityWhisper();
  const reducedMotion = useEffectiveReducedMotion();

  const visible = displayActive && Boolean(whisper);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="city-whisper"
          role="status"
          aria-live="polite"
          className="pointer-events-none select-none fixed left-0 right-0 flex justify-center"
          style={{ bottom: '24%', zIndex: UI_LAYERS.HUD }}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, filter: 'blur(6px)', letterSpacing: '0.02em' }
          }
          animate={
            reducedMotion
              ? { opacity: 0.92 }
              : {
                  opacity: 0.92,
                  filter: 'blur(0px)',
                  letterSpacing: '0.10em',
                  transition: {
                    duration: 2.6,
                    ease: 'easeOut',
                    letterSpacing: { duration: 7.5, ease: 'easeInOut' },
                  },
                }
          }
          exit={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, filter: 'blur(4px)', transition: { duration: 1.6, ease: 'easeIn' } }
          }
        >
          <span
            className="mx-6 max-w-2xl text-center font-serif text-xl leading-relaxed sm:text-2xl"
            style={{
              fontStyle: 'italic',
              color: 'rgba(240, 230, 200, 0.85)',
              textShadow:
                '0 0 18px rgba(240, 230, 200, 0.28), 0 0 42px rgba(160, 96, 192, 0.20), 0 2px 6px rgba(0, 0, 0, 0.85)',
            }}
          >
            {whisper}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
