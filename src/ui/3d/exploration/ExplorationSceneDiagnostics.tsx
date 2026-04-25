'use client';

import { memo, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import type { SceneId } from '@/data/types';
import { isExplorationMeshAuditEnabled, isExplorationWebGlContextLogEnabled, isExplorationStreamingDebugEnabled } from '@/lib/explorationDiagnostics';
import { useGameStore } from '@/state/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { Html } from '@react-three/drei';
import { getSceneStreamingCoordinator } from '@/engine/streaming/SceneStreamingCoordinator';
import type { StreamingDebugSnapshot } from '@/engine/streaming/SceneStreamingCoordinator';
import { eventBus } from '@/engine/EventBus';
import {
  collectMeshWorldAuditRows,
  findGeometryPlacementDuplicates,
  findNamePlacementDuplicates,
} from '@/lib/explorationMeshWorldAudit';

/**
 * После смены сцены логирует все `Mesh` с **мировыми** координатами (ищите совпадения / наслоение полов).
 */
export const ExplorationMeshWorldAudit = memo(function ExplorationMeshWorldAudit({
  sceneId,
}: {
  sceneId: SceneId;
}) {
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    if (!isExplorationMeshAuditEnabled()) return;

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      console.log('[ExplorationMeshWorldAudit] THREE.Scene (разверните в DevTools → children)', scene);

      const rows = collectMeshWorldAuditRows(scene);
      const tableRows = rows.map((r) => ({
        name: r.name,
        wx: r.wx,
        wy: r.wy,
        wz: r.wz,
        mesh: r.meshUuid,
        geometry: r.geometryUuid,
      }));
      console.table(tableRows);

      const geoDups = findGeometryPlacementDuplicates(rows);
      if (geoDups.length > 0) {
        console.warn(
          `[ExplorationMeshWorldAudit] Дубликаты: одна и та же геометрия (uuid) в одной мировой позиции (${geoDups.length} групп). Часто — два одинаковых меша в GLTF.`,
          geoDups,
        );
      }

      const nameDups = findNamePlacementDuplicates(rows);
      if (nameDups.length > 0) {
        console.warn(
          `[ExplorationMeshWorldAudit] Дубликаты: одно и то же имя меша в одной позиции (${nameDups.length} групп).`,
          nameDups,
        );
      }

      console.info(
        `[ExplorationMeshWorldAudit] sceneId=${sceneId} meshes=${rows.length}. Колонка geometry — совпадение + одинаковые wx,wy,wz → дубликат узла; см. console.warn выше.`,
      );
    };

    const id0 = requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id0);
    };
  }, [scene, sceneId]);

  return null;
});

export const ExplorationWebGlContextLog = memo(function ExplorationWebGlContextLog() {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    if (!isExplorationWebGlContextLogEnabled()) return;
    const canvas = gl.domElement;
    const onLost = (e: Event) => {
      (e as WebGLContextEvent).preventDefault?.();
      console.warn('[Exploration] webglcontextlost');
    };
    const onRestored = () => {
      console.info('[Exploration] webglcontextrestored');
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [gl]);

  return null;
});

/** Polished streaming debug HUD (v0.2). Pulls live snapshot from coordinator, shows chunks, budget, LRU pressure indicators, Rapier bodies. Reactive via eventBus. Enable with `NEXT_PUBLIC_EXPLORATION_STREAMING_DEBUG=1`. */
export const StreamingDebugHUD = memo(function StreamingDebugHUD() {
  const [snapshot, setSnapshot] = useState<StreamingDebugSnapshot>(() =>
    getSceneStreamingCoordinator().getDebugSnapshot()
  );

  // Sync with coordinator events for reactivity (v0.2 polish)
  useEffect(() => {
    if (!isExplorationStreamingDebugEnabled()) return;

    const coordinator = getSceneStreamingCoordinator();
    const unsub = [
      // Re-sync on key streaming events
      eventBus.on('streaming:chunk_activated', () => setSnapshot(coordinator.getDebugSnapshot())),
      eventBus.on('streaming:chunk_deactivated', () => setSnapshot(coordinator.getDebugSnapshot())),
      eventBus.on('scene:enter', () => setSnapshot(coordinator.getDebugSnapshot())),
    ];

    // Periodic refresh for budget/LRU metrics (every 2s)
    const interval = setInterval(() => {
      setSnapshot(coordinator.getDebugSnapshot());
    }, 2000);

    return () => {
      unsub.forEach(u => u());
      clearInterval(interval);
    };
  }, []);

  if (!isExplorationStreamingDebugEnabled()) return null;

  const active = snapshot.activeChunkIds.length;
  const unloading = snapshot.unloadingChunkIds.length;
  const pending = snapshot.pendingActivationChunkIds.length;
  const budgetMB = (snapshot.budgetTextureBytesApprox / 1_048_576).toFixed(1);
  const lruPressure = 'low'; // TODO: integrate with gltfModelCache.__getGltfModelCacheTestState() for real pressure

  return (
    <Html position={[0, 2.5, -6]} style={{ color: '#0ff', fontSize: '10px', pointerEvents: 'none', userSelect: 'none', zIndex: 100 }}>
      <div style={{
        background: 'rgba(0, 20, 40, 0.85)',
        padding: '6px 10px',
        border: '1px solid #0ff',
        borderRadius: '2px',
        fontFamily: 'monospace',
        lineHeight: '1.3',
        minWidth: '220px'
      }}>
        <div style={{ color: '#0f0', marginBottom: '4px' }}>🚀 STREAMING v0.2 DEBUG</div>
        Scene: {snapshot.activeSceneId || 'none'}<br />
        Active: <span style={{color: '#0f0'}}>{active}</span> ({snapshot.activeChunkIds.join(', ') || '—'})<br />
        Unloading: <span style={{color: '#fa0'}}>{unloading}</span> ({snapshot.unloadingChunkIds.join(', ') || '—'})<br />
        Pending: {pending}<br />
        Prefetch Q: {snapshot.prefetchQueueLength}<br />
        Budget: ~{budgetMB}MB tex<br />
        Rapier bodies: {snapshot.rapierActiveBodiesApprox ?? '—'}<br />
        LRU pressure: {lruPressure} (MAX_CACHED=14)<br />
        <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
          Full wrap: volodka_room ✓ | corridor/zarema pending
        </div>
      </div>
    </Html>
  );
});
