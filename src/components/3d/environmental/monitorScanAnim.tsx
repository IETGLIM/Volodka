import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';
import { seededRandom, hashString } from './seededRandom';

export function MonitorScanAnim({ anim }: { anim: EnvAnimation }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const timeRef = useRef(0);
  const speed = anim.config.speed ?? 2;
  const intensity = anim.config.intensity ?? 0.3;

  // Create scanline texture
  const scanlineTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    // Dark screen base
    ctx.fillStyle = '#001100';
    ctx.fillRect(0, 0, 64, 256);
    // Scanlines
    ctx.fillStyle = 'rgba(0, 255, 68, 0.08)';
    for (let y = 0; y < 256; y += 4) {
      ctx.fillRect(0, y, 64, 2);
    }
    // Bright scan bar
    ctx.fillStyle = 'rgba(0, 255, 68, 0.4)';
    ctx.fillRect(0, 0, 64, 8);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);
    return tex;
  }, []);

  // Dispose texture on unmount
  useEffect(() => {
    const tex = scanlineTexture;
    return () => { tex.dispose(); };
  }, [scanlineTexture]);

  useFrameTick('misc', ({ delta }) => {
    timeRef.current += delta;
    // Scroll the texture to create a scanline moving down
    const offsetY = (timeRef.current * speed * 0.2) % 1;
    scanlineTexture.offset.set(0, offsetY);

    // Pulse the emissive intensity
    if (materialRef.current) {
      const pulse = 0.3 + Math.sin(timeRef.current * speed) * intensity;
      materialRef.current.emissiveIntensity = pulse;
    }
  });

  return (
    <mesh ref={meshRef} position={anim.position}>
      <planeGeometry args={[0.6, 0.4]} />
      <meshStandardMaterial
        ref={materialRef}
        map={scanlineTexture}
        emissive="#00ff44"
        emissiveIntensity={0.5}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}
