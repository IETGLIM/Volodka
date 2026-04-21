'use client';

import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CHARSET = 'アイウエオカ0123456789█▓▒░[]{}<>ВОЛОДЬКА';

type Drop = { x: number; y: number; speed: number; len: number; head: string };

function rnd(seed: number, i: number): number {
  return ((seed * 9301 + i * 49297) % 233280) / 233280;
}

function initDrops(cols: number, rows: number, seed: number): Drop[] {
  const drops: Drop[] = [];
  for (let c = 0; c < cols; c += 1) {
    drops.push({
      x: c,
      y: rnd(seed, c) * rows,
      speed: 0.35 + rnd(seed, c + 99) * 1.15,
      len: 3 + Math.floor(rnd(seed, c + 199) * 10),
      head: CHARSET[Math.floor(rnd(seed, c + 299) * CHARSET.length) % CHARSET.length] ?? '0',
    });
  }
  return drops;
}

function drawMatrix(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  drops: Drop[],
  cols: number,
  rows: number,
  t: number,
  seed: number,
): void {
  ctx.fillStyle = 'rgba(0, 6, 2, 0.22)';
  ctx.fillRect(0, 0, w, h);
  const fontPx = Math.max(7, Math.floor(w / cols) - 1);
  ctx.font = `${fontPx}px monospace`;
  const prng = (idx: number, salt: number) =>
    ((seed + idx * 11003 + salt + Math.floor(t * 30)) % 1000) / 1000;

  for (let idx = 0; idx < drops.length; idx += 1) {
    const d = drops[idx]!;
    d.y += d.speed * 0.42;
    if (d.y - d.len > rows) {
      d.y = -prng(idx, 1) * rows * 0.5;
      d.speed = 0.35 + prng(idx, 2) * 1.15;
      d.len = 3 + Math.floor(prng(idx, 3) * 10);
      d.head = CHARSET[Math.floor(prng(idx, 4) * CHARSET.length) % CHARSET.length] ?? '0';
    }
    const gx = (d.x / cols) * w;
    for (let i = 0; i < d.len; i += 1) {
      const row = Math.floor(d.y) - i;
      if (row < 0 || row >= rows) continue;
      const gy = (row / rows) * h;
      const ch =
        i === 0
          ? d.head
          : CHARSET[Math.floor(prng(idx * 131 + i * 9, 5) * CHARSET.length) % CHARSET.length] ?? '·';
      const g = i === 0 ? 1 : Math.max(0.15, 0.92 - i * 0.08);
      ctx.fillStyle = i === 0 ? `rgba(200, 255, 210, ${0.85 * g})` : `rgba(0, ${180 + i * 6}, 70, ${0.55 * g})`;
      ctx.fillText(ch, gx, gy + fontPx);
    }
  }
}

export type MatrixRainScreenMeshProps = {
  seed?: number;
  width?: number;
  height?: number;
  emissiveIntensity?: number;
};

/**
 * Плоский экран с процедурным «матричным дождём» (CanvasTexture + `useFrame`).
 */
export const MatrixRainScreenMesh = memo(function MatrixRainScreenMesh({
  seed = 1,
  width = 0.42,
  height = 0.28,
  emissiveIntensity = 1.15,
}: MatrixRainScreenMeshProps) {
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const dropsRef = useRef<Drop[] | null>(null);
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
    textureRef.current = texture;
    dropsRef.current = initDrops(cols, rows, seed);
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
    drawMatrix(ctx, canvas.width, canvas.height, drops, cols, rows, clock.elapsedTime, seed);
    tex.needsUpdate = true;
  });

  return (
    <mesh castShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={texture}
        emissiveMap={texture}
        emissive="#22ff66"
        emissiveIntensity={emissiveIntensity}
        roughness={0.42}
        metalness={0.12}
        toneMapped={false}
      />
    </mesh>
  );
});
