
/* ─── Volodka RPG – Voice Line Subtitles HUD (v4.8.5) ───
 *
 * Субтитры голосовых линий: слушает audio:voice_line_start / audio:voice_line_end
 * и показывает реплику внизу экрана в формате «Спикер: текст».
 *
 * Когда показывается:
 *   • играет VO-файл (когда такие появятся в public/audio/vo/);
 *   • включена озвучка «синтез речи» (opt-in в настройках, вкладка «Аудио»)
 *     и реплика проговаривается speechSynthesis.
 * Без воспроизведения субтитр не рисуется — текст и так виден в диалоге,
 * дублирование подсказок избыточно.
 *
 * Дизайн: стеклянная капсула в стилистике HUD, шрифт масштабируется
 * через --subtitle-scale (доступность). Таймаут-предохранитель: если событие
 * end потерялось (молчаливый голос в системе), субтитр скрывается по
 * расчётной длительности прочтения.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface ActiveSubtitle {
  nodeId: string;
  speaker: string | null;
  text: string;
}

/** Расчётная длительность показа, если событие end не пришло. */
function estimateDurationMs(text: string): number {
  // ~55 знаков в секунду при среднем темпе речи, минимум 2.5с, максимум 9с.
  return Math.min(9000, Math.max(2500, Math.round((text.length / 55) * 1000)));
}

export function VoiceLineSubtitleHud() {
  const reducedMotion = useEffectiveReducedMotion();
  const [subtitle, setSubtitle] = useState<ActiveSubtitle | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const unsubStart = eventBus.on('audio:voice_line_start', (payload) => {
      if (!payload.text) return;
      clearTimer();
      setSubtitle({
        nodeId: payload.nodeId,
        speaker: payload.speaker,
        text: payload.text,
      });
      /* Предохранитель: end может потеряться (utterance.onerror без вызова,
       * размонтирование синтезатора и т.п.). */
      timeoutRef.current = setTimeout(() => {
        setSubtitle(null);
        timeoutRef.current = null;
      }, estimateDurationMs(payload.text));
    });

    const unsubEnd = eventBus.on('audio:voice_line_end', (payload) => {
      setSubtitle((prev) => {
        if (prev && prev.nodeId === payload.nodeId) {
          clearTimer();
          return null;
        }
        return prev;
      });
    });

    return () => {
      unsubStart();
      unsubEnd();
      clearTimer();
    };
  }, [clearTimer]);

  return (
    <AnimatePresence>
      {subtitle && (
        <motion.div
          key={`vo-subtitle-${subtitle.nodeId}`}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: 6 }}
          transition={{ duration: reducedMotion ? 0 : 0.22, ease: 'easeOut' }}
          className="fixed left-1/2 -translate-x-1/2 pointer-events-none max-w-[min(92vw,640px)]"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))', zIndex: UI_LAYERS.VOICE_SUBTITLE }}
          role="status"
          aria-live="polite"
          data-testid="voice-line-subtitle"
        >
          <div
            className="px-4 py-2 rounded-xl text-center"
            style={{
              background: 'rgba(4, 8, 18, 0.82)',
              border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.22)',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            {subtitle.speaker && subtitle.speaker !== 'Голос' && (
              <span
                className="block font-mono uppercase tracking-[0.14em] mb-0.5"
                style={{
                  fontSize: 'calc(0.625rem * var(--subtitle-scale, 1))',
                  color: 'rgb(var(--cyber-cyan-rgb) / 0.85)',
                }}
              >
                {subtitle.speaker}
              </span>
            )}
            <span
              className="block leading-snug"
              style={{
                fontSize: 'calc(0.9375rem * var(--subtitle-scale, 1))',
                color: 'rgba(240, 246, 255, 0.96)',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
              }}
            >
              {subtitle.text}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
