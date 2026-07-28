import { Suspense, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { closeMinigame } from '@/shared/constants/minigames';
import type { MinigamePanelSetters } from '@/shared/constants/minigames';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { runOverlayCleanup } from './panelLifecycle';
import {
  LazyCodeBreakerGame,
  LazyOpenStackTerminalGame,
  LazyBashTerminalGame,
  LazyPoetryCompositionGame,
  LazyHackingGame,
  LazyMemoryPuzzleGame,
  LazyQuizGame,
  LazyRhythmGame,
} from './lazyMinigames';

type MinigameId =
  | 'codebreaker'
  | 'openstack_terminal'
  | 'bash_terminal'
  | 'poetry'
  | 'hacking'
  | 'memory'
  | 'quiz'
  | 'rhythm';

type Props = {
  codebreakerOpen: boolean;
  openstackTerminalOpen: boolean;
  bashTerminalOpen: boolean;
  poetryGameOpen: boolean;
  hackingGameOpen: boolean;
  memoryGameOpen: boolean;
  quizGameOpen: boolean;
  rhythmGameOpen: boolean;
  minigameSetters: MinigamePanelSetters;
};

function resolveActiveMinigame(props: Props): MinigameId | null {
  if (props.codebreakerOpen) return 'codebreaker';
  if (props.openstackTerminalOpen) return 'openstack_terminal';
  if (props.bashTerminalOpen) return 'bash_terminal';
  if (props.poetryGameOpen) return 'poetry';
  if (props.hackingGameOpen) return 'hacking';
  if (props.memoryGameOpen) return 'memory';
  if (props.quizGameOpen) return 'quiz';
  if (props.rhythmGameOpen) return 'rhythm';
  return null;
}

function MinigameLoadingFallback() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      style={{ zIndex: UI_LAYERS.MINIGAME }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      tabIndex={-1}
    >
      <p className="text-cyan-300/80 text-sm font-mono tracking-wide">Загрузка мини-игры…</p>
    </div>
  );
}

/** Single AnimatePresence for all minigames — one layout exit path instead of eight.
 *  FocusTrap wraps every CodeBreaker/Bash/etc. overlay (Sprint A + D). */
export function OrchestratorMinigameOverlays(props: Props) {
  const active = resolveActiveMinigame(props);
  const { minigameSetters } = props;

  useEffect(() => {
    if (!active) return;
    return () => runOverlayCleanup(`minigame:${active}`);
  }, [active]);

  return (
    <AnimatePresence initial={false} mode="wait">
      {active && (
        <FocusTrap key={active} active>
          <Suspense fallback={<MinigameLoadingFallback />}>
            {active === 'codebreaker' && (
              <LazyCodeBreakerGame onClose={() => closeMinigame('codebreaker', minigameSetters)} />
            )}
            {active === 'openstack_terminal' && (
              <LazyOpenStackTerminalGame onClose={() => closeMinigame('openstack_terminal', minigameSetters)} />
            )}
            {active === 'bash_terminal' && (
              <LazyBashTerminalGame onClose={() => closeMinigame('bash_terminal', minigameSetters)} />
            )}
            {active === 'poetry' && (
              <LazyPoetryCompositionGame onClose={() => closeMinigame('poetry', minigameSetters)} />
            )}
            {active === 'hacking' && (
              <LazyHackingGame onClose={() => closeMinigame('hacking', minigameSetters)} />
            )}
            {active === 'memory' && (
              <LazyMemoryPuzzleGame onClose={() => closeMinigame('memory', minigameSetters)} />
            )}
            {active === 'quiz' && (
              <LazyQuizGame onClose={() => closeMinigame('quiz', minigameSetters)} />
            )}
            {active === 'rhythm' && (
              <LazyRhythmGame onClose={() => closeMinigame('rhythm', minigameSetters)} />
            )}
          </Suspense>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
}
