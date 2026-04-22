/**
 * Общая логика «матричного дождя» для Canvas 2D → `CanvasTexture` в 3D (мониторы, декорации).
 * Переиспользует идеи из `AsciiCyberBackdrop` / прежнего `MatrixRainScreenMesh`, но без DOM-зависимостей.
 */

export const CYBER_MATRIX_CHARSET = 'アイウエオカ0123456789█▓▒░[]{}<>ВОЛОДЬКА';

export type CyberMatrixDrop = {
  x: number;
  y: number;
  speed: number;
  len: number;
  head: string;
};

function rnd(seed: number, i: number): number {
  return ((seed * 9301 + i * 49297) % 233280) / 233280;
}

export function initCyberMatrixDrops(cols: number, rows: number, seed: number): CyberMatrixDrop[] {
  const drops: CyberMatrixDrop[] = [];
  for (let c = 0; c < cols; c += 1) {
    drops.push({
      x: c,
      y: rnd(seed, c) * rows,
      speed: 0.35 + rnd(seed, c + 99) * 1.15,
      len: 3 + Math.floor(rnd(seed, c + 199) * 10),
      head:
        CYBER_MATRIX_CHARSET[Math.floor(rnd(seed, c + 299) * CYBER_MATRIX_CHARSET.length) %
          CYBER_MATRIX_CHARSET.length] ?? '0',
    });
  }
  return drops;
}

function drawStatusOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  lines: readonly string[],
): void {
  if (lines.length === 0) return;
  const pad = 10;
  const lineH = Math.max(11, Math.floor(h * 0.08));
  ctx.save();
  ctx.font = `${lineH}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(0, 24, 12, 0.55)';
  ctx.fillRect(pad - 4, pad - 4, w - 2 * (pad - 4), lines.length * (lineH + 4) + 4);
  for (let i = 0; i < lines.length; i += 1) {
    const y = pad + i * (lineH + 4);
    ctx.fillStyle = i === 0 ? 'rgba(220, 255, 230, 0.95)' : 'rgba(120, 220, 160, 0.88)';
    ctx.fillText(lines[i]!, pad, y);
  }
  ctx.restore();
}

/**
 * Один кадр матрицы на существующем canvas (размеры не меняются).
 */
export function drawCyberMatrixRainFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  drops: CyberMatrixDrop[],
  cols: number,
  rows: number,
  t: number,
  seed: number,
  statusLines: readonly string[],
): void {
  ctx.fillStyle = 'rgba(0, 6, 2, 0.22)';
  ctx.fillRect(0, 0, w, h);
  const fontPx = Math.max(7, Math.floor(w / cols) - 1);
  ctx.font = `${fontPx}px monospace`;
  const prng = (idx: number, salt: number) =>
    ((seed + idx * 11003 + salt + Math.floor(t * 30)) % 1000) / 1000;

  for (let idx = 0; idx < drops.length; idx += 1) {
    const d = drops[idx]!;
    d.y += d.speed * 0.42;
    if (d.y - d.len > rows) {
      d.y = -prng(idx, 1) * rows * 0.5;
      d.speed = 0.35 + prng(idx, 2) * 1.15;
      d.len = 3 + Math.floor(prng(idx, 3) * 10);
      d.head =
        CYBER_MATRIX_CHARSET[Math.floor(prng(idx, 4) * CYBER_MATRIX_CHARSET.length) %
          CYBER_MATRIX_CHARSET.length] ?? '0';
    }
    const gx = (d.x / cols) * w;
    for (let i = 0; i < d.len; i += 1) {
      const row = Math.floor(d.y) - i;
      if (row < 0 || row >= rows) continue;
      const gy = (row / rows) * h;
      const ch =
        i === 0
          ? d.head
          : CYBER_MATRIX_CHARSET[
              Math.floor(prng(idx * 131 + i * 9, 5) * CYBER_MATRIX_CHARSET.length) %
                CYBER_MATRIX_CHARSET.length
            ] ?? '·';
      const g = i === 0 ? 1 : Math.max(0.15, 0.92 - i * 0.08);
      ctx.fillStyle = i === 0 ? `rgba(200, 255, 210, ${0.85 * g})` : `rgba(0, ${180 + i * 6}, 70, ${0.55 * g})`;
      ctx.fillText(ch, gx, gy + fontPx);
    }
  }
  if (statusLines.length > 0) {
    drawStatusOverlay(ctx, w, h, statusLines);
  }
}
