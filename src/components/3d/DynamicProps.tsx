/* ─── Volodka RPG – pushable dynamic physics props ───
 *  Small clutter (cans, bottles, boxes, barrels) as Rapier dynamic bodies.
 *  The player's KinematicCharacterController has applyImpulsesToDynamicBodies
 *  enabled, so walking into a prop kicks it. Remounts per scene (key=sceneId).
 */

import { useRef } from 'react';
import { RigidBody, CylinderCollider, CuboidCollider } from '@react-three/rapier';
import { useGameStore } from '@/store/gameStore';
import { useMobileVisualPerf } from '@/hooks/use-mobile';
import { audioEngine } from '@/engine/audio/AudioEngine';
import { DYNAMIC_PROPS, type DynamicPropDef } from '@/data/dynamicProps';

/** Footstep material reused as a cheap impact "clatter" per prop kind */
const IMPACT_MATERIAL: Record<DynamicPropDef['kind'], string> = {
  can: 'metal',
  bottle: 'tile',
  box: 'wood',
  barrel: 'metal',
};

/** M4: Minimum mass per prop kind to prevent extreme impulse transfer.
 *  A 75 kg player at 7 m/s should nudge props, not launch them. */
const PROP_MASS: Record<DynamicPropDef['kind'], number> = {
  can: 5,
  bottle: 5,
  box: 8,
  barrel: 15,
};

const IMPACT_COOLDOWN_S = 0.3;

function PropBody({ def }: { def: DynamicPropDef }) {
  const lastImpactRef = useRef(0);

  const onImpact = () => {
    const now = performance.now() / 1000;
    if (now - lastImpactRef.current < IMPACT_COOLDOWN_S) return;
    lastImpactRef.current = now;
    audioEngine.playFootstep(IMPACT_MATERIAL[def.kind]);
  };

  const common = {
    position: [def.position[0], def.position[1] + restHeight(def.kind), def.position[2]] as [
      number,
      number,
      number,
    ],
    rotation: [0, def.rotation ?? 0, 0] as [number, number, number],
    linearDamping: 0.6,
    angularDamping: 0.9,
    onCollisionEnter: onImpact,
  };

  switch (def.kind) {
    case 'can':
      return (
        <RigidBody {...common} colliders={false} mass={PROP_MASS.can} ccd>
          <CylinderCollider args={[0.08, 0.06]} restitution={0.35} friction={0.5} />
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.16, 10]} />
            <meshStandardMaterial color="#8a3a2a" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.081, 0]}>
            <cylinderGeometry args={[0.058, 0.058, 0.004, 10]} />
            <meshStandardMaterial color="#b8b8b8" metalness={0.8} roughness={0.25} />
          </mesh>
        </RigidBody>
      );
    case 'bottle':
      return (
        <RigidBody {...common} colliders={false} mass={PROP_MASS.bottle} ccd>
          <CylinderCollider args={[0.12, 0.045]} restitution={0.25} friction={0.45} />
          <mesh castShadow>
            <cylinderGeometry args={[0.045, 0.05, 0.2, 8]} />
            <meshStandardMaterial color="#1a3a18" metalness={0.2} roughness={0.15} transparent opacity={0.92} />
          </mesh>
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.03, 0.08, 8]} />
            <meshStandardMaterial color="#1a3a18" metalness={0.2} roughness={0.15} transparent opacity={0.92} />
          </mesh>
        </RigidBody>
      );
    case 'box':
      return (
        <RigidBody {...common} colliders={false} mass={PROP_MASS.box} ccd>
          <CuboidCollider args={[0.18, 0.13, 0.15]} restitution={0.2} friction={0.7} />
          <mesh castShadow>
            <boxGeometry args={[0.36, 0.26, 0.3]} />
            <meshStandardMaterial color="#7a5c38" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.131, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.34, 0.06]} />
            <meshStandardMaterial color="#a8906a" roughness={0.95} />
          </mesh>
        </RigidBody>
      );
    case 'barrel':
      return (
        <RigidBody {...common} colliders={false} mass={PROP_MASS.barrel} ccd>
          <CylinderCollider args={[0.3, 0.24]} restitution={0.15} friction={0.7} />
          <mesh castShadow>
            <cylinderGeometry args={[0.24, 0.24, 0.6, 12]} />
            <meshStandardMaterial color="#4a4438" metalness={0.55} roughness={0.5} />
          </mesh>
          {[-0.18, 0.18].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <torusGeometry args={[0.245, 0.012, 6, 14]} />
              <meshStandardMaterial color="#2e2a22" metalness={0.7} roughness={0.4} />
            </mesh>
          ))}
        </RigidBody>
      );
    default: {
      const exhaustive: never = def.kind;
      return exhaustive;
    }
  }
}

function restHeight(kind: DynamicPropDef['kind']): number {
  switch (kind) {
    case 'can':
      return 0.1;
    case 'bottle':
      return 0.13;
    case 'box':
      return 0.15;
    case 'barrel':
      return 0.32;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

/** Pushable clutter for the current scene. Skipped on visual-lite presets. */
export function DynamicProps() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const { visualLite } = useMobileVisualPerf();

  const defs = DYNAMIC_PROPS[sceneId];
  if (visualLite || !defs || defs.length === 0) return null;

  return (
    <group key={`dynamic-props:${sceneId}`}>
      {defs.map((def) => (
        <PropBody key={def.id} def={def} />
      ))}
    </group>
  );
}
