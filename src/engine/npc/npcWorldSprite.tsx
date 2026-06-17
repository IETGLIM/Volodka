import { useRef, useEffect, useMemo, useLayoutEffect, useId, type MutableRefObject } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';

const LABEL_CANVAS_W = 256;
const LABEL_CANVAS_H = 64;
const NAME_MAX_CHARS = 18;

function hexWithAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function truncateLabel(text: string, maxChars: number): string {
  return text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text;
}

function disposeCanvasSpriteResources(
  texture: THREE.CanvasTexture,
  material: THREE.SpriteMaterial,
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
): void {
  texture.dispose();
  if (texture.source?.data) {
    (texture.source as { data: unknown }).data = null;
  }
  material.dispose();
  canvasRef.current = null;
}

function drawNameLabelCanvas(
  ctx: CanvasRenderingContext2D,
  name: string,
  accentColor: string,
  bodyColor: string,
): void {
  const displayName = truncateLabel(name, NAME_MAX_CHARS);
  ctx.clearRect(0, 0, LABEL_CANVAS_W, LABEL_CANVAS_H);
  ctx.font = '600 22px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(displayName);
  const padX = 16;
  const boxW = Math.min(LABEL_CANVAS_W - 8, metrics.width + padX * 2);
  const boxH = 32;
  const boxX = (LABEL_CANVAS_W - boxW) / 2;
  const boxY = (LABEL_CANVAS_H - boxH) / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.fill();

  ctx.strokeStyle = hexWithAlpha(bodyColor, 0.6);
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 6;
  ctx.fillText(displayName, LABEL_CANVAS_W / 2, LABEL_CANVAS_H / 2);
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const materialRef = useRef<THREE.SpriteMaterial | null>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = LABEL_CANVAS_W;
    canvas.height = LABEL_CANVAS_H;
    canvasRef.current = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = tex;
    return tex;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    materialRef.current = mat;
    return mat;
  }, [texture]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawNameLabelCanvas(ctx, name, accentColor, bodyColor);
    texture.needsUpdate = true;
  }, [name, accentColor, bodyColor, texture]);

  useEffect(() => {
    material.opacity = opacity;
  }, [material, opacity]);

  useLayoutEffect(
    () => () => {
      const tex = textureRef.current;
      const mat = materialRef.current;
      if (tex && mat) {
        disposeCanvasSpriteResources(tex, mat, canvasRef);
      }
    },
    [],
  );

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
  activeDot: number,
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
    const dots = ['·', '·', '·'].map((d, i) => (activeDot === i ? d : ' '));
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
  const tickLabel = useId();
  const dotPhaseRef = useRef(0);
  const activeDotRef = useRef(0);
  const phaseRef = useRef(phase);
  const textRef = useRef(text);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const materialRef = useRef<THREE.SpriteMaterial | null>(null);

  phaseRef.current = phase;
  textRef.current = text;

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = BUBBLE_CANVAS_W;
    canvas.height = BUBBLE_CANVAS_H;
    canvasRef.current = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = tex;
    return tex;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    materialRef.current = mat;
    return mat;
  }, [texture]);

  const redrawBubble = (activeDot: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawSpeechBubbleCanvas(ctx, phaseRef.current, textRef.current, activeDot);
    texture.needsUpdate = true;
  };

  useEffect(() => {
    if (phase === 'thinking') {
      dotPhaseRef.current = 0;
      activeDotRef.current = 0;
    }
    redrawBubble(activeDotRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [phase, text, texture]);

  useEffect(() => {
    material.opacity = opacity;
  }, [material, opacity]);

  useFrameTick(
    'npc',
    ({ delta }) => {
      if (phaseRef.current !== 'thinking') return;
      dotPhaseRef.current += delta;
      const nextDot = Math.floor((dotPhaseRef.current * 3) % 3);
      if (nextDot === activeDotRef.current) return;
      activeDotRef.current = nextDot;
      redrawBubble(nextDot);
    },
    { phase: 'pre', label: tickLabel },
  );

  useLayoutEffect(
    () => () => {
      const tex = textureRef.current;
      const mat = materialRef.current;
      if (tex && mat) {
        disposeCanvasSpriteResources(tex, mat, canvasRef);
      }
    },
    [],
  );

  return (
    <sprite
      position={[0, 2.4, 0]}
      material={material}
      scale={[0.9, 0.16, 1]}
    />
  );
}

const MARKER_CANVAS_SIZE = 128;
const MARKER_BASE_SCALE = 0.35;

function drawQuestMarkerCanvas(
  ctx: CanvasRenderingContext2D,
  icon: string,
  color: string,
  questName: string,
): void {
  ctx.clearRect(0, 0, MARKER_CANVAS_SIZE, MARKER_CANVAS_SIZE);
  const cx = MARKER_CANVAS_SIZE / 2;
  const cy = MARKER_CANVAS_SIZE / 2 - 8;

  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fillStyle = hexWithAlpha(color, 0.27);
  ctx.fill();

  ctx.font = 'bold 36px monospace';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
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
  const tickLabel = useId();
  const spriteRef = useRef<THREE.Sprite>(null);
  const pulsePhaseRef = useRef(0);
  const pulseSpeedRef = useRef(pulseSpeed);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const materialRef = useRef<THREE.SpriteMaterial | null>(null);

  pulseSpeedRef.current = pulseSpeed;

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = MARKER_CANVAS_SIZE;
    canvas.height = MARKER_CANVAS_SIZE;
    canvasRef.current = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = tex;
    return tex;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    });
    materialRef.current = mat;
    return mat;
  }, [texture]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawQuestMarkerCanvas(ctx, icon, color, questName);
    texture.needsUpdate = true;
  }, [icon, color, questName, texture]);

  useFrameTick(
    'npc',
    ({ delta }) => {
      pulsePhaseRef.current += delta * (1.5 / pulseSpeedRef.current) * 3.0;
      const pulse = 0.7 + Math.sin(pulsePhaseRef.current) * 0.5;
      const mat = materialRef.current;
      if (mat) {
        mat.opacity = 0.75 + pulse * 0.25;
      }
      const sprite = spriteRef.current;
      if (sprite) {
        const scale = MARKER_BASE_SCALE * (0.92 + pulse * 0.12);
        sprite.scale.set(scale, scale, 1);
      }
    },
    { phase: 'pre', label: tickLabel },
  );

  useLayoutEffect(
    () => () => {
      const tex = textureRef.current;
      const mat = materialRef.current;
      if (tex && mat) {
        disposeCanvasSpriteResources(tex, mat, canvasRef);
      }
    },
    [],
  );

  return (
    <sprite
      ref={spriteRef}
      position={[0, 1.75, 0]}
      material={material}
      scale={[MARKER_BASE_SCALE, MARKER_BASE_SCALE, 1]}
    />
  );
}
