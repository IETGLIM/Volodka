import { CanvasTexture, ClampToEdgeWrapping, SRGBColorSpace } from 'three';

function seededSeries(count: number, seed: number, min: number, max: number): number[] {
  const out: number[] = [];
  let s = seed % 233280;
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    out.push(min + (s / 233280) * (max - min));
  }
  return out;
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stroke: string,
  fill: string,
  seed: number,
): void {
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= 4; gx++) {
    ctx.beginPath();
    ctx.moveTo(x + (w / 4) * gx, y);
    ctx.lineTo(x + (w / 4) * gx, y + h);
    ctx.stroke();
  }
  for (let gy = 0; gy <= 3; gy++) {
    ctx.beginPath();
    ctx.moveTo(x, y + (h / 3) * gy);
    ctx.lineTo(x + w, y + (h / 3) * gy);
    ctx.stroke();
  }
  const pts = seededSeries(16, seed, 0.15, 0.92);
  const px = (i: number) => x + (w / (pts.length - 1)) * i;
  const py = (v: number) => y + h - v * h;
  ctx.beginPath();
  pts.forEach((v, i) => (i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.lineTo(px(i), py(v))));
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  pts.forEach((v, i) => (i === 0 ? ctx.moveTo(px(i), py(v)) : ctx.lineTo(px(i), py(v))));
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.6;
  ctx.stroke();
}

function makeScreenCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 176;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

export function createGrafanaTexture(): CanvasTexture {
  const { canvas, ctx } = makeScreenCanvas();
  ctx.fillStyle = '#0b0e14';
  ctx.fillRect(0, 0, 256, 176);
  ctx.fillStyle = '#11161f';
  ctx.fillRect(0, 0, 256, 20);
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(11, 10, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cdd6e4';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('GRAFANA · node-01', 22, 14);
  ctx.fillStyle = '#7d8aa0';
  ctx.font = '8px monospace';
  ctx.fillText('CPU usage %', 8, 32);
  drawChart(ctx, 8, 36, 240, 48, '#22d3ee', 'rgba(34,211,238,0.18)', 73);
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('63%', 214, 33);
  ctx.fillStyle = '#7d8aa0';
  ctx.font = '8px monospace';
  ctx.fillText('Network I/O', 8, 100);
  drawChart(ctx, 8, 104, 240, 48, '#34d399', 'rgba(52,211,153,0.18)', 191);
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('12MB/s', 196, 101);
  ctx.fillStyle = '#11161f';
  ctx.fillRect(0, 162, 256, 14);
  ctx.fillStyle = '#34d399';
  ctx.font = '8px monospace';
  ctx.fillText('● live · refresh 5s', 8, 172);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export function createZabbixTexture(): CanvasTexture {
  const { canvas, ctx } = makeScreenCanvas();
  ctx.fillStyle = '#0a0f0a';
  ctx.fillRect(0, 0, 256, 176);
  ctx.fillStyle = '#3a0d0d';
  ctx.fillRect(0, 0, 256, 20);
  ctx.fillStyle = '#e8413a';
  ctx.beginPath();
  ctx.arc(11, 10, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e6ede6';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('ZABBIX · triggers', 22, 14);
  ctx.fillStyle = '#8aa08a';
  ctx.font = '8px monospace';
  ctx.fillText('Response time (ms)', 8, 32);
  drawChart(ctx, 8, 36, 240, 44, '#f59e0b', 'rgba(245,158,11,0.16)', 53);
  const rows: Array<[string, string, string]> = [
    ['web-01', 'OK', '#34d399'],
    ['db-02', 'PROBLEM', '#e8413a'],
    ['node-7', 'OK', '#34d399'],
    ['disk /', '87%', '#f59e0b'],
  ];
  rows.forEach(([host, status, color], i) => {
    const y = 96 + i * 17;
    ctx.fillStyle = '#0f150f';
    ctx.fillRect(8, y, 240, 14);
    ctx.fillStyle = '#c7d2c7';
    ctx.font = '8px monospace';
    ctx.fillText(host, 14, y + 10);
    ctx.fillStyle = color;
    ctx.font = 'bold 8px monospace';
    ctx.fillText(status, 200, y + 10);
  });
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export function createTerminalScreenTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#03110a';
  ctx.fillRect(0, 0, 256, 320);
  ctx.fillStyle = '#00ff66';
  ctx.font = '11px monospace';
  const lines = [
    'volodka@neurosys:~$ tail -f /var/log/sys',
    '[14:02:11] INFO  scheduler tick ok',
    '[14:02:12] WARN  latency p99=812ms',
    '[14:02:13] INFO  node-7 heartbeat ok',
    '[14:02:14] ERROR db-02 connection reset',
    '[14:02:14] INFO  retry 1/3 ...',
    '[14:02:15] INFO  retry ok, restored',
    '[14:02:16] INFO  deploy build #4729',
    '[14:02:17] INFO  poem fragment found',
    '[14:02:18] INFO  "Смерть есть лишь",',
    '[14:02:18] INFO  "      начало..."',
    '[14:02:19] WARN  unknown signature',
    '[14:02:20] INFO  rotating logs',
    '[14:02:21] INFO  uptime 412d 06:11',
    'volodka@neurosys:~$ ./watch.sh',
    'monitoring 3 hosts ... press ^C',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 6, 16 + i * 19));
  ctx.fillRect(6, 16 + lines.length * 19, 8, 11);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  return tex;
}
