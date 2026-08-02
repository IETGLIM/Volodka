/**
 * Manager — boots the full procedural AAA hero scene with one action.
 * Unity scene bootstrap → generateProceduralAaaScene().
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ProceduralSdfWorldMesh } from './ProceduralSdfWorldMesh';
import { ProceduralCharacter } from './ProceduralCharacter';
import { ProceduralAtmosphereLayer } from './ProceduralAtmosphereLayer';
import { ProceduralAaaGlbLandmarks } from './HybridGlbLandmarks';
import { createProceduralSoundscape, type ProceduralSoundscapeHandle } from './ProceduralSoundscapes';
import {
  getProceduralAaaParams,
  setProceduralAaaFlag,
  setProceduralAaaParams,
  type ProceduralAaaParams,
} from './params';
import { clearDynamicTextureCache, generateDynamicTexturesSync } from './DynamicTextureGenerator';

export interface ProceduralAaaSceneRootProps {
  autoStartAudio?: boolean;
}

let generationCounter = 0;
const regenerateListeners = new Set<(key: number) => void>();

/** Public API — one action to (re)generate the full procedural hero scene. */
// eslint-disable-next-line react-refresh/only-export-components
export function generateProceduralAaaScene(
  patch?: Partial<ProceduralAaaParams>,
): number {
  if (patch) setProceduralAaaParams(patch);
  setProceduralAaaFlag(true);
  clearDynamicTextureCache();
  const p = getProceduralAaaParams();
  generateDynamicTexturesSync('asphalt', p.textureSize, p.seed);
  generateDynamicTexturesSync('concrete', p.textureSize, p.seed + 1);
  generateDynamicTexturesSync('metal_worn', p.textureSize, p.seed + 2);
  generateDynamicTexturesSync('brick', p.textureSize, p.seed + 3);
  generationCounter += 1;
  for (const l of regenerateListeners) l(generationCounter);

  try {
    void import('@/engine/scene/sceneTransition').then(({ requestSceneTransition }) => {
      void import('@/config/sceneIds').then(({ SCENE_IDS }) => {
        if ((SCENE_IDS as string[]).includes('procedural_aaa')) {
          requestSceneTransition('procedural_aaa' as never);
        }
      });
    });
  } catch {
    /* scene may not exist yet during early boot */
  }

  return generationCounter;
}

// eslint-disable-next-line react-refresh/only-export-components
export function onProceduralAaaRegenerate(fn: (key: number) => void): () => void {
  regenerateListeners.add(fn);
  return () => {
    regenerateListeners.delete(fn);
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function getProceduralAaaGenerationKey(): number {
  return generationCounter;
}

declare global {
  interface Window {
    generateProceduralAaaScene?: typeof generateProceduralAaaScene;
  }
}

if (typeof window !== 'undefined') {
  window.generateProceduralAaaScene = generateProceduralAaaScene;
}

/** Full hero scene composition — world + character + atmosphere + authored GLB landmarks. */
export function ProceduralAaaSceneRoot({ autoStartAudio = true }: ProceduralAaaSceneRootProps) {
  const [genKey, setGenKey] = useState(generationCounter);
  const spectrumRef = useRef(0);
  const groundMeshesRef = useRef<THREE.Object3D[]>([]);
  const audioRef = useRef<ProceduralSoundscapeHandle | null>(null);

  useEffect(() => onProceduralAaaRegenerate(setGenKey), []);

  useEffect(() => {
    const handle = createProceduralSoundscape(getProceduralAaaParams());
    audioRef.current = handle;
    if (autoStartAudio) {
      void handle.start().catch(() => {
        /* needs user gesture — tweak panel Generate will retry */
      });
    }
    return () => handle.dispose();
  }, [autoStartAudio, genKey]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      spectrumRef.current = audioRef.current?.getSpectrumEnergy() ?? 0;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMeshReady = useCallback((mesh: THREE.Mesh) => {
    groundMeshesRef.current = [mesh];
  }, []);

  return (
    <group name="ProceduralAaaSceneRoot">
      <ProceduralAtmosphereLayer />
      <ProceduralSdfWorldMesh
        key={genKey}
        generationKey={genKey}
        spectrumRef={spectrumRef}
        onMeshReady={onMeshReady}
      />
      <ProceduralAaaGlbLandmarks />
      <ProceduralCharacter
        position={[0, 0, 2.5]}
        spectrumRef={spectrumRef}
        groundMeshesRef={groundMeshesRef}
        walking
      />
    </group>
  );
}
