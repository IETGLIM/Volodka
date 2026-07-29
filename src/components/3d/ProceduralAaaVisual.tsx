/**
 * Dedicated procedural_aaa scene visual — boots ProceduralAaaSceneRoot.
 */

import { ProceduralAaaSceneRoot } from '@/proceduralAaa/ProceduralAaaManager';

export interface ProceduralAaaVisualProps {
  livePlayerPositionRef?: React.MutableRefObject<import('three').Vector3>;
}

export function ProceduralAaaVisual(_props: ProceduralAaaVisualProps) {
  return <ProceduralAaaSceneRoot autoStartAudio />;
}
