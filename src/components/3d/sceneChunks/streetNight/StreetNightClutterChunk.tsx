/** Minimal clutter chunk for street night — lazy-loaded on scene enter. */
export function StreetNightClutterChunk() {
  return (
    <group>
      <mesh position={[1.5, 0.2, 2]} castShadow>
        <boxGeometry args={[0.8, 0.4, 0.5]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.85} />
      </mesh>
      <mesh position={[-2, 0.35, -1]}>
        <cylinderGeometry args={[0.08, 0.12, 0.7, 6]} />
        <meshStandardMaterial color="#333" metalness={0.6} />
      </mesh>
    </group>
  );
}
