/**
 * Best-effort disposal of drei MeshReflectorMaterial GPU resources.
 *
 * drei's MeshReflectorMaterial React component creates 2 WebGLRenderTargets
 * (fbo1 + fbo2) + a BlurPass (with 2 more internal renderTargets) inside
 * React.useMemo with NO cleanup on unmount. On ultra quality (1024×1024
 * HalfFloat) this leaks ~16 MB of GPU memory per scene transition.
 *
 * The forwarded ref only exposes the material class instance, NOT the React
 * component closure where fbo1/fbo2/blurpass live. We CAN reach the textures
 * via the material's uniform getters (tDiffuse, tDiffuseBlur, tDepth) and
 * dispose those, which frees the bulk of GPU memory (~10-14 MB at 1024 res).
 *
 * The WebGLRenderTarget framebuffers themselves (~2-4 MB) remain until
 * page close or WebGL context loss — this is a drei library limitation
 * that cannot be worked around without forking the component.
 */

/** Minimal interface for a disposable Three.js texture. */
interface DisposableTexture {
  dispose(): void;
  disposed?: boolean;
}

/** Minimal interface for a disposable Three.js resource (FBO, BlurPass). */
interface DisposableResource {
  dispose(): void;
}

/** Uniform value container used internally by MeshReflectorMaterial. */
interface UniformContainer {
  value?: unknown;
}

/**
 * Disposes GPU resources held by a MeshReflectorMaterial instance.
 *
 * Cleanup steps:
 * 1. Collect texture references from the material's uniform getters
 *    (tDiffuse = fbo1.texture, tDiffuseBlur = fbo2.texture, tDepth = fbo1.depthTexture)
 * 2. Dispose each texture (frees GPU texture memory — the bulk of the leak)
 * 3. Null out the uniform value containers to prevent use-after-dispose
 * 4. Dispose the material itself (frees compiled shader programs)
 * 5. Best-effort attempt to reach fbo1/fbo2/blurpass as material properties
 *    (currently undefined — defensive no-op for future drei compatibility)
 *
 * This function is idempotent and safe to call multiple times.
 * All operations are wrapped in try/catch to never propagate errors.
 */
export function disposeReflectorResources(material: unknown): void {
  if (!material || typeof material !== 'object') return;

  try {
    const mat = material as Record<string, unknown>;

    // Step 1-2: Collect and dispose textures from the material's getters.
    const TEXTURE_KEYS = ['tDiffuse', 'tDiffuseBlur', 'tDepth'] as const;
    for (const key of TEXTURE_KEYS) {
      try {
        const tex = mat[key] as DisposableTexture | undefined;
        if (tex && typeof tex.dispose === 'function' && !tex.disposed) {
          tex.dispose();
        }
      } catch {
        // Getter may throw if uniform was never initialized
      }
    }

    // Step 3: Null out the internal uniform value containers.
    // MeshReflectorMaterial stores uniforms as { value: Texture } objects.
    // Setting value to null prevents the shader from sampling freed textures
    // if the material is somehow reused before GC.
    const UNIFORM_CONTAINER_KEYS = ['_tDiffuse', '_tDiffuseBlur', '_tDepth'] as const;
    for (const key of UNIFORM_CONTAINER_KEYS) {
      try {
        const container = mat[key] as UniformContainer | undefined;
        if (container && 'value' in container) {
          container.value = null;
        }
      } catch {
        // ignore
      }
    }

    // Step 4: Dispose the material itself to free compiled WebGLPrograms.
    // THREE.Material.dispose() is safe to call multiple times.
    try {
      const dispose = (mat as { dispose?: () => void }).dispose;
      if (typeof dispose === 'function') {
        dispose();
      }
    } catch {
      // Material may already be disposed or in a bad state
    }

    // Step 5: Best-effort attempt to reach fbo1/fbo2/blurpass.
    // These are local variables in drei's React component closure, NOT on
    // the material, so they will always be undefined. This defensive block
    // becomes effective if a future version of drei exposes them.
    const INTERNAL_KEYS = ['fbo1', 'fbo2', 'blurpass'] as const;
    for (const key of INTERNAL_KEYS) {
      try {
        const resource = mat[key] as DisposableResource | undefined;
        if (resource && typeof resource.dispose === 'function') {
          resource.dispose();
        }
      } catch {
        // Not exposed on material — expected
      }
    }
  } catch {
    // Best-effort: never let cleanup errors propagate
  }
}
