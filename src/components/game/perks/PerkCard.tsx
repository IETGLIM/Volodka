import { memo, useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, Lock, Star } from 'lucide-react';
import { PERKS_MAP, type PerkDefinition } from '@/data/perks';
import { PERKS_PANEL_LABELS } from '@/engine/perks/perksPanelConstants';
import {
  getAcquiredCardMotion,
  getFlavorRevealTransition,
  getPerkCardVisualStyle,
  type PerkState,
} from '@/engine/perks/perksPanelPresentation';
import { resolvePerkLucideIcon } from '@/components/game/perks/perkIcons';

type PerkCardProps = {
  perk: PerkDefinition;
  state: PerkState;
  categoryColor: string;
  canAfford: boolean;
  reducedMotion: boolean;
  onAcquire: (id: string) => void;
};

export const PerkCard = memo(function PerkCard({
  perk,
  state,
  categoryColor,
  canAfford,
  reducedMotion,
  onAcquire,
}: PerkCardProps) {
  const [hovered, setHovered] = useState(false);
  const titleId = useId();
  const PerkIcon = resolvePerkLucideIcon(perk.icon);

  const isAcquired = state === 'acquired';
  const isAvailable = state === 'available';
  const isLocked = state === 'locked';
  const isExclusive = state === 'exclusive';

  const visual = getPerkCardVisualStyle(state, categoryColor, canAfford, reducedMotion);
  const acquiredMotion = getAcquiredCardMotion(reducedMotion, isAcquired);

  const stateLabel = isAcquired
    ? PERKS_PANEL_LABELS.stateAcquired
    : isLocked
      ? PERKS_PANEL_LABELS.stateLocked
      : isExclusive
        ? PERKS_PANEL_LABELS.stateExclusive
        : PERKS_PANEL_LABELS.stateAvailable;

  return (
    <motion.div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={false}
      animate={acquiredMotion.animate}
      transition={acquiredMotion.transition}
      role="listitem"
    >
      <article
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-desc`}
        className={`
          perk-card relative rounded-lg border p-3 transition-all duration-300
          ${isAvailable && canAfford ? 'cursor-pointer perk-card-hover-scale hover:scale-[1.02]' : ''}
          ${isLocked ? 'opacity-50' : ''}
          ${isExclusive ? 'opacity-40' : ''}
          ${visual.usePulse ? 'perk-card--pulse' : ''}
        `}
        style={{
          borderColor: visual.borderColor,
          background: visual.bgColor,
          ...visual.glowStyle,
        }}
      >
        <span className="sr-only">{stateLabel}</span>

        <div className="flex items-start gap-2.5">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 border"
            style={{
              borderColor: `${categoryColor}25`,
              background: isAcquired
                ? `${categoryColor}15`
                : isAvailable && canAfford
                  ? `${categoryColor}0c`
                  : isAvailable
                    ? `${categoryColor}06`
                    : 'rgba(0,0,0,0.3)',
              color: isAcquired || isAvailable ? categoryColor : 'rgba(100,116,139,0.5)',
              boxShadow:
                isAvailable && canAfford
                  ? `0 0 10px ${categoryColor}20, inset 0 0 4px ${categoryColor}08`
                  : 'none',
            }}
            aria-hidden="true"
          >
            {isAcquired ? (
              <Check className="size-4" style={{ color: categoryColor }} />
            ) : isLocked ? (
              <Lock className="size-3.5 text-slate-600" />
            ) : isExclusive ? (
              <AlertTriangle className="size-3.5 text-rose-400/50" />
            ) : (
              <PerkIcon className="size-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span
                id={titleId}
                className="text-xs font-semibold font-mono truncate"
                style={{
                  color: isAcquired ? categoryColor : isAvailable ? '#e2e8f0' : '#94a3b8',
                  textShadow: isAcquired
                    ? `0 0 8px ${categoryColor}60`
                    : isAvailable && canAfford
                      ? `0 0 6px ${categoryColor}30`
                      : 'none',
                }}
              >
                {perk.name}
              </span>
              {isAcquired && (
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{
                    background: `linear-gradient(135deg, ${categoryColor}25, ${categoryColor}10)`,
                    color: categoryColor,
                    border: `1px solid ${categoryColor}40`,
                    textShadow: `0 0 8px ${categoryColor}60, 0 0 16px ${categoryColor}30`,
                    boxShadow: `0 0 10px ${categoryColor}25, inset 0 0 6px ${categoryColor}10`,
                  }}
                >
                  {PERKS_PANEL_LABELS.activeBadge}
                </span>
              )}
            </div>
            <p id={`${titleId}-desc`} className="text-[11px] text-slate-400 leading-tight line-clamp-2">
              {perk.description}
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1" aria-hidden="true">
          {perk.effects.map((effect, idx) => (
            <span
              key={`${perk.id}-effect-${idx}`}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: isAcquired ? `${categoryColor}10` : isAvailable ? `${categoryColor}06` : 'rgba(0,0,0,0.3)',
                color: isAcquired ? `${categoryColor}cc` : isAvailable ? `${categoryColor}99` : '#64748b',
                border: `1px solid ${isAcquired ? `${categoryColor}15` : isAvailable ? `${categoryColor}08` : 'rgba(100,116,139,0.1)'}`,
              }}
            >
              {effect.description}
            </span>
          ))}
        </div>

        {perk.requiredPerks.length > 0 && !isAcquired && (
          <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
            <div
              className="h-px flex-1"
              style={{ background: `linear-gradient(90deg, ${categoryColor}20, ${categoryColor}08)` }}
            />
            <div className="flex items-center gap-1 text-[9px] font-mono" style={{ color: `${categoryColor}80` }}>
              <Lock className="size-2.5" />
              <span>← </span>
              {perk.requiredPerks.map((id, idx) => (
                <span key={id}>
                  <span style={{ color: `${categoryColor}aa` }}>{PERKS_MAP[id]?.name ?? id}</span>
                  {idx < perk.requiredPerks.length - 1 && <span className="text-slate-600"> + </span>}
                </span>
              ))}
            </div>
            <div
              className="h-px flex-1"
              style={{ background: `linear-gradient(90deg, ${categoryColor}08, ${categoryColor}20)` }}
            />
          </div>
        )}

        {isLocked && (
          <div className="mt-2 flex items-center gap-2 text-[9px] text-slate-500 font-mono">
            {perk.minLevel > 1 && (
              <span className="flex items-center gap-0.5">
                <Star className="size-2.5" aria-hidden="true" />
                {PERKS_PANEL_LABELS.levelRequirement(perk.minLevel)}
              </span>
            )}
            {perk.requiredPerks.length > 0 && (
              <span className="flex items-center gap-0.5">
                <Lock className="size-2.5" aria-hidden="true" />
                {perk.requiredPerks.map((id) => PERKS_MAP[id]?.name ?? id).join(', ')}
              </span>
            )}
          </div>
        )}

        {isExclusive && (
          <div className="mt-2 flex items-center gap-1 text-[9px] text-rose-400/60 font-mono">
            <AlertTriangle className="size-2.5" aria-hidden="true" />
            <span>{PERKS_PANEL_LABELS.exclusiveNotice}</span>
          </div>
        )}

        {isAvailable && canAfford && (
          <button
            type="button"
            onClick={() => onAcquire(perk.id)}
            aria-label={PERKS_PANEL_LABELS.acquireAria(perk.name)}
            className="mt-2.5 w-full py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400/70"
            style={{
              background: `linear-gradient(135deg, ${categoryColor}25, ${categoryColor}10)`,
              border: `1px solid ${categoryColor}50`,
              color: categoryColor,
              boxShadow: `0 0 16px ${categoryColor}20, 0 0 4px ${categoryColor}10, inset 0 0 8px ${categoryColor}08`,
              textShadow: `0 0 6px ${categoryColor}40`,
            }}
          >
            {PERKS_PANEL_LABELS.acquire}
          </button>
        )}

        {isAvailable && !canAfford && (
          <div
            className="mt-2.5 w-full py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider text-center opacity-50"
            style={{
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid rgba(100,116,139,0.15)',
              color: '#64748b',
            }}
            role="status"
          >
            {PERKS_PANEL_LABELS.noPoints}
          </div>
        )}

        <AnimatePresence>
          {hovered && perk.flavorText && !isLocked && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
              transition={getFlavorRevealTransition(reducedMotion)}
              className="overflow-hidden"
            >
              <p
                className="mt-2 text-[9px] italic leading-tight pt-2 border-t"
                style={{
                  color: `${categoryColor}80`,
                  borderColor: `${categoryColor}15`,
                  fontFamily: '"Georgia", "Times New Roman", serif',
                }}
              >
                «{perk.flavorText}»
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    </motion.div>
  );
});
