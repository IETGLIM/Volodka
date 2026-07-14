import { useEffect, useRef, useState } from 'react';
import { shallow } from 'zustand/shallow';

import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { withHmrCleanup } from '@/shared/dev/hmrDispose';
import { SCENE_CONFIG } from '@/config/scenes';
import type { SceneId } from '@/shared/types/game';
import { formatSceneBanner, type SceneBannerPresentation } from '@/engine/world/worldAmbiencePresentation';
import { AUTO_SAVE_INTERVAL_MS } from '@/data/constants';
import { processExpiredTTLFlags } from '@/engine/PoemPowerSystem';
import { preloadNarrativeGameData, ensureNarrativeNodeIds } from '@/data/gameDataLoader';
import { devWarn } from '@/shared/utils/devLog';
import { initWorldEventDirector } from '@/engine/world';
import { reconcileGuidedStory } from '@/engine/GuidedStoryManager';
import { runGlobalCombatEnd } from '@/engine/core/GlobalCleanupService';
import { SCENE_ENTRY_THOUGHTS } from '@/data/sceneEntryThoughts';

/** Autosave, TTL cleanup, daily resets, scene banners, guided story lifecycle. */
export type { SceneBannerPresentation } from '@/engine/world/worldAmbiencePresentation';

export function useGameLifecycleManager(mode: string) {
  const [sceneBanner, setSceneBanner] = useState<SceneBannerPresentation | null>(null);
  const sceneBannerTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isMountedRef = useRef(true);

  useEffect(() => withHmrCleanup(initWorldEventDirector()), []);

  // gameDataReady path — narrative preload + GuidedStory init (LoadingTimeline marks ready separately)
  useEffect(() => {
    let cancelled = false;

    void preloadNarrativeGameData()
      .then(async () => {
        const { playerState, currentNodeId } = useGameStore.getState();
        const nodeIds = currentNodeId
          ? [currentNodeId, ...playerState.visitedNodes]
          : playerState.visitedNodes;
        await ensureNarrativeNodeIds(nodeIds);
      })
      .then(() => import('@/engine/GuidedStoryManager'))
      .then((mod) => {
        if (cancelled) return;
        mod.initGuidedStoryManager();
      })
      .catch((err) => {
        devWarn('[useGameLifecycleManager] Narrative preload / GuidedStory init failed:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Scene banner on store sceneId change (UI only — transition protocol is EventBus-driven)
  useEffect(() => {
    isMountedRef.current = true;

    const unsub = useGameStore.subscribe(
      (state) => state.exploration.currentSceneId,
      (newScene, oldScene) => {
        if (newScene === oldScene) return;

        eventBus.emit('fx:glitch', { duration: 300, intensity: 0.5 });

        const sceneName = SCENE_CONFIG[newScene]?.name ?? '';
        if (!sceneName || !isMountedRef.current) return;

        if (sceneBannerTimeout.current) clearTimeout(sceneBannerTimeout.current);
        setSceneBanner(formatSceneBanner(newScene as SceneId, sceneName));
        sceneBannerTimeout.current = setTimeout(() => {
          if (!isMountedRef.current) return;
          setSceneBanner(null);
          sceneBannerTimeout.current = undefined;
        }, 2500);
      },
    );

    return () => {
      isMountedRef.current = false;
      unsub();
      if (sceneBannerTimeout.current) {
        clearTimeout(sceneBannerTimeout.current);
        sceneBannerTimeout.current = undefined;
      }
    };
  }, []);

  // Quest/story sync — reconcile guidance when player/quest/TTL state changes
  useEffect(() => {
    const unsub = useGameStore.subscribe(
      (state) => ({
        visitedNodes: state.playerState.visitedNodes,
        quests: state.quests,
        ttlKeys: Object.keys(state.activeTTLFlags),
        currentNodeId: state.currentNodeId,
      }),
      () => reconcileGuidedStory(),
      { equalityFn: shallow },
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (mode !== 'exploration') return;

    const interval = setInterval(() => {
      const store = useGameStore.getState();
      if (readGamePhase(store) !== 'exploration') return;
      store.saveGame({ source: 'auto' });
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [mode]);

  useEffect(() => {
    const scope = eventBus.createScope();

    scope.on('scene:enter', ({ sceneId }) => {
      const store = useGameStore.getState();
      if (readGamePhase(store) === 'exploration') {
        store.saveGame({ source: 'auto' });
      }

      // Scene-specific entry thought (once per scene)
      const thoughtText = SCENE_ENTRY_THOUGHTS[sceneId];
      if (thoughtText) {
        const flagKey = `visited_thought_${sceneId}`;
        const { flags } = store.playerState;
        if (!flags[flagKey]) {
          store.setFlag(flagKey, true);
          // Delay slightly so the scene banner fades first
          setTimeout(() => {
            eventBus.emit('volodka:thought', { text: thoughtText, duration: 5000 });
          }, 2800);
        }
      }
    });

    scope.on('combat:end', () => {
      const store = useGameStore.getState();
      runGlobalCombatEnd(store.exploration.currentSceneId);
      if (readGamePhase(store) === 'exploration') {
        store.saveGame({ source: 'auto' });
      }
      reconcileGuidedStory();
    }, EventBusPriority.Orchestrator);

    const checkResets = () => useGameStore.getState().checkDailyMissionResets();
    checkResets();
    scope.on('game:loaded', checkResets);

    scope.on('item:crafted', ({ category }) => {
      const store = useGameStore.getState();
      const categoryToObjective: Record<string, string> = {
        equipment: 'craft_equipment',
        consumable: 'craft_consumables',
        quest: 'craft_items',
      };
      const objectiveId = categoryToObjective[category] ?? 'craft_items';

      for (const mission of store.acceptedDailyMissions) {
        if (mission.completed || mission.claimed) continue;
        const hasObjective =
          mission.progress[objectiveId] !== undefined || objectiveId === 'craft_items';
        if (hasObjective) {
          store.updateDailyMissionProgress(mission.missionId, objectiveId, 1);
        }
      }
    });

    return withHmrCleanup(() => scope.dispose());
  }, []);

  useEffect(() => {
    const ttlInterval = setInterval(() => {
      processExpiredTTLFlags();
    }, 1000);
    return () => clearInterval(ttlInterval);
  }, []);

  return { sceneBanner };
}
