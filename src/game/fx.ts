/**
 * Система частиц: пул для искр/эмберов/следов + отдельные светлячки.
 * Аддитивное смешение, затухание цветом — мягкая «живая» картинка.
 */
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DynamicDrawUsage, Points, PointsMaterial, Scene, Vector3 } from 'three';
import { rand, TAU, clamp } from './utils';

type SpawnFn = (
  dt: number,
  t: number,
  spawn: (pos: Vector3, vel: Vector3, life: number, color: Color, size: number) => void,
) => void;

export class FX {
  private points: Points;
  private N = 700;
  private posArr: Float32Array;
  private colArr: Float32Array;
  private velArr: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private sizeArr: Float32Array;
  private baseCol: Color[];
  private cursor = 0;
  private emitters: SpawnFn[] = [];

  // светлячки — отдельное облако
  private flyPoints: Points;
  private flyPos: Float32Array;
  private flyMat: PointsMaterial;
  private flyAnchors: Vector3[] = [];
  private flyPhase: number[] = [];
  private tmpColor = new Color();

  constructor(scene: Scene) {
    this.N = 700;
    this.posArr = new Float32Array(this.N * 3);
    this.colArr = new Float32Array(this.N * 3);
    this.velArr = new Float32Array(this.N * 3);
    this.life = new Float32Array(this.N);
    this.maxLife = new Float32Array(this.N);
    this.sizeArr = new Float32Array(this.N);
    this.baseCol = [];
    for (let i = 0; i < this.N; i++) {
      this.baseCol.push(new Color(0, 0, 0));
      this.sizeArr[i] = 0.15;
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(this.posArr, 3).setUsage(DynamicDrawUsage));
    geo.setAttribute('color', new BufferAttribute(this.colArr, 3).setUsage(DynamicDrawUsage));
    const mat = new PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.points = new Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);

    // светлячки
    this.flyPos = new Float32Array(60 * 3);
    const fg = new BufferGeometry();
    fg.setAttribute('position', new BufferAttribute(this.flyPos, 3).setUsage(DynamicDrawUsage));
    this.flyMat = new PointsMaterial({
      size: 0.22,
      color: new Color('#ffe9a0'),
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.flyPoints = new Points(fg, this.flyMat);
    this.flyPoints.frustumCulled = false;
    scene.add(this.flyPoints);
  }

  setFireflies(anchors: Vector3[]) {
    this.flyAnchors = anchors;
    this.flyPhase = [];
    for (let i = 0; i < anchors.length * 3; i++) this.flyPhase.push(rand(0, TAU));
  }

  addEmitter(fn: SpawnFn) {
    this.emitters.push(fn);
  }

  burst(pos: Vector3, colorHex: number, n: number, speed = 2.2) {
    const c = new Color(colorHex);
    for (let i = 0; i < n; i++) {
      const idx = this.cursor;
      this.cursor = (this.cursor + 1) % this.N;
      const i3 = idx * 3;
      this.posArr[i3] = pos.x;
      this.posArr[i3 + 1] = pos.y;
      this.posArr[i3 + 2] = pos.z;
      const a = rand(0, TAU);
      const b = rand(-1, 1);
      const sp = rand(0.3, 1) * speed;
      this.velArr[i3] = Math.cos(a) * Math.sqrt(1 - b * b) * sp;
      this.velArr[i3 + 1] = Math.abs(b) * sp + 0.6;
      this.velArr[i3 + 2] = Math.sin(a) * Math.sqrt(1 - b * b) * sp;
      this.life[idx] = this.maxLife[idx] = rand(0.5, 1.4);
      this.baseCol[idx].copy(c).multiplyScalar(rand(0.7, 1.2));
      this.sizeArr[idx] = rand(0.1, 0.24);
    }
  }

  update(dt: number, t: number, night: number) {
    // светлячки
    const nf = this.flyAnchors.length;
    for (let i = 0; i < nf; i++) {
      const a = this.flyAnchors[i];
      for (let k = 0; k < 3; k++) {
        const f = i * 3 + k;
        const ph = this.flyPhase[f];
        const r = 0.8 + Math.sin(t * 0.4 + ph * 2.1) * 0.7;
        const ang = t * (0.25 + (ph % 0.4)) + ph;
        const i3 = f * 3;
        this.flyPos[i3] = a.x + Math.cos(ang) * r;
        this.flyPos[i3 + 1] = a.y + 1.1 + Math.sin(t * 1.3 + ph * 3) * 0.55 + Math.sin(ang) * 0.25;
        this.flyPos[i3 + 2] = a.z + Math.sin(ang) * r;
      }
    }
    this.flyMat.opacity = clamp(night * 1.5, 0, 0.95);

    // пул частиц
    for (let i = 0; i < this.N; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const i3 = i * 3;
      if (this.life[i] <= 0) {
        this.colArr[i3] = this.colArr[i3 + 1] = this.colArr[i3 + 2] = 0;
        continue;
      }
      this.velArr[i3 + 1] -= dt * 0.55;
      const drag = 1 - 0.6 * dt;
      this.posArr[i3] += this.velArr[i3] * dt;
      this.posArr[i3 + 1] += this.velArr[i3 + 1] * dt;
      this.posArr[i3 + 2] += this.velArr[i3 + 2] * dt;
      this.velArr[i3] *= drag;
      this.velArr[i3 + 1] *= drag;
      this.velArr[i3 + 2] *= drag;
      const fade = this.life[i] / this.maxLife[i];
      this.tmpColor.copy(this.baseCol[i]).multiplyScalar(fade);
      this.colArr[i3] = this.tmpColor.r;
      this.colArr[i3 + 1] = this.tmpColor.g;
      this.colArr[i3 + 2] = this.tmpColor.b;
    }

    for (const e of this.emitters) e(dt, t, (p, v, life, c, size) => {
      const idx = this.cursor;
      this.cursor = (this.cursor + 1) % this.N;
      const i3 = idx * 3;
      this.posArr[i3] = p.x;
      this.posArr[i3 + 1] = p.y;
      this.posArr[i3 + 2] = p.z;
      this.velArr[i3] = v.x;
      this.velArr[i3 + 1] = v.y;
      this.velArr[i3 + 2] = v.z;
      this.life[idx] = this.maxLife[idx] = life;
      this.baseCol[idx].copy(c);
      this.sizeArr[idx] = size;
    });

    (this.points.geometry.getAttribute('position') as BufferAttribute).needsUpdate = true;
    (this.points.geometry.getAttribute('color') as BufferAttribute).needsUpdate = true;
    (this.flyPoints.geometry.getAttribute('position') as BufferAttribute).needsUpdate = true;
  }
}
