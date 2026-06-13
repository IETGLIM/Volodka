/** Minimal clutter chunk for factory basement — lazy-loaded on scene enter. */
export function FactoryBasementClutterChunk() {
  return (
    <group>
      <mesh position={[1.2, 0.4, -0.8]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.5]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>
      <mesh position={[-1.5, 0.25, 1.2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.5, 8]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.5} />
      </mesh>
    </group>
  );
}
