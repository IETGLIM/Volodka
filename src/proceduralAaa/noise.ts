/**
 * Inlined simplex / FBM / Worley (cellular) noise — no external deps.
 * Unity equivalent: custom HLSL noise libs / Burst jobs.
 */

/** Hash → [0,1) — быстрый детерминированный шум без таблицы перестановок. */
export function hash2(x: number, y: number, seed = 0): number {
  let n = Math.imul(x + seed, 374761393) ^ Math.imul(y + seed * 7, 668265263);
  n = (n ^ (n >>> 13)) * 1274126177;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function hash3(x: number, y: number, z: number, seed = 0): number {
  return hash2(x + z * 57, y + z * 131, seed);
}

/** Value-noise с билинейной интерполяцией (глаже, чем raw hash). */
export function valueNoise2(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  // Hermite smoothstep: 3t²−2t³
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Fractional Brownian Motion — сумма октав с геометрическим затуханием. */
export function fbm2(
  x: number,
  y: number,
  octaves = 4,
  lacunarity = 2,
  gain = 0.5,
  seed = 0,
): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2(x * freq, y * freq, seed + i * 1013) * amp;
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / Math.max(1e-6, norm);
}

/**
 * Worley / cellular F1 distance.
 * Каждая ячейка сетки имеет feature-point → min расстояние до точки.
 */
export function worley2(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let minD = 1e9;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const cx = xi + ox;
      const cy = yi + oy;
      const fx = cx + hash2(cx, cy, seed);
      const fy = cy + hash2(cx, cy, seed + 17);
      const dx = fx - x;
      const dy = fy - y;
      const d = dx * dx + dy * dy;
      if (d < minD) minD = d;
    }
  }
  return Math.sqrt(minD);
}

export function fbm3(
  x: number,
  y: number,
  z: number,
  octaves = 3,
  seed = 0,
): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n =
      valueNoise2(x * freq + z * 0.37, y * freq + z * 0.71, seed + i * 907) * 0.65
      + valueNoise2(y * freq, z * freq, seed + i * 421) * 0.35;
    sum += n * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / Math.max(1e-6, norm);
}
