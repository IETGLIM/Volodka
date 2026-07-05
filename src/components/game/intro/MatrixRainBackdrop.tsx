/* ─── Volodka RPG – Matrix Rain backdrop ───
 * Canvas-based falling-glyph "digital rain" that spans the whole cinematic
 * intro, giving all opening beats one continuous visual identity. Lightweight:
 * a single 2D canvas, DPR-capped, throttled to ~24fps, fully cleaned up.
 */

import { memo, useEffect, useRef } from 'react';

const GLYPHS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノﾊﾋﾌﾍﾎマミムメモヤユヨラリルレロワヲン0123456789{}[]<>/\\|#$@=+*アДЖЗИЛПФЦЧЭЮЯ';

interface MatrixRainBackdropProps {
  /** Overall layer opacity 0..1 — drive this per intro phase. */
  opacity?: number;
  /** Head-glyph color. */
  color?: string;
  /** Trail (body) color. */
  trailColor?: string;
  /** Reduce CPU + motion (renders a faint static field). */
  reduceMotion?: boolean;
  /** z-index for the fixed layer. */
  zIndex?: number;
}

export const MatrixRainBackdrop = memo(function MatrixRainBackdrop({
  opacity = 0.18,
  color = 'rgba(180, 255, 220, 0.95)',
  trailColor = '0, 230, 160',
  reduceMotion = false,
  zIndex = 3,
}: MatrixRainBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const opacityRef = useRef(opacity);
  opacityRef.current = opacity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fontSize = 16;
    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.ceil(w / fontSize);
      drops = Array.from({ length: columns }, () => Math.floor((Math.random() * -h) / fontSize));
      speeds = Array.from({ length: columns }, () => 0.5 + Math.random() * 0.9);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let last = 0;
    const frameInterval = 1000 / 24; // throttle to ~24fps

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < frameInterval) return;
      last = now;

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      // Fade previous frame for the trailing tail.
      ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${fontSize}px "Courier New", monospace`;
      const layerOpacity = opacityRef.current;

      for (let i = 0; i < columns; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

        // Bright head glyph.
        ctx.fillStyle = color.replace(/0\.95\)$/, `${(0.95 * layerOpacity).toFixed(3)})`);
        ctx.fillText(glyph, x, y);

        // Dimmer glyph just above for a short trail accent.
        ctx.fillStyle = `rgba(${trailColor}, ${(0.5 * layerOpacity).toFixed(3)})`;
        ctx.fillText(
          GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          x,
          y - fontSize,
        );

        if (y > h && Math.random() > 0.975) {
          drops[i] = Math.floor((Math.random() * -20));
        }
        drops[i] += speeds[i];
      }
    };

    if (reduceMotion) {
      // Single faint static pass — no animation loop.
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize}px "Courier New", monospace`;
      for (let i = 0; i < columns; i++) {
        ctx.fillStyle = `rgba(${trailColor}, ${(0.25 * opacityRef.current).toFixed(3)})`;
        for (let j = 0; j < h / fontSize; j += 3) {
          if (Math.random() > 0.6) {
            ctx.fillText(
              GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
              i * fontSize,
              j * fontSize,
            );
          }
        }
      }
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [color, trailColor, reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex, mixBlendMode: 'screen' }}
    />
  );
});
