/* ─── Volodka RPG – God Rays Sun Mesh (postprocessing source) ───
 * Dedicated emissive sphere mesh that serves as the `sun` source for the
 * postprocessing GodRaysEffect in ExplorationPostFX. The mesh is tiny (~0.1m
 * radius), additive-blended, depth-write-disabled, and tone-mapping-disabled
 * so it reads as a pure light source for the GodRays shader.
 *
 * Why a dedicated mesh (not the existing GodRays.tsx cylinders or scene lights):
 * - GodRaysEffect requires a `Mesh | Points` sun prop (not a Three.js Light).
 * - The effect's `update()` re-parents the mesh into a private `lightScene`,
 *   so the mesh must NOT be animated/transformed elsewhere.
 * - Existing GodRays.tsx cylinders have their center at mid-shaft, not at the
 *   light origin — GodRays projects rays FROM the sun mesh's screen position,
 *   so we need the mesh at the actual light bulb position.
 *
 * Этап 98 (persistent composer): меш смонтирован ОДИН раз на ultra-структуре
 * и живёт между сценами — позиция/цвет применяются императивно из
 * GODRAYS_SUN_CONFIG (scenePostFxProfiles) в effect по sceneId, JSX-props
 * позиции/цвета больше нет: GodRaysEffect переносит меш в свой lightScene,
 * поэтому все трансформации — только прямые мутации через ref.
 */

import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { AdditiveBlending, Mesh, SphereGeometry, type MeshBasicMaterial } from 'three';
import type { SceneId } from '@/shared/types/game';
import { getGodRaysSunConfig, type GodRaysSunConfig } from '@/engine/graphics/scenePostFxProfiles';

// Конфиг «солнца» переехал в scenePostFxProfiles (этап 98) — ре-экспорт для совместимости.
export type { GodRaysSunConfig };

interface GodRaysSunMeshProps {
  sceneId: SceneId;
  /** Fired from a useLayoutEffect once the mesh ref has been committed, so the
   *  parent can gate the <GodRays> effect mount on a non-null sun ref. This
   *  prevents GodRaysEffect from being constructed with a null lightSource
   *  (which crashes the EffectComposer render loop → black screen). */
  onMount?: () => void;
}

/** Emissive sphere mesh that acts as the GodRays postprocessing sun source.
 *  Forwarded ref exposes the Mesh so ExplorationPostFX can pass it to
 *  the <GodRays sun={...} /> effect. Живёт между сценами: пер-сценная
 *  конфигурация применяется императивно (position/color/visible). */
export const GodRaysSunMesh = forwardRef<Mesh, GodRaysSunMeshProps>(
  function GodRaysSunMesh({ sceneId, onMount }, ref) {
    const meshRef = useRef<Mesh | null>(null);
    const geometry = useMemo(() => new SphereGeometry(0.1, 8, 8), []);

    // R3F auto-disposes geometries declared via JSX (<sphereGeometry/>), but NOT
    // geometries passed as a prop from useMemo. Dispose on unmount.
    useEffect(() => () => geometry.dispose(), [geometry]);

    // Комбинированный ref: наружу (GodRays sun) и внутрь (императивные мутации).
    // useImperativeHandle гарантирует, что ref.current актуален к моменту,
    // когда родитель читает его в layout-фазе.
    useLayoutEffect(() => {
      const mesh = meshRef.current;
      if (!mesh) return;
      const config = getGodRaysSunConfig(sceneId);
      if (config) {
        mesh.visible = true;
        mesh.position.set(config.position[0], config.position[1], config.position[2]);
        (mesh.material as MeshBasicMaterial).color.set(config.color);
      } else {
        // Сцена без GodRays — пасс выключается аплаером; прячем и сам меш.
        mesh.visible = false;
      }
    }, [sceneId]);

    // Signal readiness synchronously after commit so the parent can mount the
    // <GodRays> effect on the next render with a guaranteed non-null sun ref.
    // useLayoutEffect (not useEffect) so it fires before the browser paints —
    // otherwise a render tick could sneak in with the effect still unmounted.
    useLayoutEffect(() => {
      onMount?.();
    }, [onMount]);

    return (
      <mesh
        ref={(node: Mesh | null) => {
          meshRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as RefObject<Mesh | null>).current = node;
        }}
        geometry={geometry}
        // GodRaysEffect requires: sun mesh must NOT write depth and must be
        // transparent. The effect's `set lightSource` auto-sets these, but
        // explicit is safer (matches postprocessing docs).
        // toneMapped={false} so the emissive color isn't tone-mapped down
        // before GodRays samples it. Начальный цвет нейтральный — пер-сценный
        // цвет применяется в layout-effect выше.
        visible={false}
      >
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    );
  },
);
