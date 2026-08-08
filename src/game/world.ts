/**
 * Живой мир: долина с деревней, мельницей, прудом, дубом и лунной поляной.
 * Небо с циклом дня и ночи, звёзды, облака, светлячки, фонари, костёр.
 */
import * as THREE from 'three';
import { fbm, smooth, lerp, clamp, rand, TAU } from './utils';
import type { V3 } from './utils';
import { TARGETS } from './quests';
import { deformGeometry, crownGeo, trunkGeo, roundedRoofGeo, rockGeo, flowerGroup } from './organic';

export interface QuestLantern {
  pos: V3;
  set(on: boolean): void;
  get on(): boolean;
}

interface Scroll {
  pos: V3;
  group: THREE.Group;
  baseY: number;
  halo: THREE.Sprite;
  collected: boolean;
}

interface WorldCollider {
  x: number;
  z: number;
  radius: number;
}

export interface MovementResult {
  x: number;
  z: number;
  blocked: boolean;
}

function glowTexture(inner: string, outer: string): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, outer);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

function cloudTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 32, 8, 128, 32, 110);
  grad.addColorStop(0, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.28)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 64);
  return new THREE.CanvasTexture(c);
}

const PATH_LINES: [number, number][][] = [
  [[0, 0], [3.5, 1.8], [17.5, -13.5]],
  [[17.5, -13.5], [6, -8], [-20, 25]],
  [[-2, 0], [-32, -38]],
  [[4, -4], [12, -9], [32, -16]],
];

function pathDist(x: number, z: number): number {
  let md = Infinity;
  for (const line of PATH_LINES) {
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, az] = line[i];
      const [bx, bz] = line[i + 1];
      const dx = bx - ax, dz = bz - az;
      const len2 = dx * dx + dz * dz;
      let t = ((x - ax) * dx + (z - az) * dz) / len2;
      t = clamp(t, 0, 1);
      const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
      if (d < md) md = d;
    }
  }
  return md;
}

const DUSK = new THREE.Color('#ff8e5e');
const DAY_HOR = new THREE.Color('#f4b98a');
const NIGHT_HOR = new THREE.Color('#241f4a');
const DAY_MID = new THREE.Color('#a8c8e8');
const NIGHT_MID = new THREE.Color('#262d55');
const DAY_TOP = new THREE.Color('#3d6bb0');
const NIGHT_TOP = new THREE.Color('#0a0f2a');
const SUN_C = new THREE.Color('#ffe9c0');
const MOON_C = new THREE.Color('#aab8ee');

export class World {
  private scene: THREE.Scene;
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private moonL: THREE.DirectionalLight;
  private skyMat: THREE.ShaderMaterial;
  private starMat: THREE.PointsMaterial;
  private starDome: THREE.Points;
  private sunDir = new THREE.Vector3(0.45, 0.75, 0.4).normalize();
  private sunMesh: THREE.Mesh;
  private moonMesh: THREE.Mesh;
  private sunGlow: THREE.Sprite;
  private moonGlow: THREE.Sprite;
  private clouds: { mesh: THREE.Mesh; speed: number }[] = [];
  private waterMat!: THREE.ShaderMaterial;
  private windowMats: THREE.MeshBasicMaterial[] = [];
  private villageLights: THREE.PointLight[] = [];
  private questLanterns: QuestLantern[] = [];
  private fireLight!: THREE.PointLight;
  private fireFlames: THREE.Mesh[] = [];
  private millBlades!: THREE.Group;
  private spinning = false;
  private scrolls: Scroll[] = [];
  private swayGroup: THREE.Group;
  fireflyAnchors: THREE.Vector3[] = [];
  firePos: V3 = [10.2, 0, 4.6];
  private colliders: WorldCollider[] = [];

  // живая вселенная: птицы, дым, бабочки, метеоры, всплески
  private birds: { group: THREE.Group; cx: number; cz: number; r: number; spd: number; ph: number; y: number }[] = [];
  private smokePts: THREE.Points | null = null;
  private smokeData: Float32Array | null = null;
  private butters: THREE.Group[] = [];
  private milkway: THREE.Mesh | null = null;
  private meteor: { mesh: THREE.Mesh; vel: THREE.Vector3; t: number; active: boolean } | null = null;
  private splashes: { mesh: THREE.Mesh; t: number }[] = [];

  // погода и свет
  private rain: { lines: THREE.LineSegments; pos: Float32Array; base: Float32Array; mat: THREE.LineBasicMaterial } | null = null;
  private rainLevel = 0;
  private rainTarget = 0;
  private godRays: THREE.Mesh[] = [];
  private bobber: THREE.Group | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // ---------- lights ----------
    this.hemi = new THREE.HemisphereLight('#bcd0ff', '#3c5238', 0.55);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#ffe3b0', 1.15);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -75;
    this.sun.shadow.camera.right = 75;
    this.sun.shadow.camera.top = 75;
    this.sun.shadow.camera.bottom = -75;
    this.sun.shadow.camera.near = 10;
    this.sun.shadow.camera.far = 420;
    this.sun.shadow.bias = -0.0004;
    this.sun.position.copy(this.sunDir).multiplyScalar(120);
    scene.add(this.sun);
    scene.add(this.sun.target);
    this.moonL = new THREE.DirectionalLight('#9db4ff', 0);
    this.moonL.position.set(-80, 60, -40);
    scene.add(this.moonL);

