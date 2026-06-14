import { useCallback, useEffect, useRef, useState } from 'react';
import {
  OPENSTACK_ALERT_DURATION_MS,
  OPENSTACK_COMMAND_DELAY_MS,
  OPENSTACK_PHASE_ADVANCE_MS,
  OPENSTACK_RETRY_DELAY_MS,
  OPENSTACK_TERMINAL_COLORS,
  OPENSTACK_TERMINAL_LABELS,
  OPENSTACK_TIME_LIMIT_SEC,
  isOpenStackPlayPhase,
  isTimerActivePhase,
} from '@/engine/minigame/openstack/openstackTerminalConstants';
import { OPENSTACK_TERMINAL_PHASES } from '@/engine/minigame/openstack/openstackTerminalPhases';
import {
  applyOpenStackFailure,
  applyOpenStackSuccess,
} from '@/engine/minigame/openstack/openstackTerminalRewards';
import {
  buildPhaseLiveAnnouncement,
  formatPhaseHeader,
  triggerOpenStackHaptic,
} from '@/engine/minigame/openstack/openstackTerminalPresentation';
import type {
  OpenStackGamePhase,
  TerminalLine,
} from '@/engine/minigame/openstack/openstackTerminalTypes';
import { useSafeTimeouts } from '@/components/game/memoryPuzzle/useSafeTimeouts';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';
import { useGamePrimitive, useGameStore } from '@/store/gameStore';

