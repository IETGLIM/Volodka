'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/state';
import type { PlayerSkills, MoralChoice, ChoiceLogEntry } from '@/data/types';

/**
 * Фасад над действиями игрока.
 * На время миграции делегирует в gameStore.
 * После распила монолита будет обращаться напрямую к playerStore.
 */
export function usePlayerActions() {
  const addStat = useCallback(
    (
      stat: 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem',
      amount: number
    ) => {
      useGameStore.getState().addStat(stat, amount);
    },
    []
  );

  const addStress = useCallback((amount: number) => {
    useGameStore.getState().addStress(amount);
  }, []);

  const reduceStress = useCallback((amount: number) => {
    useGameStore.getState().reduceStress(amount);
  }, []);

  const clearPanicMode = useCallback(() => {
    useGameStore.getState().clearPanicMode();
  }, []);

  const addSkill = useCallback((skill: keyof PlayerSkills, amount: number) => {
    useGameStore.getState().addSkill(skill, amount);
  }, []);

  const addSkillPoints = useCallback((points: number) => {
    useGameStore.getState().addSkillPoints(points);
  }, []);

  const addExperience = useCallback((amount: number, source?: string) => {
    useGameStore.getState().addExperience(amount, source);
  }, []);

  const setFlag = useCallback((flag: string) => {
    useGameStore.getState().setFlag(flag);
  }, []);

  const unsetFlag = useCallback((flag: string) => {
    useGameStore.getState().unsetFlag(flag);
  }, []);

  const hasFlag = useCallback((flag: string): boolean => {
    return useGameStore.getState().hasFlag(flag);
  }, []);

  const collectPoem = useCallback((poemId: string) => {
    useGameStore.getState().collectPoem(poemId);
  }, []);

  const incrementPlayTime = useCallback(() => {
    useGameStore.getState().incrementPlayTime();
  }, []);

  const setPlayerAct = useCallback((act: number) => {
    useGameStore.getState().setPlayerAct(act);
  }, []);

  const visitNode = useCallback((nodeId: string) => {
    useGameStore.getState().visitNode(nodeId);
  }, []);

  const addMoralChoice = useCallback((choice: MoralChoice) => {
    useGameStore.getState().addMoralChoice(choice);
  }, []);

  const pushChoiceLog = useCallback(
    (entry: Omit<ChoiceLogEntry, 'id' | 'at'> & { id?: string; at?: number }) => {
      useGameStore.getState().pushChoiceLog(entry);
    },
    []
  );

  return {
    addStat,
    addStress,
    reduceStress,
    clearPanicMode,
    addSkill,
    addSkillPoints,
    addExperience,
    setFlag,
    unsetFlag,
    hasFlag,
    collectPoem,
    incrementPlayTime,
    setPlayerAct,
    visitNode,
    addMoralChoice,
    pushChoiceLog,
  };
}
