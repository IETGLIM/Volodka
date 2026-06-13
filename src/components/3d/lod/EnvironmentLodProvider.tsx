/* ─── Scene-wide environment LOD from player position ─── */

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { getSceneConfig } from '@/config/scenes';
import { useCurrentSceneId } from '@/store/selectors';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import {
  environmentLodFromDistance,
  getEnvironmentLodProfile,
  type EnvironmentLodLevel,
} from '@/engine/lod/distanceLod';

interface EnvironmentLodContextValue {
  lod: EnvironmentLodLevel;
}

const EnvironmentLodContext = createContext<EnvironmentLodContextValue>({ lod: 'full' });

export function useEnvironmentLod(): EnvironmentLodContextValue {
  return useContext(EnvironmentLodContext);
}

interface EnvironmentLodProviderProps {
  livePlayerPositionRef: MutableRefObject<THREE.Vector3>;
  children: ReactNode;
}

/**
 * Computes environment LOD from player distance to the scene anchor (spawn point).
 * Large outdoor/industrial scenes downgrade clutter when the player moves away.
 */
export function EnvironmentLodProvider({
  livePlayerPositionRef,
  children,
}: EnvironmentLodProviderProps) {
  const sceneId = useCurrentSceneId();
  const { preset } = useGraphicsQuality();
  const profile = useMemo(() => getEnvironmentLodProfile(sceneId), [sceneId]);
  const sceneAnchorRef = useRef(new THREE.Vector3());

  const lodRef = useRef<EnvironmentLodLevel>('full');
  const [lod, setLod] = useState<EnvironmentLodLevel>('full');
  const timerRef = useRef(0);

  useFrameTick('misc', ({ delta }) => {
    timerRef.current += delta;
    if (timerRef.current < 0.15) return;
    timerRef.current = 0;

    const spawn = getSceneConfig(sceneId).spawnPoint;
    sceneAnchorRef.current.set(spawn[0], spawn[1], spawn[2]);
    const dist = livePlayerPositionRef.current.distanceTo(sceneAnchorRef.current);
    const next = environmentLodFromDistance(dist, profile, preset.lodBias);
    if (next !== lodRef.current) {
      lodRef.current = next;
      setLod(next);
    }
  });

  const value = useMemo(() => ({ lod }), [lod]);

  return (
    <EnvironmentLodContext.Provider value={value}>
      {children}
    </EnvironmentLodContext.Provider>
  );
}