export function useOpenStackTerminalGame(onClose: () => void) {
  const reducedMotion = useEffectiveReducedMotion();
  const { phase: transitionPhase } = useTransitionDirector();
  const alreadySolved = useGamePrimitive((state) =>
    Boolean(state.playerState.flags?.openstack_terminal_solved),
  );

  const addSkill = useGameStore((state) => state.addSkill);
  const addKarma = useGameStore((state) => state.addKarma);
  const addStress = useGameStore((state) => state.addStress);
  const setFlag = useGameStore((state) => state.setFlag);

  const [phase, setPhase] = useState<OpenStackGamePhase>(() => (alreadySolved ? 'success' : 'alert'));
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [timeLeft, setTimeLeft] = useState(OPENSTACK_TIME_LIMIT_SEC);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const terminalRef = useRef<HTMLDivElement>(null);
  const wasPreviouslySolved = useRef(alreadySolved);
  const completedRef = useRef(alreadySolved);
  const isProcessingRef = useRef(false);
  const selectedOptionRef = useRef<number | null>(null);
  const { setSafeTimeout, clearTimeouts } = useSafeTimeouts();

  const syncProcessingRefs = useCallback((processing: boolean, selected: number | null) => {
    isProcessingRef.current = processing;
    selectedOptionRef.current = selected;
    setIsProcessing(processing);
    setSelectedOption(selected);
  }, []);

  const addTerminalLine = useCallback((text: string, color: string, isCommand = false) => {
    setTerminalLines((prev) => [...prev, { text, color, isCommand }]);
  }, []);

  const addTerminalLines = useCallback((text: string, color: string, isCommand = false) => {
    const lines = text.split('\n');
    setTerminalLines((prev) => [
      ...prev,
      ...lines.map((line) => ({ text: line, color, isCommand })),
    ]);
  }, []);

  const handleFailure = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimeouts();
    setPhase('failure');
    setLiveAnnouncement(OPENSTACK_TERMINAL_LABELS.outcomeFailureAlert);
    applyOpenStackFailure({ addSkill, addKarma, addStress, setFlag });
    triggerOpenStackHaptic('failure', reducedMotion);
  }, [addKarma, addSkill, addStress, clearTimeouts, reducedMotion, setFlag]);

  const handleSuccess = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimeouts();
    setPhase('success');
    setLiveAnnouncement(OPENSTACK_TERMINAL_LABELS.outcomeSuccessAlert);
    applyOpenStackSuccess({ addSkill, addKarma, addStress, setFlag });
    triggerOpenStackHaptic('success', reducedMotion);
  }, [addKarma, addSkill, addStress, clearTimeouts, reducedMotion, setFlag]);

  const handleClose = useCallback(() => {
    clearTimeouts();
    onClose();
  }, [clearTimeouts, onClose]);

  useEffect(() => {
    if (transitionPhase === 'loading') {
      handleClose();
    }
  }, [transitionPhase, handleClose]);

  useEffect(() => {
    if (!isTimerActivePhase(phase)) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          handleFailure();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, handleFailure]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  useEffect(() => {
    if (phase !== 'alert') return;

    const timer = window.setTimeout(() => {
      setPhase('diagnose');
      addTerminalLine(OPENSTACK_TERMINAL_LABELS.promptPrefix, OPENSTACK_TERMINAL_COLORS.command, true);
      addTerminalLine(OPENSTACK_TERMINAL_PHASES[0]?.prompt ?? '', OPENSTACK_TERMINAL_COLORS.prompt);
      setLiveAnnouncement(buildPhaseLiveAnnouncement('diagnose', 0));
    }, reducedMotion ? 0 : OPENSTACK_ALERT_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [phase, addTerminalLine, reducedMotion]);

  const selectOption = useCallback(
    (optionIndex: number) => {
      if (!isOpenStackPlayPhase(phase)) return;
      if (isProcessingRef.current || selectedOptionRef.current !== null) return;

      const currentPhase = OPENSTACK_TERMINAL_PHASES[phaseIndex];
      const option = currentPhase?.options[optionIndex];
      if (!currentPhase || !option) return;

      syncProcessingRefs(true, optionIndex);
      setLiveAnnouncement(OPENSTACK_TERMINAL_LABELS.liveRegionProcessing);

      addTerminalLine(
        `${OPENSTACK_TERMINAL_LABELS.promptPrefix}${option.command}`,
        OPENSTACK_TERMINAL_COLORS.command,
        true,
      );

      setSafeTimeout(() => {
        if (option.isCorrect) {
          addTerminalLines(option.successOutput ?? '', OPENSTACK_TERMINAL_COLORS.success);
          addTerminalLine('', OPENSTACK_TERMINAL_COLORS.success);
          setLiveAnnouncement(OPENSTACK_TERMINAL_LABELS.liveRegionSuccess);

          const nextPhaseIdx = phaseIndex + 1;
          if (nextPhaseIdx < OPENSTACK_TERMINAL_PHASES.length) {
            setSafeTimeout(() => {
              const nextPhase = OPENSTACK_TERMINAL_PHASES[nextPhaseIdx];
              if (!nextPhase) return;

              setPhaseIndex(nextPhaseIdx);
              setPhase(nextPhase.id);
              addTerminalLine('', OPENSTACK_TERMINAL_COLORS.success);
              addTerminalLine(
                formatPhaseHeader(nextPhaseIdx + 1, nextPhase.title),
                OPENSTACK_TERMINAL_COLORS.phase,
              );
              addTerminalLine(nextPhase.prompt, OPENSTACK_TERMINAL_COLORS.prompt);
              addTerminalLine(OPENSTACK_TERMINAL_LABELS.promptPrefix, OPENSTACK_TERMINAL_COLORS.command, true);
              syncProcessingRefs(false, null);
              setLiveAnnouncement(buildPhaseLiveAnnouncement(nextPhase.id, nextPhaseIdx));
            }, OPENSTACK_PHASE_ADVANCE_MS);
          } else {
            setSafeTimeout(handleSuccess, OPENSTACK_PHASE_ADVANCE_MS);
          }
        } else {
          addTerminalLines(option.errorOutput ?? '', OPENSTACK_TERMINAL_COLORS.error);
          addTerminalLine('', OPENSTACK_TERMINAL_COLORS.error);
          setLiveAnnouncement(OPENSTACK_TERMINAL_LABELS.liveRegionFailure);

          setSafeTimeout(() => {
            addTerminalLine(OPENSTACK_TERMINAL_LABELS.promptPrefix, OPENSTACK_TERMINAL_COLORS.command, true);
            syncProcessingRefs(false, null);
          }, OPENSTACK_RETRY_DELAY_MS);
        }
      }, OPENSTACK_COMMAND_DELAY_MS);
    },
    [
      phase,
      phaseIndex,
      addTerminalLine,
      addTerminalLines,
      handleSuccess,
      setSafeTimeout,
      syncProcessingRefs,
    ],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      const num = Number.parseInt(event.key, 10);
      if (num >= 1 && num <= 4) {
        selectOption(num - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, selectOption]);

  return {
    reducedMotion,
    alreadySolved: wasPreviouslySolved.current,
    phase,
    phaseIndex,
    terminalLines,
    terminalRef,
    timeLeft,
    selectedOption,
    isProcessing,
    liveAnnouncement,
    currentPhaseConfig: OPENSTACK_TERMINAL_PHASES[phaseIndex],
    selectOption,
    handleClose,
  };
}
