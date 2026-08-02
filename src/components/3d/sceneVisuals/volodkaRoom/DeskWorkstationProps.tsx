/* Wake-room desk surface props — keyboard RGB + mouse sit on the tabletop. */

import { useMemo } from 'react';
import * as THREE from 'three';
import {
  getSharedBoxGeometry,
  getSharedCylinderGeometry,
} from '@/engine/three/moduleGeometryRegistry';

function createRgbKeyboardTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 96;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  // Base chassis
  ctx.fillStyle = '#1a1c22';
  ctx.fillRect(0, 0, w, h);
  // Key grid with cyan→magenta gradient emissive look
  const cols = 14;
  const rows = 5;
  const padX = 10;
  const padY = 10;
  const keyW = (w - padX * 2) / cols - 2;
  const keyH = (h - padY * 2) / rows - 2;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const t = col / (cols - 1);
      const hue = 180 + t * 140; // cyan → magenta
      const light = 42 + row * 4;
      ctx.fillStyle = `hsl(${hue} 85% ${light}%)`;
      const x = padX + col * (keyW + 2);
      const y = padY + row * (keyH + 2);
      ctx.fillRect(x, y, keyW, keyH);
      // Soft key bevel
      ctx.fillStyle = `hsla(${hue} 90% ${light + 18}% / 0.55)`;
      ctx.fillRect(x, y, keyW, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Gradient RGB backlit keyboard — single textured slab (no per-key materials). */
export function DeskRgbKeyboard({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  const map = useMemo(() => createRgbKeyboardTexture(), []);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow receiveShadow geometry={getSharedBoxGeometry(0.44, 0.016, 0.15)}>
        <meshStandardMaterial
          map={map}
          emissiveMap={map}
          emissive="#ffffff"
          emissiveIntensity={0.55}
          roughness={0.4}
          metalness={0.2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Compact desk mouse with subtle LED. */
export function DeskMouse({
  position,
  rotationY = 0.2,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow geometry={getSharedBoxGeometry(0.055, 0.028, 0.09)}>
        <meshStandardMaterial color="#22262e" roughness={0.45} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.016, -0.01]} geometry={getSharedCylinderGeometry(0.012, 0.014, 0.01, 10)}>
        <meshStandardMaterial color="#2a3038" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.006, 0.035]} geometry={getSharedBoxGeometry(0.02, 0.004, 0.012)}>
        <meshStandardMaterial
          color="#44ddaa"
          emissive="#44ddaa"
          emissiveIntensity={0.7}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Soft hanging curtain behind the monitor trio. */
export function DeskWallCurtain({
  position,
  width = 2.4,
  height = 2.1,
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
}) {
  const folds = useMemo(() => {
    const n = 7;
    return Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      return {
        x: -width / 2 + t * width,
        z: Math.sin(t * Math.PI * 3) * 0.025,
        w: width / n + 0.02,
      };
    });
  }, [width]);

  return (
    <group position={position}>
      {folds.map((f, i) => (
        <mesh
          key={i}
          position={[f.x, height / 2, f.z]}
          castShadow
          receiveShadow
          geometry={getSharedBoxGeometry(f.w, height, 0.02)}
        >
          <meshStandardMaterial
            color={i % 2 === 0 ? '#2a2438' : '#322a42'}
            roughness={0.92}
            metalness={0.02}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* Rod */}
      <mesh
        position={[0, height + 0.02, 0]}
        rotation={[0, 0, Math.PI / 2]}
        geometry={getSharedCylinderGeometry(0.012, 0.012, width + 0.1, 8)}
      >
        <meshStandardMaterial color="#4a4555" roughness={0.4} metalness={0.55} />
      </mesh>
    </group>
  );
}
