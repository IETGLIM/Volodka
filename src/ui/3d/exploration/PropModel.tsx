'use client';

import { useGLTF } from '@react-three/drei';
import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';

import { rewriteLegacyModelPath } from '@/config/modelUrls';
import { getPropDefinition } from '@/data/propsManifest';
import type { PropDefinition } from '@/data/propsTypes';
import {
  applyGltfCharacterDepthWrite,
  applyGltfMeshesFrustumCullOff,
  computeExplorationCharacterMeshUnionVerticalExtent,
} from '@/lib/gltfCharacterMaterialPolicy';
import { applyExplorationPlayerGlobalVisualScale } from '@/lib/playerScaleConstants';
import { validatePropGlbScale } from '@/lib/propScaleValidation';

type PropModelProps = {
  propId: string;
  /** Множитель для ветки GLB: `baseUniform × … × sceneScale` (узкие комнаты). Процедурный fallback в метрах сцены `sceneScale` не масштабирует. */
  sceneScale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Процедурный `boxGeometry` в метрах (если не задано — дефолт по `category`). */
  proceduralBoxArgs?: [number, number, number];
  /** Цвет `meshStandardMaterial` для процедурного fallback. */
  proceduralColor?: string;
};

function normalizePublicModelPath(glbPath: string): string {
  const t = glbPath.trim();
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  const withSlash = t.startsWith('/') ? t : `/${t}`;
  return rewriteLegacyModelPath(withSlash);
}

/**
 * Проп: GLB из манифеста (`glbPath`) или процедурный fallback.
 * GLB: клон сцены (не мутируем кэш `useGLTF`), ÷5 через `applyExplorationPlayerGlobalVisualScale`, проверка `validatePropGlbScale`.
 */
export function PropModel({
  propId,
  sceneScale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  proceduralBoxArgs,
  proceduralColor,
}: PropModelProps) {
  const def = getPropDefinition(propId);

  if (!def) {
    console.warn(`[PropModel] Проп "${propId}" не найден в манифесте`);
    return null;
  }

  if (def.glbPath?.trim()) {
    return (
      <PropGLB
        def={def}
        sceneScale={sceneScale}
        position={position}
        rotation={rotation}
      />
    );
  }

  return (
    <PropProcedural
      def={def}
      position={position}
      rotation={rotation}
      proceduralBoxArgs={proceduralBoxArgs}
      proceduralColor={proceduralColor}
    />
  );
}

type PropGLBProps = {
  def: PropDefinition;
  sceneScale: number;
  position: [number, number, number];
  rotation: [number, number, number];
};

function PropGLB({ def, sceneScale, position, rotation }: PropGLBProps) {
  const url = normalizePublicModelPath(def.glbPath!);
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => scene.clone(true) as THREE.Group, [scene]);

  const finalUniform = useMemo(() => {
    const base = def.baseUniform ?? 1;
    return applyExplorationPlayerGlobalVisualScale(base * sceneScale);
  }, [def.baseUniform, sceneScale]);

  useLayoutEffect(() => {
    cloned.updateMatrixWorld(true);
    const bbox = computeExplorationCharacterMeshUnionVerticalExtent(cloned);
    const v = validatePropGlbScale(def, url, bbox, finalUniform);
    if (v !== 'ok' && v !== 'skipped-procedural' && v !== 'skipped-exempt') {
      console.warn(`[PropModel] Масштаб GLB пропа "${def.id}": ${v.error} (продукт≈${v.actualHeightM.toFixed(3)})`);
    }

    applyGltfCharacterDepthWrite(cloned);
    applyGltfMeshesFrustumCullOff(cloned);
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    cloned.userData.propId = def.id;
    cloned.userData.propBoundingVerticalM = bbox;
    delete cloned.userData.characterHeightM;
  }, [cloned, def, finalUniform, url]);

  return (
    <primitive object={cloned} position={position} rotation={rotation} scale={finalUniform} />
  );
}

type PropProceduralProps = {
  def: PropDefinition;
  position: [number, number, number];
  rotation: [number, number, number];
  proceduralBoxArgs?: [number, number, number];
  proceduralColor?: string;
};

function categoryDefaultBox(category: PropDefinition['category']): [number, number, number] {
  switch (category) {
    case 'furniture':
      return [1, 0.08, 0.6];
    case 'tableware':
      return [0.1, 0.1, 0.1];
    case 'tech':
      return [0.4, 0.02, 0.15];
    case 'lighting':
      return [0.14, 0.14, 0.14];
    case 'decor':
    default:
      return [0.3, 0.3, 0.3];
  }
}

function PropProcedural({
  def,
  position,
  rotation,
  proceduralBoxArgs,
  proceduralColor,
}: PropProceduralProps) {
  const args = proceduralBoxArgs ?? categoryDefaultBox(def.category);
  const color =
    proceduralColor ??
    (def.category === 'furniture'
      ? '#5c3a21'
      : def.category === 'tableware'
        ? '#cccccc'
        : def.category === 'tech'
          ? '#333333'
          : def.category === 'lighting'
            ? '#ffffaa'
            : '#888888');

  switch (def.category) {
    case 'tableware': {
      const r = Math.max(0.02, args[0] * 0.5);
      const h = Math.max(0.04, args[1]);
      return (
        <mesh position={position} rotation={rotation} castShadow receiveShadow>
          <cylinderGeometry args={[r, r, h, 12]} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.2} />
        </mesh>
      );
    }
    case 'lighting':
      return (
        <mesh position={position} rotation={rotation} castShadow receiveShadow>
          <sphereGeometry args={[Math.max(args[0], args[1], args[2]) * 0.5, 12, 12]} />
          <meshStandardMaterial
            color={color}
            emissive="#ffaa00"
            emissiveIntensity={0.45}
            roughness={0.4}
          />
        </mesh>
      );
    default:
      return (
        <mesh position={position} rotation={rotation} castShadow receiveShadow>
          <boxGeometry args={args} />
          <meshStandardMaterial color={color} roughness={0.78} metalness={0.08} />
        </mesh>
      );
  }
}
