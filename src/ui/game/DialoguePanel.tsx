'use client';

import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * Оболочка диалога в обходе: комикс-нуар («The Wolf Among Us») — тёмная палитра,
 * хромакей углов, типографика без терминального «кибер»-chrome.
 * Логику дерева реплик и эффектов оставляет {@link DialogueRenderer}.
 */
export const DialoguePanelChrome = memo(function DialoguePanelChrome({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      className="relative mx-4 mb-4 w-full max-w-4xl game-fm-layer z-[53]"
      style={{ transformOrigin: 'bottom center' }}
      initial={{ opacity: 0, y: 22, rotate: -0.8 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      exit={{ opacity: 0, y: 14, rotate: 0.6 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
    >
      {/* Тень «вставки» как в комиксе */}
      <div
        className="pointer-events-none absolute -right-2 -bottom-2 left-3 top-3 rounded-sm bg-black/55 blur-[2px]"
        aria-hidden
      />
      <div
        className="relative overflow-hidden rounded-sm border border-zinc-700/90 bg-gradient-to-br from-[#141018] via-[#0f0d12] to-[#09070b] shadow-[0_24px_80px_rgba(0,0,0,0.92),inset_0_0_0_1px_rgba(244,228,188,0.06)]"
        style={{
          boxShadow:
            '0 0 0 1px rgba(15,12,18,0.95), 0 22px 70px rgba(0,0,0,0.85), inset 0 1px 0 rgba(250,232,189,0.06)',
        }}
      >
        {/* Полутоновая текстура */}
        <div
          className="pointer-events-none absolute inset-0 z-[15] opacity-[0.07] mix-blend-soft-light"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 10%, rgba(255,250,235,0.35) 0, transparent 38%),
              radial-gradient(circle at 80% 90%, rgba(90,70,110,0.45) 0, transparent 35%)`,
          }}
          aria-hidden
        />
        {/* Виньетка кадра */}
        <div
          className="pointer-events-none absolute inset-0 z-[16]"
          style={{
            boxShadow: 'inset 0 0 120px rgba(0,0,0,0.65)',
          }}
          aria-hidden
        />
        {children}
      </div>
    </motion.div>
  );
});

/** Алиас для короткого импорта (внешний контракт UI). */
export { DialoguePanelChrome as DialoguePanel };
