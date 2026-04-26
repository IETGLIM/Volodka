'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACHIEVEMENTS, checkAchievement } from '@/data/achievements';
import { STORY_NODES } from '@/data/storyNodes';
import { POEMS } from '@/data/poems';
import { eventBus } from '@/engine/EventBus';
import { sceneManager } from '@/engine/SceneManager';
import { coreLoop } from '@/engine/CoreLoop';
import { poemMechanics } from '@/engine/PoemMechanics';
import { initConsequencesSystem } from '@/engine/ConsequencesSystem';
import {
  startSceneStreamingCoordinator,
  disposeSceneStreamingCoordinator,
  getSceneStreamingCoordinator,
} from '@/engine/streaming/SceneStreamingCoordinator';
import { explorationHourToNarrativeTimeOfDay } from '@/game/conditions/timeOfDay';
import type { NPCRelation, PlayerState, PlayerSkills, SceneId } from '@/data/types';
import { asTrainablePlayerSkill } from '@/lib/trainablePlayerSkill';
import type { TravelToSceneOptions, TravelToSceneResult } from '@/state/gameStore';
import { useGameStore } from '@/state/gameStore';
import type { AppPhase } from '@/state/appStore';
import { useWorldState } from '@/hooks/useWorldState';
import { useWorldActions } from '@/hooks/useWorldActions';

