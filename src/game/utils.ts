import * as THREE from 'three';

export type V3 = [number, number, number];

export const TAU = Math.PI * 2;

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** smoothstep: 0 at a, 1 at b */
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export const rand = (a: number, b?: number) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const fract = (x: number) => x - Math.floor(x);

export const hash2 = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return fract(s);
};

export const vnoise = (x: number, y: number) => {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), u), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u), v);
};

export const fbm = (x: number, y: number) => {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < 4; i++) {
    v += a * vnoise(x * f, y * f);
    f *= 2.07;
    a *= 0.5;
  }
  return v;
};

export const v3 = (x: number, y: number, z: number): V3 => [x, y, z];
export const vec3 = (v: V3) => new THREE.Vector3(v[0], v[1], v[2]);
export const dist2 = (ax: number, az: number, bx: number, bz: number) => Math.hypot(ax - bx, az - bz);
export const dist3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
