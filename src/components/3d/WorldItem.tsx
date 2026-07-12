import { useRef, useState } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { getGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';

/** World item that can be picked up — bobs up and down */
export function WorldItem({
  id,
  position,
  label: _label,
  onPickup,
}: {
  id: string;
  position: [number, number, number];
  label: string;
  onPickup?: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseY = position[1];
  const time = useRef(0);
  const [picked, setPicked] = useState(false);

  useFrameTick('interaction', ({ delta }) => {
    if (!meshRef.current || picked) return;
    time.current += delta;
    // Bob animation
    meshRef.current.position.y = baseY + Math.sin(time.current * 2) * 0.08;
    // Slow rotation
    meshRef.current.rotation.y += delta * 0.5;
  });

  if (picked) return null;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={() => {
          setPicked(true);
          onPickup?.(id);
          eventBus.emit('object:interact', {
            objectId: id,
            sceneId: getGameStore().exploration.currentSceneId,
          });
        }}
      >
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial
          color="#ffaa44"
          emissive="#ff8800"
          emissiveIntensity={0.55}
        />
      </mesh>
    </group>
  );
}
