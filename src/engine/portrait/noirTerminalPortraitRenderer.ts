import {
  NPC_PORTRAIT_SIZE,
  NOIR_TERMINAL_PORTRAIT_STYLE,
  SHOULDER_HALF_WIDTH,
} from '@/engine/portrait/npcPortraitConstants';
import { hashString, mulberry32, rgbaColor, shadeColor } from '@/engine/portrait/npcPortraitPresentation';
import type { NPCAppearance, NPCHeadAccessory, NPCSilhouette } from '@/shared/types/game';

type PortraitCanvas = HTMLCanvasElement | OffscreenCanvas;
type PortraitContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function shoulderHalfWidth(silhouette: NPCSilhouette): number {
  return SHOULDER_HALF_WIDTH[silhouette];
}

function buildSilhouettePath(
  headR: number,
  headCx: number,
  headCy: number,
  shoulderHalf: number,
): Path2D {
  const path = new Path2D();
  const shoulderTop = headCy + headR + 14;
  path.arc(headCx, headCy, headR, Math.PI * 0.85, Math.PI * 2.15);
  path.lineTo(headCx + headR * 0.42, shoulderTop - 10);
  path.quadraticCurveTo(headCx + shoulderHalf * 0.9, shoulderTop, headCx + shoulderHalf, shoulderTop + 26);
  path.lineTo(headCx + shoulderHalf, NPC_PORTRAIT_SIZE);
  path.lineTo(headCx - shoulderHalf, NPC_PORTRAIT_SIZE);
  path.lineTo(headCx - shoulderHalf, shoulderTop + 26);
  path.quadraticCurveTo(headCx - shoulderHalf * 0.9, shoulderTop, headCx - headR * 0.42, shoulderTop - 10);
  path.closePath();
  return path;
}

