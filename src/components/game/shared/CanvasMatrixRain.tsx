
/* ─── Volodka RPG – Shared Canvas Matrix Rain Component ─── */

import { memo, useEffect, useRef } from 'react';

export interface CanvasMatrixRainProps {
  /** Additional CSS class names for the canvas element */
  className?: string;
  /** Overall opacity of the canvas (default: 0.15) */
  opacity?: number;
  /** Fill color for rain characters (default: '#00ff41') */
  color?: string;
  /** Minimum milliseconds between frames — controls speed (default: 33 ≈ 30fps) */
  speed?: number;
  /** Font size in pixels (default: 14) */
  fontSize?: number;
  /** Character set used for the rain columns (default: katakana + hex + command fragments) */
  chars?: string;
  /** Per-character globalAlpha while drawing (default: 0.6) */
  charOpacity?: number;
}

const DEFAULT_CHARS =
  'アイウエオカキクケコサシスセソ0123456789ABCDEFsudo_nova_grep_awk';

export const CanvasMatrixRain = memo(function CanvasMatrixRain({
  className = 'absolute inset-0 pointer-events-none',
  opacity = 0.15,
  color = '#00ff41',
  speed = 33,
  fontSize = 14,
  chars = DEFAULT_CHARS,
  charOpacity = 0.6,
}: CanvasMatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let columns: number;
    let drops: number[];
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const applyResize = () => {
      const vv = window.visualViewport;
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w));
      canvas.height = Math.max(1, Math.floor(h));
      columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(1).map(() => Math.random() * -50);
    };

    const scheduleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = undefined;
        applyResize();
      }, 120);
    };

    applyResize();
    const resize = () => scheduleResize();
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);

    let lastFrame = 0;
    const draw = (timestamp: number) => {
      animationId = requestAnimationFrame(draw);
      if (timestamp - lastFrame < speed) return;
      lastFrame = timestamp;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillStyle = color;
        ctx.globalAlpha = charOpacity;
        ctx.fillText(char, x, y);
        ctx.globalAlpha = 1;
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    animationId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationId);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
    };
  }, [fontSize, speed, chars, color, charOpacity]);

  return <canvas ref={canvasRef} className={className} style={{ opacity }} />;
});