export type StoreActionAdapter = {
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

export interface UseGameRuntimeParams {
  phase: AppPhase;
  currentNodeId: string;
  currentSceneId: SceneId;
  /** Актуальная 3D-локация при узле `explore_mode` (не перезаписываем стором сценой узла). */
  explorationCurrentSceneId?: SceneId;
  playerState: PlayerState;
  npcRelations: NPCRelation[];
  collectedPoems: string[];
  unlockedAchievements: string[];
  dialogueStoreActions: StoreActionAdapter;
  incrementPlayTime: () => void;
  travelToScene: (sceneId: SceneId, options?: TravelToSceneOptions) => TravelToSceneResult;
  collectPoem: (poemId: string) => void;
  addStat: (stat: 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem', amount: number) => void;
  addSkill: (skill: keyof PlayerSkills, amount: number) => void;
  setFlag: (flag: string) => void;
  unlockAchievement: (achievementId: string) => void;
  showEffectNotif: (text: string, type: 'poem' | 'stat' | 'quest' | 'flag' | 'energy', durationMs?: number) => void;
}

export function useGameRuntime(params: UseGameRuntimeParams) {
  const {
    phase,
    currentNodeId,
    currentSceneId,
    explorationCurrentSceneId,
    playerState,
    npcRelations,
    collectedPoems,
    unlockedAchievements,
    dialogueStoreActions,
    incrementPlayTime,
    travelToScene,
    collectPoem,
    addStat,
    addSkill,
    setFlag,
    unlockAchievement,
    showEffectNotif,
  } = params;

  const revealedPoemId = useGameStore((s) => s.revealedPoemId);
  const [activeCutsceneId, setActiveCutsceneId] = useState<string | null>(null);
  const [showLegacy, setShowLegacy] = useState(false);

  /** Иначе после onComplete снова срабатывает эффект и заставка зацикливается на том же узле. */
  const cutscenesCompletedRef = useRef(new Set<string>());
  const activeCutsceneIdRef = useRef<string | null>(null);
  /** Ключ для `cutscenesCompletedRef` при старте заставки (узел сюжета или explore-триггер). */
  const cutsceneCompletionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    activeCutsceneIdRef.current = activeCutsceneId;
  }, [activeCutsceneId]);

  const worldState = useWorldState();
  const { syncStreamingSnapshot } = useWorldActions();

  /**
   * ВРЕМЕННО: `require` не тянет `gameStore` в статический граф модуля хука.
   * После миграции ConsequencesSystem — передать снимок стора параметром.
   */
  const storeContext = useMemo(() => () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- см. комментарий выше
    const { useGameStore: gameStore } = require('@/state/gameStore') as typeof import('@/state/gameStore');
    const state = gameStore.getState();
    return {
      playerState: state.playerState,
      npcRelations: state.npcRelations,
      flags: state.playerState.flags,
      activeQuestIds: state.activeQuestIds,
      completedQuestIds: state.completedQuestIds,
      inventory: state.inventory.map((i) => i.item.id),
      visitedNodes: state.playerState.visitedNodes,
      narrativeTimeOfDay: explorationHourToNarrativeTimeOfDay(state.exploration.timeOfDay),
      equippedItemIds: state.playerState.equippedItemIds ?? [],
    };
  }, []);

  useEffect(() => {
    initConsequencesSystem(storeContext, dialogueStoreActions);
  }, [storeContext, dialogueStoreActions]);

  useEffect(() => {
    startSceneStreamingCoordinator();
    return () => {
      disposeSceneStreamingCoordinator();
    };
  }, []);

  /** HUD / вне Canvas: `exploration.streaming` зеркалит снимок координатора по шине сцен/чанков. */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sync = () => {
      try {
        const snap = getSceneStreamingCoordinator().getDebugSnapshot();
        syncStreamingSnapshot({
          activeChunkIds: [...snap.activeChunkIds],
          unloadingChunkIds: [...snap.unloadingChunkIds],
          prefetchQueueLength: snap.prefetchQueueLength,
          prefetchTargetsPreview: [...snap.prefetchTargetsPreview],
          budgetTextureBytesApprox: snap.budgetTextureBytesApprox,
          rapierActiveBodiesApprox: snap.rapierActiveBodiesApprox ?? 0,
        });
      } catch {
        /* disposed coordinator (StrictMode / уход из игры) */
      }
    };

    const unsubs = [
      eventBus.on('streaming:chunk_activated', sync),
      eventBus.on('streaming:chunk_deactivated', sync),
      eventBus.on('streaming:prefetch_warm_applied', sync),
      eventBus.on('scene:enter', sync),
    ];
    sync();

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [syncStreamingSnapshot]);

  /**
   * Prefetch warm: `requestIdleCallback` (fallback `setTimeout` 2s), `timeout` 3s — не грузить горячий кадр.
   * За один колбэк — не более 2× `drainPrefetchHeadApplyRetain` (см. координатор).
   */
  useEffect(() => {
    if (phase !== 'game') return;
    let cancelled = false;
    const idleRef = { id: 0 as number, kind: 'none' as 'ric' | 'to' | 'none' };

    function schedule() {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === 'function') {
        idleRef.kind = 'ric';
        idleRef.id = window.requestIdleCallback(run, { timeout: 3000 }) as unknown as number;
      } else {
        idleRef.kind = 'to';
        idleRef.id = window.setTimeout(run, 2000) as unknown as number;
      }
    }

    function run() {
      if (cancelled) return;
      try {
        const c = getSceneStreamingCoordinator();
        let n = 0;
        while (n < 2 && c.getDebugSnapshot().prefetchQueueLength > 0) {
          c.drainPrefetchHeadApplyRetain();
          n += 1;
        }
      } catch {
        /* coordinator disposed */
      }
      schedule();
    }

    schedule();

    return () => {
      cancelled = true;
      if (idleRef.kind === 'ric') {
        window.cancelIdleCallback?.(idleRef.id);
      } else if (idleRef.kind === 'to') {
        window.clearTimeout(idleRef.id);
      }
    };
  }, [phase]);

  useEffect(() => {
    poemMechanics.setCollectedPoems(collectedPoems);
  }, [collectedPoems]);

  useEffect(() => {
    if (phase !== 'game') return;
    const i = setInterval(() => incrementPlayTime(), 1000);
    return () => clearInterval(i);
  }, [phase, incrementPlayTime]);

  /**
   * Синхрон сцены сюжетного узла с 3D-локацией (`exploration.currentSceneId`).
   * В `explore_mode` не вызываем `travelToScene` (игрок мог переехать в другую 3D-локацию),
   * но обновляем `sceneManager` по фактической `exploration.currentSceneId`.
   */
  useEffect(() => {
    if (phase !== 'game') return;
    if (currentNodeId === 'explore_mode') {
      const sid = explorationCurrentSceneId ?? worldState.currentSceneId;
      sceneManager.transitionTo(sid);
      return;
    }
    sceneManager.transitionTo(currentSceneId);
    travelToScene(currentSceneId, { narrativeDriven: true });
  }, [phase, currentNodeId, currentSceneId, explorationCurrentSceneId, travelToScene, worldState.currentSceneId]);

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
    if (!storyNode?.cutscene) return;
    if (activeCutsceneId) return;
    const key = `${currentNodeId}::${storyNode.cutscene}`;
    if (cutscenesCompletedRef.current.has(key)) return;
    queueMicrotask(() => {
      cutsceneCompletionKeyRef.current = `${currentNodeId}::${storyNode.cutscene}`;
      setActiveCutsceneId(storyNode.cutscene!);
    });
  }, [phase, currentNodeId, activeCutsceneId]);

  const requestCutscene = useCallback((cutsceneId: string, completionKey: string) => {
    if (activeCutsceneIdRef.current) return;
    if (cutscenesCompletedRef.current.has(completionKey)) return;
    queueMicrotask(() => {
      cutsceneCompletionKeyRef.current = completionKey;
      setActiveCutsceneId(cutsceneId);
    });
  }, []);

  useEffect(() => {
    if (phase !== 'game') return;

    const poem = POEMS.find((p) => p.unlocksAt === currentNodeId);
    if (poem && !collectedPoems.includes(poem.id)) {
      collectPoem(poem.id);
      queueMicrotask(() => useGameStore.getState().setRevealedPoemId(poem.id));

      const insight = poemMechanics.collectPoem(poem.id);
      queueMicrotask(() => showEffectNotif(`СТИХ: "${poem.title}"`, 'poem'));
      if (insight) {
        for (const [stat, value] of Object.entries(insight.statBonuses)) {
          if (value && ['mood', 'creativity', 'stability', 'energy', 'karma', 'selfEsteem'].includes(stat)) {
            addStat(stat as 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem', value);
          }
        }
        for (const [skill, value] of Object.entries(insight.skillBonuses)) {
          if (!value) continue;
          const k = asTrainablePlayerSkill(skill);
          if (k != null) addSkill(k, value);
        }
        const unlocks = poemMechanics.getUnlockedChoices(poem.id);
        for (const unlock of unlocks) {
          setFlag(unlock.flag);
        }
      }

      eventBus.emit('poem:collected', { poemId: poem.id });
    }
  }, [phase, currentNodeId, collectedPoems, collectPoem, showEffectNotif, addStat, addSkill, setFlag]);

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
        relations: npcRelations.reduce(
          (acc, relation) => {
            acc[relation.id] = relation.value;
            return acc;
          },
          {} as Record<string, number>
        ),
        visitedLocations: [],
        endingsSeen: [],
      };
      if (checkAchievement(achievement, stateForCheck)) {
        unlockAchievement(achievement.id);
        eventBus.emit('achievement:unlocked', { achievementId: achievement.id });
      }
    });
  }, [
    phase,
    unlockedAchievements,
    collectedPoems,
    playerState.karma,
    playerState.flags,
    playerState.playTime,
    npcRelations,
    unlockAchievement,
  ]);

  const completeCutscene = useCallback(() => {
    const id = activeCutsceneIdRef.current;
    const key = cutsceneCompletionKeyRef.current ?? (id ? `${currentNodeId}::${id}` : null);
    if (key) cutscenesCompletedRef.current.add(key);
    cutsceneCompletionKeyRef.current = null;
    setActiveCutsceneId(null);
  }, [currentNodeId]);

  return {
    revealedPoemId,
    closePoemReveal: () => useGameStore.getState().setRevealedPoemId(null),
    activeCutsceneId,
    requestCutscene,
    completeCutscene,
    showLegacy,
    hideLegacy: () => setShowLegacy(false),
  };
}
