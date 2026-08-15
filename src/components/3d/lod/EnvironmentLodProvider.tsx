/* ─── Per-prop environment LOD context (player position + thresholds) ─── */

/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import {
  createContext,
  useContext,
  useMemo,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { Vector3 } from 'three';
import { useCurrentSceneId } from '@/store/selectors';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import {
  environmentLodThresholdsFromProfile,
  getEnvironmentLodProfile,
  type EnvironmentLodThresholds,
} from '@/engine/lod/distanceLod';

export interface EnvironmentLodContextValue {
  livePlayerPositionRef: MutableRefObject<Vector3> | null;
  thresholds: EnvironmentLodThresholds;
}

const DEFAULT_THRESHOLDS = environmentLodThresholdsFromProfile(
  { clutterDistance: 999, decorativeDistance: 999 },
  1,
);

const EnvironmentLodContext = createContext<EnvironmentLodContextValue>({
  livePlayerPositionRef: null,
  thresholds: DEFAULT_THRESHOLDS,
});

export function useEnvironmentLod(): EnvironmentLodContextValue {
  return useContext(EnvironmentLodContext);
}

interface EnvironmentLodProviderProps {
  livePlayerPositionRef: MutableRefObject<Vector3>;
  children: ReactNode;
}

/**
 * Supplies per-prop environment LOD inputs: live player position and scene-tier
 * distance thresholds (with hysteresis bands). Each {@link EnvironmentDetail}
 * evaluates distance from the player to its own anchor independently.
 */
export function EnvironmentLodProvider({
  livePlayerPositionRef,
  children,
}: EnvironmentLodProviderProps) {
  const sceneId = useCurrentSceneId();
  const { preset } = useGraphicsQuality();
  const profile = useMemo(() => getEnvironmentLodProfile(sceneId), [sceneId]);
  const thresholds = useMemo(
    () => environmentLodThresholdsFromProfile(profile, preset.lodBias),
    [profile, preset.lodBias],
  );

  const value = useMemo(
    () => ({ livePlayerPositionRef, thresholds }),
    [livePlayerPositionRef, thresholds],
  );

  return (
    <EnvironmentLodContext.Provider value={value}>
      {children}
    </EnvironmentLodContext.Provider>
  );
}
