'use client';

import { memo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SceneId } from '@/data/types';
import { EXPLORATION_QUESTS_KARMA_HINT_LINE_RU } from '@/game/core/explorationHints';

/** Одна строка для брифинга и тоста при первом диалоге из обхода (E2.1). */
export { EXPLORATION_QUESTS_KARMA_HINT_LINE_RU };

const CAMERA_ORBIT_HINT_RU =
  'Камера: мышь или перетаскивание пальца по экрану; R — сброс орбиты за спину.';

export type ExplorationBriefingOverlayProps = {
  sceneId: SceneId;
  open: boolean;
  onDismiss: () => void;
};

function briefingForScene(sceneId: SceneId): {
  title: string;
  lead: string;
  bullets: string[];
  foot: string;
} {
  switch (sceneId) {
    case 'volodka_room':
      return {
        title: 'Комната Володьки',
        lead: 'Сцена загружена. Кратко, что можно делать:',
        bullets: [
          'WASD — ходьба, Shift — бег, пробел — прыжок.',
          CAMERA_ORBIT_HINT_RU,
          'Подойдите к столу, окну, двери: у предметов нажмите E — откроется круговое меню (осмотреть / взять / использовать).',
          'Рядом с Димой с пятого — E, чтобы заговорить.',
          'В отмеченных зонах с подсказкой внизу экрана — снова E для короткой заставки или сюжета.',
        ],
        foot: 'Окно можно закрыть кнопкой или клавишей E.',
      };
    case 'volodka_corridor':
      return {
        title: 'Коридор',
        lead: 'Узкий проход между комнатой и общей зоной.',
        bullets: [
          CAMERA_ORBIT_HINT_RU,
          'Двери ведут в комнату Володьки и в квартиру; подойдите и используйте сцену по подсказкам.',
          'E — взаимодействие с объектами и зонами, как в комнате.',
        ],
        foot: 'Закрыть — кнопка или E.',
      };
    case 'home_evening':
      return {
        title: 'Кухня и общие комнаты',
        lead: 'Большая локация квартиры.',
        bullets: [
          CAMERA_ORBIT_HINT_RU,
          'Ищите интерактивные объекты и NPC; E открывает действия или диалог.',
          'Следите за подсказкой [E] Interact у зон квестов и разговоров.',
        ],
        foot: 'Закрыть — кнопка или E.',
      };
    default:
      return {
        title: 'Обход',
        lead: 'Локация готова.',
        bullets: [
          'WASD, Shift, пробел.',
          CAMERA_ORBIT_HINT_RU,
          'E — взаимодействие, когда вы рядом с объектом или персонажем.',
        ],
        foot: 'Закрыть — кнопка или E.',
      };
  }
}

/**
 * Явная подсказка после первого тика физики (позиция игрока), чтобы игрок не гадал, что делать в 3D.
 */
export const ExplorationBriefingOverlay = memo(function ExplorationBriefingOverlay({
  sceneId,
  open,
  onDismiss,
}: ExplorationBriefingOverlayProps) {
  const content = briefingForScene(sceneId);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      panelRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open, sceneId]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        onDismiss();
      }
    },
    [open, onDismiss],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exploration-briefing-title"
          className="fixed inset-0 z-[88] flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            ref={panelRef}
            tabIndex={0}
            layout
            onKeyDown={onKeyDown}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="game-critical-motion game-fm-layer game-panel max-h-[min(78dvh,520px)] w-full max-w-md overflow-y-auto rounded-xl border border-cyan-500/45 bg-slate-950/95 p-5 pb-[max(1.25rem,calc(1.25rem+env(safe-area-inset-bottom)))] shadow-2xl outline-none ring-0"
          >
            <h2
              id="exploration-briefing-title"
              className="font-mono text-sm uppercase tracking-[0.2em] text-cyan-300/90"
            >
              {content.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-200">{content.lead}</p>
            <p className="mt-2 border-l-2 border-amber-500/45 pl-3 text-xs leading-relaxed text-slate-300">
              {EXPLORATION_QUESTS_KARMA_HINT_LINE_RU}
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-300">
              {content.bullets.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">{content.foot}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-cyan-500/50 bg-cyan-950/80 px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-cyan-100 hover:bg-cyan-900/90 touch-manipulation"
                onClick={onDismiss}
              >
                Понятно
              </button>
              <span className="self-center font-mono text-[10px] text-slate-500">или E / Esc</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
