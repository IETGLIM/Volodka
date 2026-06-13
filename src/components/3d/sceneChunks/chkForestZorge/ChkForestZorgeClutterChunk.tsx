/** Minimal clutter chunk for CHK forest Zorge — lazy-loaded on scene enter. */
export function ChkForestZorgeClutterChunk() {
  return (
    <group>
      <mesh position={[2, 0.3, -1.5]} castShadow>
        <coneGeometry args={[0.4, 0.6, 6]} />
        <meshStandardMaterial color="#1a3020" roughness={0.95} />
      </mesh>
      <mesh position={[-1.8, 0.15, 0.6]}>
        <boxGeometry args={[0.5, 0.3, 0.4]} />
        <meshStandardMaterial color="#2a2018" roughness={0.9} />
      </mesh>
    </group>
  );
}
