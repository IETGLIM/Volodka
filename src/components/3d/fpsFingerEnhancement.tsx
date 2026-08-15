/**
 * Procedural finger caps for FPS arms GLB rigs that end in empty sleeves.
 * Parent should use scale ~0.01 (Khronos-style arm rigs).
 */

/* eslint-disable react-refresh/only-export-components -- co-located helpers and lazy exports */
import { Mesh, Object3D } from 'three';

const SKIN = '#c4a882';
const SKIN_EMISSIVE = '#1a1208';

const FINGER_LAYOUT: readonly { x: number; y: number; z: number; len: number }[] = [
  { x: -0.35, y: -0.15, z: -0.55, len: 0.55 },
  { x: -0.12, y: -0.18, z: -0.62, len: 0.72 },
  { x: 0.1, y: -0.2, z: -0.66, len: 0.78 },
  { x: 0.3, y: -0.17, z: -0.6, len: 0.68 },
  { x: 0.48, y: -0.1, z: -0.48, len: 0.42 },
];

function Finger({ x, y, z, len }: { x: number; y: number; z: number; len: number }) {
  return (
    <mesh position={[x, y, z]} rotation={[0.15, 0, 0]}>
      <capsuleGeometry args={[0.09, len, 4, 8]} />
      <meshStandardMaterial color={SKIN} roughness={0.72} emissive={SKIN_EMISSIVE} emissiveIntensity={0.08} />
    </mesh>
  );
}

function HandFingers({ side }: { side: 'left' | 'right' }) {
  const xSign = side === 'left' ? -1 : 1;
  return (
    <group position={[xSign * 6.5, -2.5, -14]} rotation={[0.1, xSign * 0.08, 0]}>
      <mesh position={[0, -0.08, -0.18]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.52, 0.14, 0.38]} />
        <meshStandardMaterial color={SKIN} roughness={0.72} emissive={SKIN_EMISSIVE} emissiveIntensity={0.08} />
      </mesh>
      {FINGER_LAYOUT.map((f, i) => (
        <Finger key={i} x={f.x * xSign} y={f.y} z={f.z} len={f.len} />
      ))}
    </group>
  );
}

/** Attach inside the FPS arms mount (same scale as the GLB root). */
export function FpsFingerEnhancement() {
  return (
    <group>
      <HandFingers side="left" />
      <HandFingers side="right" />
    </group>
  );
}

/** Optional: hide finger caps when arm mesh already has detailed hands. */
export function armMeshHasFingerDetail(scene: Object3D): boolean {
  let fingerMeshes = 0;
  scene.traverse((obj) => {
    if (!(obj instanceof Mesh)) return;
    const name = obj.name.toLowerCase();
    if (name.includes('finger') || name.includes('thumb') || name.includes('index')) {
      fingerMeshes += 1;
    }
  });
  return fingerMeshes >= 4;
}
