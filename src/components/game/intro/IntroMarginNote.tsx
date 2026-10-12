/* ─── Volodka RPG – Заметка Володьки «на полях» (v4.48.4) ───
 * Появляется на развороте тетради ПОСЛЕ того, как стих собран из кода:
 * карандашная помарка автора — слой данных из src/data/poemMargins.ts.
 * Сами стихи неприкосновенны; заметка — отдельный слой и текст стиха
 * никогда не трогает. Выбор заметки (getPoemMargin) делает родитель —
 * ему же нужно знать, есть ли заметка, чтобы задержать уход в меню.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import type { PoemMargin } from '@/data/poemMargins';

interface IntroMarginNoteProps {
  /** Готовая заметка (getPoemMargin с догеймплейным контекстом) или undefined. */
  margin: PoemMargin | undefined;
  /** Показывать заметку (после сборки стиха). */
  visible: boolean;
  reduceMotion: boolean;
}

export const IntroMarginNote = memo(function IntroMarginNote({
  margin,
  visible,
  reduceMotion,
}: IntroMarginNoteProps) {
  if (!margin) return null;

  return (
    <motion.div
      className="vk-intro-note"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 6 }}
      transition={{ duration: reduceMotion ? 0.2 : 1.4, ease: 'easeOut' }}
      aria-hidden={!visible}
      data-testid="intro-margin-note"
    >
      <span className="vk-intro-note-label mb-1 block">на полях — карандашом</span>
      {margin.text}
    </motion.div>
  );
});
