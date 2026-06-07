import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { eventBus } from '@/engine/EventBus';
import { musicEngine } from '@/engine/MusicEngine';
import { SCENE_CONFIG } from '@/config/scenes';
import { AUTO_SAVE_INTERVAL_MS } from '@/data/constants';
import { processExpiredTTLFlags } from '@/engine/PoemPowerSystem';
import { preloadNarrativeGameData } from '@/data/gameDataLoader';
import { initWorldEventDirector } from '@/engine/world';

/** Autosave, TTL cleanup, daily resets, scene banners, guided story lifecycle. */
export function useGameLifecycleManager(mode: string) {
  const [sceneBanner, setSceneBanner] = useState<string | null>(null);
  const sceneBannerTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return initWorldEventDirector();
  }, []);

  useEffect(() => {
    let disposeFn: (() => void) | undefined;
    let cancelled = false;

    void preloadNarrativeGameData()
      .then(() => import('@/engine/GuidedStoryManager'))
      .then((mod) => {
      if (cancelled) return;
      mod.initGuidedStoryManager();
      disposeFn = mod.disposeGuidedStoryManager;
    });

    return () => {
      cancelled = true;
      disposeFn?.();
    };
  }, []);

  useEffect(() => {
    return () => {
      musicEngine.dispose();
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const unsub = useGameStore.subscribe(
      (state) => state.exploration.currentSceneId,
      (newScene, oldScene) => {
        if (newScene === oldScene) return;

        eventBus.emit('fx:glitch', { duration: 300, intensity: 0.5 });
        useGameStore.getState().autoRegenBetweenScenes();
        useGameStore.getState().discoverScene(newScene);

        const sceneName = SCENE_CONFIG[newScene]?.name ?? '';
        if (!sceneName || !isMountedRef.current) return;

        if (sceneBannerTimeout.current) clearTimeout(sceneBannerTimeout.current);
        setSceneBanner(sceneName);
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
    const unsub = eventBus.on('scene:enter', () => {
      const store = useGameStore.getState();
      if (readGamePhase(store) === 'exploration') {
        store.saveGame({ source: 'auto' });
      }
    });
    return unsub;
  }, []);

  // Save after combat session ends (post-rewards, mode back to exploration).
  // Do NOT save on combat:victory — rewards apply synchronously but mode changes
  // after CombatSystem's delay; an immediate save can race stale state.
  useEffect(() => {
    const unsub = eventBus.on('combat:end', () => {
      const store = useGameStore.getState();
      if (readGamePhase(store) === 'exploration') {
        store.saveGame({ source: 'auto' });
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const checkResets = () => useGameStore.getState().checkDailyMissionResets();
    checkResets();
    return eventBus.on('game:loaded', checkResets);
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('item:crafted', ({ category }) => {
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
    return unsub;
  }, []);

  useEffect(() => {
    const ttlInterval = setInterval(() => {
      processExpiredTTLFlags();
    }, 1000);
    return () => clearInterval(ttlInterval);
  }, []);

  return { sceneBanner };
}
