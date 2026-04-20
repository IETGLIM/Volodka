'use client';

import { memo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { SceneId } from '@/data/types';
import { isExplorationMeshAuditEnabled, isExplorationWebGlContextLogEnabled } from '@/lib/explorationDiagnostics';
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
      // eslint-disable-next-line no-console -- диагностический режим по env
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
      // eslint-disable-next-line no-console -- диагностический режим по env
      console.table(tableRows);

      const geoDups = findGeometryPlacementDuplicates(rows);
      if (geoDups.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
          `[ExplorationMeshWorldAudit] Дубликаты: одна и та же геометрия (uuid) в одной мировой позиции (${geoDups.length} групп). Часто — два одинаковых меша в GLTF.`,
          geoDups,
        );
      }

      const nameDups = findNamePlacementDuplicates(rows);
      if (nameDups.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
          `[ExplorationMeshWorldAudit] Дубликаты: одно и то же имя меша в одной позиции (${nameDups.length} групп).`,
          nameDups,
        );
      }

      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.warn('[Exploration] webglcontextlost');
    };
    const onRestored = () => {
      // eslint-disable-next-line no-console
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
