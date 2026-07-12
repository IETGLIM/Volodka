import { memo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MINIGAME_CARD_MIN_HEIGHT_PX,
  MINIGAME_HUB_LABELS,
  type MinigameHubGameDef,
  type MinigameHubGameType,
} from '@/engine/minigame/hub/minigameHubConstants';
import { shouldShowHubShimmer } from '@/engine/minigame/hub/minigameHubPresentation';

function DifficultyDots({
  count,
  max,
  accentRgb,
}: {
  count: number;
  max: number;
  accentRgb: string;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="inline-block h-2 w-2 rounded-full transition-all duration-300"
          style={{
            background: i < count ? `rgba(${accentRgb}, 0.85)` : 'rgba(100, 116, 139, 0.15)',
            boxShadow: i < count ? `0 0 6px rgba(${accentRgb}, 0.5)` : 'none',
          }}
        />
      ))}
      <span
        className="ml-1 font-mono text-[10px] uppercase tracking-wider"
        style={{ color: `rgba(${accentRgb}, 0.5)` }}
      >
        {count}/{max}
      </span>
    </div>
  );
}

type MiniGameCardProps = {
  game: MinigameHubGameDef;
  selected: boolean;
  reducedMotion: boolean;
  onLaunch: (gameType: MinigameHubGameType) => void;
};

export const MiniGameCard = memo(function MiniGameCard({
  game,
  selected,
  reducedMotion,
  onLaunch,
}: MiniGameCardProps) {
  const launchRef = useRef<HTMLButtonElement>(null);
  const showShimmer = shouldShowHubShimmer(reducedMotion);

  useEffect(() => {
    if (selected) {
      launchRef.current?.focus();
    }
  }, [selected]);

  const cardMotion = reducedMotion
    ? {}
    : {
        whileHover: { scale: 1.02 },
        transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
      };

  return (
    <motion.div className="relative group" {...cardMotion}>
      <div
        role="listitem"
        className="flex min-h-[var(--minigame-card-min-h)] flex-col gap-4 overflow-hidden rounded-lg border bg-slate-950/90 p-5 backdrop-blur-md transition-all duration-300"
        style={{
          ['--minigame-card-min-h' as string]: `${MINIGAME_CARD_MIN_HEIGHT_PX}px`,
          borderColor: selected
            ? `rgba(${game.accentRgb}, 0.55)`
            : `rgba(${game.accentRgb}, 0.2)`,
          boxShadow: selected
            ? `0 0 0 2px rgba(${game.accentRgb}, 0.35), 0 0 20px rgba(${game.accentRgb}, 0.12)`
            : `0 0 15px rgba(${game.accentRgb}, 0.04), inset 0 0 15px rgba(${game.accentRgb}, 0.02)`,
        }}
      >
        <div className="flex items-start gap-3">
          <span className="select-none text-2xl leading-none" role="img" aria-label={game.name}>
            {game.icon}
          </span>
          <div className="min-w-0 flex-1">
            <h3
              className="truncate font-mono text-sm font-bold uppercase tracking-wide"
              style={{ color: game.accentColor }}
            >
              {game.name}
            </h3>
            <p
              className="mt-1 line-clamp-3 font-mono text-xs leading-relaxed"
              style={{ color: 'rgba(148, 163, 184, 0.65)' }}
            >
              {game.description}
            </p>
          </div>
        </div>

        <div>
          <span
            className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider"
            style={{ color: 'rgba(148, 163, 184, 0.4)' }}
          >
            {MINIGAME_HUB_LABELS.difficulty}
          </span>
          <DifficultyDots
            count={game.difficulty}
            max={game.maxDifficulty}
            accentRgb={game.accentRgb}
          />
        </div>

        <button
          ref={launchRef}
          type="button"
          onClick={() => onLaunch(game.gameType)}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.15em] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            color: game.accentColor,
            background: `rgba(${game.accentRgb}, 0.08)`,
            border: `1px solid rgba(${game.accentRgb}, 0.25)`,
            outlineColor: game.accentColor,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `rgba(${game.accentRgb}, 0.18)`;
            e.currentTarget.style.borderColor = `rgba(${game.accentRgb}, 0.5)`;
            e.currentTarget.style.boxShadow = `0 0 20px rgba(${game.accentRgb}, 0.2), inset 0 0 12px rgba(${game.accentRgb}, 0.06)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `rgba(${game.accentRgb}, 0.08)`;
            e.currentTarget.style.borderColor = `rgba(${game.accentRgb}, 0.25)`;
            e.currentTarget.style.boxShadow = 'none';
          }}
          aria-label={MINIGAME_HUB_LABELS.launchAria(game.name)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {MINIGAME_HUB_LABELS.launch}
        </button>

        {showShimmer && (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            aria-hidden="true"
          >
            <div
              className="minigame-hub-shimmer absolute inset-0"
              style={{
                background: `linear-gradient(
                  115deg,
                  transparent 30%,
                  rgba(${game.accentRgb}, 0.04) 42%,
                  rgba(${game.accentRgb}, 0.08) 48%,
                  rgba(${game.accentRgb}, 0.04) 54%,
                  transparent 66%
                )`,
              }}
            />
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                boxShadow: `0 0 25px rgba(${game.accentRgb}, 0.1), inset 0 0 25px rgba(${game.accentRgb}, 0.03)`,
                border: `1px solid rgba(${game.accentRgb}, 0.15)`,
                borderRadius: '0.5rem',
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
});
