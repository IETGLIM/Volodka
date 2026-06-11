/* ─── Volodka RPG – Procedural NPC portrait ───
   Deterministic canvas-generated noir avatar: dark scanline background,
   head/shoulders silhouette tinted with NPCAppearance colors, neon rim in
   glowColor, monospace name initial. Seeded by hash(npcId) — same NPC always
   renders the same "retro terminal photo". Rendered once to a 256×256 canvas,
   exported as dataURL and cached per npcId at module level. */

import { useMemo } from 'react';
import type { NPCAppearance, NPCHeadAccessory, NPCSilhouette } from '@/shared/types/game';

const PORTRAIT_SIZE = 256;

/* ── Deterministic seed / PRNG ── */

function hashString(str: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Color helpers ── */

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return { r: 128, g: 128, b: 128 };
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Mix a hex color toward white (amount > 0) or black (amount < 0). */
function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const target = amount > 0 ? 255 : 0;
  const t = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * t);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

/* ── Fallback appearance for NPCs without one (and for Volodka) ── */

const FALLBACK_GLOWS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24'];

function fallbackAppearance(seed: number): NPCAppearance {
  const glow = FALLBACK_GLOWS[seed % FALLBACK_GLOWS.length];
  return {
    bodyColor: '#2a3142',
    accentColor: '#4a5568',
    headAccessory: 'none',
    height: 1.0,
    glowColor: glow,
    silhouette: 'average',
  };
}

/* ── Geometry helpers ── */

function shoulderHalfWidth(silhouette: NPCSilhouette): number {
  switch (silhouette) {
    case 'slim':
      return 74;
    case 'average':
      return 86;
    case 'heavy':
      return 100;
    default: {
      const _exhaustive: never = silhouette;
      return _exhaustive;
    }
  }
}

/** Head + shoulders outline, reused for fill and for the neon rim stroke. */
function traceSilhouette(
  ctx: CanvasRenderingContext2D,
  headR: number,
  headCx: number,
  headCy: number,
  shoulderHalf: number,
): void {
  const shoulderTop = headCy + headR + 14;
  ctx.beginPath();
  ctx.arc(headCx, headCy, headR, Math.PI * 0.85, Math.PI * 2.15);
  // Neck down to shoulders
  ctx.lineTo(headCx + headR * 0.42, shoulderTop - 10);
  ctx.quadraticCurveTo(headCx + shoulderHalf * 0.9, shoulderTop, headCx + shoulderHalf, shoulderTop + 26);
  ctx.lineTo(headCx + shoulderHalf, PORTRAIT_SIZE);
  ctx.lineTo(headCx - shoulderHalf, PORTRAIT_SIZE);
  ctx.lineTo(headCx - shoulderHalf, shoulderTop + 26);
  ctx.quadraticCurveTo(headCx - shoulderHalf * 0.9, shoulderTop, headCx - headR * 0.42, shoulderTop - 10);
  ctx.closePath();
}

/* ── Feature primitives (chosen by seed) ── */

