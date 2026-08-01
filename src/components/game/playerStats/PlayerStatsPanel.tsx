import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, ChevronUp, X, Zap } from 'lucide-react';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  getBorderGlowAnimate,
  getEffectRowMotion,
  getEffectRowTransition,
  getEnergyColor,
  getPanelSlideTransition,
  getStressColor,
  computeXpProgressPct,
  PLAYER_STATS_COLORS,
  PLAYER_STATS_SKILL_COLORS,
} from '@/engine/playerStats/playerStatsPanelPresentation';
import {
  PLAYER_STATS_DISPLAY_SKILLS,
  PLAYER_STATS_PANEL_LABELS,
  PLAYER_STATS_SKILL_LABELS,
} from '@/engine/playerStats/playerStatsPanelConstants';
import { getStatusEffectById } from '@/data/statusEffects';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  KarmaRing,
  SectionHeader,
  SkillMiniBar,
  StatBar,
  StatusEffectRow,
  XpProgressBar,
} from '@/components/game/playerStats/PlayerStatsPanelSections';
import { resolvePlayerStatsSkillIcon } from '@/components/game/playerStats/skillIcons';
import { usePlayerStatsPanelData } from '@/components/game/playerStats/usePlayerStatsPanelData';

export type PlayerStatsPanelProps = {
  open: boolean;
  onClose: () => void;
};

