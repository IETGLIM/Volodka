import { useId, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { LevelUpParticles } from '@/components/game/levelUp/LevelUpParticles';
import {
  buildSummaryAnnouncement,
  computeStatChanges,
  getUnlockMessagesInRange,
  type LevelUpSummaryData,
} from '@/engine/levelUp/levelUpSummaryPresentation';
import {
  buildSummaryParticleSpecs,
  formatPerkPointsShortLabel,
  formatSkillPointsShortLabel,
  getParticleCountForTier,
} from '@/engine/levelUp/levelUpPresentation';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { useLevelUpSummaryState } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

type LevelUpSummaryDialogProps = {
  data: LevelUpSummaryData;
  reducedMotion: boolean;
  onDismiss: () => void;
};

export function LevelUpSummaryDialog({ data, reducedMotion, onDismiss }: LevelUpSummaryDialogProps) {
  const { skills, karma, progression } = useLevelUpSummaryState();
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const descriptionId = useId();
  const deviceTier = useDeviceTier();

  const statChanges = useMemo(
    () => computeStatChanges(data.prevSkills, skills),
    [data.prevSkills, skills],
  );
  const unlockMessages = useMemo(
    () => getUnlockMessagesInRange(data.prevLevel, data.newLevel),
    [data.prevLevel, data.newLevel],
  );
  const particles = useMemo(
    () => buildSummaryParticleSpecs(getParticleCountForTier(deviceTier, reducedMotion)),
    [deviceTier, reducedMotion],
  );
  const announcement = buildSummaryAnnouncement(data);
  const motionDuration = reducedMotion ? 0 : 0.3;

  const cardContent = (
    <>
      <div className="px-6 pt-6 pb-4 text-center">
        <p className="font-mono text-xs tracking-[0.3em] uppercase text-amber-500/50 mb-2">
          Повышение уровня
        </p>
        <h2
          {...titleProps}
          className="font-mono text-4xl sm:text-5xl font-black tracking-[0.1em] text-amber-400"
          style={
            reducedMotion
              ? undefined
              : {
                  textShadow:
                    '0 0 20px rgba(212, 146, 10, 0.6), 0 0 40px rgba(212, 146, 10, 0.3)',
                }
          }
        >
          УРОВЕНЬ {data.newLevel}!
        </h2>
        <div
          className="mt-3 h-px mx-auto w-[200px]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(212, 146, 10, 0.5), transparent)',
          }}
        />
      </div>

      <div id={descriptionId} className="px-6 pb-4 space-y-4">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-amber-400">+{data.levelsGained}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500/50">
              {formatSkillPointsShortLabel(data.levelsGained)}
            </p>
          </div>
          {data.perkPointsGained > 0 && (
            <div className="text-center">
              <p className="font-mono text-2xl font-bold text-cyan-400">+{data.perkPointsGained}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-500/50">
                {formatPerkPointsShortLabel(data.perkPointsGained)}
              </p>
            </div>
          )}
        </div>

        {statChanges.length > 0 && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500/40 mb-2">
              Изменения
            </p>
            <div className="space-y-1.5">
              {statChanges.map((change) => (
                <div key={change.label} className="flex items-center justify-between text-sm font-mono">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span>{change.icon}</span>
                    {change.label}
                  </span>
                  <span className="text-amber-400">
                    {change.before} → <span className="font-bold">{change.after}</span>
                    <span className="text-emerald-400 ml-1">+{change.delta}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {karma !== data.prevKarma && (
          <div className="flex items-center justify-between text-sm font-mono px-1">
            <span className="text-slate-400">☯ Карма</span>
            <span className="text-amber-400">
              {data.prevKarma} → <span className="font-bold">{karma}</span>
              <span className="text-emerald-400 ml-1">+{karma - data.prevKarma}</span>
            </span>
          </div>
        )}

        {unlockMessages.length > 0 && (
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-500/40 mb-2">
              Разблокировано
            </p>
            <div className="space-y-1">
              {unlockMessages.map((unlock) => (
                <p key={unlock} className="font-mono text-sm text-cyan-300 flex items-center gap-1.5">
                  <span className="text-cyan-400">✦</span>
                  {unlock}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 pt-1">
          <div className="text-center px-3 py-1.5 rounded-md bg-slate-900/50 border border-slate-700/30">
            <p className="font-mono text-xs text-slate-400">Очки навыков</p>
            <p className="font-mono text-lg font-bold text-amber-400">{progression.skillPoints}</p>
          </div>
          <div className="text-center px-3 py-1.5 rounded-md bg-slate-900/50 border border-slate-700/30">
            <p className="font-mono text-xs text-slate-400">Очки черт</p>
            <p className="font-mono text-lg font-bold text-cyan-400">{progression.perkPoints}</p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-2">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onDismiss}
          className="w-full py-3 rounded-lg font-mono text-sm tracking-[0.15em] uppercase font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 transition-colors hover:bg-amber-500/20 hover:border-amber-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
        >
          Продолжить
        </button>
        {!reducedMotion && (
          <p className="mt-2 text-center font-mono text-[10px] text-slate-500/80">
            Enter, Escape, пробел или любая кнопка геймпада
          </p>
        )}
      </div>
    </>
  );

  return (
    <>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>

      <AnimatePresence>
        <motion.div
          key={data.id}
          className="fixed inset-0 flex items-center justify-center pointer-events-auto"
          style={{ zIndex: UI_LAYERS.LOADING }}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: motionDuration }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onDismiss();
          }}
        >
          {!reducedMotion && (
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}

          {reducedMotion && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none" />
          )}

          {!reducedMotion && <LevelUpParticles particles={particles} />}

          <FocusTrap initialFocusRef={closeButtonRef}>
            <motion.div
              className="relative z-10 w-full max-w-md mx-4 rounded-xl border overflow-hidden bg-gradient-to-b from-[rgba(15,12,5,0.95)] to-[rgba(10,8,3,0.98)] border-amber-500/40 shadow-[0_0_40px_rgba(212,146,10,0.15)]"
              {...dialogProps}
              aria-describedby={descriptionId}
              initial={reducedMotion ? false : { scale: 0.5, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: reducedMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-amber-500/50 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-amber-500/50 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-amber-500/50 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-amber-500/50 rounded-br-xl" />

              {cardContent}

              {!reducedMotion && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(212, 146, 10, 0.015) 2px, rgba(212, 146, 10, 0.015) 4px)',
                  }}
                />
              )}
            </motion.div>
          </FocusTrap>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
