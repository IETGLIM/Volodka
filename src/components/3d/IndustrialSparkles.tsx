/* ─── Volodka RPG – Industrial dust sparkles (drei Sparkles) ─── */

import { Sparkles } from '@react-three/drei';
import { useIsMobileVisual, useMobileVisualPerf } from '@/hooks/use-mobile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

const FACTORY_SPARKLE_SCENES = new Set(['abandoned_factory', 'factory_basement']);

interface IndustrialSparklesProps {
  sceneId: string;
}

/** Floating server-room / chemical-vat dust — abandoned factory & basement. */
export function IndustrialSparkles({ sceneId }: IndustrialSparklesProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const isMobile = useIsMobileVisual();
  const { visualLite } = useMobileVisualPerf();

  if (!FACTORY_SPARKLE_SCENES.has(sceneId) || reducedMotion || visualLite) {
    return null;
  }

  const isBasement = sceneId === 'factory_basement';
  const baseCount = isBasement ? 28 : 40;

  return (
    <>
      <Sparkles
        count={isMobile ? Math.floor(baseCount * 0.55) : baseCount}
        position={isBasement ? [0, 1.4, 0] : [-4, 1.6, 5]}
        scale={isBasement ? [7, 2.5, 5] : [10, 3.5, 7]}
        size={isBasement ? 1.8 : 2.2}
        speed={0.25}
        opacity={0.45}
        color={isBasement ? '#55ddaa' : '#88ffcc'}
      />
      {!isBasement && (
        <Sparkles
          count={isMobile ? 12 : 18}
          position={[6, 2.5, -3]}
          scale={[4, 2, 3]}
          size={1.5}
          speed={0.15}
          opacity={0.35}
          color="#aaccff"
        />
      )}
    </>
  );
}
