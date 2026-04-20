import * as THREE from 'three';

function canvasTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  size = 256,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D context unavailable for procedural texture');
  }
  draw(ctx, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** Панель «линолеум» + лёгкий шум. */
export function createVolodkaFloorTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#5a4d3f');
    g.addColorStop(0.35, '#4a3f34');
    g.addColorStop(0.7, '#524538');
    g.addColorStop(1, '#453a30');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const step = Math.max(3, Math.floor(w / 48));
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
  });
}

/** Светлая штукатурка с мелким зерном. */
export function createVolodkaWallTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#ddd2c4';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 14000; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.045})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(180,160,140,${0.04 + Math.random() * 0.06})`;
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.fillRect(x, y, 2 + Math.random() * 2, 1);
    }
  });
}

/** Ковёр — более тёмный рисунок. */
export function createVolodkaCarpetTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#4a3828';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) {
      ctx.strokeStyle = `rgba(0,0,0,${0.08 + (y % 12) * 0.01})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = 0; i < 6000; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
  });
}

/** Дерево мебели. */
export function createVolodkaWoodTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, w, h) => {
    ctx.fillStyle = '#5c4a38';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 3) {
      ctx.strokeStyle = `rgba(0,0,0,${0.06 + Math.random() * 0.05})`;
      ctx.beginPath();
      ctx.moveTo(x + Math.random() * 2, 0);
      ctx.lineTo(x + Math.random() * 2, h);
      ctx.stroke();
    }
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `rgba(255,220,180,${Math.random() * 0.03})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
  });
}
