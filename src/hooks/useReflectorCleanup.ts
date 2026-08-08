/**
 * React hook that disposes drei MeshReflectorMaterial GPU resources on unmount.
 *
 * drei's MeshReflectorMaterial creates 2 WebGLRenderTargets + a BlurPass
 * in React.useMemo with NO cleanup. This hook captures the material ref
 * and on unmount calls `disposeReflectorResources` which frees the
 * accessible textures (~10-14 MB at 1024 res) and the material's compiled
 * shader programs.
 *
 * Usage:
 * ```tsx
 * const ref = useRef<ComponentRef<typeof MeshReflectorMaterial>>(null);
 * useReflectorCleanup(ref);
 * return <MeshReflectorMaterial ref={ref} ... />;
 * ```
 */

import { useLayoutEffect, type RefObject } from 'react';
import { disposeReflectorResources } from '@/engine/graphics/disposeReflectorResources';

/**
 * Registers cleanup for drei MeshReflectorMaterial GPU resources on unmount.
 *
 * @param ref - React ref to the MeshReflectorMaterial instance
 */
export function useReflectorCleanup<T>(ref: RefObject<T | null>): void {
  useLayoutEffect(() => {
    const mat = ref.current;
    if (!mat) return;
    return () => {
      disposeReflectorResources(mat);
    };
  }, [ref]);
}
