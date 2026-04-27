'use client';

/**
 * Верхняя «орбита» героя: портрет, жизнь (энергия), карма как аналог маны (класс. RPG), уровень = «N лет».
 * Мобилка: компактные отступы, `safe-area`, без фиксированного перекрытия миникарты (она снизу справа).
 */
import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { PlayerState } from '@/data/types';
import { MAX_PLAYER_ENERGY } from '@/lib/energyConfig';
import { RPG_MAX_CHARACTER_LEVEL } from '@/lib/rpgLeveling';
import { useIsMobile } from '@/hooks/use-mobile';

const PORTRAIT_HOLO = 'from-cyan-500/90 via-fuchsia-600/80 to-slate-900/90';

const ORBIT_ENERGY_BUCKETS = 12;

function OrbitEnergyCells({ energy, visualLite }: { energy: number; visualLite: boolean }) {
  const maxEnergy = MAX_PLAYER_ENERGY;
  const filled = Math.max(0, Math.ceil((energy / maxEnergy) * ORBIT_ENERGY_BUCKETS));
  const cells = useMemo(
    () => Array.from({ length: ORBIT_ENERGY_BUCKETS }, (_, i) => ({ id: i, active: i < filled })),
    [filled],
  );
  return (
    <div className="flex gap-px" role="img" aria-label={`Энергия жизни ${energy} из ${maxEnergy}`}>
      {cells.map((c) => (
        <div
          key={c.id}
          className={`h-2 w-1.5 rounded-sm ${c.active ? 'bg-cyan-400' : 'bg-slate-800/70'}`}
          style={{
            boxShadow: c.active && !visualLite ? '0 0 3px rgba(34, 211, 238, 0.45)' : undefined,
          }}
        />
      ))}
    </div>
  );
}

function OrbitKarmaMana({ karma, visualLite }: { karma: number; visualLite: boolean }) {
  const v = Math.max(0, Math.min(100, karma));
  return (
    <div
      className="w-full min-w-[6.5rem] max-w-[10rem] sm:max-w-[12rem]"
      title="Карма — моральный ресурс, аналог маны: влияет на ветвления и исходы, не тратится как MP в бою."
    >
      <div className="mb-0.5 flex items-center justify-between text-[8px] font-mono uppercase tracking-wider text-fuchsia-300/90 sm:text-[9px]">
        <span className="bg-gradient-to-r from-fuchsia-300 to-violet-300 bg-clip-text text-transparent">mana // karma</span>
        <span className="text-fuchsia-200/80">{Math.round(v)}</span>
      </div>
      <div
        className="relative h-1.5 overflow-hidden rounded-sm border border-fuchsia-500/30 bg-black/50"
        role="img"
        aria-label={`Карма ${Math.round(v)} из 100`}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-violet-600/95 via-fuchsia-500/90 to-amber-200/80"
          initial={false}
          animate={{ width: `${v}%` }}
          transition={{ duration: visualLite ? 0.1 : 0.25, ease: 'easeOut' }}
        />
        {!visualLite && (
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
              backgroundSize: '40% 100%',
              animation: 'cyber-scan 2.2s linear infinite',
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
      className={`mr-1 flex shrink-0 gap-2 sm:gap-3 ${narrow ? 'w-full max-w-full border-b border-cyan-500/15 pb-2' : ''}`}
    >
      <div
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cyan-400/40 font-mono text-lg font-bold text-white shadow-lg sm:h-14 sm:w-14 sm:text-xl ${!visualLite ? 'shadow-cyan-500/20' : ''}`}
        style={{
          background: `linear-gradient(135deg, rgba(6,182,212,0.5), rgba(192,38,211,0.45), rgba(15,23,42,0.9))`,
        }}
        aria-hidden
      >
        <span className="drop-shadow-md">В</span>
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${PORTRAIT_HOLO} opacity-35 mix-blend-overlay`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="truncate font-mono text-[11px] uppercase tracking-wide text-cyan-200/90 sm:text-xs">
            Володька
          </span>
          <span className="font-mono text-xs text-cyan-400/95 sm:text-sm" title="Уровень как «прожитые годы» опыта">
            {level} {atCap ? 'лет (макс.)' : 'лет'}
          </span>
        </div>
        <div className="mt-1 w-full max-w-[14rem] sm:max-w-[16rem]">
          <div className="mb-0.5 flex justify-between text-[8px] font-mono text-slate-500 sm:text-[9px]">
            <span>опыт</span>
            <span>
              {atCap ? '—' : `${Math.floor(xp)} / ${cap}`}
            </span>
          </div>
          <div className="relative h-1 overflow-hidden rounded-sm border border-violet-500/25 bg-black/50">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-600/90 to-fuchsia-500/80"
              initial={false}
              animate={{ width: `${xpPct * 100}%` }}
              transition={{ duration: visualLite ? 0.1 : 0.28, ease: 'easeOut' }}
            />
          </div>
        </div>
        <div className="mt-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:gap-3">
          <div>
            <div className="mb-0.5 text-[8px] font-mono uppercase tracking-wider text-cyan-500/70 sm:text-[9px]">жизнь</div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs" title="Энергия / жизнь">
                ⚡
              </span>
              <OrbitEnergyCells energy={playerState.energy} visualLite={visualLite} />
              <span className="font-mono text-[9px] text-slate-500 sm:text-[10px]">
                {playerState.energy}/{MAX_PLAYER_ENERGY}
              </span>
            </div>
          </div>
          <OrbitKarmaMana karma={playerState.karma} visualLite={visualLite} />
        </div>
      </div>
    </div>
  );
});
