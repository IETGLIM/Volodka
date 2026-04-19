'use client';

import { memo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneId } from '@/data/types';
import { isExplorationMeshAuditEnabled, isExplorationWebGlContextLogEnabled } from '@/lib/explorationDiagnostics';

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

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
      scene.updateMatrixWorld(true);
      const rows: { name: string; wx: number; wy: number; wz: number; uuid: string }[] = [];
      const v = new THREE.Vector3();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.getWorldPosition(v);
        rows.push({
          name: mesh.name || '(unnamed)',
          wx: round3(v.x),
          wy: round3(v.y),
          wz: round3(v.z),
          uuid: mesh.uuid.slice(0, 8),
        });
      });
      rows.sort((a, b) => a.name.localeCompare(b.name) || a.wx - b.wx || a.wy - b.wy || a.wz - b.wz);
      // eslint-disable-next-line no-console -- диагностический режим по env
      console.table(rows);
      // eslint-disable-next-line no-console
      console.info(
        `[ExplorationMeshWorldAudit] sceneId=${sceneId} meshes=${rows.length}. Ищите одинаковые wx,wy,wz у разных имён (z-fight / дубликаты).`,
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
