import { useEffect, useLayoutEffect, useRef } from 'react';
import { AdditiveBlending, DoubleSide, Group, Mesh, MeshBasicMaterial, PointLight, SpotLight } from 'three';
import type { ProximityGodRayProps } from './ProximityGodRayTypes';
import { addGodRayBatchEntry, removeGodRayBatchEntry, type GodRayBatchEntry } from './proximityGodRayBatch';

export type { ProximityGodRayProps };

/** Soft spotlight + volumetric cone for nearby interactables (no floor ring).
 *
 *  PERF (v4.40, этап 27): экземпляр НЕ регистрирует собственный кадровый тик.
 *  Все лучи сцены обслуживает один центральный тик ProximityGodRayBatch
 *  (см. proximityGodRayBatch.ts) — компонент лишь публикует в батч ссылки
 *  на материалы/группу и зеркалирует свежие пропсы. */
export function ProximityGodRay(props: ProximityGodRayProps) {
  const {
    active = false,
    activeRef,
    color = '#88eeff',
    beamHeight = 2.8,
    baseY = 0.35,
    coneRadius = 0.38,
    enableLights = false,
    spotAngle = 0.38,
  } = props;

  const spotRef = useRef<SpotLight>(null);
  const fillRef = useRef<PointLight>(null);
  const coneMatRef = useRef<MeshBasicMaterial>(null);
  const glintMatRef = useRef<MeshBasicMaterial>(null);
  const glintMeshRef = useRef<Mesh>(null);
  const rootGroupRef = useRef<Group>(null);

  const usesActiveRef = activeRef !== undefined;
  const resolvedColor = props.colorRef?.current ?? color;
  const mounted = usesActiveRef || active;
  const mountedRef = useRef(mounted);
  mountedRef.current = mounted;

  const propsRef = useRef(props);
  propsRef.current = props;

  const entryRef = useRef<GodRayBatchEntry | null>(null);
  if (entryRef.current === null) {
    entryRef.current = {
      props,
      usesActiveRef,
      rootGroup: rootGroupRef,
      spot: spotRef,
      fill: fillRef,
      coneMat: coneMatRef,
      glintMat: glintMatRef,
      glintMesh: glintMeshRef,
      hidden: true,
      pulse: 0,
    };
  }
  // Mirror latest props/flags into the stable entry — no re-registration.
  entryRef.current.props = propsRef.current;
  entryRef.current.usesActiveRef = usesActiveRef;

  useLayoutEffect(() => {
    const entry = entryRef.current;
    if (!entry || !mountedRef.current) return;
    addGodRayBatchEntry(entry);
    return () => {
      removeGodRayBatchEntry(entry);
    };
  }, [mounted]);

  // React StrictMode remounts effects — keep the batch registration alive.
  useEffect(() => {
    const entry = entryRef.current;
    if (!entry || !mountedRef.current) return;
    addGodRayBatchEntry(entry);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <group ref={rootGroupRef} position={[0, baseY, 0]} visible={false}>
      {enableLights && (
        <spotLight
          ref={spotRef}
          color={resolvedColor}
          intensity={0.4}
          angle={spotAngle}
          penumbra={0.94}
          distance={Math.max(5, beamHeight * 2.2)}
          decay={2}
          position={[0, beamHeight, 0.12]}
          castShadow={false}
        >
          <object3D attach="target" position={[0, 0, 0]} />
        </spotLight>
      )}
      <mesh position={[0, beamHeight * 0.42, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[coneRadius, beamHeight * 0.9, 16, 1, true]} />
        <meshBasicMaterial
          ref={coneMatRef}
          color={resolvedColor}
          transparent
          opacity={0.1}
          depthWrite={false}
          side={DoubleSide}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh ref={glintMeshRef} position={[0, 0.06, 0]} renderOrder={3}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial
          ref={glintMatRef}
          color={resolvedColor}
          transparent
          opacity={0.24}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      {enableLights && (
        <pointLight ref={fillRef} color={color} intensity={0.22} distance={2.8} decay={2} position={[0, 0.25, 0]} />
      )}
    </group>
  );
}
