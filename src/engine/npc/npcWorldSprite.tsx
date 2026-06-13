import { useRef, useEffect, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';

const LABEL_CANVAS_W = 256;
const LABEL_CANVAS_H = 64;

function drawNameLabelCanvas(
  ctx: CanvasRenderingContext2D,
  name: string,
  accentColor: string,
  bodyColor: string,
): void {
  ctx.clearRect(0, 0, LABEL_CANVAS_W, LABEL_CANVAS_H);
  ctx.font = '600 22px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(name);
  const padX = 16;
  const boxW = Math.min(LABEL_CANVAS_W - 8, metrics.width + padX * 2);
  const boxH = 32;
  const boxX = (LABEL_CANVAS_W - boxW) / 2;
  const boxY = (LABEL_CANVAS_H - boxH) / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.fill();

  ctx.strokeStyle = `${bodyColor}99`;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 6;
  ctx.fillText(name, LABEL_CANVAS_W / 2, LABEL_CANVAS_H / 2);
  ctx.shadowBlur = 0;
}

export function NpcNameSprite({
  name,
  accentColor,
  bodyColor,
  opacity,
}: {
  name: string;
  accentColor: string;
  bodyColor: string;
  opacity: number;
}) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const { texture, material } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = LABEL_CANVAS_W;
    canvas.height = LABEL_CANVAS_H;
    const ctx = canvas.getContext('2d')!;
    drawNameLabelCanvas(ctx, name, accentColor, bodyColor);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      opacity,
    });
    return { texture: tex, material: mat };
  }, [name, accentColor, bodyColor, opacity]);

  useEffect(() => {
    material.opacity = opacity;
  }, [material, opacity]);

  useEffect(() => () => { texture.dispose(); material.dispose(); }, [texture, material]);

  return (
    <sprite
      ref={spriteRef}
      position={[0, 2.15, 0]}
      material={material}
      scale={[0.55, 0.14, 1]}
    />
  );
}

const BUBBLE_CANVAS_W = 440;
const BUBBLE_CANVAS_H = 80;

function drawSpeechBubbleCanvas(
  ctx: CanvasRenderingContext2D,
  phase: 'thinking' | 'speaking' | 'fading',
  text: string,
  dotPhase: number,
): void {
  ctx.clearRect(0, 0, BUBBLE_CANVAS_W, BUBBLE_CANVAS_H);
  const isThinking = phase === 'thinking';
  const borderColor = isThinking ? 'rgba(0, 255, 238, 0.7)' : 'rgba(255, 180, 40, 0.7)';
  const textColor = isThinking ? '#00ffee' : '#f0f0f0';

  ctx.fillStyle = 'rgba(8, 8, 18, 0.95)';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  const boxW = BUBBLE_CANVAS_W - 20;
  const boxH = 52;
  const boxX = 10;
  const boxY = 8;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = isThinking ? '22px monospace' : '600 22px monospace';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (isThinking) {
    const dots = ['·', '·', '·'].map((d, i) => {
      const active = Math.floor((dotPhase * 3) % 3) === i;
      return active ? d : ' ';
    });
    ctx.fillText(dots.join(' '), BUBBLE_CANVAS_W / 2, boxY + boxH / 2);
  } else {
    const display = text.length > 28 ? `${text.slice(0, 27)}…` : text;
    ctx.fillText(display, BUBBLE_CANVAS_W / 2, boxY + boxH / 2);
  }
}

export function NpcSpeechSprite({
  phase,
  text,
  opacity,
}: {
  phase: 'thinking' | 'speaking' | 'fading';
  text: string;
  opacity: number;
}) {
  const dotPhaseRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const { texture, material } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = BUBBLE_CANVAS_W;
    canvas.height = BUBBLE_CANVAS_H;
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d')!;
    ctxRef.current = ctx;
    drawSpeechBubbleCanvas(ctx, phase, text, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      opacity,
    });
    return { texture: tex, material: mat };
  }, [phase, text, opacity]);

  useEffect(() => {
    material.opacity = opacity;
  }, [material, opacity]);

  useFrameTick('npc', ({ delta }) => {
    if (phase !== 'thinking') return;
    dotPhaseRef.current += delta;
    const ctx = ctxRef.current;
    const tex = texture;
    if (!ctx) return;
    drawSpeechBubbleCanvas(ctx, phase, text, dotPhaseRef.current);
    tex.needsUpdate = true;
  });

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    drawSpeechBubbleCanvas(ctx, phase, text, dotPhaseRef.current);
    texture.needsUpdate = true;
  }, [phase, text, texture]);

  useEffect(() => () => { texture.dispose(); material.dispose(); }, [texture, material]);

  return (
    <sprite
      position={[0, 2.4, 0]}
      material={material}
      scale={[0.9, 0.16, 1]}
    />
  );
}

const MARKER_CANVAS_SIZE = 128;

function drawQuestMarkerCanvas(
  ctx: CanvasRenderingContext2D,
  icon: string,
  color: string,
  questName: string,
  glowAlpha: number,
): void {
  ctx.clearRect(0, 0, MARKER_CANVAS_SIZE, MARKER_CANVAS_SIZE);
  const cx = MARKER_CANVAS_SIZE / 2;
  const cy = MARKER_CANVAS_SIZE / 2 - 8;

  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fillStyle = `${color}${Math.round(glowAlpha * 45).toString(16).padStart(2, '0')}`;
  ctx.fill();

  ctx.font = 'bold 36px monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 8 * glowAlpha;
  ctx.fillText(icon, cx, cy);
  ctx.shadowBlur = 0;

  ctx.font = '10px monospace';
  ctx.globalAlpha = 0.65;
  const label = questName.length > 10 ? `${questName.slice(0, 9)}…` : questName;
  ctx.fillText(label, cx, cy + 28);
  ctx.globalAlpha = 1;
}

export function NpcQuestMarkerSprite({
  icon,
  color,
  questName,
  pulseSpeed,
}: {
  icon: string;
  color: string;
  questName: string;
  pulseSpeed: number;
}) {
  const pulsePhaseRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const { texture, material } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = MARKER_CANVAS_SIZE;
    canvas.height = MARKER_CANVAS_SIZE;
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d')!;
    ctxRef.current = ctx;
    drawQuestMarkerCanvas(ctx, icon, color, questName, 1);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    });
    return { texture: tex, material: mat };
  }, [icon, color, questName]);

  useFrameTick('npc', ({ delta }) => {
    pulsePhaseRef.current += delta * (1.5 / pulseSpeed) * 3.0;
    const glowIntensity = 0.7 + Math.sin(pulsePhaseRef.current) * 0.5;
    const ctx = ctxRef.current;
    if (!ctx) return;
    drawQuestMarkerCanvas(ctx, icon, color, questName, glowIntensity);
    texture.needsUpdate = true;
  });

  useEffect(() => () => { texture.dispose(); material.dispose(); }, [texture, material]);

  return (
    <sprite
      position={[0, 1.75, 0]}
      material={material}
      scale={[0.35, 0.35, 1]}
    />
  );
}
