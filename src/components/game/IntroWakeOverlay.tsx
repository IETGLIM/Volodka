/**
 * Letterbox + fade + skip for the opening wake-up cinematic (AAA-style).
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { getGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { WAKEUP_PHASE } from '@/engine/wakeup/wakeUpCinematic';

const SKIP_DELAY_MS = 2000;

export const IntroWakeOverlay = memo(function IntroWakeOverlay() {
  const [visible, setVisible] = useState(false);
  const [letterbox, setLetterbox] = useState(true);
  const [showSkip, setShowSkip] = useState(false);
  const [beatText, setBeatText] = useState('');
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    setVisible(false);
    setLetterbox(true);
    setShowSkip(false);
    setBeatText('');
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const start = () => {
      setVisible(true);
      setLetterbox(true);
      setShowSkip(false);
      setBeatText('03:47 — писк терминала');
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
      skipTimerRef.current = setTimeout(() => setShowSkip(true), SKIP_DELAY_MS);
    };

    const onHandoff = () => {
      setLetterbox(false);
      setBeatText('');
    };

    const onComplete = () => hide();

    const unsubs = [
      eventBus.on('intro:wakeup_sequence', start),
      eventBus.on('intro:wakeup_handoff', onHandoff),
      eventBus.on('intro:wakeup_complete', onComplete),
    ];

    if (getGameStore().activeCutsceneId === 'intro_wakeup') {
      start();
    }

    return () => {
      for (const u of unsubs) u();
    };
  }, [hide]);

  useEffect(() => {
    if (!visible) return;

    const beatTimers = [
      setTimeout(() => setBeatText(''), WAKEUP_PHASE.terminal * 1000),
    ];

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSkip) {
        e.preventDefault();
        eventBus.emit('intro:wakeup_skip', {});
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      for (const t of beatTimers) clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [visible, showSkip]);

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key="intro-wake-overlay"
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />

          <AnimatePresence>
            {letterbox && (
              <>
                <motion.div
                  key="lb-top"
                  className="absolute top-0 left-0 right-0 h-[7dvh] min-h-[28px] bg-black"
                  initial={{ scaleY: 0, transformOrigin: 'top' }}
                  animate={{ scaleY: 1 }}
                  exit={{ scaleY: 0 }}
                  transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
                <motion.div
                  key="lb-bot"
                  className="absolute bottom-0 left-0 right-0 h-[7dvh] min-h-[28px] bg-black"
                  initial={{ scaleY: 0, transformOrigin: 'bottom' }}
                  animate={{ scaleY: 1 }}
                  exit={{ scaleY: 0 }}
                  transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {beatText && (
              <motion.p
                key="wake-beat"
                className="absolute bottom-[12dvh] left-0 right-0 text-center text-sm tracking-[0.2em] uppercase text-emerald-400/80 font-mono"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {beatText}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSkip && (
              <motion.button
                type="button"
                className="absolute bottom-6 right-6 pointer-events-auto px-3 py-1.5 rounded border border-white/20 bg-black/50 text-white/70 text-xs tracking-wide hover:text-white hover:border-white/40 transition-colors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => eventBus.emit('intro:wakeup_skip', {})}
              >
                ESC — пропустить
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
