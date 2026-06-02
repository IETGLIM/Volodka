import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SceneId } from '@/data/types';
import { sanitizeExplorationPlayerPositionAgainstSpawn } from '@/config/scenes';
import {
  clearExplorationLivePlayerPosition,
  updateExplorationLivePlayerPosition,
} from '@/lib/explorationLivePlayerBridge';
import { useGameStore } from '@/state';
import { getActiveSessionPreset } from '@/state/sessionPresetStore';
import { useInteractionHintStore } from '@/state/interactionHintStore';

interface ExplorationPosition {
  x: number;
  y: number;
  z: number;
  rotation?: number;
}

interface UseExplorationBootstrapParams {
  sceneId: SceneId;
  introCutsceneActive: boolean;
  playerInputLocked: boolean;
  explorationStorePosition: ExplorationPosition;
  setPlayerPosition: (position: ExplorationPosition) => void;
}

export function useExplorationBootstrap({
  sceneId,
  introCutsceneActive,
  playerInputLocked,
  explorationStorePosition,
  setPlayerPosition,
}: UseExplorationBootstrapParams) {
  const [explorationBriefingOpen, setExplorationBriefingOpen] = useState(false);
  const explorationBriefingPendingRef = useRef(true);

  const livePlayerPositionRef = useRef(
    (() => {
      const p = useGameStore.getState().exploration.playerPosition;
      return { x: p.x, y: p.y, z: p.z, rotation: p.rotation ?? 0 };
    })(),
  );

  const explorationSpawnSnapshot = useMemo(() => {
    const p = explorationStorePosition;
    return sanitizeExplorationPlayerPositionAgainstSpawn(sceneId, {
      x: p.x,
      y: p.y,
      z: p.z,
      rotation: p.rotation ?? 0,
    });
  }, [sceneId, explorationStorePosition.x, explorationStorePosition.y, explorationStorePosition.z, explorationStorePosition.rotation]);

  useEffect(() => {
    const p = explorationStorePosition;
    const next = sanitizeExplorationPlayerPositionAgainstSpawn(sceneId, {
      x: p.x,
      y: p.y,
      z: p.z,
      rotation: p.rotation ?? 0,
    });
    if (next.x !== p.x || next.y !== p.y || next.z !== p.z) {
      setPlayerPosition(next);
    }
  }, [
    sceneId,
    explorationStorePosition.x,
    explorationStorePosition.y,
    explorationStorePosition.z,
    explorationStorePosition.rotation,
    setPlayerPosition,
  ]);

  const playerPositionRef = useRef(explorationSpawnSnapshot);
  useEffect(() => {
    playerPositionRef.current = explorationSpawnSnapshot;
  }, [explorationSpawnSnapshot]);

  useEffect(() => {
    const p = useGameStore.getState().exploration.playerPosition;
    livePlayerPositionRef.current = { x: p.x, y: p.y, z: p.z, rotation: p.rotation ?? 0 };
    updateExplorationLivePlayerPosition(livePlayerPositionRef.current);
  }, [sceneId]);

  useEffect(() => {
    if (!introCutsceneActive) return;
    const p = explorationStorePosition;
    const snap = { x: p.x, y: p.y, z: p.z, rotation: p.rotation ?? 0 };
    livePlayerPositionRef.current = snap;
    updateExplorationLivePlayerPosition(snap);
  }, [
    introCutsceneActive,
    explorationStorePosition.x,
    explorationStorePosition.y,
    explorationStorePosition.z,
    explorationStorePosition.rotation,
  ]);

  useEffect(() => {
    explorationBriefingPendingRef.current = true;
    setExplorationBriefingOpen(false);
    if (sceneId === 'volodka_room' && getActiveSessionPreset() === 'arcadeSlice') {
      const nodeId = useGameStore.getState().currentNodeId;
      if (nodeId === 'vs_slice_explore_free' || nodeId === 'vs_slice_intro') {
        useInteractionHintStore.getState().show('E — стойка мониторов');
      }
    }
  }, [sceneId]);

  useEffect(() => {
    return () => {
      clearExplorationLivePlayerPosition();
    };
  }, []);

  const handlePositionChange = useCallback(
    (pos: { x: number; y: number; z: number; rotation: number }) => {
      const next = { x: pos.x, y: pos.y, z: pos.z, rotation: pos.rotation };
      livePlayerPositionRef.current = next;
      playerPositionRef.current = next;
      updateExplorationLivePlayerPosition(next);
      if (explorationBriefingPendingRef.current && !playerInputLocked) {
        explorationBriefingPendingRef.current = false;
        queueMicrotask(() => setExplorationBriefingOpen(true));
      }
    },
    [playerInputLocked],
  );

  return {
    explorationSpawnSnapshot,
    playerPositionRef,
    livePlayerPositionRef,
    explorationBriefingOpen,
    setExplorationBriefingOpen,
    handlePositionChange,
  };
}
