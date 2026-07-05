import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Monitor, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { OpenStackTerminalAlert } from '@/components/game/openstackTerminal/OpenStackTerminalAlert';
import { OpenStackTerminalOutcome } from '@/components/game/openstackTerminal/OpenStackTerminalOutcome';
import { OpenStackTerminalPlay } from '@/components/game/openstackTerminal/OpenStackTerminalPlay';
import { useOpenStackTerminalGame } from '@/components/game/openstackTerminal/useOpenStackTerminalGame';
import '@/components/game/openstackTerminal/openstack-terminal.css';
import {
  OPENSTACK_TERMINAL_LABELS,
  isOpenStackPlayPhase,
} from '@/engine/minigame/openstack/openstackTerminalConstants';
import { getPanelMotionTransition, getTimeLeftColor } from '@/engine/minigame/openstack/openstackTerminalPresentation';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

export type OpenStackTerminalGameProps = {
  onClose: () => void;
};

function OpenStackTerminalGameInner({ onClose }: OpenStackTerminalGameProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const game = useOpenStackTerminalGame(onClose);
  const panelTransition = getPanelMotionTransition(game.reducedMotion);
  const timeColor = getTimeLeftColor(game.timeLeft);
  const reducedMotionClass = game.reducedMotion ? 'openstack-terminal--reduced-motion' : '';

  return (
    <FocusTrap initialFocusRef={closeButtonRef}>
      <motion.div
        initial={game.reducedMotion ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={game.reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
        transition={panelTransition}
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: UI_LAYERS.MINIGAME }}
        data-testid="openstack-terminal-game"
      >
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={game.handleClose}
          aria-hidden="true"
        />

        <div
          className={`relative z-10 w-full max-w-lg mx-4 rounded-lg border overflow-hidden openstack-terminal-panel ${reducedMotionClass}`}
          {...dialogProps}
        >
          <div className="openstack-terminal-header px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="size-5" style={{ color: '#44ff88' }} aria-hidden="true" />
              <h2
                {...titleProps}
                className="text-sm font-bold tracking-widest uppercase font-mono"
                style={{ color: '#44ff88' }}
              >
                {OPENSTACK_TERMINAL_LABELS.headerTitle}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {isOpenStackPlayPhase(game.phase) && (
                <>
                  <span className="text-sm font-bold font-mono flex items-center gap-1" style={{ color: timeColor }}>
                    <Clock className="size-3.5" aria-hidden="true" />
                    {OPENSTACK_TERMINAL_LABELS.timerSeconds(game.timeLeft)}
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{
                      color: '#ffcc00',
                      background: 'rgba(255, 204, 0, 0.1)',
                      border: '1px solid rgba(255, 204, 0, 0.25)',
                    }}
                    aria-label={`Фаза ${game.phaseIndex + 1} из 3`}
                  >
                    {OPENSTACK_TERMINAL_LABELS.phaseCounter(game.phaseIndex + 1, 3)}
                  </span>
                </>
              )}
              <button
                ref={closeButtonRef}
                type="button"
                onClick={game.handleClose}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={OPENSTACK_TERMINAL_LABELS.closeAria}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            className="openstack-terminal-scanlines absolute inset-0 pointer-events-none z-20"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <div className="sr-only" aria-live="polite">
              {game.liveAnnouncement}
            </div>

            <AnimatePresence mode="wait">
              {game.phase === 'alert' && (
                <OpenStackTerminalAlert key="alert" reducedMotion={game.reducedMotion} />
              )}

              {isOpenStackPlayPhase(game.phase) && (
                <OpenStackTerminalPlay
                  phaseIndex={game.phaseIndex}
                  currentPhaseConfig={game.currentPhaseConfig}
                  terminalLines={game.terminalLines}
                  terminalRef={game.terminalRef}
                  selectedOption={game.selectedOption}
                  isProcessing={game.isProcessing}
                  reducedMotion={game.reducedMotion}
                  onSelect={game.selectOption}
                />
              )}

              {(game.phase === 'success' || game.phase === 'failure') && (
                <OpenStackTerminalOutcome
                  phase={game.phase}
                  alreadySolved={game.alreadySolved}
                  reducedMotion={game.reducedMotion}
                  onClose={game.handleClose}
                  closeButtonRef={closeButtonRef}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </FocusTrap>
  );
}

export function OpenStackTerminalGame(props: OpenStackTerminalGameProps) {
  return (
    <ErrorBoundary name="OpenStackTerminalGame" fallback={null}>
      <OpenStackTerminalGameInner {...props} />
    </ErrorBoundary>
  );
}