function drawHair(
  ctx: CanvasRenderingContext2D,
  variant: number,
  color: string,
  headR: number,
  cx: number,
  cy: number,
): void {
  ctx.fillStyle = color;
  switch (variant % 4) {
    case 0: {
      // Flat cap of hair across the crown
      ctx.beginPath();
      ctx.arc(cx, cy, headR * 0.98, Math.PI * 1.12, Math.PI * 1.88);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 1: {
      // Side-swept block
      ctx.beginPath();
      ctx.arc(cx, cy, headR * 0.98, Math.PI * 1.0, Math.PI * 1.75);
      ctx.lineTo(cx - headR * 0.55, cy - headR * 0.2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 2: {
      // Short spikes
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
      // Bald — a faint specular highlight on the crown instead
      ctx.fillStyle = rgba('#ffffff', 0.08);
      ctx.beginPath();
      ctx.ellipse(cx - headR * 0.3, cy - headR * 0.55, headR * 0.28, headR * 0.14, -0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
}

function drawBeard(
  ctx: CanvasRenderingContext2D,
  variant: number,
  color: string,
  headR: number,
  cx: number,
  cy: number,
): void {
  ctx.fillStyle = color;
  switch (variant % 3) {
    case 0:
      // Clean-shaven
      break;
    case 1: {
      // Chin patch
      ctx.beginPath();
      ctx.ellipse(cx, cy + headR * 0.78, headR * 0.26, headR * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    default: {
      // Full jaw arc
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
  ctx: CanvasRenderingContext2D,
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
      ctx.strokeStyle = rgba(glowColor, 0.85);
      ctx.lineWidth = 2.5;
      ctx.strokeRect(cx - lensW - 4, eyeY - lensH / 2, lensW, lensH);
      ctx.strokeRect(cx + 4, eyeY - lensH / 2, lensW, lensH);
      ctx.beginPath();
      ctx.moveTo(cx - 4, eyeY);
      ctx.lineTo(cx + 4, eyeY);
      ctx.stroke();
      ctx.fillStyle = rgba(glowColor, 0.12);
      ctx.fillRect(cx - lensW - 4, eyeY - lensH / 2, lensW, lensH);
      ctx.fillRect(cx + 4, eyeY - lensH / 2, lensW, lensH);
      break;
    }
    case 'hat': {
      const brimY = cy - headR * 0.62;
      ctx.fillStyle = shade(accentColor, -0.35);
      ctx.fillRect(cx - headR * 1.12, brimY, headR * 2.24, 7);
      ctx.beginPath();
      ctx.moveTo(cx - headR * 0.82, brimY);
      ctx.lineTo(cx - headR * 0.62, brimY - headR * 0.62);
      ctx.lineTo(cx + headR * 0.62, brimY - headR * 0.62);
      ctx.lineTo(cx + headR * 0.82, brimY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(glowColor, 0.5);
      ctx.fillRect(cx - headR * 0.82, brimY - 5, headR * 1.64, 3);
      break;
    }
    case 'scarf': {
      const neckY = cy + headR + 6;
      ctx.fillStyle = shade(accentColor, -0.15);
      ctx.fillRect(cx - headR * 0.85, neckY, headR * 1.7, 14);
      ctx.fillStyle = rgba(glowColor, 0.35);
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
      void _exhaustive;
      break;
    }
  }
}

/* ── Main renderer ── */

function renderPortrait(npcId: string, initial: string, appearance: NPCAppearance): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = PORTRAIT_SIZE;
    canvas.height = PORTRAIT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const seed = hashString(npcId);
    const rng = mulberry32(seed);
    const { bodyColor, accentColor, glowColor, silhouette, headAccessory, height } = appearance;

    /* Background: near-black tinted with bodyColor + soft glow behind head */
    const bg = ctx.createLinearGradient(0, 0, 0, PORTRAIT_SIZE);
    bg.addColorStop(0, shade(bodyColor, -0.92));
    bg.addColorStop(1, '#04060a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);

    const halo = ctx.createRadialGradient(128, 104, 10, 128, 104, 150);
    halo.addColorStop(0, rgba(glowColor, 0.16));
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);

    /* Faint background grid noise (terminal feel) */
    ctx.fillStyle = rgba(glowColor, 0.05);
    for (let i = 0; i < 14; i++) {
      const gx = Math.floor(rng() * 32) * 8;
      const gy = Math.floor(rng() * 32) * 8;
      ctx.fillRect(gx, gy, 8, 1);
    }

    /* Head + shoulders silhouette */
    const headR = 44 * (0.94 + (height - 1) * 0.5 + rng() * 0.08);
    const headCx = 128;
    const headCy = 102;
    const shoulderHalf = shoulderHalfWidth(silhouette);

    traceSilhouette(ctx, headR, headCx, headCy, shoulderHalf);
    const bodyGrad = ctx.createLinearGradient(0, headCy - headR, 0, PORTRAIT_SIZE);
    bodyGrad.addColorStop(0, shade(bodyColor, 0.12));
    bodyGrad.addColorStop(0.45, shade(bodyColor, -0.25));
    bodyGrad.addColorStop(1, shade(bodyColor, -0.6));
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    /* Collar accent band on the shoulders */
    ctx.save();
    traceSilhouette(ctx, headR, headCx, headCy, shoulderHalf);
    ctx.clip();
    ctx.fillStyle = rgba(accentColor, 0.55);
    ctx.fillRect(headCx - shoulderHalf, headCy + headR + 30, shoulderHalf * 2, 5);
    /* Half-face key light (noir side lighting) */
    const keyLight = ctx.createLinearGradient(headCx - headR, 0, headCx + headR, 0);
    keyLight.addColorStop(0, rgba(glowColor, 0.2));
    keyLight.addColorStop(0.55, 'rgba(0,0,0,0)');
    keyLight.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = keyLight;
    ctx.beginPath();
    ctx.arc(headCx, headCy, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* Eyes: two dim phosphor slits */
    const eyeY = headCy - headR * 0.08;
    ctx.fillStyle = rgba(glowColor, 0.65);
    ctx.fillRect(headCx - headR * 0.46, eyeY - 1.5, headR * 0.3, 3);
    ctx.fillRect(headCx + headR * 0.16, eyeY - 1.5, headR * 0.3, 3);

    /* Seeded features: hair / beard, then data-driven accessory */
    const hairVariant = seed % 4;
    const beardVariant = (seed >>> 3) % 3;
    drawHair(ctx, hairVariant, shade(bodyColor, -0.45), headR, headCx, headCy);
    drawBeard(ctx, beardVariant, shade(bodyColor, -0.5), headR, headCx, headCy);
    drawAccessory(ctx, headAccessory, accentColor, glowColor, headR, headCx, headCy);

    /* Neon rim around the silhouette */
    traceSilhouette(ctx, headR, headCx, headCy, shoulderHalf);
    ctx.strokeStyle = rgba(glowColor, 0.9);
    ctx.lineWidth = 2;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;

    /* Scanlines over everything — "retro terminal photo" */
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 0; y < PORTRAIT_SIZE; y += 4) {
      ctx.fillRect(0, y, PORTRAIT_SIZE, 1);
    }
    /* A couple of brighter interference lines */
    ctx.fillStyle = rgba(glowColor, 0.08);
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(0, Math.floor(rng() * PORTRAIT_SIZE), PORTRAIT_SIZE, 2);
    }

    /* Vignette */
    const vignette = ctx.createRadialGradient(128, 128, 90, 128, 128, 190);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, PORTRAIT_SIZE, PORTRAIT_SIZE);

    /* Monospace name initial, bottom-left */
    ctx.font = '700 44px "Geist Mono", "Courier New", monospace';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = rgba(glowColor, 0.92);
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.fillText(initial, 16, 240);
    ctx.shadowBlur = 0;

    /* Inner frame + corner ticks */
    ctx.strokeStyle = rgba(glowColor, 0.4);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(4.5, 4.5, PORTRAIT_SIZE - 9, PORTRAIT_SIZE - 9);
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

    return canvas.toDataURL('image/png');
  } catch {
    // jsdom / environments without canvas support
    return null;
  }
}

/* ── Module-level dataURL cache ── */

const portraitCache = new Map<string, string | null>();

export function getNpcPortraitDataUrl(
  npcId: string,
  name: string,
  appearance?: NPCAppearance,
): string | null {
  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  const cacheKey = `${npcId}|${initial}`;
  const cached = portraitCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const resolved = appearance ?? fallbackAppearance(hashString(npcId));
  const dataUrl = renderPortrait(npcId, initial, resolved);
  portraitCache.set(cacheKey, dataUrl);
  return dataUrl;
}

/* ── Component ── */

export type NpcPortraitSize = 'sm' | 'md';

export interface NpcPortraitProps {
  npcId: string;
  /** Display name; first letter becomes the monospace initial on the portrait */
  name: string;
  appearance?: NPCAppearance;
  size?: NpcPortraitSize;
  className?: string;
}

export function NpcPortrait({ npcId, name, appearance, size = 'md', className }: NpcPortraitProps) {
  const resolved = useMemo(
    () => appearance ?? fallbackAppearance(hashString(npcId)),
    [appearance, npcId],
  );
  const dataUrl = useMemo(
    () => getNpcPortraitDataUrl(npcId, name, appearance),
    [npcId, name, appearance],
  );

  const sizeClasses = size === 'sm' ? 'w-9 h-9 rounded-md' : 'w-14 h-14 sm:w-16 sm:h-16 rounded-lg';
  const frameStyle: React.CSSProperties = {
    borderColor: rgba(resolved.glowColor, 0.55),
    boxShadow: `0 0 10px ${rgba(resolved.glowColor, 0.3)}, inset 0 0 6px ${rgba(resolved.glowColor, 0.15)}`,
    background: '#04060a',
  };

  if (!dataUrl) {
    // Canvas unavailable: monospace initial in the same frame
    return (
      <div
        className={`${sizeClasses} border shrink-0 flex items-center justify-center font-mono font-bold ${className ?? ''}`}
        style={{ ...frameStyle, color: resolved.glowColor }}
        aria-hidden="true"
      >
        {(name.trim().charAt(0) || '?').toUpperCase()}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} border shrink-0 overflow-hidden ${className ?? ''}`} style={frameStyle}>
      <img
        src={dataUrl}
        alt=""
        aria-hidden="true"
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}
