'use client';

import { memo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { SceneId } from '@/data/types';
import { isExplorationMeshAuditEnabled, isExplorationWebGlContextLogEnabled, isExplorationStreamingDebugEnabled } from '@/lib/explorationDiagnostics';
import { useGameStore } from '@/state/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { Html } from '@react-three/drei';
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

/** Simple streaming debug overlay (v0.2). Shows active chunks when `NEXT_PUBLIC_EXPLORATION_STREAMING_DEBUG=1`. */
export const StreamingDebugHUD = memo(function StreamingDebugHUD() {
  const { activeChunkIds, unloadingChunkIds } = useGameStore(
    useShallow((s) => ({
      activeChunkIds: (s.exploration as any)?.streaming?.activeChunkIds ?? [],
      unloadingChunkIds: (s.exploration as any)?.streaming?.unloadingChunkIds ?? [],
    }))
  );

  if (!isExplorationStreamingDebugEnabled()) return null;

  return (
    <Html position={[0, 2, -5]} style={{ color: '#0ff', fontSize: '11px', pointerEvents: 'none', userSelect: 'none' }}>
      <div style={{ background: 'rgba(0,0,0,0.7)', padding: '4px 8px', border: '1px solid #0ff' }}>
        STREAMING DEBUG<br />
        Active: {activeChunkIds.join(', ') || 'none'}<br />
        Unloading: {unloadingChunkIds.join(', ') || 'none'}
      </div>
    </Html>
  );
});
