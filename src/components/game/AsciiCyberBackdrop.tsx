'use client';

import { memo, useEffect, useRef, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { sceneManager } from '@/engine/SceneManager';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import type { SceneId } from '@/data/types';
import type { PlayerState } from '@/data/types';

const MATRIX_CHARS = 'アイウエオ0123456789█▓▒░[]{}<>ВОЛОДЬКА';

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Нижняя «линия города» в ASCII по сцене */
function skylineRows(sceneId: SceneId, cols: number): string[] {
  const seed = hashStr(sceneId);
  const prng = (i: number) => ((seed + i * 11003) % 1000) / 1000;
  const rowCount = 5;
  const rows: string[] = [];
  for (let r = 0; r < rowCount; r++) {
    let line = '';
    let x = 0;
    while (x < cols) {
      const w = 2 + Math.floor(prng(x + r * 17) * 6);
      const ch = prng(x + r * 31) > 0.35 ? '█' : '▓';
      line += ch.repeat(Math.min(w, cols - x));
      x += w;
    }
    rows.push(line.slice(0, cols));
  }
  return rows;
}

export const AsciiCyberBackdrop = memo(function AsciiCyberBackdrop({
  sceneId,
  playerState,
  visualLite,
}: {
  sceneId: SceneId;
  playerState: PlayerState;
  visualLite: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();
  const staticMode = Boolean(visualLite || reduceMotion);

  const sceneMeta = useMemo(() => sceneManager.getSceneConfig(sceneId), [sceneId]);
  const npcsHere = useMemo(
    () => Object.values(NPC_DEFINITIONS).filter((n) => n.sceneId === sceneId),
    [sceneId],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let t0 = performance.now();
    const drops: { x: number; y: number; speed: number; c: string }[] = [];

    const resize = () => {
      drops.length = 0;
      const vv = window.visualViewport;
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w * (window.devicePixelRatio || 1)));
      canvas.height = Math.max(1, Math.floor(h * (window.devicePixelRatio || 1)));
      canvas.style.width = `${Math.floor(w)}px`;
      canvas.style.height = `${Math.floor(h)}px`;
      ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);

    const fontPx = staticMode ? 11 : 10;
    const charW = fontPx * 0.62;
    const lineH = fontPx * 1.15;

    const stress = playerState.stress / 100;
    const panic = playerState.panicMode;

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      const cols = Math.max(8, Math.floor(w / charW));
      const rows = Math.max(6, Math.floor(h / lineH));

      ctx.fillStyle = '#010204';
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${fontPx}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      ctx.textBaseline = 'top';

      // Matrix rain (редкий)
      const rainCount = staticMode ? 12 : Math.floor(cols * 0.35);
      while (drops.length < rainCount) {
        drops.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.4,
          speed: 40 + Math.random() * 120,
          c: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]!,
        });
      }
      const alphaBase = staticMode ? 0.12 : 0.18;
      for (const d of drops) {
        d.y += d.speed * (staticMode ? 0.012 : 0.02);
        if (d.y > h * 0.55) d.y = -10;
        ctx.fillStyle = panic
          ? `rgba(255,40,80,${alphaBase + stress * 0.08})`
          : `rgba(0,255,200,${alphaBase + stress * 0.06})`;
        ctx.fillText(d.c, d.x, d.y);
      }

      // Тикер — описание сцены
      const tag = ` // ${sceneMeta.name.toUpperCase()} :: ${sceneMeta.description}`;
      const scroll = staticMode ? 0 : Math.floor(t * 14) % Math.max(1, tag.length);
      const slice = (tag + tag).slice(scroll, scroll + cols - 4);
      ctx.fillStyle = 'rgba(0, 255, 200, 0.45)';
      ctx.fillText(`> ${slice}`, 8, 8);
      ctx.fillStyle = 'rgba(255, 80, 140, 0.25)';
      ctx.fillText('─'.repeat(Math.min(cols - 2, 72)), 8, 8 + lineH);

      // Skyline
      const sk = skylineRows(sceneId, cols);
      const baseRow = Math.max(3, rows - sk.length - 2);
      for (let i = 0; i < sk.length; i++) {
        const row = sk[i] ?? '';
        const gy = (baseRow + i) * lineH;
        ctx.fillStyle = i > sk.length - 2 ? 'rgba(0,200,255,0.35)' : 'rgba(120,160,200,0.22)';
        ctx.fillText(row, 0, gy);
      }

      // «Платформа» и NPC
      const platY = (baseRow - 1) * lineH;
      const plat = '═'.repeat(Math.min(cols - 4, 64));
      const platW = plat.length * charW;
      ctx.fillStyle = 'rgba(0, 255, 200, 0.2)';
      ctx.fillText(plat, Math.max(8, (w - platW) / 2), platY);

      npcsHere.forEach((npc, idx) => {
        const phase = hashStr(npc.id) % 628 / 100;
        const span = Math.min(40, cols - 10);
        const ox = staticMode ? (idx * 7) % span : ((Math.sin(t * 0.9 + phase) + 1) * 0.5 * span + idx * 4) % span;
        const px = 12 + ox * charW;
        const glyph = idx % 2 === 0 ? '◉' : '◇';
        ctx.fillStyle = 'rgba(255, 200, 120, 0.55)';
        ctx.fillText(`${glyph}${npc.name.slice(0, 1)}`, px, platY - lineH * 1.2);
      });

      if (!staticMode) {
        raf = requestAnimationFrame(draw);
      }
    };

    if (staticMode) {
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
    };
  }, [sceneId, sceneMeta.name, sceneMeta.description, npcsHere, staticMode, playerState.stress, playerState.panicMode]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[0] h-full w-full"
      aria-hidden
    />
  );
});
