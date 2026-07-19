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
import { resolveSceneThought, type ThoughtContext } from '@/data/sceneEntryThoughts';
import {
  canShowReactiveThought,
  getPostCombatThought,
  getPoemCollectedThought,
  getLevelUpThought,
  getQuestCompletedThought,
  getLoreDiscoveredThought,
  getChoiceMadeThought,
  getPerkUnlockedThought,
  getSkillMilestoneThought,
} from '@/data/reactiveThoughts';

/** Build a ThoughtContext from the current game store state. */
function buildThoughtContext(store: ReturnType<typeof useGameStore.getState>): ThoughtContext {
  const { playerState } = store;
  return {
    karma: playerState.karma,
    stress: playerState.stress,
    energy: playerState.energy,
    currentAct: playerState.progression.currentAct,
    flags: playerState.flags,
  };
}

/** Emit a reactive thought (rate-limited) and record it in the journal. */
function emitReactiveThought(text: string, sceneId: SceneId | string, duration = 5000): void {
  if (!canShowReactiveThought()) return;
  const store = useGameStore.getState();
  eventBus.emit('volodka:thought', { text, duration });
  try {
    store.addThought(text, sceneId);
  } catch {
    /* store may not be ready during HMR */
  }
}

/** Autosave, TTL cleanup, daily resets, scene banners, guided story lifecycle. */
export type { SceneBannerPresentation } from '@/engine/world/worldAmbiencePresentation';

export function useGameLifecycleManager(mode: string) {
  const [sceneBanner, setSceneBanner] = useState<SceneBannerPresentation | null>(null);
  const sceneBannerTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isMountedRef = useRef(true);
  /** Tracks whether the initial-scene thought has been fired (avoids duplicate). */
  const initialThoughtFiredRef = useRef(false);

  useEffect(() => withHmrCleanup(initWorldEventDirector()), []);

  // Fire the scene-entry thought for the INITIAL scene when exploration mode
  // first begins. The scene:enter EventBus event only fires on scene TRANSITIONS,
  // not for the first scene set during game load / new game. This effect bridges
  // that gap so Volodka's first inner monologue plays on game start.
  useEffect(() => {
    if (mode !== 'exploration' || initialThoughtFiredRef.current) return;
    const store = useGameStore.getState();
    if (readGamePhase(store) !== 'exploration') return;

    const sceneId = store.exploration.currentSceneId;
    if (!sceneId) return;

    const ctx = buildThoughtContext(store);
    const resolved = resolveSceneThought(sceneId, ctx);
    if (resolved) {
      initialThoughtFiredRef.current = true;
      store.setFlag(resolved.flagToSet, true);
      // Delay so the scene banner / tutorial fade first
      setTimeout(() => {
        if (!isMountedRef.current) return;
        eventBus.emit('volodka:thought', { text: resolved.text, duration: 5500 });
        try {
          store.addThought(resolved.text, sceneId);
        } catch {
          /* store may not be ready during HMR */
        }
      }, 3500);
    }
  }, [mode]);

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

      // Scene-specific entry thought — reactive inner monologue.
      // First visit: karma/stress-branched thought. Revisit: act-specific
      // thought (once per act). All shown thoughts are recorded in the
      // persistent journal (thoughtHistory) so the player can re-read them.
      const ctx = buildThoughtContext(store);
      const resolved = resolveSceneThought(sceneId, ctx);
      if (resolved) {
        store.setFlag(resolved.flagToSet, true);
        // Delay slightly so the scene banner fades first
        setTimeout(() => {
          eventBus.emit('volodka:thought', { text: resolved.text, duration: 5500 });
          // Record in persistent journal so the player can re-read later
          try {
            store.addThought(resolved.text, sceneId);
          } catch {
            /* store may not be ready during HMR */
          }
        }, 2800);
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

    // ── Reactive inner monologue on key gameplay events ──
    // Rate-limited via canShowReactiveThought() (12 s cooldown) to avoid spam.

    scope.on('combat:victory', () => {
      const store = useGameStore.getState();
      const ctx = buildThoughtContext(store);
      const text = getPostCombatThought(ctx, true);
      if (text) {
        setTimeout(() => emitReactiveThought(text, store.exploration.currentSceneId), 1200);
      }
    });

    scope.on('combat:defeat', () => {
      const store = useGameStore.getState();
      const ctx = buildThoughtContext(store);
      const text = getPostCombatThought(ctx, false);
      if (text) {
        setTimeout(() => emitReactiveThought(text, store.exploration.currentSceneId), 1200);
      }
    });

    scope.on('poem:collected', () => {
      const store = useGameStore.getState();
      const ctx = buildThoughtContext(store);
      // collectedPoems already includes the newly collected poem at this point
      const poemCount = store.collectedPoems.length;
      const text = getPoemCollectedThought(ctx, poemCount);
      if (text) {
        setTimeout(() => emitReactiveThought(text, store.exploration.currentSceneId, 6000), 800);
      }
    });

    scope.on('player:levelup', ({ newLevel }) => {
      const store = useGameStore.getState();
      const ctx = buildThoughtContext(store);
      const text = getLevelUpThought(ctx, newLevel);
      if (text) {
        setTimeout(() => emitReactiveThought(text, store.exploration.currentSceneId), 600);
      }
    });

    scope.on('quest:completed', ({ questId }) => {
      const store = useGameStore.getState();
      const ctx = buildThoughtContext(store);
      const text = getQuestCompletedThought(ctx, questId);
      if (text) {
        setTimeout(() => emitReactiveThought(text, store.exploration.currentSceneId), 1000);
      }
    });

    scope.on('lore:discovered', ({ rarity }) => {
      const store = useGameStore.getState();
      const ctx = buildThoughtContext(store);
      const text = getLoreDiscoveredThought(ctx, rarity);
      if (text) {
        setTimeout(() => emitReactiveThought(text, store.exploration.currentSceneId), 500);
      }
    });

    scope.on('choice:made', ({ karmaChange }) => {
      const store = useGameStore.getState();
      const ctx = buildThoughtContext(store);
      const text = getChoiceMadeThought(ctx, karmaChange);
      if (text) {
        setTimeout(() => emitReactiveThought(text, store.exploration.currentSceneId), 1500);
      }
    });

    scope.on('perk:unlocked', ({ perkName, category }) => {
      const store = useGameStore.getState();
      const ctx = buildThoughtContext(store);
      const text = getPerkUnlockedThought(ctx, perkName, category);
      if (text) {
        // Longer delay — perk thoughts deserve space after the UI notification
        setTimeout(() => emitReactiveThought(text, store.exploration.currentSceneId, 6000), 2000);
      }
    });

    scope.on('skill:level_up', ({ skill, level }) => {
      const store = useGameStore.getState();
      const ctx = buildThoughtContext(store);
      const text = getSkillMilestoneThought(ctx, skill, level);
      if (text) {
        setTimeout(() => emitReactiveThought(text, store.exploration.currentSceneId, 5500), 900);
      }
    });

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
