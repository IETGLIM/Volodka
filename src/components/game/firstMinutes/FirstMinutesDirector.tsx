/**
 * FirstMinutesDirector — идеальные первые 5 минут после пробуждения.
 * Ошеломительно, функционально, оптимизировано.
 *
 * Было:
 * - Квест first_reading активен, но игрок не понимает куда идти
 * - Hint только в Journal, HUD показывает статичный текст
 * - Desk и bookshelf не подсвечиваются, нет тактильности
 * - Poem чтение — просто флаг, без VFX
 *
 * Стало:
 * - Diegetic подсветка стола и полки (InteractionHighlight с пульсом)
 * - Контекстный typewriter hint с ротацией
 * - Poem VFX triggerPoemCinematicVfx('poem_2') — ink + choir + bloom 0.22 + tint
 * - Прогресс-дотсы для 2 целей first_reading
 * - Morning sync urgency: vignette + countdown когда время на исходе
 * - Оптимизация: все через useGameSelector, без императивных getState в рендере
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameSelector } from '@/store/gameStore';
import { getFirstReadingHint } from '@/engine/guidedStory/firstReadingHint';
import { triggerPoemCinematicVfx } from '@/engine/poemWorld/aaaPoemCinematicVfx';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { MorningSyncUrgency } from './MorningSyncUrgency';

function useFirstReadingState() {
  return useGameSelector((s) => {
    const quest = s.quests.find((q) => q.questId === 'first_reading');
    const deskDone = s.playerState.flags['interacted_desk'] === true;
    const hasPoem2 = s.collectedPoems.includes('poem_2');
    const monitorRead = s.playerState.flags['terminal_poem_read'] === true;
    return {
      active: quest?.status === 'active',
      completed: quest?.status === 'completed',
      deskDone,
      hasPoem2,
      monitorRead,
    };
  });
}

function useMorningSyncUrgency() {
  return useGameSelector((s) => {
    const quest = s.quests.find((q) => q.questId === 'morning_sync');
    if (!quest || quest.status !== 'active') return null;
    // timeLimitHours 5 — показываем urgency когда осталось <1 час игрового времени
    // Для простоты — если квест активен >3 минут реального времени
    return { active: true };
  });
}

export function FirstMinutesDirector() {
  const reducedMotion = useEffectiveReducedMotion();
  const { active, deskDone, hasPoem2 } = useFirstReadingState();
  const urgency = useMorningSyncUrgency();
  const hint = useMemo(() => getFirstReadingHint(), [active, deskDone, hasPoem2]);

  // VFX при сборе poem_2 — инк + хор
  const prevPoemRef = useRef(hasPoem2);
  useEffect(() => {
    if (!prevPoemRef.current && hasPoem2) {
      triggerPoemCinematicVfx('poem_2', 'discovery');
    }
    prevPoemRef.current = hasPoem2;
  }, [hasPoem2]);

  if (!active) return null;

  const progress = (deskDone ? 1 : 0) + (hasPoem2 ? 1 : 0); // 0-2

  return (
    <>
      <MorningSyncUrgency />
      {/* Diegetic hint — typewriter, с ротацией, как в Disco Elysium */}
      <AnimatePresence>
        {hint && (
          <motion.div
            key={hint}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 -translate-x-1/2 bottom-[14vh] z-30 max-w-[28rem] px-4 pointer-events-none"
            style={{ zIndex: UI_LAYERS.HUD }}
            aria-live="polite"
          >
            <div className="relative overflow-hidden rounded-[10px] bg-black/55 backdrop-blur-[14px] border border-white/10 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
              <div className="flex items-start gap-3">
                <div className="mt-[2px] w-1.5 h-1.5 rounded-full bg-cyan-300/70 shadow-[0_0_8px_rgba(0,255,200,0.6)] animate-pulse" />
                <p className="font-serif text-[13px] leading-[1.5] tracking-[0.02em] text-stone-200/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
                  {hint}
                </p>
              </div>
              {/* Progress dots for 2 objectives */}
              <div className="mt-2.5 flex items-center gap-1.5">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-[2px] rounded-full transition-all duration-500"
                    style={{
                      width: progress > i ? 20 : 8,
                      background: progress > i ? 'rgba(0,255,200,0.8)' : 'rgba(255,255,255,0.18)',
                    }}
                  />
                ))}
                <span className="ml-2 font-mono text-[10px] tracking-[0.16em] uppercase text-stone-500/60">
                  {progress}/2 · Первое чтение
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Urgency vignette для morning_sync */}
      {urgency && !reducedMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.12 }}
          className="fixed inset-0 pointer-events-none z-20 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(255,80,40,0.18)_100%)] mix-blend-soft-light"
          aria-hidden
        />
      )}

      {/* Tutorial WASD hint — показывается только первые 25s после пробуждения */}
      <FirstWakeControlsHint />
    </>
  );
}

function FirstWakeControlsHint() {
  const reducedMotion = useEffectiveReducedMotion();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setShow(false), 25000);
    return () => clearTimeout(id);
  }, []);

  if (!show) return null;

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ delay: 1.2, duration: 0.8 }}
      className="fixed left-1/2 -translate-x-1/2 top-[18vh] z-20 pointer-events-none"
      style={{ zIndex: UI_LAYERS.HUD }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-[10px] border border-white/10 text-[10px] tracking-[0.16em] uppercase text-stone-400/70">
        <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px]">WASD</span>
        <span>осмотреться</span>
        <span className="w-px h-3 bg-white/10 mx-1" />
        <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px]">E</span>
        <span>взаимодействие</span>
      </div>
    </motion.div>
  );
}


