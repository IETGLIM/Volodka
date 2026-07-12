
/**
 * R3F component that runs inside <Canvas> and writes renderer.info
 * to the module-level RendererInfoState every frame.
 * Must be placed as a child of the R3F Canvas.
 */

import { useThree } from '@react-three/fiber';
import { usePostFrameTick } from '@/engine/frame/useFrameTick';
import { setRendererInfo } from '@/engine/RendererInfoState';

export function RendererInfoBridge() {
  const gl = useThree((state) => state.gl);
  const dpr = useThree((state) => state.viewport.dpr);

  usePostFrameTick(
    'misc',
    () => {
      const info = gl.info;
      setRendererInfo({
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        textures: info.memory.textures,
        geometries: info.memory.geometries,
        programs: info.programs?.length ?? 0,
        dpr,
      });
    },
    { label: 'RendererInfo' },
  );

  return null;
}