function PlayerStatsPanelInner({ open, onClose }: PlayerStatsPanelProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const [openAnnouncement, setOpenAnnouncement] = useState('');
  const data = usePlayerStatsPanelData(open, onClose);

  const xpPct = computeXpProgressPct(data.xp, data.xpToNextLevel);
  const panelTransition = getPanelSlideTransition(data.reducedMotion);
  const borderGlow = getBorderGlowAnimate(data.reducedMotion, PLAYER_STATS_COLORS.cyan);
  const effectRowMotion = getEffectRowMotion(data.reducedMotion);

  useEffect(() => {
    if (!open) {
      setOpenAnnouncement('');
      return;
    }
    setOpenAnnouncement(PLAYER_STATS_PANEL_LABELS.openedAnnouncement);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <FocusTrap initialFocusRef={closeButtonRef}>
          <motion.div
            key="player-stats-panel"
            {...dialogProps}
            className="fixed inset-y-0 left-0 pointer-events-auto stats-panel-container"
            style={{ zIndex: UI_LAYERS.PANEL, width: 'min(320px, 85vw)' }}
            initial={data.reducedMotion ? false : { x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={data.reducedMotion ? { opacity: 0 } : { x: '-100%', opacity: 0 }}
            transition={panelTransition}
          >
            <div
              className="relative h-full flex flex-col border-r overflow-hidden"
              style={{
                background:
                  'linear-gradient(180deg, rgba(2,6,23,0.95) 0%, rgba(8,12,28,0.92) 50%, rgba(4,8,18,0.90) 100%)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRight: `1px solid ${PLAYER_STATS_COLORS.cyan}25`,
              }}
            >
              <div
                aria-hidden="true"
                className="corner-bracket corner-bracket-tl"
                style={{ borderColor: `${PLAYER_STATS_COLORS.cyan}35` }}
              />
              <div
                aria-hidden="true"
                className="corner-bracket corner-bracket-tr"
                style={{ borderColor: `${PLAYER_STATS_COLORS.cyan}35` }}
              />
              <div
                aria-hidden="true"
                className="corner-bracket corner-bracket-bl"
                style={{ borderColor: `${PLAYER_STATS_COLORS.cyan}35` }}
              />
              <div
                aria-hidden="true"
                className="corner-bracket corner-bracket-br"
                style={{ borderColor: `${PLAYER_STATS_COLORS.cyan}35` }}
              />

              {!data.reducedMotion && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none overflow-hidden stats-panel-scanline"
                />
              )}

              {borderGlow && (
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none"
                  animate={borderGlow}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              <span className="sr-only" aria-live="polite">
                {openAnnouncement}
              </span>

              <div className="flex items-center justify-between px-4 pt-4 pb-2 relative z-10">
                <div className="flex items-center gap-2">
                  <ChevronUp
                    className="size-4 rotate-90"
                    aria-hidden="true"
                    style={{
                      color: PLAYER_STATS_COLORS.cyan,
                      filter: `drop-shadow(0 0 4px ${PLAYER_STATS_COLORS.cyan}50)`,
                    }}
                  />
                  <h2
                    {...titleProps}
                    className="text-sm font-mono font-bold tracking-wider uppercase"
                    style={{
                      color: PLAYER_STATS_COLORS.cyan,
                      textShadow: `0 0 8px ${PLAYER_STATS_COLORS.cyan}40`,
                    }}
                  >
                    {PLAYER_STATS_PANEL_LABELS.title}
                  </h2>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={data.handleClose}
                  className="w-7 h-7 flex items-center justify-center rounded-md close-btn-glow transition-all duration-200"
                  style={{ border: `1px solid ${PLAYER_STATS_COLORS.cyan}25`, color: PLAYER_STATS_COLORS.slate }}
                  aria-label={PLAYER_STATS_PANEL_LABELS.closeAria}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto game-scrollbar px-4 pb-6 relative z-10 space-y-4">
                <div>
                  <SectionHeader title={PLAYER_STATS_PANEL_LABELS.sectionAttributes} />

                  <div className="flex items-center gap-2 mb-2.5">
                    <Zap
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                      style={{
                        color: getEnergyColor(data.energy),
                        filter: `drop-shadow(0 0 4px ${getEnergyColor(data.energy)}50)`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-mono text-slate-300/70 stat-label">
                          {PLAYER_STATS_PANEL_LABELS.energy}
                        </span>
                        <span
                          className="text-[10px] font-mono font-bold data-bar-label"
                          style={{
                            color: getEnergyColor(data.energy),
                            textShadow: `0 0 4px ${getEnergyColor(data.energy)}40`,
                          }}
                        >
                          {data.energy}/100
                        </span>
                      </div>
                      <StatBar
                        value={data.energy}
                        max={100}
                        color={getEnergyColor(data.energy)}
                        label={PLAYER_STATS_PANEL_LABELS.energy}
                        reducedMotion={data.reducedMotion}
                        lowWarning
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2.5">
                    <Brain
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                      style={{
                        color: getStressColor(data.stress),
                        filter: `drop-shadow(0 0 4px ${getStressColor(data.stress)}50)`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-mono text-slate-300/70 stat-label">
                          {PLAYER_STATS_PANEL_LABELS.stress}
                        </span>
                        <span
                          className="text-[10px] font-mono font-bold data-bar-label"
                          style={{
                            color: getStressColor(data.stress),
                            textShadow: `0 0 4px ${getStressColor(data.stress)}40`,
                          }}
                        >
                          {data.stress}/100
                        </span>
                      </div>
                      <StatBar
                        value={data.stress}
                        max={100}
                        color={getStressColor(data.stress)}
                        label={PLAYER_STATS_PANEL_LABELS.stress}
                        reducedMotion={data.reducedMotion}
                        highWarning
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <KarmaRing value={data.karma} reducedMotion={data.reducedMotion} />
                      <span className="text-[9px] font-mono text-slate-400/70 -mt-0.5">
                        {PLAYER_STATS_PANEL_LABELS.karma}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span
                          className="text-lg font-mono font-bold"
                          style={{
                            color: PLAYER_STATS_COLORS.amber,
                            textShadow: `0 0 8px ${PLAYER_STATS_COLORS.amber}40`,
                          }}
                        >
                          {data.level}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400/70">
                          {PLAYER_STATS_PANEL_LABELS.level}
                        </span>
                      </div>
                      <XpProgressBar pct={xpPct} reducedMotion={data.reducedMotion} />
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[8px] font-mono text-slate-500">
                          {PLAYER_STATS_PANEL_LABELS.xpProgress(data.xp, data.xpToNextLevel)}
                        </span>
                        <div className="flex gap-2">
                          {data.skillPoints > 0 && (
                            <span
                              className="text-[8px] font-mono font-bold"
                              style={{ color: PLAYER_STATS_COLORS.emerald }}
                            >
                              {PLAYER_STATS_PANEL_LABELS.skillPoints(data.skillPoints)}
                            </span>
                          )}
                          {data.perkPoints > 0 && (
                            <span
                              className="text-[8px] font-mono font-bold"
                              style={{ color: PLAYER_STATS_COLORS.amber }}
                            >
                              {PLAYER_STATS_PANEL_LABELS.perkPoints(data.perkPoints)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader title={PLAYER_STATS_PANEL_LABELS.sectionSkills} />
                  <div className="grid grid-cols-2 gap-1.5">
                    {PLAYER_STATS_DISPLAY_SKILLS.map((skillKey) => {
                      const IconComp = resolvePlayerStatsSkillIcon(skillKey);
                      const skillVal = data.skills[skillKey] ?? 0;
                      const color = PLAYER_STATS_SKILL_COLORS[skillKey] ?? PLAYER_STATS_COLORS.cyan;
                      const skillLabel = PLAYER_STATS_SKILL_LABELS[skillKey];

                      return (
                        <div
                          key={skillKey}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-md"
                          style={{
                            background: `linear-gradient(135deg, ${color}06, ${color}02)`,
                            border: `1px solid ${color}12`,
                          }}
                        >
                          <IconComp
                            className="size-3 shrink-0"
                            aria-hidden="true"
                            style={{ color, filter: `drop-shadow(0 0 3px ${color}40)` }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono text-slate-300/80 truncate stat-label">
                                {skillLabel}
                              </span>
                              <span
                                className="text-[9px] font-mono font-bold ml-1 data-bar-label"
                                style={{ color, textShadow: `0 0 4px ${color}30` }}
                              >
                                {skillVal}
                              </span>
                            </div>
                            <SkillMiniBar
                              value={skillVal}
                              color={color}
                              label={skillLabel}
                              reducedMotion={data.reducedMotion}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <SectionHeader title={PLAYER_STATS_PANEL_LABELS.sectionEffects} />
                  {data.activeEffects.length === 0 ? (
                    <div className="text-center py-3">
                      <span className="text-[10px] font-mono text-slate-500">
                        {PLAYER_STATS_PANEL_LABELS.noEffects}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {data.activeEffects.map((active) => {
                        const def = getStatusEffectById(active.id);
                        return (
                          <motion.div
                            key={active.id}
                            initial={effectRowMotion.initial}
                            animate={effectRowMotion.animate}
                            transition={getEffectRowTransition(data.reducedMotion)}
                          >
                            <StatusEffectRow
                              effect={def}
                              remainingHours={active.remainingHours}
                              stacks={active.stacks}
                            />
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
}

export function PlayerStatsPanel(props: PlayerStatsPanelProps) {
  return (
    <ErrorBoundary name="PlayerStatsPanel" fallback={null}>
      <PlayerStatsPanelInner {...props} />
    </ErrorBoundary>
  );
}