function drawHair(
  ctx: PortraitContext,
  variant: number,
  color: string,
  headR: number,
  cx: number,
  cy: number,
): void {
  ctx.fillStyle = color;
  switch (variant % 4) {
    case 0: {
      ctx.beginPath();
      ctx.arc(cx, cy, headR * 0.98, Math.PI * 1.12, Math.PI * 1.88);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 1: {
      ctx.beginPath();
      ctx.arc(cx, cy, headR * 0.98, Math.PI * 1.0, Math.PI * 1.75);
      ctx.lineTo(cx - headR * 0.55, cy - headR * 0.2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 2: {
      for (let i = -2; i <= 2; i++) {
        const x = cx + i * headR * 0.32;
        const topY = cy - headR - 10 - (i % 2 === 0 ? 5 : 0);
        ctx.beginPath();
        ctx.moveTo(x - 7, cy - headR * 0.72);
        ctx.lineTo(x, topY);
        ctx.lineTo(x + 7, cy - headR * 0.72);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    default:
      ctx.fillStyle = rgbaColor('#ffffff', 0.08);
      ctx.beginPath();
      ctx.ellipse(cx - headR * 0.3, cy - headR * 0.55, headR * 0.28, headR * 0.14, -0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}

function drawBeard(
  ctx: PortraitContext,
  variant: number,
  color: string,
  headR: number,
  cx: number,
  cy: number,
): void {
  ctx.fillStyle = color;
  switch (variant % 3) {
    case 0:
      break;
    case 1: {
      ctx.beginPath();
      ctx.ellipse(cx, cy + headR * 0.78, headR * 0.26, headR * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      ctx.beginPath();
      ctx.arc(cx, cy + headR * 0.1, headR * 0.86, Math.PI * 0.22, Math.PI * 0.78);
      ctx.arc(cx, cy + headR * 0.1, headR * 0.56, Math.PI * 0.78, Math.PI * 0.22, true);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}

function drawAccessory(
  ctx: PortraitContext,
  accessory: NPCHeadAccessory,
  accentColor: string,
  glowColor: string,
  headR: number,
  cx: number,
  cy: number,
): void {
  switch (accessory) {
    case 'none':
      break;
    case 'glasses': {
      const eyeY = cy - headR * 0.08;
      const lensW = headR * 0.52;
      const lensH = headR * 0.34;
      ctx.strokeStyle = rgbaColor(glowColor, 0.85);
      ctx.lineWidth = 2.5;
      ctx.strokeRect(cx - lensW - 4, eyeY - lensH / 2, lensW, lensH);
      ctx.strokeRect(cx + 4, eyeY - lensH / 2, lensW, lensH);
      ctx.beginPath();
      ctx.moveTo(cx - 4, eyeY);
      ctx.lineTo(cx + 4, eyeY);
      ctx.stroke();
      ctx.fillStyle = rgbaColor(glowColor, 0.12);
      ctx.fillRect(cx - lensW - 4, eyeY - lensH / 2, lensW, lensH);
      ctx.fillRect(cx + 4, eyeY - lensH / 2, lensW, lensH);
      break;
    }
    case 'hat': {
      const brimY = cy - headR * 0.62;
      ctx.fillStyle = shadeColor(accentColor, -0.35);
      ctx.fillRect(cx - headR * 1.12, brimY, headR * 2.24, 7);
      ctx.beginPath();
      ctx.moveTo(cx - headR * 0.82, brimY);
      ctx.lineTo(cx - headR * 0.62, brimY - headR * 0.62);
      ctx.lineTo(cx + headR * 0.62, brimY - headR * 0.62);
      ctx.lineTo(cx + headR * 0.82, brimY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgbaColor(glowColor, 0.5);
      ctx.fillRect(cx - headR * 0.82, brimY - 5, headR * 1.64, 3);
      break;
    }
    case 'scarf': {
      const neckY = cy + headR + 6;
      ctx.fillStyle = shadeColor(accentColor, -0.15);
      ctx.fillRect(cx - headR * 0.85, neckY, headR * 1.7, 14);
      ctx.fillStyle = rgbaColor(glowColor, 0.35);
      ctx.fillRect(cx - headR * 0.85, neckY + 4, headR * 1.7, 2);
      break;
    }
    case 'earring': {
      ctx.fillStyle = glowColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx + headR * 0.92, cy + headR * 0.3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }
    default: {
      const _exhaustive: never = accessory;
      return _exhaustive;
    }
  }
}

export function createPortraitCanvas(): PortraitCanvas | null {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(NPC_PORTRAIT_SIZE, NPC_PORTRAIT_SIZE);
  }
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = NPC_PORTRAIT_SIZE;
  canvas.height = NPC_PORTRAIT_SIZE;
  return canvas;
}

export function renderNoirTerminalPortrait(
  ctx: PortraitContext,
  npcId: string,
  initial: string,
  appearance: NPCAppearance,
): void {
  const seed = hashString(npcId);
  const rng = mulberry32(seed);
  const { bodyColor, accentColor, glowColor, silhouette, headAccessory, height } = appearance;
  const style = NOIR_TERMINAL_PORTRAIT_STYLE;

  const bg = ctx.createLinearGradient(0, 0, 0, NPC_PORTRAIT_SIZE);
  bg.addColorStop(0, shadeColor(bodyColor, -0.92));
  bg.addColorStop(1, style.backgroundBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, NPC_PORTRAIT_SIZE, NPC_PORTRAIT_SIZE);

  const halo = ctx.createRadialGradient(128, 104, 10, 128, 104, 150);
  halo.addColorStop(0, rgbaColor(glowColor, 0.16));
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, NPC_PORTRAIT_SIZE, NPC_PORTRAIT_SIZE);

  ctx.fillStyle = rgbaColor(glowColor, 0.05);
  for (let i = 0; i < 14; i++) {
    const gx = Math.floor(rng() * 32) * 8;
    const gy = Math.floor(rng() * 32) * 8;
    ctx.fillRect(gx, gy, 8, 1);
  }

  const headR = 44 * (0.94 + (height - 1) * 0.5 + rng() * 0.08);
  const headCx = 128;
  const headCy = 102;
  const shoulderHalf = shoulderHalfWidth(silhouette);
  const silhouettePath = buildSilhouettePath(headR, headCx, headCy, shoulderHalf);

  ctx.fillStyle = (() => {
    const bodyGrad = ctx.createLinearGradient(0, headCy - headR, 0, NPC_PORTRAIT_SIZE);
    bodyGrad.addColorStop(0, shadeColor(bodyColor, 0.12));
    bodyGrad.addColorStop(0.45, shadeColor(bodyColor, -0.25));
    bodyGrad.addColorStop(1, shadeColor(bodyColor, -0.6));
    return bodyGrad;
  })();
  ctx.fill(silhouettePath);

  ctx.save();
  ctx.clip(silhouettePath);
  ctx.fillStyle = rgbaColor(accentColor, 0.55);
  ctx.fillRect(headCx - shoulderHalf, headCy + headR + 30, shoulderHalf * 2, 5);
  const keyLight = ctx.createLinearGradient(headCx - headR, 0, headCx + headR, 0);
  keyLight.addColorStop(0, rgbaColor(glowColor, 0.2));
  keyLight.addColorStop(0.55, 'rgba(0,0,0,0)');
  keyLight.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = keyLight;
  ctx.beginPath();
  ctx.arc(headCx, headCy, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const eyeY = headCy - headR * 0.08;
  ctx.fillStyle = rgbaColor(glowColor, 0.65);
  ctx.fillRect(headCx - headR * 0.46, eyeY - 1.5, headR * 0.3, 3);
  ctx.fillRect(headCx + headR * 0.16, eyeY - 1.5, headR * 0.3, 3);

  drawHair(ctx, seed % 4, shadeColor(bodyColor, -0.45), headR, headCx, headCy);
  drawBeard(ctx, (seed >>> 3) % 3, shadeColor(bodyColor, -0.5), headR, headCx, headCy);
  drawAccessory(ctx, headAccessory, accentColor, glowColor, headR, headCx, headCy);

  ctx.strokeStyle = rgbaColor(glowColor, 0.9);
  ctx.lineWidth = 2;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14;
  ctx.stroke(silhouettePath);
  ctx.shadowBlur = 0;

  ctx.fillStyle = `rgba(0,0,0,${style.scanlineOpacity})`;
  for (let y = 0; y < NPC_PORTRAIT_SIZE; y += 4) {
    ctx.fillRect(0, y, NPC_PORTRAIT_SIZE, 1);
  }
  ctx.fillStyle = rgbaColor(glowColor, 0.08);
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(0, Math.floor(rng() * NPC_PORTRAIT_SIZE), NPC_PORTRAIT_SIZE, 2);
  }

  const vignette = ctx.createRadialGradient(128, 128, 90, 128, 128, 190);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, `rgba(0,0,0,${style.vignetteOuter})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, NPC_PORTRAIT_SIZE, NPC_PORTRAIT_SIZE);

  ctx.font = '700 44px "Geist Mono", "Courier New", monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = rgbaColor(glowColor, 0.92);
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.fillText(initial, 16, 240);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = rgbaColor(glowColor, 0.4);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(style.frameInset, style.frameInset, NPC_PORTRAIT_SIZE - style.frameInset * 2, NPC_PORTRAIT_SIZE - style.frameInset * 2);
  ctx.lineWidth = 2.5;
  for (const [tx, ty, dx, dy] of [
    [4, 4, 1, 1],
    [252, 4, -1, 1],
    [4, 252, 1, -1],
    [252, 252, -1, -1],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(tx + dx * 14, ty);
    ctx.lineTo(tx, ty);
    ctx.lineTo(tx, ty + dy * 14);
    ctx.stroke();
  }
}

export function exportPortraitCanvas(canvas: PortraitCanvas): Promise<string> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: 'image/png' }).then((blob) => URL.createObjectURL(blob));
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Portrait toBlob failed'));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  });
}

export function exportPortraitCanvasSyncDataUrl(canvas: HTMLCanvasElement): string | null {
  try {
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}
