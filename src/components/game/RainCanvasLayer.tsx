'use client';

import { memo, useEffect, useRef } from 'react';

export interface RainCanvasLayerProps {
  intensity?: number;
  color?: string;
  className?: string;
}

/** Canvas-дождь — общий слой для сцен; отключать на lite-режиме снаружи */
export const RainCanvasLayer = memo(function RainCanvasLayer({
  intensity = 0.5,
  color = 'rgba(150,170,200,0.25)',
  className = '',
}: RainCanvasLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const dropCount = Math.floor(80 * intensity);
    const drops: Array<{ x: number; y: number; speed: number; length: number; opacity: number }> = [];

    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 4 + Math.random() * 6,
        length: 10 + Math.random() * 20,
        opacity: 0.1 + Math.random() * 0.3,
      });
    }

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (const drop of drops) {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + 0.5, drop.y + drop.length);
        ctx.strokeStyle = color.replace(/[\d.]+\)$/, `${drop.opacity * intensity})`);
        ctx.lineWidth = 1;
        ctx.stroke();

        drop.y += drop.speed;
        drop.x += 0.3;

        if (drop.y > height) {
          drop.y = -drop.length;
          drop.x = Math.random() * width;
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [intensity, color]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
      aria-hidden
    />
  );
});
