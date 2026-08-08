/**
 * Высокополигональные процедурные NPC.
 * Каждый — полноценная модель с деталями: лицо, одежда, аксессуары.
 */
import * as THREE from 'three';
import { rand, TAU } from './utils';
import type { V3 } from './utils';
import { deformGeometry, trunkGeo } from './organic';

export type NpcKind = 'starets' | 'milica' | 'melnik' | 'villager1' | 'villager2' | 'kot' | 'koza';

function soft(geo: THREE.BufferGeometry, amt: number) {
  return deformGeometry(geo, amt, 1.3, rand(0, 200));
}
function softSphere(r: number, seg = 28) {
  return soft(new THREE.SphereGeometry(r, seg, seg * 0.75), r * 0.06);
}
function softCapsule(r: number, h: number, seg = 20) {
  return soft(new THREE.CapsuleGeometry(r, h, seg, seg + 4), r * 0.07);
}

function mat(color: string, rough = 0.8, em?: string, ei = 0) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough });
  if (em) { m.emissive = new THREE.Color(em); m.emissiveIntensity = ei; }
  return m;
}

export class Npc {
  group = new THREE.Group();
  kind: NpcKind;
  home: V3;
  radius: number;
  private heightAt: (x: number, z: number) => number;
  private target = new THREE.Vector3();
  private wait = 0;
  private walkT = 0;
  private yaw = 0;
  private body: THREE.Group;
  private head: THREE.Group;
  private armL: THREE.Group | null = null;
  private armR: THREE.Group | null = null;
  private tail: THREE.Group | null = null;
  private follow: THREE.Vector3 | null = null;
  private speed = 1.15;
  private eyeMeshes: THREE.Mesh[] = [];

  constructor(kind: NpcKind, home: V3, radius: number, heightAt: (x: number, z: number) => number) {
    this.kind = kind;
    this.home = home;
    this.radius = radius;
    this.heightAt = heightAt;
    this.body = new THREE.Group();
    this.head = new THREE.Group();
    this.group.add(this.body);
    this.body.add(this.head);
    this.build(kind);
    this.group.position.set(home[0], heightAt(home[0], home[2]), home[2]);
    this.target.copy(new THREE.Vector3(home[0], 0, home[2]));
    this.wait = rand(0, 3);
    if (kind === 'kot') this.speed = 2.6;
    if (kind === 'koza') this.speed = 1.0;
  }

  private build(kind: NpcKind) {
    if (kind === 'starets') this.buildStarets();
    else if (kind === 'milica') this.buildMilica();
    else if (kind === 'melnik') this.buildMelnik();
    else if (kind === 'villager1') this.buildVillager('#4a6b8a');
    else if (kind === 'villager2') this.buildVillager('#6b7a4a');
    else if (kind === 'kot') this.buildKot();
    else if (kind === 'koza') this.buildKoza();
  }

  private buildStarets() {
    const skin = mat('#d9a077', 0.75);
    const robe = mat('#6d5a3a', 0.82);
    const cloak = mat('#4a3f2c', 0.85);
    const beard = mat('#efe8d5', 0.7);
    const staff = mat('#5d4630', 0.85);
    const gem = mat('#e8a04a', 0.5, '#ffab4a', 1.4);
    const eye = mat('#8fb8ff', 0.3, '#6ea0ff', 1.2);

    // Тело — мантия
    const bodyMesh = new THREE.Mesh(softCapsule(0.4, 0.8, 28), robe);
    bodyMesh.position.y = 0.72;
    bodyMesh.castShadow = true;
    this.body.add(bodyMesh);

    // Плечи
    const shoulders = new THREE.Mesh(softSphere(0.36, 28), cloak);
    shoulders.scale.set(1.2, 0.7, 1.0);
    shoulders.position.y = 1.48;
    this.body.add(shoulders);

    // Руки
    const mkArm = (side: number) => {
      const g = new THREE.Group();
      g.position.set(0.45 * side, 1.45, 0);
      const upper = new THREE.Mesh(softCapsule(0.09, 0.32, 18), robe);
      upper.position.y = -0.2;
      g.add(upper);
      const elbow = new THREE.Mesh(softSphere(0.08, 16), robe);
      elbow.position.y = -0.4;
      g.add(elbow);
      const forearm = new THREE.Mesh(softCapsule(0.08, 0.28, 16), robe);
      forearm.position.y = -0.58;
      g.add(forearm);
      const hand = new THREE.Mesh(softSphere(0.065, 16), skin);
      hand.position.y = -0.78;
      hand.scale.set(0.85, 0.6, 1.05);
      g.add(hand);
      this.body.add(g);
      return g;
    };
    this.armL = mkArm(-1);
    this.armR = mkArm(1);

    // Голова
    const faceGeo = soft(new THREE.SphereGeometry(0.2, 30, 26), 0.018);
    const fa = faceGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < fa.count; i++) {
      const y = fa.getY(i);
      if (y < -0.02) fa.setY(i, y * 1.2);
    }
    faceGeo.computeVertexNormals();
    const face = new THREE.Mesh(faceGeo, skin);
    face.castShadow = true;
    this.head.add(face);

