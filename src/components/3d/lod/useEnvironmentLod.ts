import { createContext, useContext } from 'react';
import type { EnvironmentLodLevel } from '@/engine/lod/distanceLod';

export interface EnvironmentLodContextValue {
  lod: EnvironmentLodLevel;
}

export const EnvironmentLodContext = createContext<EnvironmentLodContextValue>({
  lod: 'full',
});

export function useEnvironmentLod(): EnvironmentLodContextValue {
  return useContext(EnvironmentLodContext);
}
