'use client';

import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  drawCyberMatrixRainFrame,
  initCyberMatrixDrops,
  type CyberMatrixDrop,
} from '@/lib/cyberMatrixRainCanvas';

export type MatrixRainScreenMeshProps = {
  seed?: number;
  width?: number;
  height?: number;
  emissiveIntensity?: number;
  /** Цвет emissive под пост Bloom (без PointLight на экране). */
  emissive?: string;
  /** Статичные строки «интерфейса монитора» поверх матрицы (читаемый текст). */
  statusLines?: readonly string[];
};

/**
 * Плоский экран с процедурным «матричным дождём» (Canvas 2D → `CanvasTexture`, логика в `cyberMatrixRainCanvas`).
 */
export const MatrixRainScreenMesh = memo(function MatrixRainScreenMesh({
  seed = 1,
  width = 0.42,
  height = 0.28,
  emissiveIntensity = 1.15,
  emissive = '#22ff66',
  statusLines = [],
}: MatrixRainScreenMeshProps) {
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const dropsRef = useRef<CyberMatrixDrop[] | null>(null);
  const statusLinesRef = useRef(statusLines);
  const cols = 18;
  const rows = 28;

  const { canvas, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 160;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    return { canvas: c, texture: tex };
  }, []);

  useEffect(() => {
    statusLinesRef.current = statusLines;
  }, [statusLines]);

  useEffect(() => {
    textureRef.current = texture;
    dropsRef.current = initCyberMatrixDrops(cols, rows, seed);
    return () => {
      texture.dispose();
      dropsRef.current = null;
      textureRef.current = null;
    };
  }, [texture, seed]);

  useFrame(({ clock }) => {
    const tex = textureRef.current;
    const drops = dropsRef.current;
    if (!tex || !drops) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000500';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawCyberMatrixRainFrame(
      ctx,
      canvas.width,
      canvas.height,
      drops,
      cols,
      rows,
      clock.elapsedTime,
      seed,
      statusLinesRef.current,
    );
    tex.needsUpdate = true;
  });

  return (
    <mesh castShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={texture}
        emissiveMap={texture}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.42}
        metalness={0.12}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
});
