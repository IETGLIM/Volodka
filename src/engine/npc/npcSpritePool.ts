/* ─── Volodka RPG – ref-counted NPC label sprite textures (shared canvas pool) ─── */

import * as THREE from 'three';
import {
  getCachedCanvasTexture,
  releaseCachedCanvasTexture,
} from '@/engine/three/cachedCanvasTexture';

const LABEL_CANVAS_W = 256;
const LABEL_CANVAS_H = 64;
const BUBBLE_CANVAS_W = 440;
const BUBBLE_CANVAS_H = 80;
const MARKER_CANVAS_SIZE = 128;
const NAME_MAX_CHARS = 18;

let sharedSpriteMaterialTemplate: THREE.SpriteMaterial | null = null;

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

export function drawNpcNameLabelCanvas(
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

export function npcNameLabelCacheKey(
  name: string,
  accentColor: string,
  bodyColor: string,
): string {
  return `npc_name:${name}:${accentColor}:${bodyColor}`;
}

export function acquireNpcNameLabelTexture(
  name: string,
  accentColor: string,
  bodyColor: string,
): THREE.CanvasTexture {
  const key = npcNameLabelCacheKey(name, accentColor, bodyColor);
  return getCachedCanvasTexture(key, () => {
    const canvas = document.createElement('canvas');
    canvas.width = LABEL_CANVAS_W;
    canvas.height = LABEL_CANVAS_H;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawNpcNameLabelCanvas(ctx, name, accentColor, bodyColor);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

export function releaseNpcNameLabelTexture(
  name: string,
  accentColor: string,
  bodyColor: string,
): void {
  releaseCachedCanvasTexture(npcNameLabelCacheKey(name, accentColor, bodyColor));
}

export function drawNpcSpeechBubbleCanvas(
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

export function npcSpeechBubbleCacheKey(text: string, phase: 'thinking' | 'speaking' | 'fading'): string {
  return `npc_speech:${phase}:${text}`;
}

export function acquireNpcSpeechBubbleTexture(
  phase: 'thinking' | 'speaking' | 'fading',
  text: string,
  activeDot: number,
): THREE.CanvasTexture {
  const key = `${npcSpeechBubbleCacheKey(text, phase)}:${activeDot}`;
  return getCachedCanvasTexture(key, () => {
    const canvas = document.createElement('canvas');
    canvas.width = BUBBLE_CANVAS_W;
    canvas.height = BUBBLE_CANVAS_H;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawNpcSpeechBubbleCanvas(ctx, phase, text, activeDot);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

export function releaseNpcSpeechBubbleTexture(
  phase: 'thinking' | 'speaking' | 'fading',
  text: string,
  activeDot: number,
): void {
  releaseCachedCanvasTexture(`${npcSpeechBubbleCacheKey(text, phase)}:${activeDot}`);
}

export function drawNpcQuestMarkerCanvas(
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

export function npcQuestMarkerCacheKey(icon: string, color: string, questName: string): string {
  return `npc_quest_marker:${icon}:${color}:${questName}`;
}

export function acquireNpcQuestMarkerTexture(
  icon: string,
  color: string,
  questName: string,
): THREE.CanvasTexture {
  const key = npcQuestMarkerCacheKey(icon, color, questName);
  return getCachedCanvasTexture(key, () => {
    const canvas = document.createElement('canvas');
    canvas.width = MARKER_CANVAS_SIZE;
    canvas.height = MARKER_CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawNpcQuestMarkerCanvas(ctx, icon, color, questName);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

export function releaseNpcQuestMarkerTexture(
  icon: string,
  color: string,
  questName: string,
): void {
  releaseCachedCanvasTexture(npcQuestMarkerCacheKey(icon, color, questName));
}

/* ─── Activity bark sprite (schedule-aware label) ─── */
const ACTIVITY_CANVAS_W = 256;
const ACTIVITY_CANVAS_H = 48;

export function drawNpcActivityBarkCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  accentColor: string,
): void {
  ctx.clearRect(0, 0, ACTIVITY_CANVAS_W, ACTIVITY_CANVAS_H);
  const display = text.length > 20 ? `${text.slice(0, 19)}…` : text;

  ctx.font = '500 16px monospace';
  const metrics = ctx.measureText(display);
  const padX = 12;
  const boxW = Math.min(ACTIVITY_CANVAS_W - 8, metrics.width + padX * 2);
  const boxH = 26;
  const boxX = (ACTIVITY_CANVAS_W - boxW) / 2;
  const boxY = (ACTIVITY_CANVAS_H - boxH) / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 4);
  ctx.fill();

  ctx.strokeStyle = hexWithAlpha(accentColor, 0.35);
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = hexWithAlpha(accentColor, 0.85);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 4;
  ctx.fillText(display, ACTIVITY_CANVAS_W / 2, ACTIVITY_CANVAS_H / 2);
  ctx.shadowBlur = 0;
}

export function npcActivityBarkCacheKey(text: string, accentColor: string): string {
  return `npc_activity:${text}:${accentColor}`;
}

export function acquireNpcActivityBarkTexture(
  text: string,
  accentColor: string,
): THREE.CanvasTexture {
  const key = npcActivityBarkCacheKey(text, accentColor);
  return getCachedCanvasTexture(key, () => {
    const canvas = document.createElement('canvas');
    canvas.width = ACTIVITY_CANVAS_W;
    canvas.height = ACTIVITY_CANVAS_H;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawNpcActivityBarkCanvas(ctx, text, accentColor);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

export function releaseNpcActivityBarkTexture(
  text: string,
  accentColor: string,
): void {
  releaseCachedCanvasTexture(npcActivityBarkCacheKey(text, accentColor));
}

export function createNpcSpriteMaterial(map: THREE.Texture): THREE.SpriteMaterial {
  if (!sharedSpriteMaterialTemplate) {
    sharedSpriteMaterialTemplate = new THREE.SpriteMaterial({
      transparent: true,
      depthWrite: false,
    });
  }
  const material = sharedSpriteMaterialTemplate.clone();
  material.map = map;
  return material;
}

export function evictNpcSpritePool(): void {
  sharedSpriteMaterialTemplate = null;
}
