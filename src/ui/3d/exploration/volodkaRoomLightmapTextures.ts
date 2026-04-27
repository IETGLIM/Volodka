import * as THREE from 'three';

/**
 * Процедурные lightmap (аналог запечённого GI из Blender: окно −X, люстра сверху, тёплый отскок).
 * Для продакшена можно заменить на `TextureLoader` + KTX2/PNG из пайплайна DCC — те же слоты `lightMap` / `uv2`.
 */
function canvasLightmap(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  size = 256,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable for lightmap');
  draw(ctx, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** Пол: ярче у окна (−X) и у задней стены (−Z), мягкое пятно «люстра». */
export function createVolodkaFloorLightmap(): THREE.CanvasTexture {
  return canvasLightmap((ctx, w, h) => {
    ctx.fillStyle = '#6a6058';
    ctx.fillRect(0, 0, w, h);
    const win = ctx.createRadialGradient(0, h * 0.5, 0, 0, h * 0.5, w * 0.85);
    win.addColorStop(0, '#b8c8e8');
    win.addColorStop(0.35, '#8a8a98');
    win.addColorStop(1, '#6a6058');
    ctx.fillStyle = win;
    ctx.fillRect(0, 0, w * 0.45, h);
    const ceil = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, h * 0.35, w * 0.55);
    ceil.addColorStop(0, '#9a9288');
    ceil.addColorStop(1, '#6a6058');
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = ceil;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  });
}

/** Стены: верх светлее (отскок потолка), полоса холодного света со стороны окна. */
export function createVolodkaWallLightmap(): THREE.CanvasTexture {
  return canvasLightmap((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#c8c2bc');
    g.addColorStop(0.45, '#8e8880');
    g.addColorStop(1, '#6a6460');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(140, 170, 210, 0.22)';
    ctx.fillRect(0, 0, w * 0.22, h);
  });
}