    // Борода длинная
    const beardGeo = soft(new THREE.ConeGeometry(0.18, 0.55, 20), 0.025);
    const beardMesh = new THREE.Mesh(beardGeo, beard);
    beardMesh.position.set(0, -0.08, 0.14);
    beardMesh.rotation.x = 0.35;
    this.head.add(beardMesh);

    // Брови густые
    for (const s of [-1, 1]) {
      const b = new THREE.Mesh(
        soft(new THREE.CapsuleGeometry(0.015, 0.065, 8, 12), 0.005),
        beard,
      );
      b.position.set(s * 0.07, 0.07, 0.18);
      b.rotation.z = s * -0.2;
      this.head.add(b);
    }

    // Глаза мудрые
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 10), eye);
      e.position.set(s * 0.07, 0.03, 0.18);
      e.scale.set(1.2, 0.7, 0.6);
      this.head.add(e);
      this.eyeMeshes.push(e);
    }

    // Голова повёрнута
    this.head.position.y = 1.75;

    // Посох с кристаллом
    const staffMesh = new THREE.Mesh(trunkGeo(0.045, 0.06, 1.9), staff);
    staffMesh.position.set(0.5, 0.82, 0.08);
    staffMesh.rotation.z = 0.1;
    staffMesh.castShadow = true;
    this.body.add(staffMesh);

    const crystal = new THREE.Mesh(soft(new THREE.OctahedronGeometry(0.095, 2), 0.01), gem);
    crystal.position.set(0.57, 1.75, 0.12);
    this.body.add(crystal);

    // Обёртка посоха
    const wrap = new THREE.Mesh(soft(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 14, 3), 0.01), mat('#c9a86a', 0.7));
    wrap.position.set(0.5, 0.62, 0.08);
    this.body.add(wrap);
  }

  private buildMilica() {
    const skin = mat('#e0ac82', 0.75);
    const dress = mat('#b0483f', 0.78);
    const apron = mat('#efe6d2', 0.82);
    const hair = mat('#7a4a2a', 0.8);
    const ribbon = mat('#f2c14e', 0.6);

    // Платье — капсюла
    const dressMesh = new THREE.Mesh(softCapsule(0.38, 0.55, 28), dress);
    dressMesh.position.y = 0.65;
    dressMesh.castShadow = true;
    this.body.add(dressMesh);

    // Лиф
    const top = new THREE.Mesh(softSphere(0.3, 26), dress);
    top.scale.set(1.0, 0.85, 0.95);
    top.position.y = 1.28;
    this.body.add(top);

    // Фартук
    const apronMesh = new THREE.Mesh(soft(new THREE.CylinderGeometry(0.32, 0.4, 0.6, 22), 0.02), apron);
    apronMesh.position.set(0, 0.98, 0.16);
    this.body.add(apronMesh);

    // Руки
    const mkArm = (side: number) => {
      const g = new THREE.Group();
      g.position.set(0.42 * side, 1.45, 0);
      const shoulder = new THREE.Mesh(softSphere(0.12, 18), dress);
      g.add(shoulder);
      const upper = new THREE.Mesh(softCapsule(0.08, 0.26, 16), dress);
      upper.position.y = -0.18;
      g.add(upper);
      const forearm = new THREE.Mesh(softCapsule(0.07, 0.24, 14), skin);
      forearm.position.y = -0.5;
      g.add(forearm);
      const hand = new THREE.Mesh(softSphere(0.06, 14), skin);
      hand.position.y = -0.68;
      hand.scale.set(0.8, 0.6, 1.0);
      g.add(hand);
      this.body.add(g);
      return g;
    };
    this.armL = mkArm(-1);
    this.armR = mkArm(1);

    // Голова
    const faceGeo = soft(new THREE.SphereGeometry(0.19, 28, 24), 0.015);
    const face = new THREE.Mesh(faceGeo, skin);
    face.castShadow = true;
    this.head.add(face);

    // Волосы — полусфера
    const hairMesh = new THREE.Mesh(
      soft(new THREE.SphereGeometry(0.21, 26, 20, 0, TAU, 0, Math.PI * 0.55), 0.02),
      hair,
    );
    hairMesh.position.y = 0.03;
    this.head.add(hairMesh);

    // Коса
    const braid = new THREE.Mesh(softCapsule(0.045, 0.5, 12), hair);
    braid.position.set(-0.08, -0.38, -0.08);
    braid.rotation.x = 0.35;
    this.head.add(braid);

    // Лента
    const ribbonMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.08), ribbon);
    ribbonMesh.position.set(-0.08, -0.12, -0.05);
    this.head.add(ribbonMesh);

    // Глаза
    for (const s of [-1, 1]) {
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 10), mat('#eef2f6', 0.4));
      eyeWhite.position.set(s * 0.065, 0.03, 0.17);
      eyeWhite.scale.set(1.15, 0.7, 0.55);
      this.head.add(eyeWhite);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 8), mat('#6aaa8a', 0.3));
      iris.position.set(s * 0.065, 0.03, 0.19);
      this.head.add(iris);

      this.eyeMeshes.push(iris);
    }

    // Рот — мягкая улыбка
    const mouth = new THREE.Mesh(soft(new THREE.CapsuleGeometry(0.008, 0.035, 6, 10), 0.004), mat('#c48a6e', 0.6));
    mouth.position.set(0, -0.06, 0.18);
    mouth.rotation.z = Math.PI / 2;
    this.head.add(mouth);

    this.head.position.y = 1.58;
  }

  private buildMelnik() {
    const skin = mat('#d9a077', 0.75);
    const tunic = mat('#d9c08a', 0.82);
    const apron = mat('#8a6b4a', 0.85);
    const hat = mat('#c9a86a', 0.75);

    // Тело — шире
    const bodyMesh = new THREE.Mesh(softCapsule(0.44, 0.45, 26), tunic);
    bodyMesh.position.y = 0.7;
    bodyMesh.castShadow = true;
    this.body.add(bodyMesh);

    // Фартук
    const apronMesh = new THREE.Mesh(soft(new THREE.CylinderGeometry(0.36, 0.42, 0.7, 20), 0.02), apron);
    apronMesh.position.set(0, 0.75, 0.12);
    this.body.add(apronMesh);

    // Плечи
    const shoulders = new THREE.Mesh(softSphere(0.38, 26), tunic);
    shoulders.scale.set(1.2, 0.65, 1.0);
    shoulders.position.y = 1.3;
    this.body.add(shoulders);

    // Руки — крепкие
    const mkArm = (side: number) => {
      const g = new THREE.Group();
      g.position.set(0.48 * side, 1.45, 0);
      const shoulder = new THREE.Mesh(softSphere(0.13, 18), tunic);
      g.add(shoulder);
      const upper = new THREE.Mesh(softCapsule(0.1, 0.3, 16), tunic);
      upper.position.y = -0.2;
      g.add(upper);
      const forearm = new THREE.Mesh(softCapsule(0.09, 0.28, 14), skin);
      forearm.position.y = -0.52;
      g.add(forearm);
      const hand = new THREE.Mesh(softSphere(0.07, 14), skin);
      hand.position.y = -0.72;
      hand.scale.set(0.9, 0.65, 1.1);
      g.add(hand);
      this.body.add(g);
      return g;
    };
    this.armL = mkArm(-1);
    this.armR = mkArm(1);

    // Голова
    const face = new THREE.Mesh(softSphere(0.2, 28), skin);
    face.castShadow = true;
    this.head.add(face);

    // Шапка мельника — деформированная сфера
    const hatMesh = new THREE.Mesh(
      soft(new THREE.SphereGeometry(0.21, 24, 18, 0, TAU, 0, Math.PI * 0.55), 0.03),
      hat,
    );
    hatMesh.position.y = 0.16;
    this.head.add(hatMesh);

    // Мука на щеках
    for (let i = 0; i < 3; i++) {
      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.02, 8),
        new THREE.MeshBasicMaterial({ color: '#f5eeda', transparent: true, opacity: 0.6, depthWrite: false }),
      );
      dot.position.set(-0.08 + i * 0.08, -0.01 + i * 0.012, 0.18);
      this.head.add(dot);
    }

    // Глаза
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 10), mat('#888', 0.4));
      e.position.set(s * 0.065, 0.03, 0.17);
      e.scale.set(1.1, 0.65, 0.5);
      this.head.add(e);
      this.eyeMeshes.push(e);
    }

    this.head.position.y = 1.52;
  }

  private buildVillager(color: string) {
    const skin = mat('#d9a077', 0.75);
    const tunic = mat(color, 0.8);
    const hair = mat('#4a3a2a', 0.8);

    const bodyMesh = new THREE.Mesh(softCapsule(0.36, 0.55, 24), tunic);
    bodyMesh.position.y = 0.72;
    bodyMesh.castShadow = true;
    this.body.add(bodyMesh);

    const shoulders = new THREE.Mesh(softSphere(0.28, 24), tunic);
    shoulders.scale.set(1.05, 0.7, 0.95);
    shoulders.position.y = 1.32;
    this.body.add(shoulders);

    const mkArm = (side: number) => {
      const g = new THREE.Group();
      g.position.set(0.4 * side, 1.42, 0);
      const shoulder = new THREE.Mesh(softSphere(0.1, 16), tunic);
      g.add(shoulder);
      const arm = new THREE.Mesh(softCapsule(0.075, 0.52, 14), tunic);
      arm.position.y = -0.3;
      g.add(arm);
      const hand = new THREE.Mesh(softSphere(0.06, 12), skin);
      hand.position.y = -0.62;
      hand.scale.set(0.8, 0.6, 1.0);
      g.add(hand);
      this.body.add(g);
      return g;
    };
    this.armL = mkArm(-1);
    this.armR = mkArm(1);

    const face = new THREE.Mesh(softSphere(0.18, 24), skin);
    face.castShadow = true;
    this.head.add(face);

    const hairMesh = new THREE.Mesh(
      soft(new THREE.SphereGeometry(0.19, 22, 16, 0, TAU, 0, Math.PI * 0.5), 0.015),
      hair,
    );
    hairMesh.position.y = 0.03;
    this.head.add(hairMesh);

    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), mat('#888', 0.4));
      e.position.set(s * 0.06, 0.025, 0.16);
      e.scale.set(1.1, 0.65, 0.5);
      this.head.add(e);
      this.eyeMeshes.push(e);
    }

    this.head.position.y = 1.56;
  }

  private buildKot() {
    const fur = mat('#d98a3d', 0.82);
    const furDark = mat('#c97a2e', 0.85);
    const eyeGlow = mat('#8fe85f', 0.3, '#8fe85f', 0.6);

    // Тело — горизонтальная капсюла
    const bodyMesh = new THREE.Mesh(softCapsule(0.2, 0.35, 18), fur);
    bodyMesh.rotation.z = Math.PI / 2;
    bodyMesh.position.y = 0.3;
    bodyMesh.castShadow = true;
    this.body.add(bodyMesh);

    // Грудная клетка
    const chest = new THREE.Mesh(softSphere(0.18, 20), fur);
    chest.scale.set(1.15, 0.85, 0.8);
    chest.position.set(0, 0.3, 0.18);
    this.body.add(chest);

    // Голова
    const headMesh = new THREE.Mesh(softSphere(0.15, 22), fur);
    headMesh.position.set(0, 0.06, 0.28);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Уши
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(soft(new THREE.ConeGeometry(0.055, 0.14, 14), 0.01), furDark);
      ear.position.set(0.09 * s, 0.15, 0.3);
      ear.rotation.z = -0.3 * s;
      this.head.add(ear);
      // внутренность уха
      const innerEar = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), mat('#e8a0a0', 0.7));
      innerEar.position.set(0.08 * s, 0.13, 0.31);
      innerEar.scale.set(0.8, 0.6, 0.5);
      this.head.add(innerEar);
    }

    // Глаза — зелёные, светящиеся
    for (const s of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 10), eyeGlow);
      eye.position.set(0.055 * s, 0.06, 0.4);
      eye.scale.set(1.1, 0.8, 0.6);
      this.head.add(eye);
      this.eyeMeshes.push(eye);

      // Зрачок
      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 8, 6),
        mat('#0a0e05', 0.2),
      );
      pupil.position.set(0.058 * s, 0.06, 0.42);
      pupil.scale.set(0.6, 1.3, 0.5);
      this.head.add(pupil);
    }

    // Нос
    const nose = new THREE.Mesh(softSphere(0.022, 10), mat('#c97a2e', 0.6));
    nose.scale.set(1.1, 0.75, 1);
    nose.position.set(0, 0.02, 0.42);
    this.head.add(nose);

    // Усы (тонкие линии через капсюлы)
    for (const s of [-1, 1]) {
      for (let w = 0; w < 3; w++) {
        const whisker = new THREE.Mesh(
          soft(new THREE.CapsuleGeometry(0.005, 0.12, 4, 6), 0.003),
          mat('#d9d2c4', 0.6),
        );
        whisker.position.set(0.03 * s, -0.01 + w * 0.015, 0.4 + w * 0.01);
        whisker.rotation.z = s * (0.2 + w * 0.15);
        this.head.add(whisker);
      }
    }

    // Хвост
    this.tail = new THREE.Group();
    const tailMesh = new THREE.Mesh(softCapsule(0.035, 0.45, 12), furDark);
    tailMesh.position.y = 0.22;
    tailMesh.castShadow = true;
    this.tail.add(tailMesh);
    // кончик хвоста
    const tailTip = new THREE.Mesh(softSphere(0.05, 12), fur);
    tailTip.position.y = 0.45;
    this.tail.add(tailTip);
    this.tail.position.set(0, 0.32, -0.3);
    this.tail.rotation.x = -1.1;
    this.body.add(this.tail);

    this.head.position.y = 0.36;
  }

  private buildKoza() {
    const fur = mat('#d9d2c4', 0.85);
    const furDark = mat('#b8b0a0', 0.9);
    const horn = mat('#8a8f9e', 0.65);

    // Тело
    const bodyMesh = new THREE.Mesh(softCapsule(0.22, 0.5, 16), fur);
    bodyMesh.rotation.z = Math.PI / 2;
    bodyMesh.position.y = 0.52;
    bodyMesh.castShadow = true;
    this.body.add(bodyMesh);

    // Ноги
    for (const s of [-1, 1]) {
      for (const f of [-1, 1]) {
        const leg = new THREE.Mesh(softCapsule(0.04, 0.28, 10), furDark);
        leg.position.set(0.14 * s, 0.21, 0.25 * f);
        this.body.add(leg);
        // копыто
        const hoof = new THREE.Mesh(
          soft(new THREE.BoxGeometry(0.08, 0.04, 0.1, 4, 2, 4), 0.005),
          mat('#3e3e3e', 0.7),
        );
        hoof.position.set(0.14 * s, 0.04, 0.25 * f);
        this.body.add(hoof);
      }
    }

    // Голова
    const headMesh = new THREE.Mesh(softSphere(0.13, 22), fur);
    headMesh.scale.set(0.9, 1.15, 1.4);
    headMesh.position.set(0, 0.06, 0.02);
    this.head.add(headMesh);

    // Рога
    for (const s of [-1, 1]) {
      const hornMesh = new THREE.Mesh(soft(new THREE.ConeGeometry(0.03, 0.22, 14), 0.01), horn);
      hornMesh.position.set(0.07 * s, 0.18, 0.02);
      hornMesh.rotation.z = -0.55 * s;
      this.head.add(hornMesh);
    }

    // Уши
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(soft(new THREE.ConeGeometry(0.04, 0.12, 14), 0.01), fur);
      ear.position.set(0.09 * s, 0.1, -0.02);
      ear.rotation.z = -1.2 * s;
      this.head.add(ear);
    }

    // Глаза — козлиные (прямоугольные зрачки)
    for (const s of [-1, 1]) {
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), mat('#eef2f6', 0.4));
      eyeWhite.position.set(s * 0.06, 0.06, 0.1);
      eyeWhite.scale.set(1.2, 0.8, 0.6);
      this.head.add(eyeWhite);

      const pupil = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.008, 0.01),
        mat('#1a1a1a', 0.3),
      );
      pupil.position.set(s * 0.062, 0.06, 0.12);
      this.head.add(pupil);
      this.eyeMeshes.push(pupil);
    }

    this.head.position.y = 0.78;
  }

  setFollow(v: THREE.Vector3 | null) { this.follow = v; this.wait = 0; }

  update(dt: number, playerPos: THREE.Vector3, t: number) {
    if (this.follow) {
      const d = this.group.position.distanceTo(this.follow);
      if (d > 2.4) {
        const dir = new THREE.Vector3().subVectors(this.follow, this.group.position).normalize();
        this.group.position.x += dir.x * this.speed * 1.35 * dt;
        this.group.position.z += dir.z * this.speed * 1.35 * dt;
        this.walkT += dt * 10;
        const targetYaw = Math.atan2(dir.x, dir.z);
        let dy = targetYaw - this.yaw;
        while (dy > Math.PI) dy -= TAU;
        while (dy < -Math.PI) dy += TAU;
        this.yaw += dy * Math.min(1, 8 * dt);
      } else {
        this.walkT = 0;
      }
    } else {
      if (this.wait > 0) {
        this.wait -= dt;
      } else {
        const d = Math.hypot(this.target.x - this.group.position.x, this.target.z - this.group.position.z);
        if (d < 0.4) {
          this.wait = rand(1.5, 6);
          const a = rand(0, TAU);
          const r = rand(0, this.radius);
          this.target.set(this.home[0] + Math.cos(a) * r, 0, this.home[2] + Math.sin(a) * r);
        } else {
          const dir = new THREE.Vector3(this.target.x - this.group.position.x, 0, this.target.z - this.group.position.z).normalize();
          this.group.position.x += dir.x * this.speed * dt;
          this.group.position.z += dir.z * this.speed * dt;
          this.walkT += dt * 8;
          const targetYaw = Math.atan2(dir.x, dir.z);
          let dy = targetYaw - this.yaw;
          while (dy > Math.PI) dy -= TAU;
          while (dy < -Math.PI) dy += TAU;
          this.yaw += dy * Math.min(1, 7 * dt);
        }
      }
    }

    this.group.position.y = this.heightAt(this.group.position.x, this.group.position.z);

    const pd = this.group.position.distanceTo(playerPos);
    if (pd < 5 && this.wait > 0 && !this.follow) {
      const targetYaw = Math.atan2(playerPos.x - this.group.position.x, playerPos.z - this.group.position.z);
      let dy = targetYaw - this.yaw;
      while (dy > Math.PI) dy -= TAU;
      while (dy < -Math.PI) dy += TAU;
      this.yaw += dy * Math.min(1, 3 * dt);
    }

    const moving = this.walkT !== 0 && this.wait <= 0 || !!this.follow;
    const bob = moving ? Math.abs(Math.sin(this.walkT)) * 0.05 : Math.sin(t * 1.7) * 0.008;
    this.body.position.y = bob;
    this.body.rotation.y = this.yaw;

    // Руки анимируются
    if (this.armL && this.armR) {
      const sw = moving ? Math.sin(this.walkT * 2) * 0.3 : 0;
      this.armL.rotation.x = sw;
      this.armR.rotation.x = -sw;
      const elbowL = moving ? -Math.abs(Math.sin(this.walkT * 2)) * 0.4 : 0;
      const elbowR = moving ? -Math.abs(Math.cos(this.walkT * 2)) * 0.4 : 0;
      if (this.armL.children.length > 2) {
        this.armL.children[2].rotation.x = elbowL;
        this.armR.children[2].rotation.x = elbowR;
      }
    }

    if (this.kind === 'kot' && this.tail) {
      this.tail.rotation.z = Math.sin(t * 5) * 0.55;
      this.tail.rotation.x = -1.1 + Math.sin(t * 3) * 0.15;
    }
    if (this.kind === 'koza') {
      this.head.rotation.x = Math.sin(t * 2.2) * 0.12;
    }

    // Глаза смотрят на игрока — но не «дрейфуют», а плавно возвращаются к базе
    if (this.eyeMeshes.length > 0) {
      const targetOffX = pd < 8 ? clamp((playerPos.x - this.group.position.x) * 0.005, -0.008, 0.008) : 0;
      for (const eye of this.eyeMeshes) {
        const base = eye.userData.baseX as number | undefined;
        if (base === undefined) {
          // запоминаем оригинал только один раз
          eye.userData.baseX = eye.position.x;
        } else {
          const target = base + targetOffX;
          eye.position.x += (target - eye.position.x) * Math.min(1, dt * 6);
        }
      }
    }
  }
}

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
