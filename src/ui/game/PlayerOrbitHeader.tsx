'use client';

/**
 * Верхняя «орбита» героя: портрет слева; справа — полосы в духе WoW: Здоровье (энергия), Карма (слот «маны»), ниже — опыт.
 * Мобилка: компактные отступы, `safe-area`, без фиксированного перекрытия миникарты (она снизу справа).
 */
import { memo } from 'react';
import { motion } from 'framer-motion';
import type { PlayerState } from '@/data/types';
import { MAX_PLAYER_ENERGY } from '@/lib/energyConfig';
import { RPG_MAX_CHARACTER_LEVEL } from '@/lib/rpgLeveling';
import { useIsMobile } from '@/hooks/use-mobile';

const PORTRAIT_HOLO = 'from-cyan-500/90 via-fuchsia-600/80 to-slate-900/90';

/** Ресурсные полосы в духе WoW: портрет слева, справа — стек Health / «мана» (у нас — карма). */
function WoWStyleResourceBar({
  labelRu,
  labelEn,
  current,
  max,
  variant,
  visualLite,
  title,
}: {
  labelRu: string;
  labelEn: string;
  current: number;
  max: number;
  variant: 'health' | 'karma';
  visualLite: boolean;
  title: string;
}) {
  const safeMax = Math.max(1, max);
  const pct = Math.min(100, Math.max(0, (current / safeMax) * 100));
  const rounded = Math.round(current);
  const borderStyle =
    variant === 'health'
      ? { borderColor: 'rgb(21 128 61 / 0.55)' }
      : { borderColor: 'var(--game-ui-border-medium)' };
  const fillClass =
    variant === 'health'
      ? 'bg-gradient-to-r from-emerald-950/90 via-green-600 to-lime-400'
      : 'bg-gradient-to-r from-indigo-950/90 via-blue-600 to-cyan-300';
  const glow =
    variant === 'health' ? 'var(--game-ui-glow-stability)' : 'var(--game-ui-glow-mood)';

  return (
    <div
      className="min-w-0 w-full"
      title={title}
    >
      <div className="mb-0.5 flex items-center justify-between gap-1 font-mono text-[8px] uppercase tracking-wide sm:text-[9px]">
        <span className={variant === 'health' ? 'text-green-200/90' : 'text-sky-200/90'}>
          {labelRu}{' '}
          <span className="text-slate-500 normal-case">({labelEn})</span>
        </span>
        <span className="tabular-nums text-slate-300/90">
          {rounded}/{max}
        </span>
      </div>
      <div
        className="relative h-2 sm:h-2.5 overflow-hidden rounded-sm border bg-black/60"
        style={borderStyle}
        role="img"
        aria-label={`${labelRu}: ${rounded} из ${max}`}
      >
        <motion.div
          className={`h-full ${fillClass}`}
          initial={false}
          style={{ boxShadow: visualLite ? undefined : `0 0 6px ${glow}` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: visualLite ? 0.1 : 0.22, ease: 'easeOut' }}
        />
        {!visualLite && (
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
              backgroundSize: '45% 100%',
              animation: 'cyber-scan 2.4s linear infinite',
            }}
          />
        )}
      </div>
    </div>
  );
}

export type PlayerOrbitHeaderProps = {
  playerState: PlayerState;
  visualLite: boolean;
};

export const PlayerOrbitHeader = memo(function PlayerOrbitHeader({
  playerState,
  visualLite,
}: PlayerOrbitHeaderProps) {
  const narrow = useIsMobile() ?? false;
  const level = playerState.characterLevel;
  const xp = playerState.experience;
  const cap = Math.max(1, playerState.experienceToNextLevel);
  const xpPct = level >= RPG_MAX_CHARACTER_LEVEL ? 1 : Math.min(1, xp / cap);
  const atCap = level >= RPG_MAX_CHARACTER_LEVEL;

  return (
    <div
      data-exploration-ui
      className={`mr-1 flex shrink-0 items-center gap-2 sm:gap-3 ${narrow ? 'w-full max-w-full border-b pb-2' : ''}`}
      style={
        narrow
          ? { borderBottomColor: 'var(--game-ui-border-subtle)', borderBottomWidth: 1, borderBottomStyle: 'solid' }
          : undefined
      }
    >
      <div
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border font-mono text-lg font-bold text-white shadow-lg sm:h-14 sm:w-14 sm:text-xl"
        style={{
          borderColor: 'var(--game-ui-border-medium)',
          boxShadow: !visualLite ? 'var(--game-ui-shadow-floating)' : undefined,
          background: `linear-gradient(135deg, rgba(6,182,212,0.5), rgba(192,38,211,0.45), rgba(15,23,42,0.9))`,
        }}
        aria-hidden
      >
        <span className="drop-shadow-md">В</span>
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${PORTRAIT_HOLO} opacity-35 mix-blend-overlay`}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="truncate font-mono text-[11px] uppercase tracking-wide text-cyan-200/90 sm:text-xs">
            Володька
          </span>
          <span className="font-mono text-xs text-cyan-400/95 sm:text-sm" title="Уровень как «прожитые годы» опыта">
            {level} {atCap ? 'лет (макс.)' : 'лет'}
          </span>
        </div>

        <div className="w-full max-w-[15rem] space-y-1 sm:max-w-[17rem]">
          <WoWStyleResourceBar
            labelRu="Здоровье"
            labelEn="Health"
            current={playerState.energy}
            max={MAX_PLAYER_ENERGY}
            variant="health"
            visualLite={visualLite}
            title="Здоровье: сюжетная энергия (как HP). Трата на выборы, путешествия и проверки; сон и пассивная регенерация."
          />
          <WoWStyleResourceBar
            labelRu="Карма"
            labelEn="Karma"
            current={Math.max(0, Math.min(100, playerState.karma))}
            max={100}
            variant="karma"
            visualLite={visualLite}
            title="Карма — моральный ресурс (слот «маны»): ветвления, тон сцены, исходы; 0–100."
          />
        </div>

        <div className="w-full max-w-[15rem] sm:max-w-[17rem]">
          <div className="mb-0.5 flex justify-between text-[8px] font-mono text-slate-500 sm:text-[9px]">
            <span>опыт</span>
            <span>
              {atCap ? '—' : `${Math.floor(xp)} / ${cap}`}
            </span>
          </div>
          <div
            className="relative h-1 overflow-hidden rounded-sm border bg-black/50"
            style={{ borderColor: 'var(--game-ui-border-subtle)' }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-violet-600/90 to-fuchsia-500/80"
              initial={false}
              animate={{ width: `${xpPct * 100}%` }}
              transition={{ duration: visualLite ? 0.1 : 0.28, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
