import { useCallback, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import {
  CELL_INPUT_HIGHLIGHT_MS,
  CORRECT_ROUND_DELAY_MS,
  DIFFICULTY_CONFIG,
  GAME_OVER_DELAY_MS,
  MAX_LIVES,
  SIMPLIFIED_SHOW_PAUSE_MS,
  START_DELAY_MS,
  WRONG_REPLAY_DELAY_MS,
  type MemoryDifficulty,
  type MemoryGamePhase,
} from '@/engine/minigame/memory/memoryPuzzleConstants';
import {
  calculateMemoryRewards,
  generatePattern,
  getEffectiveShowTiming,
} from '@/engine/minigame/memory/memoryPuzzlePresentation';
import { useSafeTimeouts } from '@/components/game/memoryPuzzle/useSafeTimeouts';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGameStore } from '@/store/gameStore';

export function useMemoryPuzzleGame(onClose: () => void) {
  const reducedMotion = useEffectiveReducedMotion();
  const simplified = reducedMotion;

  const [difficulty, setDifficulty] = useState<MemoryDifficulty>('hacker');
  const [gamePhase, setGamePhase] = useState<MemoryGamePhase>('setup');
  const [pattern, setPattern] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const [correctWave, setCorrectWave] = useState(false);
  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [rewardsClaimed, setRewardsClaimed] = useState(false);
  const [patternShowing, setPatternShowing] = useState(false);
  const [focusedCell, setFocusedCell] = useState(0);

  const { setSafeTimeout, clearTimeouts } = useSafeTimeouts();
  const config = DIFFICULTY_CONFIG[difficulty];
  const showTiming = getEffectiveShowTiming(difficulty, simplified);

  const transitionToInput = useCallback(() => {
    setPatternShowing(false);
    setGamePhase('input');
    setPlayerInput([]);
    setActiveCell(null);
  }, []);

  const showPattern = useCallback(
    (pat: number[]) => {
      clearTimeouts();
      setPatternShowing(true);
      setGamePhase('showing');
      setActiveCell(null);

      if (simplified) {
        setSafeTimeout(transitionToInput, SIMPLIFIED_SHOW_PAUSE_MS);
        return;
      }

      pat.forEach((cellIdx, i) => {
        setSafeTimeout(() => {
          setActiveCell(cellIdx);

          setSafeTimeout(() => {
            setActiveCell(null);

            if (i === pat.length - 1) {
              setSafeTimeout(transitionToInput, showTiming.showDelay / 2);
            }
          }, showTiming.showDuration);
        }, i * (showTiming.showDelay + showTiming.showDuration));
      });
    },
    [clearTimeouts, setSafeTimeout, showTiming.showDelay, showTiming.showDuration, simplified, transitionToInput],
  );

  const skipPatternShow = useCallback(() => {
    if (gamePhase !== 'showing' || !patternShowing) return;
    clearTimeouts();
    transitionToInput();
  }, [clearTimeouts, gamePhase, patternShowing, transitionToInput]);

  const startGame = useCallback(
    (diff: MemoryDifficulty) => {
      clearTimeouts();
      const cfg = DIFFICULTY_CONFIG[diff];
      const newPattern = generatePattern(cfg.startingLength);
      setDifficulty(diff);
      setPattern(newPattern);
      setPlayerInput([]);
      setRound(1);
      setLives(MAX_LIVES);
      setScore(0);
      setRoundsCompleted(0);
      setWrongCell(null);
      setCorrectWave(false);
      setRewardsClaimed(false);
      setFocusedCell(0);
      setGamePhase('showing');
      setSafeTimeout(() => showPattern(newPattern), START_DELAY_MS);
    },
    [clearTimeouts, setSafeTimeout, showPattern],
  );

  const handleCellClick = useCallback(
    (cellIndex: number) => {
      if (gamePhase !== 'input' || patternShowing) return;

      const currentInput = [...playerInput, cellIndex];
      const stepIndex = currentInput.length - 1;

      if (pattern[stepIndex] !== cellIndex) {
        setWrongCell(cellIndex);
        setGamePhase('wrong');
        setLives((prev) => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setSafeTimeout(() => setGamePhase('results'), GAME_OVER_DELAY_MS);
          } else {
            setSafeTimeout(() => {
              setWrongCell(null);
              setPlayerInput([]);
              showPattern(pattern);
            }, WRONG_REPLAY_DELAY_MS);
          }
          return newLives;
        });
        return;
      }

      setActiveCell(cellIndex);
      setSafeTimeout(() => setActiveCell(null), CELL_INPUT_HIGHLIGHT_MS);
      setPlayerInput(currentInput);

      if (currentInput.length === pattern.length) {
        const roundScore = Math.round(pattern.length * config.multiplier * 10);
        setScore((prev) => prev + roundScore);
        setRoundsCompleted((prev) => prev + 1);
        setGamePhase('correct');
        setCorrectWave(true);

        setSafeTimeout(() => {
          setCorrectWave(false);
          setActiveCell(null);
          const newPattern = generatePattern(pattern.length + 1, pattern);
          setPattern(newPattern);
          setPlayerInput([]);
          setRound((prev) => prev + 1);
          showPattern(newPattern);
        }, CORRECT_ROUND_DELAY_MS);
      }
    },
    [config.multiplier, gamePhase, pattern, patternShowing, playerInput, setSafeTimeout, showPattern],
  );

  const handleClose = useCallback(() => {
    clearTimeouts();
    onClose();
  }, [clearTimeouts, onClose]);

  const handleClaimRewards = useCallback(() => {
    if (rewardsClaimed) return;
    const rewards = calculateMemoryRewards(roundsCompleted);
    const store = useGameStore.getState();

    store.addXp(rewards.xpReward);
    store.addKarma(rewards.karmaReward);
    store.addSkill('coding', rewards.codingSkill);
    store.setFlag('memory_puzzle_complete', true);

    eventBus.emit('minigame:complete', {
      gameType: 'memory',
      success: true,
      reward: [
        { type: 'addXp', value: rewards.xpReward },
        { type: 'addKarma', value: rewards.karmaReward },
      ],
    });

    setRewardsClaimed(true);
    handleClose();
  }, [handleClose, rewardsClaimed, roundsCompleted]);

  return {
    difficulty,
    setDifficulty,
    gamePhase,
    pattern,
    playerInput,
    activeCell,
    wrongCell,
    correctWave,
    round,
    lives,
    score,
    roundsCompleted,
    rewardsClaimed,
    patternShowing,
    focusedCell,
    setFocusedCell,
    config,
    simplified,
    startGame,
    handleCellClick,
    skipPatternShow,
    handleClaimRewards,
    handleClose,
  };
}
