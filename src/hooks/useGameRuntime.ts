import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { ACHIEVEMENTS, checkAchievement } from '@/data/achievements';
import { STORY_NODES } from '@/data/storyNodes';
import { POEMS } from '@/data/poems';
import { eventBus } from '@/engine/EventBus';
import { sceneManager } from '@/engine/SceneManager';
import { coreLoop } from '@/engine/CoreLoop';
import { poemMechanics } from '@/engine/PoemMechanics';
import { initConsequencesSystem } from '@/engine/ConsequencesSystem';
import type { NPCRelation, PlayerState, SceneId } from '@/data/types';

type StoreActionAdapter = {
  addStat: (stat: 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem', amount: number) => void;
  addStress: (amount: number) => void;
  reduceStress: (amount: number) => void;
  setFlag: (flag: string) => void;
  unsetFlag: (flag: string) => void;
  updateNPCRelation: (npcId: string, change: number) => void;
  addItem: (itemId: string, quantity?: number) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  activateQuest: (questId: string) => void;
  updateQuestObjective: (questId: string, objectiveId: string, value?: number) => void;
  collectPoem: (poemId: string) => void;
  addSkill: (skill: string, amount: number) => void;
};

interface UseGameRuntimeParams {
  phase: 'loading' | 'intro' | 'menu' | 'game';
  currentNodeId: string;
  currentSceneId: SceneId;
  playerState: PlayerState;
  npcRelations: NPCRelation[];
  collectedPoems: string[];
  unlockedAchievements: string[];
  dialogueStoreActions: StoreActionAdapter;
  incrementPlayTime: () => void;
  setCurrentScene: (sceneId: SceneId) => void;
  collectPoem: (poemId: string) => void;
  addStat: (stat: 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem', amount: number) => void;
  addSkill: (skill: 'writing', amount: number) => void;
  setFlag: (flag: string) => void;
  unlockAchievement: (achievementId: string) => void;
  showEffectNotif: (text: string, type: 'poem' | 'stat' | 'quest' | 'flag' | 'energy', durationMs?: number) => void;
}

export function useGameRuntime(params: UseGameRuntimeParams) {
  const {
    phase,
    currentNodeId,
    currentSceneId,
    playerState,
    npcRelations,
    collectedPoems,
    unlockedAchievements,
    dialogueStoreActions,
    incrementPlayTime,
    setCurrentScene,
    collectPoem,
    addStat,
    addSkill,
    setFlag,
    unlockAchievement,
    showEffectNotif,
  } = params;

  const [revealedPoemId, setRevealedPoemId] = useState<string | null>(null);
  const [activeCutsceneId, setActiveCutsceneId] = useState<string | null>(null);
  const [showLegacy, setShowLegacy] = useState(false);

  const storeContext = useMemo(() => () => {
    const state = useGameStore.getState();
    return {
      playerState: state.playerState,
      npcRelations: state.npcRelations,
      flags: state.playerState.flags,
      activeQuestIds: state.activeQuestIds,
      completedQuestIds: state.completedQuestIds,
      inventory: state.inventory.map(i => i.item.id),
      visitedNodes: state.playerState.visitedNodes,
    };
  }, []);

  useEffect(() => {
    initConsequencesSystem(storeContext, dialogueStoreActions);
  }, [storeContext, dialogueStoreActions]);

  useEffect(() => {
    poemMechanics.setCollectedPoems(collectedPoems);
  }, [collectedPoems]);

  useEffect(() => {
    if (phase !== 'game') return;
    const i = setInterval(() => incrementPlayTime(), 1000);
    return () => clearInterval(i);
  }, [phase, incrementPlayTime]);

  useEffect(() => {
    sceneManager.transitionTo(currentSceneId);
    setCurrentScene(currentSceneId);
  }, [currentSceneId, setCurrentScene]);

  useEffect(() => {
    if (phase === 'game') {
      coreLoop.init({
        getStoreContext: storeContext,
        storeActions: dialogueStoreActions,
      });
      coreLoop.startLoop(currentNodeId, currentSceneId);
    }
    return () => {
      coreLoop.stopLoop();
    };
  }, [phase, currentNodeId, currentSceneId, storeContext, dialogueStoreActions]);

  useEffect(() => {
    if (phase !== 'game') return;

    const storyNode = STORY_NODES[currentNodeId];
    if (storyNode?.cutscene && !activeCutsceneId) {
      queueMicrotask(() => setActiveCutsceneId(storyNode.cutscene!));
    }

    const poem = POEMS.find(p => p.unlocksAt === currentNodeId);
    if (poem && !collectedPoems.includes(poem.id)) {
      collectPoem(poem.id);
      queueMicrotask(() => setRevealedPoemId(poem.id));

      const insight = poemMechanics.collectPoem(poem.id);
      queueMicrotask(() => showEffectNotif(`СТИХ: "${poem.title}"`, 'poem'));
      if (insight) {
        for (const [stat, value] of Object.entries(insight.statBonuses)) {
          if (value && ['mood', 'creativity', 'stability', 'energy', 'karma', 'selfEsteem'].includes(stat)) {
            addStat(stat as 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem', value);
          }
        }
        for (const [skill, value] of Object.entries(insight.skillBonuses)) {
          if (value) addSkill(skill as 'writing', value);
        }
        const unlocks = poemMechanics.getUnlockedChoices(poem.id);
        for (const unlock of unlocks) {
          setFlag(unlock.flag);
        }
      }

      eventBus.emit('poem:collected', { poemId: poem.id });
    }
  }, [phase, currentNodeId, activeCutsceneId, collectedPoems, collectPoem, showEffectNotif, addStat, addSkill, setFlag]);

  useEffect(() => {
    if (phase !== 'game') return;
    const storyNode = STORY_NODES[currentNodeId];
    if (storyNode?.type === 'ending' && !showLegacy) {
      const timer = setTimeout(() => setShowLegacy(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [phase, currentNodeId, showLegacy]);

  useEffect(() => {
    if (phase !== 'game') return;
    ACHIEVEMENTS.forEach((achievement) => {
      if (unlockedAchievements.includes(achievement.id)) return;
      const stateForCheck = {
        poemsCount: collectedPoems.length,
        karma: playerState.karma,
        poemsCollected: collectedPoems,
        flags: playerState.flags,
        playTime: playerState.playTime,
        completedQuests: [],
        relations: npcRelations.reduce((acc, relation) => {
          acc[relation.id] = relation.value;
          return acc;
        }, {} as Record<string, number>),
        visitedLocations: [],
        endingsSeen: [],
      };
      if (checkAchievement(achievement, stateForCheck)) {
        unlockAchievement(achievement.id);
        eventBus.emit('achievement:unlocked', { achievementId: achievement.id });
      }
    });
  }, [phase, unlockedAchievements, collectedPoems, playerState, npcRelations, unlockAchievement]);

  return {
    revealedPoemId,
    closePoemReveal: () => setRevealedPoemId(null),
    activeCutsceneId,
    completeCutscene: () => setActiveCutsceneId(null),
    showLegacy,
    hideLegacy: () => setShowLegacy(false),
  };
}
