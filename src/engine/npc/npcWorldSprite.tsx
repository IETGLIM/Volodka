import { useRef, useEffect, useLayoutEffect, useId, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace, Sprite, SpriteMaterial } from 'three';
import { useRegisterNpcFrame } from '@/engine/npc/npcFrameBatch';
import {
  acquireNpcNameLabelTexture,
  acquireNpcQuestMarkerTexture,
  acquireNpcActivityBarkTexture,
  createNpcSpriteMaterial,
  drawNpcSpeechBubbleCanvas,
  releaseNpcNameLabelTexture,
  releaseNpcQuestMarkerTexture,
  releaseNpcActivityBarkTexture,
} from '@/engine/npc/npcSpritePool';

const BUBBLE_CANVAS_W = 440;
const BUBBLE_CANVAS_H = 80;
const MARKER_BASE_SCALE = 0.35;

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
  const materialRef = useRef<SpriteMaterial | null>(null);

  const material = useMemo(() => {
    const texture = acquireNpcNameLabelTexture(name, accentColor, bodyColor);
    const mat = createNpcSpriteMaterial(texture);
    materialRef.current = mat;
    return mat;
  }, [name, accentColor, bodyColor]);

  useEffect(() => {
    material.opacity = opacity;
  }, [material, opacity]);

  useLayoutEffect(
    () => () => {
      materialRef.current?.dispose();
      materialRef.current = null;
      releaseNpcNameLabelTexture(name, accentColor, bodyColor);
    },
    [name, accentColor, bodyColor],
  );

  return (
    <sprite
      position={[0, 2.15, 0]}
      material={material}
      scale={[0.55, 0.14, 1]}
    />
  );
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
  const tickOwner = useId();
  const dotPhaseRef = useRef(0);
  const activeDotRef = useRef(0);
  const phaseRef = useRef(phase);
  const textRef = useRef(text);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<CanvasTexture | null>(null);
  const materialRef = useRef<SpriteMaterial | null>(null);

  phaseRef.current = phase;
  textRef.current = text;

  if (!canvasRef.current) {
    const canvas = document.createElement('canvas');
    canvas.width = BUBBLE_CANVAS_W;
    canvas.height = BUBBLE_CANVAS_H;
    canvasRef.current = canvas;
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    textureRef.current = tex;
  }

  const texture = textureRef.current!;
  const material = materialRef.current ?? createNpcSpriteMaterial(texture);
  materialRef.current = material;

  const redrawBubble = (activeDot: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    drawNpcSpeechBubbleCanvas(ctx, phaseRef.current, textRef.current, activeDot);
    texture.needsUpdate = true;
  };

  useEffect(() => {
    if (phase === 'thinking') {
      dotPhaseRef.current = 0;
      activeDotRef.current = 0;
    }
    redrawBubble(activeDotRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [phase, text]);

  useEffect(() => {
    material.opacity = opacity;
  }, [material, opacity]);

  useRegisterNpcFrame(
    tickOwner,
    'sprite',
    ({ delta }) => {
      if (phaseRef.current !== 'thinking') return;
      dotPhaseRef.current += delta;
      const nextDot = Math.floor((dotPhaseRef.current * 3) % 3);
      if (nextDot === activeDotRef.current) return;
      activeDotRef.current = nextDot;
      redrawBubble(nextDot);
    },
    { enabled: () => phaseRef.current === 'thinking' },
  );

  useLayoutEffect(
    () => () => {
      materialRef.current?.dispose();
      materialRef.current = null;
      textureRef.current?.dispose();
      textureRef.current = null;
      canvasRef.current = null;
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
  const tickOwner = useId();
  const spriteRef = useRef<Sprite>(null);
  const pulsePhaseRef = useRef(0);
  const pulseSpeedRef = useRef(pulseSpeed);
  const materialRef = useRef<SpriteMaterial | null>(null);

  pulseSpeedRef.current = pulseSpeed;

  const material = useMemo(() => {
    const texture = acquireNpcQuestMarkerTexture(icon, color, questName);
    const mat = createNpcSpriteMaterial(texture);
    materialRef.current = mat;
    return mat;
  }, [icon, color, questName]);

  useRegisterNpcFrame(tickOwner, 'sprite', ({ delta }) => {
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
  });

  useLayoutEffect(
    () => () => {
      materialRef.current?.dispose();
      materialRef.current = null;
      releaseNpcQuestMarkerTexture(icon, color, questName);
    },
    [icon, color, questName],
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

const ACTIVITY_BARK_SCALE_X = 0.4;
const ACTIVITY_BARK_SCALE_Y = 0.08;

/** Schedule-aware activity bark — shows above NPC head during idle activities */
export function NpcActivityBarkSprite({
  text,
  accentColor,
  opacity,
}: {
  text: string;
  accentColor: string;
  opacity: number;
}) {
  const materialRef = useRef<SpriteMaterial | null>(null);

  const material = useMemo(() => {
    const texture = acquireNpcActivityBarkTexture(text, accentColor);
    const mat = createNpcSpriteMaterial(texture);
    materialRef.current = mat;
    return mat;
  }, [text, accentColor]);

  useEffect(() => {
    material.opacity = opacity;
  }, [material, opacity]);

  useLayoutEffect(
    () => () => {
      materialRef.current?.dispose();
      materialRef.current = null;
      releaseNpcActivityBarkTexture(text, accentColor);
    },
    [text, accentColor],
  );

  return (
    <sprite
      position={[0, 1.95, 0]}
      material={material}
      scale={[ACTIVITY_BARK_SCALE_X, ACTIVITY_BARK_SCALE_Y, 1]}
    />
  );
}