    // ---------- sky ----------
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: NIGHT_TOP.clone() },
        uMid: { value: NIGHT_MID.clone() },
        uHor: { value: NIGHT_HOR.clone() },
        uSunDir: { value: this.sunDir.clone() },
        uSunColor: { value: SUN_C.clone() },
      },
      vertexShader: `
        varying vec3 vWorld;
        void main() {
          vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor;
        uniform vec3 uSunDir; uniform vec3 uSunColor;
        varying vec3 vWorld;
        void main() {
          vec3 dir = normalize(vWorld);
          float h = dir.y;
          vec3 c = mix(uHor, uMid, smoothstep(0.02, 0.24, h));
          c = mix(c, uTop, smoothstep(0.2, 0.6, h));
          float d = max(dot(dir, uSunDir), 0.0);
          c += uSunColor * pow(d, 200.0) * 1.6;
          c += uSunColor * pow(d, 12.0) * 0.18;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(420, 28, 14), this.skyMat);
    dome.frustumCulled = false;
    scene.add(dome);

    // stars
    const starGeo = new THREE.BufferGeometry();
    const sp = new Float32Array(700 * 3);
    for (let i = 0; i < 700; i++) {
      const a = rand(0, TAU);
      const y = rand(0.08, 0.95);
      const r = 400 * Math.sqrt(1 - y * y);
      sp[i * 3] = Math.cos(a) * r;
      sp[i * 3 + 1] = y * 400;
      sp[i * 3 + 2] = Math.sin(a) * r;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.starMat = new THREE.PointsMaterial({ color: '#d8e0ff', size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false });
    this.starDome = new THREE.Points(starGeo, this.starMat);
    this.starDome.frustumCulled = false;
    scene.add(this.starDome);

    // sun & moon
    const gt = glowTexture('rgba(255,236,190,0.95)', 'rgba(255,200,120,0.35)');
    this.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(13, 20, 14), new THREE.MeshBasicMaterial({ color: '#ffdf9e', fog: false }));
    this.sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: '#ffd27a', transparent: true, opacity: 0.8, depthWrite: false, fog: false }));
    this.sunGlow.scale.setScalar(110);
    scene.add(this.sunMesh, this.sunGlow);
    const mt = glowTexture('rgba(235,240,255,0.95)', 'rgba(180,195,255,0.3)');
    this.moonMesh = new THREE.Mesh(new THREE.SphereGeometry(8, 20, 14), new THREE.MeshBasicMaterial({ color: '#eef1ff', fog: false }));
    this.moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: mt, color: '#c8d4ff', transparent: true, opacity: 0, depthWrite: false, fog: false }));
    this.moonGlow.scale.setScalar(75);
    scene.add(this.moonMesh, this.moonGlow);

    // clouds
    const ct = cloudTexture();
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(rand(24, 42), rand(8, 14)),
        new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: rand(0.3, 0.55), depthWrite: false, fog: false }),
      );
      m.position.set(rand(-260, 260), rand(42, 62), rand(-260, 260));
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = rand(0, TAU);
      this.clouds.push({ mesh: m, speed: rand(0.4, 1.3) });
      scene.add(m);
    }

    // ---------- terrain ----------
    this.swayGroup = new THREE.Group();
    scene.add(this.swayGroup);
    this.buildTerrain();
    this.buildVillage();
    this.buildTrees();
    this.buildProps();
    this.buildWater();
    this.buildMill();
    this.buildOak();
    this.buildGlade();
    this.buildHilltop();
    this.buildCampfire();
    this.buildScrolls();
    this.buildWildlife();
  }

  // ================= TERRAIN =================
  heightAt(x: number, z: number): number {
    const dV = Math.hypot(x, z);
    const flat = 1 - smooth(10, 30, dV);
    let h = fbm(x * 0.014 + 3.7, z * 0.014 - 1.2) * 7.5 * flat + fbm(x * 0.05, z * 0.05) * 1.5 * flat + 0.55;
    h += 5.2 * Math.exp(-((x + 32) * (x + 32) + (z + 38) * (z + 38)) / 64);
    h += 1.7 * Math.exp(-((x - 2) * (x - 2) + (z - 62) * (z - 62)) / 55);
    const pd = pathDist(x, z);
    h -= 0.5 * smooth(0.8, 2.1, pd);
    const pondD = Math.hypot(x - 32, z + 16);
    if (pondD < 9) h = lerp(h, -0.85, smooth(4.5, 7.5, pondD));
    return clamp(h, -0.8, 26);
  }

  private addCollider(x: number, z: number, radius: number) {
    this.colliders.push({ x, z, radius });
  }

  /**
   * Swept circle collision with substeps. Small steps prevent a fast roll from
   * tunnelling through a wall; radial projection naturally slides along it.
   */
  resolvePlayerMovement(fromX: number, fromZ: number, toX: number, toZ: number, radius = 0.42): MovementResult {
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    const distance = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(distance / 0.16));
    let x = fromX;
    let z = fromZ;
    let blocked = false;

    for (let step = 0; step < steps; step++) {
      let nx = x + dx / steps;
      let nz = z + dz / steps;

      // World edge is also solid so movement cannot leave the authored valley.
      const boundedX = clamp(nx, -163, 163);
      const boundedZ = clamp(nz, -163, 163);
      if (boundedX !== nx || boundedZ !== nz) blocked = true;
      nx = boundedX;
      nz = boundedZ;

      for (const c of this.colliders) {
        const minDist = c.radius + radius;
        let ox = nx - c.x;
        let oz = nz - c.z;
        let d = Math.hypot(ox, oz);
        if (d >= minDist) continue;

        blocked = true;
        // Exact-center fallback uses the incoming movement direction.
        if (d < 0.0001) {
          ox = -dx || 1;
          oz = -dz;
          d = Math.hypot(ox, oz) || 1;
        }
        nx = c.x + (ox / d) * minDist;
        nz = c.z + (oz / d) * minDist;
      }

      x = nx;
      z = nz;
    }

    return { x, z, blocked };
  }

  private buildTerrain() {
    const seg = 170;
    const size = 340;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const cGrass = new THREE.Color('#4d6e46');
    const cGrass2 = new THREE.Color('#5f8050');
    const cSand = new THREE.Color('#c2a26a');
    const cWet = new THREE.Color('#3d5248');
    const cDark = new THREE.Color('#38502f');
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.heightAt(x, z);
      pos.setY(i, y);
      const n = fbm(x * 0.08 + 9, z * 0.08 - 4);
      tmp.copy(cGrass).lerp(cGrass2, n);
      const pd = pathDist(x, z);
      if (pd < 2.2) tmp.lerp(cSand, smooth(0.5, 1.9, pd) * 0.92);
      const pondD = Math.hypot(x - 32, z + 16);
      if (pondD < 10) tmp.lerp(cWet, smooth(6.5, 9.6, pondD));
      const hillD = Math.hypot(x + 32, z + 38);
      if (hillD < 9) tmp.lerp(cDark, smooth(4, 8.5, hillD) * 0.5);
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  // ================= VILLAGE =================
  private buildVillage() {
    const houseMat = new THREE.MeshStandardMaterial({ color: '#e3d2a8', roughness: 0.9, flatShading: false });
    const roofMat = new THREE.MeshStandardMaterial({ color: '#7c4a38', roughness: 0.85, flatShading: false });
    const woodMat = new THREE.MeshStandardMaterial({ color: '#6b4a2f', roughness: 0.9, flatShading: false });
    const doorMat = new THREE.MeshStandardMaterial({ color: '#4a3320', roughness: 0.95, flatShading: false });
    const winBase = new THREE.Color('#ffb347');
    const shadowMat = new THREE.MeshBasicMaterial({ color: '#1c2418', transparent: true, opacity: 0.3, depthWrite: false });

    const house = (x: number, z: number, rot: number, s = 1) => {
      const g = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(5 * s, 2.7 * s, 4 * s);
      deformGeometry(bodyGeo, 0.04 * s, 1.5, rand(0, 100));
      const body = new THREE.Mesh(bodyGeo, houseMat);
      body.position.y = 1.35 * s;
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);
      const roof = new THREE.Mesh(roundedRoofGeo(3.2 * s, 1.8 * s, 3.6 * s), roofMat);
      roof.position.y = 2.85 * s;
      roof.castShadow = true;
      g.add(roof);
      const chim = new THREE.Mesh(new THREE.BoxGeometry(0.55 * s, 1.5 * s, 0.55 * s), woodMat);
      chim.position.set(1.4 * s, 3.6 * s, 0.9 * s);
      chim.castShadow = true;
      g.add(chim);
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.95 * s, 1.7 * s, 0.12), doorMat);
      door.position.set(0, 0.85 * s, 2.05 * s);
      door.castShadow = true;
      g.add(door);
      for (const wx of [-1.5, 1.5]) {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.8 * s, 0.85 * s, 0.14), new THREE.MeshBasicMaterial({ color: winBase }));
        w.position.set(wx * s, 1.6 * s, 2.06 * s);
        g.add(w);
        this.windowMats.push(w.material as THREE.MeshBasicMaterial);
      }
      const sh = new THREE.Mesh(new THREE.CircleGeometry(3.6 * s, 22), shadowMat);
      sh.rotation.x = -Math.PI / 2;
      sh.position.y = 0.03;
      g.add(sh);
      g.position.set(x, this.heightAt(x, z), z);
      g.rotation.y = rot;
      this.scene.add(g);
      this.addCollider(x, z, 2.55 * s);
    };

    house(-5.5, 4.2, 0.35);
    house(4.6, 6.4, -0.25, 0.9);
    house(-6.4, -4.2, 2.85);
    house(5.8, -3.6, 0.1, 1.05);
    house(-11, 6.8, 0.7, 0.8);
    house(10.4, -6.2, -0.4, 0.85);

    // колодец — деформированный каменный обод, деревянная крыша-полусфера
    const wellX = TARGETS.well[0], wellZ = TARGETS.well[2];
    const well = new THREE.Group();
    const ringGeo = new THREE.CylinderGeometry(1.15, 1.35, 1.05, 18, 3);
    deformGeometry(ringGeo, 0.08, 2.2, 151);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: '#9a937f', roughness: 0.95, flatShading: false }));
    ring.castShadow = true;
    ring.receiveShadow = true;
    well.add(ring);
    const innerGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.08, 14, 2);
    deformGeometry(innerGeo, 0.025, 2, 157);
    const inner = new THREE.Mesh(innerGeo, new THREE.MeshStandardMaterial({ color: '#2c3138', roughness: 1, flatShading: false }));
    well.add(inner);
    // столбы — деформированные
    const post1 = new THREE.Mesh(trunkGeo(0.09, 0.11, 2.1), woodMat);
    post1.position.set(-0.85, 1.05, 0);
    post1.castShadow = true;
    well.add(post1);
    const post2 = new THREE.Mesh(trunkGeo(0.09, 0.11, 2.1), woodMat);
    post2.position.set(0.85, 1.05, 0);
    post2.castShadow = true;
    well.add(post2);
    // крыша — закруглённая полусфера
    const roofGeo = new THREE.SphereGeometry(1.5, 14, 8, 0, TAU, 0, Math.PI * 0.5);
    deformGeometry(roofGeo, 0.06, 2, 163);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.scale.set(1, 0.5, 1);
    roof.position.y = 2.25;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    well.add(roof);
    // ведро — деформированный цилиндр
    const bucketGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.3, 10);
    deformGeometry(bucketGeo, 0.015, 2, 167);
    const bucket = new THREE.Mesh(bucketGeo, woodMat);
    bucket.position.set(0, 1.15, 0.5);
    well.add(bucket);
    well.position.set(wellX, this.heightAt(wellX, wellZ), wellZ);
    this.scene.add(well);
    this.addCollider(wellX, wellZ, 1.05);

    // рыночный ларёк
    const stall = new THREE.Group();
    const awning = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.14, 2.6), new THREE.MeshStandardMaterial({ color: '#b85c3e', roughness: 0.9 }));
    awning.position.y = 2.25;
    awning.rotation.z = 0.18;
    awning.castShadow = true;
    stall.add(awning);
    for (const [px, pz] of [[-1.5, -1], [1.5, -1], [-1.5, 1.1], [1.5, 1.1]]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.3, 6), woodMat);
      p.position.set(px, 1.15, pz);
      stall.add(p);
    }
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), woodMat);
    crate.position.set(0.8, 0.35, 0.3);
    crate.castShadow = true;
    stall.add(crate);
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), new THREE.MeshStandardMaterial({ color: '#c9b078', roughness: 1 }));
    sack.scale.set(1, 0.8, 1);
    sack.position.set(-0.7, 0.34, 0.2);
    stall.add(sack);
    const sx = -1.6, sz = 3.6;
    stall.position.set(sx, this.heightAt(sx, sz), sz);
    stall.rotation.y = -0.5;
    this.scene.add(stall);
    this.addCollider(sx, sz, 1.45);

    // фонари деревни (горят ночью)
    const lantern = (x: number, z: number) => {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 2.6, 8), new THREE.MeshStandardMaterial({ color: '#3a332b', roughness: 0.9 }));
      pole.position.y = 1.3;
      pole.castShadow = true;
      g.add(pole);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.42), new THREE.MeshStandardMaterial({ color: '#2b2f3d', emissive: '#ffb347', emissiveIntensity: 0 }));
      lamp.position.y = 2.85;
      g.add(lamp);
      const light = new THREE.PointLight('#ffb45e', 0, 16, 2);
      light.position.y = 2.85;
      g.add(light);
      g.position.set(x, this.heightAt(x, z), z);
      this.scene.add(g);
      this.villageLights.push(light);
    };
    lantern(-5, 5.6);
    lantern(5.2, 6.8);
    lantern(-7, -4.6);
    lantern(6.4, -4.4);

    // фонари-квесты вдоль дороги к мельнице
    for (let i = 0; i < 5; i++) {
      const tt = 0.14 + i * 0.185;
      const x = lerp(-2, -32, tt);
      const z = lerp(0, -38, tt);
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 2.6, 8), new THREE.MeshStandardMaterial({ color: '#3a332b', roughness: 0.9 }));
      pole.position.y = 1.3;
      pole.castShadow = true;
      g.add(pole);
      const lampMat = new THREE.MeshStandardMaterial({ color: '#23262f', emissive: '#ffb347', emissiveIntensity: 0 });
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.42), lampMat);
      lamp.position.y = 2.85;
      g.add(lamp);
      const light = new THREE.PointLight('#ffb45e', 0, 15, 2);
      light.position.y = 2.85;
      g.add(light);
      g.position.set(x, this.heightAt(x, z), z);
      this.scene.add(g);
      const on = { v: false };
      this.questLanterns.push({
        pos: [x, this.heightAt(x, z), z],
        set(v: boolean) {
          on.v = v;
          lampMat.emissiveIntensity = v ? 1.6 : 0;
          lampMat.color.set(v ? '#e8c36a' : '#23262f');
        },
        get on() { return on.v; },
      });
    }
  }

  // ================= TREES =================
  private buildTrees() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#5d4630', roughness: 1, flatShading: false });
    const pineMats = [
      new THREE.MeshStandardMaterial({ color: '#2e4d3a', roughness: 0.92, flatShading: false }),
      new THREE.MeshStandardMaterial({ color: '#3a6148', roughness: 0.92, flatShading: false }),
      new THREE.MeshStandardMaterial({ color: '#477257', roughness: 0.92, flatShading: false }),
    ];
    const roundMats = [
      new THREE.MeshStandardMaterial({ color: '#4a7a4e', roughness: 0.92, flatShading: false }),
      new THREE.MeshStandardMaterial({ color: '#5b8a57', roughness: 0.92, flatShading: false }),
    ];
    const dummy = new THREE.Object3D();

    const makeInst = (geo: THREE.BufferGeometry, mat: THREE.Material, n: number) => {
      const m = new THREE.InstancedMesh(geo, mat, n);
      m.castShadow = true;
      m.receiveShadow = false;
      return m;
    };

    // стволы — деформированные цилиндры (слегка искривлённые)
    const pineTrunks = makeInst(trunkGeo(0.18, 0.32, 1.9), trunkMat, 130);
    const pineCrowns: THREE.InstancedMesh[] = [];
    for (let i = 0; i < 3; i++) {
      // пушистые кроны из нескольких смещённых сфер, деформированных
      pineCrowns.push(makeInst(crownGeo(1.55 - i * 0.32, 12), pineMats[i], 130));
    }

    const roundTrunks = makeInst(trunkGeo(0.22, 0.32, 1.7), trunkMat, 85);
    const roundCrowns: THREE.InstancedMesh[] = [];
    for (let i = 0; i < 2; i++) roundCrowns.push(makeInst(crownGeo(1.55 - i * 0.4, 14), roundMats[i], 85));

    const place = (i: number, x: number, z: number, s: number) => {
      dummy.position.set(x, this.heightAt(x, z), z);
      dummy.scale.setScalar(s);
      dummy.rotation.set(0, rand(0, TAU), 0);
      dummy.updateMatrix();
      pineTrunks.setMatrixAt(i, dummy.matrix);
      let y = dummy.position.y;
      pineCrowns.forEach((c, k) => {
        y += 0.9 + k * 0.62;
        dummy.position.y = y;
        dummy.scale.set(s * (1.05 - k * 0.05), s * (0.85 + k * 0.04), s * (1.05 - k * 0.05));
        dummy.updateMatrix();
        c.setMatrixAt(i, dummy.matrix);
      });
    };
    const placeR = (i: number, x: number, z: number, s: number) => {
      dummy.position.set(x, this.heightAt(x, z), z);
      dummy.scale.setScalar(s);
      dummy.rotation.set(0, rand(0, TAU), 0);
      dummy.updateMatrix();
      roundTrunks.setMatrixAt(i, dummy.matrix);
      let y = dummy.position.y;
      roundCrowns.forEach((c, k) => {
        y += 0.95 + k * 0.78;
        dummy.position.y = y;
        dummy.scale.setScalar(s * (1.1 - k * 0.1));
        dummy.updateMatrix();
        c.setMatrixAt(i, dummy.matrix);
      });
    };

    let pi = 0;
    let tries = 0;
    while (pi < 130 && tries < 4000) {
      tries++;
      const x = rand(-150, 150);
      const z = rand(-150, 150);
      const dV = Math.hypot(x, z);
      const pd = pathDist(x, z);
      const pondD = Math.hypot(x - 32, z + 16);
      if (dV < 13 || pd < 2.6 || pondD < 10 || x < -140 || z > 130 || (Math.hypot(x - 17.5, z + 13.5) < 4)) continue;
      const hillD = Math.hypot(x + 32, z + 38);
      if (hillD < 7) continue;
      const treeScale = rand(0.8, 1.9);
      place(pi, x, z, treeScale);
      this.addCollider(x, z, 0.22 + treeScale * 0.17);
      pi++;
    }
    let ri = 0;
    tries = 0;
    while (ri < 85 && tries < 4000) {
      tries++;
      const x = rand(-140, 140);
      const z = rand(-140, 130);
      const dV = Math.hypot(x, z);
      const pd = pathDist(x, z);
      const pondD = Math.hypot(x - 32, z + 16);
      if (dV < 12 || pd < 2.6 || pondD < 10) continue;
      if (Math.hypot(x + 32, z + 38) < 7) continue;
      const treeScale = rand(0.7, 1.6);
      placeR(ri, x, z, treeScale);
      this.addCollider(x, z, 0.23 + treeScale * 0.18);
      ri++;
    }
    this.swayGroup.add(pineTrunks, ...pineCrowns, roundTrunks, ...roundCrowns);
  }

  // ================= PROPS =================
  private buildProps() {
    // камни — деформированные икосаэдры для органичной формы
    const baseRock = rockGeo(0.6, 1);
    const rockMat = new THREE.MeshStandardMaterial({ color: '#8a8795', roughness: 1, flatShading: false });
    const rocks = new THREE.InstancedMesh(baseRock, rockMat, 46);
    const dummy = new THREE.Object3D();
    let k = 0;
    let tries = 0;
    while (k < 46 && tries < 2000) {
      tries++;
      const x = rand(-130, 130);
      const z = rand(-120, 120);
      if (pathDist(x, z) < 3 || Math.hypot(x, z) < 9 || Math.hypot(x - 32, z + 16) < 9) continue;
      dummy.position.set(x, this.heightAt(x, z) - 0.15, z);
      dummy.scale.set(rand(0.5, 2.4), rand(0.4, 1.1), rand(0.5, 2.4));
      dummy.rotation.set(rand(0, TAU), rand(0, TAU), rand(0, TAU));
      dummy.updateMatrix();
      rocks.setMatrixAt(k, dummy.matrix);
      this.addCollider(x, z, Math.max(0.25, dummy.scale.x * 0.38));
      k++;
    }
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    this.swayGroup.add(rocks);

    // цветы — деформированные органичные букетики
    const colors = ['#f2ede0', '#e8a0b4', '#f2c14e', '#9b8fd4', '#e87a6a'];
    const flowerCluster = new THREE.Group();
    const flowerCount = 90;
    for (let i = 0; i < flowerCount; i++) {
      let x = 0, z = 0, ok = false;
      for (let tt = 0; tt < 20 && !ok; tt++) {
        x = rand(-75, 75);
        z = rand(-65, 85);
        if (pathDist(x, z) < 1.8 || Math.hypot(x, z) < 6 || Math.hypot(x - 32, z + 16) < 10) continue;
        ok = true;
      }
      if (!ok) continue;
      const col = colors[i % colors.length];
      const fl = this.flowerCluster(col, rand(0.35, 0.55));
      fl.position.set(x, this.heightAt(x, z), z);
      fl.rotation.y = rand(0, TAU);
      flowerCluster.add(fl);
    }
    this.swayGroup.add(flowerCluster);

    // трава — ультра-надёжные стандартные материалы без рискованных кастомных шейдеров
    const grassMat1 = new THREE.MeshStandardMaterial({ color: '#4a7a3e', roughness: 0.9, side: THREE.DoubleSide });
    const grassMat2 = new THREE.MeshStandardMaterial({ color: '#5c8a50', roughness: 0.9, side: THREE.DoubleSide });
    const bladeGeo1 = new THREE.PlaneGeometry(0.16, 0.5, 1, 1);
    const bladeGeo2 = new THREE.PlaneGeometry(0.16, 0.5, 1, 1);
    const grass1 = new THREE.InstancedMesh(bladeGeo1, grassMat1, 600);
    const grass2 = new THREE.InstancedMesh(bladeGeo2, grassMat2, 600);
    k = 0; tries = 0;
    while (k < 600 && tries < 8000) {
      tries++;
      const x = rand(-60, 60);
      const z = rand(-55, 75);
      if (pathDist(x, z) < 1.1 || Math.hypot(x, z) < 5.5) continue;
      dummy.position.set(x, this.heightAt(x, z) + 0.1, z);
      dummy.scale.set(rand(0.8, 1.8), rand(0.8, 1.7), 1);
      dummy.rotation.set(0, rand(0, TAU), 0);
      dummy.updateMatrix();
      grass1.setMatrixAt(k, dummy.matrix);
      dummy.rotation.y += Math.PI / 2;
      dummy.updateMatrix();
      grass2.setMatrixAt(k, dummy.matrix);
      k++;
    }
    this.swayGroup.add(grass1, grass2);
  }

  private flowerCluster(col: string, size: number) {
    return flowerGroup(col, size);
  }

  // ================= WILDLIFE =================
  private buildWildlife() {
    // стаи птиц
    const wingGeo = new THREE.PlaneGeometry(0.42, 0.2);
    const birdMat = new THREE.MeshBasicMaterial({ color: '#2b3040', side: THREE.DoubleSide, depthWrite: false });
    for (let s = 0; s < 3; s++) {
      const group = new THREE.Group();
      for (let i = 0; i < 6; i++) {
        const wing = new THREE.Mesh(wingGeo, birdMat);
        wing.position.set((i - 2.5) * 0.9, 0, 0);
        wing.rotation.z = Math.sin(i * 2.1) * 0.15;
        wing.userData.phase = i * 1.7;
        group.add(wing);
      }
      const cx = s === 0 ? -70 : s === 1 ? 55 : 10;
      const cz = s === 0 ? 20 : s === 1 ? -55 : 85;
      group.position.set(cx, 28 + s * 4, cz);
      this.birds.push({ group, cx, cz, r: 38 + s * 14, spd: 0.05 + s * 0.02, ph: s * 2.1, y: 26 + s * 5 });
      this.scene.add(group);
    }

    // дым из труб
    const smokeGeo = new THREE.BufferGeometry();
    const smokeN = 36;
    this.smokeData = new Float32Array(smokeN * 4); // x, y, z, life
    for (let i = 0; i < smokeN; i++) this.smokeData[i * 4 + 3] = Math.random() * 2;
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(smokeN * 3), 3).setUsage(THREE.DynamicDrawUsage));
    this.smokePts = new THREE.Points(smokeGeo, new THREE.PointsMaterial({
      size: 0.55,
      color: '#c9c2b2',
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      sizeAttenuation: true,
    }));
    this.smokePts.frustumCulled = false;
    this.scene.add(this.smokePts);

    // бабочки у поляны
    const butterGeo = new THREE.PlaneGeometry(0.16, 0.12);
    const butterColors = ['#e8a0b4', '#9b8fd4'];
    for (let b = 0; b < 2; b++) {
      const group = new THREE.Group();
      const wingMat = new THREE.MeshBasicMaterial({ color: butterColors[b], side: THREE.DoubleSide, depthWrite: false });
      const wl = new THREE.Mesh(butterGeo, wingMat);
      wl.position.x = -0.08;
      const wr = new THREE.Mesh(butterGeo, wingMat);
      wr.position.x = 0.08;
      wr.rotation.y = Math.PI;
      group.add(wl, wr);
      group.position.set(-20 + b * 3, this.heightAt(-20 + b * 3, 25) + 1.2, 25 + Math.sin(b * 3) * 2);
      group.userData = { t: b * 3.1, cx: group.position.x, cz: group.position.z };
      this.butters.push(group);
      this.scene.add(group);
    }

    // Млечный путь
    const milkGeo = new THREE.RingGeometry(320, 385, 48);
    this.milkway = new THREE.Mesh(milkGeo, new THREE.MeshBasicMaterial({
      color: '#aab8ff',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    }));
    this.milkway.rotation.x = 1.15;
    this.milkway.rotation.y = 0.6;
    this.milkway.frustumCulled = false;
    this.scene.add(this.milkway);

    // метеор
    const meteorGeo = new THREE.PlaneGeometry(0.14, 1.6);
    this.meteor = {
      mesh: new THREE.Mesh(meteorGeo, new THREE.MeshBasicMaterial({
        color: '#d8e4ff',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })),
      vel: new THREE.Vector3(),
      t: 0,
      active: false,
    };
    this.meteor.mesh.visible = false;
    this.meteor.mesh.frustumCulled = false;
    this.scene.add(this.meteor.mesh);

    // дождь — падающие линии
    const rainN = 900;
    const rainPos = new Float32Array(rainN * 6);
    const rainBase = new Float32Array(rainN * 2);
    for (let i = 0; i < rainN; i++) {
      const x = rand(-150, 150);
      const z = rand(-150, 150);
      const y0 = rand(22, 82);
      rainPos[i * 6] = x;
      rainPos[i * 6 + 1] = y0;
      rainPos[i * 6 + 2] = z;
      rainPos[i * 6 + 3] = x;
      rainPos[i * 6 + 4] = y0 + 1.1;
      rainPos[i * 6 + 5] = z;
      rainBase[i * 2] = x;
      rainBase[i * 2 + 1] = z;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.LineBasicMaterial({ color: '#a8c0e0', transparent: true, opacity: 0, depthWrite: false });
    const rainLines = new THREE.LineSegments(rainGeo, rainMat);
    rainLines.frustumCulled = false;
    this.rain = { lines: rainLines, pos: rainPos, base: rainBase, mat: rainMat };
    this.scene.add(rainLines);

    // лучи бога на закате
    const rayMat = new THREE.MeshBasicMaterial({
      color: '#ffd9a0',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      fog: false,
    });
    for (let k = 0; k < 3; k++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(8 + k * 4, 110, 12, 1, true), rayMat.clone());
      cone.position.set(0, 60, 0);
      cone.rotation.z = Math.PI;
      cone.frustumCulled = false;
      this.godRays.push(cone);
      this.scene.add(cone);
    }

    // мостки у пруда + поплавок
    const pondCx = 32, pondCz = -16;
    const dx = 0.9, dz = -0.45; // направление от берега к воде
    const plankMat = new THREE.MeshStandardMaterial({ color: '#8a6b4a', roughness: 0.9, flatShading: false });
    for (let t = 0; t < 3; t++) {
      const px = pondCx - dx * (7.6 - t * 2.0);
      const pz = pondCz - dz * (7.6 - t * 2.0);
      const h = Math.max(this.heightAt(px, pz), 0.15) + 0.55;
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.14, 1.05), plankMat);
      plank.position.set(px, h, pz);
      plank.rotation.y = Math.atan2(dx, dz);
      plank.castShadow = true;
      plank.receiveShadow = true;
      this.scene.add(plank);
    }
    // поплавок
    this.bobber = new THREE.Group();
    const bobRed = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshStandardMaterial({ color: '#d94a45', roughness: 0.4 }));
    const bobWhite = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), new THREE.MeshStandardMaterial({ color: '#f2f2f0', roughness: 0.4 }));
    bobWhite.position.y = 0.09;
    this.bobber.add(bobRed, bobWhite);
    this.bobber.position.set(30.4, 0.45, -16.4);
    this.scene.add(this.bobber);

    // светлячки у костра
    for (const [fx, fz] of [[10.2, 4.6], [9, 5.8], [11.4, 3.8]]) {
      this.fireflyAnchors.push(new THREE.Vector3(fx, this.heightAt(fx, fz), fz));
    }
  }

  makeSplash(x: number, z: number) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.62, 22),
      new THREE.MeshBasicMaterial({ color: '#cfe4f2', transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.42, z);
    this.scene.add(ring);
    this.splashes.push({ mesh: ring, t: 0 });
  }

  private updateWildlife(dt: number, t: number, night: number, dusk = 0) {
    // птицы
    for (const b of this.birds) {
      const a = t * b.spd + b.ph;
      b.group.position.x = b.cx + Math.cos(a) * b.r;
      b.group.position.z = b.cz + Math.sin(a) * b.r;
      b.group.position.y = b.y + Math.sin(t * 0.3 + b.ph) * 2;
      b.group.rotation.y = -a + Math.PI / 2;
      b.group.children.forEach((wing) => {
        wing.rotation.z = Math.sin(t * 11 + (wing.userData.phase as number)) * 0.5;
      });
    }

    // дым
    if (this.smokePts && this.smokeData) {
      const posAttr = this.smokePts.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < this.smokeData.length / 4; i++) {
        let life = this.smokeData[i * 4 + 3];
        life -= dt * 0.22;
        if (life <= 0) {
          life = 1 + Math.random() * 1.6;
          const chimney = i % 2 === 0 ? [-4.6, 4.2] : [5.4, 6.4];
          this.smokeData[i * 4] = chimney[0] + (Math.random() - 0.5) * 0.3;
          this.smokeData[i * 4 + 1] = this.heightAt(chimney[0], chimney[1]) + 3.9;
          this.smokeData[i * 4 + 2] = chimney[1] + (Math.random() - 0.5) * 0.3;
        } else {
          this.smokeData[i * 4 + 1] += dt * 0.5;
          this.smokeData[i * 4] += dt * (Math.sin(t * 0.7 + i) * 0.08 + 0.04);
          this.smokeData[i * 4 + 2] += dt * Math.cos(t * 0.6 + i * 2) * 0.07;
        }
        this.smokeData[i * 4 + 3] = life;
        arr[i * 3] = this.smokeData[i * 4];
        arr[i * 3 + 1] = this.smokeData[i * 4 + 1];
        arr[i * 3 + 2] = this.smokeData[i * 4 + 2];
      }
      posAttr.needsUpdate = true;
      (this.smokePts.material as THREE.PointsMaterial).opacity = 0.1 + Math.max(0, night - 0.15) * 0.1;
    }

    // бабочки
    for (const b of this.butters) {
      const u = b.userData as { t: number; cx: number; cz: number };
      u.t += dt * 1.4;
      b.position.x = u.cx + Math.sin(u.t) * 1.6;
      b.position.z = u.cz + Math.cos(u.t * 0.8) * 1.6;
      b.position.y = this.heightAt(b.position.x, b.position.z) + 1.1 + Math.sin(u.t * 2.2) * 0.35;
      b.rotation.y = Math.sin(u.t * 0.9) * 0.8;
      b.children.forEach((w) => {
        w.rotation.z = Math.sin(t * 18 + w.position.x * 20) * 0.55;
      });
    }

    // Млечный путь
    if (this.milkway) (this.milkway.material as THREE.MeshBasicMaterial).opacity = night * 0.2;

    // метеоры
    if (this.meteor) {
      if (this.meteor.active) {
        this.meteor.t += dt;
        this.meteor.mesh.position.addScaledVector(this.meteor.vel, dt);
        const fade = Math.max(0, 1 - this.meteor.t / 1.5);
        (this.meteor.mesh.material as THREE.MeshBasicMaterial).opacity = fade * 0.9;
        if (this.meteor.t > 1.5) {
          this.meteor.active = false;
          this.meteor.mesh.visible = false;
        }
      } else if (night > 0.55 && Math.random() < dt / 26) {
        const a = Math.random() * TAU;
        const y = 260 + Math.random() * 90;
        const r = 370;
        this.meteor.mesh.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        this.meteor.vel.set((Math.random() - 0.5) * 60, -(55 + Math.random() * 50), (Math.random() - 0.5) * 60);
        this.meteor.mesh.lookAt(this.meteor.mesh.position.clone().add(this.meteor.vel));
        this.meteor.t = 0;
        this.meteor.active = true;
        this.meteor.mesh.visible = true;
      }
    }

    // всплески
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const s = this.splashes[i];
      s.t += dt;
      const p = s.t / 1.7;
      s.mesh.scale.setScalar(0.6 + p * 1.6);
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - p);
      if (p >= 1) {
        this.scene.remove(s.mesh);
        this.splashes.splice(i, 1);
      }
    }

    // дождь
    this.rainLevel = lerp(this.rainLevel, this.rainTarget, 1 - Math.exp(-1.2 * dt));
    if (this.rain) {
      const fall = 55 * dt;
      const pos = this.rain.pos;
      for (let i = 0; i < pos.length / 6; i++) {
        pos[i * 6 + 1] -= fall;
        pos[i * 6 + 4] -= fall;
        if (pos[i * 6 + 4] < 0.15) {
          const y0 = 75 + Math.random() * 12;
          pos[i * 6 + 1] = y0;
          pos[i * 6 + 4] = y0 + 1.1;
        }
      }
      (this.rain.lines.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      this.rain.mat.opacity = this.rainLevel * 0.42;
    }

    // лучи бога
    for (const cone of this.godRays) {
      cone.position.copy(this.sunDir).multiplyScalar(85).add(new THREE.Vector3(0, 42, 0));
      cone.lookAt(0, 0, 0);
      (cone.material as THREE.MeshBasicMaterial).opacity = dusk * 0.26 + Math.max(0, night - 0.4) * 0.04;
    }

    // поплавок
    if (this.bobber) {
      this.bobber.position.y = 0.45 + Math.sin(t * 1.9) * 0.06;
      this.bobber.position.x = 30.4 + Math.sin(t * 0.8) * 0.08;
      this.bobber.position.z = -16.4 + Math.cos(t * 0.7) * 0.08;
    }
  }

  setRain(v: number) {
    this.rainTarget = v;
  }
  getRainLevel() {
    return this.rainLevel;
  }

  // ================= WATER =================
  private buildWater() {
    this.waterMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: { uTime: { value: 0 }, uColorA: { value: new THREE.Color('#1e4058') }, uColorB: { value: new THREE.Color('#2e6480') } },
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorld; varying vec3 vNormal;
        void main() {
          vec3 p = position;
          p.y += sin(p.x * 0.7 + uTime * 0.9) * 0.07 + cos(p.z * 0.55 + uTime * 0.7) * 0.07;
          vWorld = (modelMatrix * vec4(p, 1.0)).xyz;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        uniform float uTime; uniform vec3 uColorA; uniform vec3 uColorB;
        varying vec3 vWorld; varying vec3 vNormal;
        void main() {
          vec3 view = normalize(cameraPosition - vWorld);
          float fres = pow(1.0 - abs(dot(normalize(vNormal), view)), 2.2);
          float wave = sin(vWorld.x * 1.7 + uTime) * 0.5 + sin(vWorld.z * 1.3 - uTime * 0.8) * 0.5;
          vec3 c = mix(uColorA, uColorB, wave * 0.5 + 0.5);
          c += vec3(0.55, 0.62, 0.75) * fres * 0.5;
          gl_FragColor = vec4(c, 0.88);
        }`,
    });
    const water = new THREE.Mesh(new THREE.CircleGeometry(9, 48), this.waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(32, 0.34, -16);
    this.scene.add(water);

    // камыши
    const reedMat = new THREE.MeshStandardMaterial({ color: '#3f5a38', roughness: 1 });
    const headMat = new THREE.MeshStandardMaterial({ color: '#6b4a30', roughness: 1 });
    for (let i = 0; i < 16; i++) {
      const a = rand(0, TAU);
      const r = rand(8.6, 10.5);
      const x = 32 + Math.cos(a) * r;
      const z = -16 + Math.sin(a) * r;
      const g = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.ConeGeometry(0.06, rand(1.4, 2.1), 5), reedMat);
      stem.position.y = 0.7;
      g.add(stem);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 5), headMat);
      head.position.y = 1.55;
      g.add(head);
      g.position.set(x, this.heightAt(x, z), z);
      g.rotation.y = rand(0, TAU);
      this.scene.add(g);
    }
  }

  // ================= MILL =================
  private buildMill() {
    const x = -32, z = -38;
    const g = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: '#9a937f', roughness: 0.95, flatShading: false });
    const wood = new THREE.MeshStandardMaterial({ color: '#8a6b4a', roughness: 0.9, flatShading: false });
    // башня — деформированный цилиндр, слегка неровный
    const towerGeo = new THREE.CylinderGeometry(2.5, 3.1, 5.2, 18, 6);
    deformGeometry(towerGeo, 0.12, 1.4, 101);
    const tower = new THREE.Mesh(towerGeo, stone);
    tower.position.y = 2.6;
    tower.castShadow = true;
    tower.receiveShadow = true;
    g.add(tower);
    // верхняя часть — деформированный цилиндр
    const topGeo = new THREE.CylinderGeometry(1.7, 2.5, 2.6, 14, 4);
    deformGeometry(topGeo, 0.09, 1.3, 107);
    const top = new THREE.Mesh(topGeo, wood);
    top.position.y = 5.6;
    top.castShadow = true;
    g.add(top);
    // крыша — деформированный конус
    const roofGeo = new THREE.ConeGeometry(2.6, 2.2, 14);
    deformGeometry(roofGeo, 0.15, 1.8, 113);
    const roof = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: '#6e3f30', roughness: 0.9, flatShading: false }));
    roof.position.y = 7.4;
    roof.castShadow = true;
    g.add(roof);
    // дверь — деформированный бокс
    const doorGeo = new THREE.BoxGeometry(1.1, 1.9, 0.14);
    deformGeometry(doorGeo, 0.03, 2, 119);
    const door = new THREE.Mesh(doorGeo, new THREE.MeshStandardMaterial({ color: '#4a3320' }));
    door.position.set(0, 0.95, 2.62);
    g.add(door);
    // окно — круглое, тёплое
    const win = new THREE.Mesh(new THREE.CircleGeometry(0.5, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb347') }));
    win.position.set(0, 2.6, 2.62);
    g.add(win);
    this.windowMats.push(win.material as THREE.MeshBasicMaterial);
    // крылья — деформированные лопасти
    this.millBlades = new THREE.Group();
    const bladeMat = new THREE.MeshStandardMaterial({ color: '#c9b078', roughness: 0.9, side: THREE.DoubleSide, flatShading: false });
    for (let i = 0; i < 4; i++) {
      const bladeGeo = new THREE.BoxGeometry(4.4, 0.42, 0.1);
      deformGeometry(bladeGeo, 0.03, 2, i * 13 + 123);
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.y = 2.4;
      blade.position.x = 0.55;
      blade.rotation.z = (i * Math.PI) / 2;
      blade.castShadow = true;
      this.millBlades.add(blade);
      const latticeGeo = new THREE.BoxGeometry(0.12, 4.2, 0.1);
      deformGeometry(latticeGeo, 0.02, 2, i * 13 + 131);
      const lattice = new THREE.Mesh(latticeGeo, bladeMat);
      lattice.position.y = 2.4;
      lattice.rotation.z = (i * Math.PI) / 2;
      this.millBlades.add(lattice);
    }
    const hub = new THREE.Mesh(crownGeo(0.45, 8), wood);
    this.millBlades.add(hub);
    this.millBlades.position.set(0, 5.9, 1.9);
    g.add(this.millBlades);
    const y = this.heightAt(x, z);
    g.position.set(x, y, z);
    this.scene.add(g);
    this.addCollider(x, z, 2.65);
  }

  // ================= OAK =================
  private buildOak() {
    const g = new THREE.Group();
    const bark = new THREE.MeshStandardMaterial({ color: '#5d4630', roughness: 1, flatShading: false });
    const leafMats = [
      new THREE.MeshStandardMaterial({ color: '#3f6b46', roughness: 0.92, flatShading: false }),
      new THREE.MeshStandardMaterial({ color: '#477a52', roughness: 0.92, flatShading: false }),
      new THREE.MeshStandardMaterial({ color: '#365c40', roughness: 0.92, flatShading: false }),
    ];
    // ствол — деформированный, с бугристой корой
    const trunk = new THREE.Mesh(trunkGeo(1.05, 1.55, 4.6), bark);
    trunk.position.y = 2.3;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    g.add(trunk);
    // ветви — деформированные
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      const br = new THREE.Mesh(trunkGeo(0.3, 0.55, 3.4), bark);
      br.position.set(Math.cos(a) * 1.2, 4.1, Math.sin(a) * 1.2);
      br.rotation.z = Math.cos(a) * 0.7;
      br.rotation.x = -Math.sin(a) * 0.7;
      br.castShadow = true;
      g.add(br);
    }
    // крона — деформированные сферы-комки
    const blobs: [number, number, number, number][] = [
      [0, 6.6, 0, 2.6], [1.9, 5.9, 0.9, 1.8], [-1.9, 6.1, -1, 1.9],
      [1.5, 5.4, -1.7, 1.6], [-1.7, 5.6, 1.6, 1.6], [0.2, 5.2, 2.1, 1.7],
    ];
    blobs.forEach(([bx, by, bz, r], i) => {
      const m = new THREE.Mesh(crownGeo(r, 14), leafMats[i % 3]);
      m.position.set(bx, by, bz);
      m.castShadow = true;
      g.add(m);
    });
    const ox = TARGETS.starets[0], oz = TARGETS.starets[2];
    g.position.set(ox, this.heightAt(ox, oz), oz);
    this.scene.add(g);
    this.addCollider(ox, oz, 1.05);

    // скамья у дуба
    const bench = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: '#8a6b4a', roughness: 0.9 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.55), woodMat);
    seat.position.y = 0.55;
    seat.castShadow = true;
    bench.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 0.1), woodMat);
    back.position.set(0, 0.95, -0.24);
    back.castShadow = true;
    bench.add(back);
    for (const lx of [-0.7, 0.7]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.5), woodMat);
      leg.position.set(lx, 0.27, 0);
      bench.add(leg);
    }
    const bx = ox + 2.2, bz = oz - 1.2;
    bench.position.set(bx, this.heightAt(bx, bz), bz);
    bench.rotation.y = -0.9;
    this.scene.add(bench);
  }

  // ================= GLADE =================
  private buildGlade() {
    const gx = TARGETS.glade[0], gz = TARGETS.glade[2];
    const stemMat = new THREE.MeshStandardMaterial({ color: '#e8e0cc', roughness: 1 });
    const capMat = new THREE.MeshStandardMaterial({ color: '#c24e3d', roughness: 0.9, flatShading: true });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU;
      const r = 2.6 + Math.sin(i * 3.7) * 0.7;
      const g = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.55, 7), stemMat);
      stem.position.y = 0.27;
      g.add(stem);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 5, 0, TAU, 0, Math.PI / 2), capMat);
      cap.position.y = 0.58;
      cap.scale.set(1, 0.75, 1);
      cap.castShadow = true;
      g.add(cap);
      const px = gx + Math.cos(a) * r;
      const pz = gz + Math.sin(a) * r;
      g.position.set(px, this.heightAt(px, pz), pz);
      g.rotation.y = rand(0, TAU);
      this.scene.add(g);
    }
  }

  // ================= HILLTOP =================
  private buildHilltop() {
    const hx = TARGETS.hill[0], hz = TARGETS.hill[2];
    const woodMat = new THREE.MeshStandardMaterial({ color: '#8a6b4a', roughness: 0.9 });
    const bench = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.12, 0.6), woodMat);
    seat.position.y = 0.55;
    bench.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2, 0.65, 0.1), woodMat);
    back.position.set(0, 0.98, -0.26);
    bench.add(back);
    for (const lx of [-0.8, 0.8]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.55, 0.55), woodMat);
      leg.position.set(lx, 0.27, 0);
      bench.add(leg);
    }
    bench.position.set(hx, this.heightAt(hx, hz) + 0.05, hz - 0.4);
    bench.rotation.y = Math.PI;
    this.scene.add(bench);
    // каменный круг
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const r = 3.4;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), new THREE.MeshStandardMaterial({ color: '#8b8794', roughness: 1, flatShading: true }));
      rock.position.set(hx + Math.cos(a) * r, this.heightAt(hx + Math.cos(a) * r, hz + Math.sin(a) * r) + 0.15, hz + Math.sin(a) * r);
      rock.scale.set(1.6, 0.8, 1.4);
      rock.rotation.set(rand(0, TAU), rand(0, TAU), rand(0, TAU));
      rock.castShadow = true;
      this.scene.add(rock);
    }
  }

  // ================= CAMPFIRE =================
  private buildCampfire() {
    const g = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: '#7d7a8a', roughness: 1, flatShading: false });
    // кострище — деформированные камни по кругу
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const s = new THREE.Mesh(rockGeo(0.22, 0), stoneMat);
      s.position.set(Math.cos(a) * 0.9, 0.08, Math.sin(a) * 0.9);
      s.scale.set(1.4, 0.7, 1.2);
      s.rotation.set(rand(0, TAU), rand(0, TAU), 0);
      g.add(s);
    }
    // брёвна — деформированные цилиндры
    const logMat = new THREE.MeshStandardMaterial({ color: '#4a3320', roughness: 1, flatShading: false });
    for (let i = 0; i < 4; i++) {
      const logGeo = trunkGeo(0.12, 0.12, 1.1);
      const l = new THREE.Mesh(logGeo, logMat);
      l.rotation.z = Math.PI / 2;
      l.rotation.y = (i * Math.PI) / 2 + 0.5;
      l.position.y = 0.16;
      g.add(l);
    }
    const f1 = new THREE.Mesh(new THREE.SphereGeometry(0.34, 9, 7), new THREE.MeshBasicMaterial({ color: '#ff9a3d', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    f1.position.y = 0.42;
    const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    f2.position.y = 0.6;
    g.add(f1, f2);
    this.fireFlames = [f1, f2];
    this.fireLight = new THREE.PointLight('#ff9a3d', 0.9, 18, 1.8);
    this.fireLight.position.y = 0.8;
    g.add(this.fireLight);
    const [fx, fz] = this.firePos;
    g.position.set(fx, this.heightAt(fx, fz), fz);
    this.scene.add(g);
  }

  // ================= SCROLLS =================
  private buildScrolls() {
    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group();
      const paper = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.55, 10), new THREE.MeshStandardMaterial({ color: '#f3e6c4', roughness: 0.8 }));
      paper.castShadow = true;
      g.add(paper);
      const cap1 = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.1, 10), new THREE.MeshStandardMaterial({ color: '#c9a86a' }));
      cap1.position.y = 0.28;
      g.add(cap1);
      const cap2 = cap1.clone();
      cap2.position.y = -0.28;
      g.add(cap2);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTexture('rgba(255,244,200,0.9)', 'rgba(255,214,120,0.25)'),
        color: '#ffe9a8',
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }));
      halo.scale.setScalar(2.4);
      g.add(halo);
      this.scrolls.push({ pos: v3(0, 0, 0), group: g, baseY: 0, halo, collected: false });
      this.scene.add(g);
    }
    const spots: V3[] = [TARGETS.well, TARGETS.glade, TARGETS.mill, TARGETS.pond, TARGETS.oakScroll, TARGETS.hill];
    this.scrolls.forEach((s, i) => {
      const [x, , z] = spots[i];
      s.pos = [x, this.heightAt(x, z) + 1.0, z];
      s.baseY = s.pos[1];
      s.group.position.set(x, s.baseY, z);
      s.group.rotation.y = rand(0, TAU);
    });

    // якоря светлячков
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      this.fireflyAnchors.push(new THREE.Vector3(32 + Math.cos(a) * 6.5, this.heightAt(32 + Math.cos(a) * 6.5, -16 + Math.sin(a) * 6.5), -16 + Math.sin(a) * 6.5));
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.6;
      this.fireflyAnchors.push(new THREE.Vector3(-20 + Math.cos(a) * 4.5, this.heightAt(-20 + Math.cos(a) * 4.5, 25 + Math.sin(a) * 4.5), 25 + Math.sin(a) * 4.5));
    }
    this.fireflyAnchors.push(new THREE.Vector3(14, this.heightAt(14, 12), 12));
    this.fireflyAnchors.push(new THREE.Vector3(9, this.heightAt(9, 21), 21));
  }

  // ================= API =================
  getQuestLanterns(): QuestLantern[] { return this.questLanterns; }
  getScroll(i: number): { pos: V3; collect(): void } {
    const s = this.scrolls[i];
    return {
      pos: s.pos,
      collect: () => {
        if (s.collected) return;
        s.collected = true;
        s.group.visible = false;
      },
    };
  }
  getScrollPos(i: number): V3 { return this.scrolls[i].pos; }
  isScrollCollected(i: number): boolean { return this.scrolls[i].collected; }
  startMill() { this.spinning = true; }
  isMillSpinning() { return this.spinning; }

  reset() {
    this.scrolls.forEach((s) => { s.collected = false; s.group.visible = true; });
    this.questLanterns.forEach((l) => l.set(false));
    this.spinning = false;
  }

  update(t: number, day: number, dusk: number, night: number, gust: number, sunDir: THREE.Vector3, dt = 0.016) {
    this.sunDir.copy(sunDir);
    this.sunDir.normalize();

    // небо
    const sky = this.skyMat.uniforms;
    (sky.uTop.value as THREE.Color).copy(NIGHT_TOP).lerp(DAY_TOP, day);
    (sky.uMid.value as THREE.Color).copy(NIGHT_MID).lerp(DAY_MID, day);
    (sky.uHor.value as THREE.Color).copy(NIGHT_HOR).lerp(DAY_HOR, day);
    (sky.uHor.value as THREE.Color).lerp(DUSK, dusk * 0.85);
    (sky.uSunDir.value as THREE.Vector3).copy(this.sunDir);
    const sunC = (sky.uSunColor.value as THREE.Color).copy(SUN_C).lerp(MOON_C, night * 0.4);
    sunC.multiplyScalar(0.4 + 0.75 * day + 0.3 * dusk);

    // солнце / луна
    this.sunMesh.position.copy(this.sunDir).multiplyScalar(390);
    this.sunGlow.position.copy(this.sunMesh.position);
    (this.sunGlow.material as THREE.SpriteMaterial).opacity = 0.15 + 0.75 * day + 0.4 * dusk;
    this.moonMesh.position.copy(this.sunDir).multiplyScalar(-390);
    this.moonGlow.position.copy(this.moonMesh.position);
    (this.moonGlow.material as THREE.SpriteMaterial).opacity = night * 0.9;
    this.moonMesh.visible = night > 0.08;
    this.moonGlow.visible = night > 0.05;

    this.starMat.opacity = night;
    this.starDome.rotation.y = t * 0.004;

    // свет
    this.hemi.intensity = 0.22 + 0.5 * day + 0.18 * dusk;
    this.hemi.color.set('#bcd0ff').lerp(new THREE.Color('#ffe6c8'), dusk * 0.5);
    this.sun.position.copy(this.sunDir).multiplyScalar(120);
    this.sun.intensity = 0.25 + 1.35 * day + 0.5 * dusk;
    this.sun.color.set('#ffe3b0').lerp(new THREE.Color('#ffb27a'), dusk * 0.55);
    this.moonL.intensity = night * 0.55;

    // окна и фонари
    const winK = 0.12 + 0.9 * Math.max(night, dusk * 0.65);
    for (const w of this.windowMats) w.color.set('#ffb347').multiplyScalar(winK);
    const villK = night * 1.4;
    for (const l of this.villageLights) l.intensity = villK;

    // костёр
    const flick = 0.8 + 0.25 * Math.sin(t * 12) + 0.18 * Math.sin(t * 23.7 + 2);
    this.fireLight.intensity = flick * (0.5 + 0.85 * Math.max(night, dusk * 0.8));
    this.fireFlames[0].scale.setScalar(1 + Math.sin(t * 11) * 0.18);
    this.fireFlames[1].scale.setScalar(1 + Math.sin(t * 17 + 1) * 0.24);

    // облака
    for (const c of this.clouds) {
      c.mesh.position.x += c.speed * (0.25 + gust) * 0.016;
      if (c.mesh.position.x > 280) c.mesh.position.x = -280;
      (c.mesh.material as THREE.MeshBasicMaterial).opacity = (0.25 + 0.3 * day) * (0.6 + gust * 0.4);
    }

    // вода
    this.waterMat.uniforms.uTime.value = t;

    // анимация травы простым покачиванием группы
    this.swayGroup.rotation.z = Math.sin(t * 0.85) * 0.015 * (0.5 + gust);

    // живая вселенная
    this.updateWildlife(dt, t, night, dusk);

    // мельница
    if (this.spinning) this.millBlades.rotation.z += 0.016 * (0.6 + gust);

    // свитки
    this.scrolls.forEach((s, i) => {
      if (s.collected) return;
      s.group.position.y = s.baseY + Math.sin(t * 1.5 + i * 1.7) * 0.14;
      s.group.rotation.y += 0.006;
      s.halo.scale.setScalar(2.2 + Math.sin(t * 2.2 + i) * 0.35);
    });

    // покачивание деревьев
    this.swayGroup.rotation.z = Math.sin(t * 0.85) * 0.011 * (0.5 + gust);
    this.swayGroup.rotation.x = Math.cos(t * 0.7 + 1) * 0.008 * (0.5 + gust);
  }
}

const v3 = (x: number, y: number, z: number): V3 => [x, y, z];
