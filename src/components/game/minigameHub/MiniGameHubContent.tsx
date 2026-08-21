import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { MiniGameCard } from '@/components/game/minigameHub/MiniGameCard';
import { useMinigameHubNavigation } from '@/components/game/minigameHub/useMinigameHubNavigation';
import { audioEngine } from '@/engine/AudioEngine';
import { requestMinigameLaunch } from '@/engine/minigame/hub/minigameLaunch';
import {
  MINIGAME_HUB_GAMES,
  MINIGAME_HUB_LABELS,
  type MinigameHubGameType,
} from '@/engine/minigame/hub/minigameHubConstants';
import {
  buildHubOpenAnnouncement,
  buildLaunchFailureMessage,
  getHubCardStaggerDelay,
  safePlayHubSfx,
} from '@/engine/minigame/hub/minigameHubPresentation';
import { toast } from '@/hooks/use-toast';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

import { devWarn } from '@/shared/utils/devLog';
type MiniGameHubContentProps = {
  onClose: () => void;
};

export function MiniGameHubContent({ onClose }: MiniGameHubContentProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const reducedMotion = useEffectiveReducedMotion();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    setLiveMessage(buildHubOpenAnnouncement());
  }, []);

  const handleLaunch = useCallback(
    (gameType: MinigameHubGameType) => {
      const result = requestMinigameLaunch(gameType);
      if (!result.ok) {
        if (import.meta.env.DEV) {
          devWarn('[MiniGameHub] launch failed:', result.reason, gameType);
        }
        toast({
          title: MINIGAME_HUB_LABELS.unavailableTitle,
          description: buildLaunchFailureMessage(result.reason),
          variant: 'destructive',
        });
        return;
      }

      safePlayHubSfx(audioEngine.playSfx.bind(audioEngine), 'confirm');
      onClose();
    },
    [onClose],
  );

  useMinigameHubNavigation({
    enabled: true,
    selectedIndex,
    setSelectedIndex,
    onLaunch: handleLaunch,
  });

  const panelMotion = reducedMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { scale: 0.92, opacity: 0, y: 30 },
        animate: { scale: 1, opacity: 1, y: 0 },
        exit: { scale: 0.92, opacity: 0, y: 30 },
        transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
      };

  const titleMotion = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: -10 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.1, duration: 0.4 },
      };

  const subtitleMotion = reducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { delay: 0.2, duration: 0.4 },
      };

  return (
    <FocusTrap initialFocusRef={closeButtonRef}>
      <motion.div className="relative z-10 mx-4 w-full max-w-4xl" {...panelMotion} {...dialogProps}>
        <div
          className="overflow-hidden rounded-lg border"
          style={{
            background:
              'linear-gradient(180deg, rgba(8, 12, 18, 0.98) 0%, rgba(5, 8, 14, 0.99) 100%)',
            borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.2)',
            boxShadow:
              '0 0 60px rgb(var(--cyber-cyan-rgb) / 0.06), 0 8px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.05)',
            clipPath:
              'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
          }}
        >
          <div
            className="flex items-center justify-between border-b px-4 py-2.5"
            style={{
              borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.15)',
              background: 'rgba(0, 0, 0, 0.4)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500/80" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-amber-400/80" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-red-500/80" aria-hidden="true" />
              <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/35">
                {MINIGAME_HUB_LABELS.terminalPath}
              </span>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md font-mono text-sm text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/70"
              aria-label={MINIGAME_HUB_LABELS.closeAria}
            >
              ✕
            </button>
          </div>

          <div className="px-6 pb-4 pt-6 text-center">
            <motion.h2
              {...titleProps}
              className="font-mono text-2xl font-bold uppercase tracking-[0.3em]"
              style={{
                color: 'rgb(var(--cyber-cyan-rgb) / 0.85)',
                textShadow: '0 0 20px rgb(var(--cyber-cyan-rgb) / 0.3)',
              }}
              {...titleMotion}
            >
              {MINIGAME_HUB_LABELS.title}
            </motion.h2>
            <motion.p
              className="mt-2 font-mono text-xs"
              style={{ color: 'rgba(148, 163, 184, 0.45)' }}
              {...subtitleMotion}
            >
              {MINIGAME_HUB_LABELS.subtitle}
            </motion.p>
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgb(var(--cyber-cyan-rgb) / 0.012) 2px, rgb(var(--cyber-cyan-rgb) / 0.012) 4px)',
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 px-6 pb-5">
            <div
              role="list"
              aria-label={MINIGAME_HUB_LABELS.title}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {MINIGAME_HUB_GAMES.map((game, idx) => (
                <motion.div
                  key={game.gameType}
                  initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : {
                          delay: getHubCardStaggerDelay(idx, reducedMotion),
                          duration: 0.4,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        }
                  }
                >
                  <MiniGameCard
                    game={game}
                    selected={selectedIndex === idx}
                    reducedMotion={reducedMotion}
                    onLaunch={handleLaunch}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          <div
            className="flex items-center justify-center border-t px-6 py-3"
            style={{ borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.1)' }}
          >
            <div className="flex items-center gap-1.5">
              <kbd
                className="inline-flex h-5 items-center justify-center rounded border px-1.5 font-mono text-[10px]"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderColor: 'rgba(100, 116, 139, 0.25)',
                  color: 'rgba(148, 163, 184, 0.5)',
                }}
              >
                Esc
              </kbd>
              <span className="font-mono text-[10px] tracking-wide text-slate-500/40">
                {MINIGAME_HUB_LABELS.backHint}
              </span>
            </div>
          </div>
        </div>

        <div
          className="pointer-events-none absolute -left-px -top-px h-8 w-8"
          style={{
            borderTop: '2px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
            borderLeft: '2px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
            boxShadow: '-2px -2px 10px rgb(var(--cyber-cyan-rgb) / 0.1)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-px -top-px h-8 w-8"
          style={{
            borderTop: '2px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
            borderRight: '2px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
            boxShadow: '2px -2px 10px rgb(var(--cyber-cyan-rgb) / 0.1)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-px -left-px h-8 w-8"
          style={{
            borderBottom: '2px solid rgba(251, 191, 36, 0.2)',
            borderLeft: '2px solid rgba(251, 191, 36, 0.2)',
            boxShadow: '-2px 2px 10px rgba(251, 191, 36, 0.05)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-px -right-px h-8 w-8"
          style={{
            borderBottom: '2px solid rgba(251, 191, 36, 0.2)',
            borderRight: '2px solid rgba(251, 191, 36, 0.2)',
            boxShadow: '2px 2px 10px rgba(251, 191, 36, 0.05)',
          }}
          aria-hidden="true"
        />

        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </div>
      </motion.div>
    </FocusTrap>
  );
}
