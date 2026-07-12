import { useCallback, useEffect, useMemo, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import {
  POETRY_COMPOSITION_LABELS,
  POETRY_COMPOSITION_TOTAL_ROUNDS,
  type PoetryCompositionGamePhase,
} from '@/engine/minigame/poetryComposition/poetryCompositionConstants';
import {
  buildWordBankOptions,
  calculatePoetryCompositionRewards,
  calculateRoundScore,
  flattenTemplateBlanks,
  getQualityRating,
  parseTemplateLines,
  pickRandomTemplates,
} from '@/engine/minigame/poetryComposition/poetryCompositionPresentation';
import { POETRY_COMPOSITION_TEMPLATES } from '@/engine/minigame/poetryComposition/poetryCompositionTemplates';
import type { WordOption } from '@/engine/minigame/poetryComposition/poetryCompositionTemplates';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';
import { useGameStore } from '@/store/gameStore';

export function usePoetryCompositionGame(onClose: () => void) {
  const reducedMotion = useEffectiveReducedMotion();
  const { phase: transitionPhase } = useTransitionDirector();
  const addXp = useGameStore((s) => s.addXp);
  const addKarma = useGameStore((s) => s.addKarma);
  const addSkill = useGameStore((s) => s.addSkill);
  const setFlag = useGameStore((s) => s.setFlag);

  const [selectedTemplates] = useState(() =>
    pickRandomTemplates(POETRY_COMPOSITION_TEMPLATES, POETRY_COMPOSITION_TOTAL_ROUNDS),
  );
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [gamePhase, setGamePhase] = useState<PoetryCompositionGamePhase>('playing');
  const [selectedBlank, setSelectedBlank] = useState<number | null>(null);
  const [filledBlanks, setFilledBlanks] = useState<Map<number, WordOption>>(new Map());
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const template = selectedTemplates[round]!;
  const blanks = useMemo(() => flattenTemplateBlanks(template), [template]);
  const allWordOptions = useMemo(() => buildWordBankOptions(blanks), [blanks]);
  const parsedLines = useMemo(() => parseTemplateLines(template), [template]);

  const usedWords = useMemo(() => {
    const used = new Set<string>();
    filledBlanks.forEach((option) => used.add(option.word));
    return used;
  }, [filledBlanks]);

  const allBlanksFilled = useMemo(
    () => blanks.every((_, index) => filledBlanks.has(index)),
    [blanks, filledBlanks],
  );

  const rewards = useMemo(() => calculatePoetryCompositionRewards(score), [score]);
  const qualityRating = useMemo(() => getQualityRating(score), [score]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (transitionPhase === 'loading') {
      handleClose();
    }
  }, [transitionPhase, handleClose]);

  useEffect(() => {
    if (!allBlanksFilled) return;
    setLiveAnnouncement(POETRY_COMPOSITION_LABELS.allBlanksFilled);
  }, [allBlanksFilled]);

  useEffect(() => {
    setLiveAnnouncement('');
  }, [round, gamePhase]);

  const handleBlankClick = useCallback(
    (blankIndex: number) => {
      if (filledBlanks.has(blankIndex)) {
        setFilledBlanks((prev) => {
          const next = new Map(prev);
          next.delete(blankIndex);
          return next;
        });
        setSelectedBlank(blankIndex);
        return;
      }
      setSelectedBlank(blankIndex);
    },
    [filledBlanks],
  );

  const handleWordClick = useCallback(
    (word: WordOption) => {
      if (usedWords.has(word.word)) return;

      let targetBlank = selectedBlank;
      if (targetBlank === null) {
        const firstEmpty = blanks.findIndex((_, index) => !filledBlanks.has(index));
        if (firstEmpty === -1) return;
        targetBlank = firstEmpty;
      }

      if (filledBlanks.has(targetBlank)) {
        const nextEmpty = blanks.findIndex(
          (_, index) => !filledBlanks.has(index) && index !== targetBlank,
        );
        if (nextEmpty === -1) return;
        targetBlank = nextEmpty;
      }

      setFilledBlanks((prev) => {
        const next = new Map(prev);
        next.set(targetBlank!, word);
        return next;
      });

      const nextEmpty = blanks.findIndex(
        (_, index) => !filledBlanks.has(index) && index !== targetBlank,
      );
      setSelectedBlank(nextEmpty !== -1 ? nextEmpty : null);
    },
    [selectedBlank, blanks, filledBlanks, usedWords],
  );

  const handleFinishRound = useCallback(() => {
    const roundScore = calculateRoundScore(filledBlanks);
    setScore((prev) => prev + roundScore);
    setRoundScores((prev) => [...prev, roundScore]);

    if (round + 1 >= POETRY_COMPOSITION_TOTAL_ROUNDS) {
      setGamePhase('results');
      return;
    }

    setRound((prev) => prev + 1);
    setSelectedBlank(null);
    setFilledBlanks(new Map());
  }, [round, filledBlanks]);

  const handleClaimRewards = useCallback(() => {
    addXp(rewards.xpReward);
    addKarma(rewards.karmaReward);
    addSkill('writing', 1);
    setFlag('poetry_composition_complete', true);

    eventBus.emit('minigame:complete', {
      gameType: 'poetry',
      success: true,
      reward: [{ type: 'addKarma', value: rewards.karmaReward }],
    });

    handleClose();
  }, [addXp, addKarma, addSkill, setFlag, rewards, handleClose]);

  return {
    reducedMotion,
    gamePhase,
    round,
    score,
    roundScores,
    template,
    parsedLines,
    allWordOptions,
    selectedBlank,
    filledBlanks,
    usedWords,
    allBlanksFilled,
    liveAnnouncement,
    rewards,
    qualityRating,
    totalRounds: POETRY_COMPOSITION_TOTAL_ROUNDS,
    handleClose,
    handleBlankClick,
    handleWordClick,
    handleFinishRound,
    handleClaimRewards,
  };
}

export type PoetryCompositionGameController = ReturnType<typeof usePoetryCompositionGame>;
