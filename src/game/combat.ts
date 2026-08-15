/**
 * Мобы и боёвка — тени баллады и кустовые стражники.
 * Органичные деформированные формы, живая анимация,
 * патруль → погоня → удар → отшатывание → смерть с рассыпанием в искры.
 */
import { CapsuleGeometry, Color, ConeGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SphereGeometry, Vector3 } from 'three';
import { rand, TAU, clamp } from './utils';
import { deformGeometry, crownGeo, trunkGeo } from './organic';

// Скретч-векторы, чтобы не аллоцировать каждый кадр на каждого моба (х60 fps × 15 мобов = 900 аллокаций/сек).
const _dir = new Vector3();
const _worldPos = new Vector3();

export type EnemyKind = 'ten' | 'kust';

export class Enemy {
  group = new Group();
  kind: EnemyKind;
  home: Vector3;
  radius: number;
  pos: Vector3;
  private target = new Vector3();
  private wait = 0;
  private walkT = 0;
  private yaw = 0;
  private body: Group;
  private head: Group;
  private armL: Group;
  private armR: Group;
  private eyes: Mesh[] = [];
  private state: 'idle' | 'patrol' | 'chase' | 'attack' | 'hurt' | 'dead' = 'patrol';
  private stateT = 0;
  hp = 36;
  maxHp = 36;
  private heightAt: (x: number, z: number) => number;
  private detectionR: number;
  private attackR: number;
  private speedWalk: number;
  private speedChase: number;
  private attackCooldown = 0;
  private hurtT = 0;
  private deadT = 0;
  private knock = new Vector3();
  private scaleBase = 1;

  private healthBar: Group;
  private healthFill: Mesh;

  // наносит ли сейчас урон игроку
  canDamagePlayer = false;

  constructor(kind: EnemyKind, home: Vector3, radius: number, heightAt: (x: number, z: number) => number, scale = 1) {
    this.kind = kind;
    this.home = home.clone();
    this.radius = radius;
    this.pos = home.clone();
    this.heightAt = heightAt;
    this.scaleBase = scale;
    this.body = new Group();
    this.head = new Group();
    this.armL = new Group();
    this.armR = new Group();
    this.group.add(this.body);
    this.body.add(this.head);
    this.body.add(this.armL);
    this.body.add(this.armR);
    this.target.copy(home);
    this.wait = rand(0, 2);

    if (kind === 'ten') {
      this.maxHp = 36; this.hp = 36;
      this.detectionR = 14; this.attackR = 1.9;
      this.speedWalk = 1.1; this.speedChase = 3.15;
      this.buildTen();
    } else {
      this.maxHp = 26; this.hp = 26;
      this.detectionR = 12; this.attackR = 1.7;
      this.speedWalk = 1.35; this.speedChase = 3.6;
      this.buildKust();
    }

    // полоска здоровья над головой
    this.healthBar = new Group();
    const bg = new Mesh(new PlaneGeometry(0.9, 0.12), new MeshBasicMaterial({ color: '#10121a', transparent: true, opacity: 0.75, depthWrite: false }));
    this.healthFill = new Mesh(new PlaneGeometry(0.86, 0.08), new MeshBasicMaterial({ color: '#f2c14e', transparent: true, opacity: 0.95, depthWrite: false }));
    this.healthFill.position.z = 0.01;
    this.healthBar.add(bg, this.healthFill);
    this.healthBar.position.y = kind === 'ten' ? 2.45 : 1.6;
    this.healthBar.visible = false;
    this.group.add(this.healthBar);

    this.group.position.copy(this.pos);
    this.group.position.y = heightAt(this.pos.x, this.pos.z);
    this.group.scale.setScalar(scale);
  }

  private mat(col: string, em?: string, ei = 0) {
    const m = new MeshStandardMaterial({ color: col, roughness: 0.9, flatShading: false });
    if (em) { m.emissive = new Color(em); m.emissiveIntensity = ei; }
    return m;
  }

  private buildTen() {
    // тень — вытянутый тёмный капсюль с рваными краями через деформацию
    const bodyGeo = new CapsuleGeometry(0.34, 0.95, 8, 14);
    deformGeometry(bodyGeo, 0.09, 1.8, rand(0, 100));
    const body = new Mesh(bodyGeo, this.mat('#1a1e30', '#252a45', 0.15));
    body.position.y = 0.95;
    body.castShadow = true;
    this.body.add(body);

    // плечи — деформированная сфера
    const shGeo = new SphereGeometry(0.34, 12, 10);
    deformGeometry(shGeo, 0.05, 2, rand(0, 100));
    const sh = new Mesh(shGeo, this.mat('#1e2338', '#2a2f4a', 0.12));
    sh.scale.set(1.25, 0.7, 1.0);
    sh.position.y = 1.55;
    this.body.add(sh);

    // руки — длинные тонкие капсюли
    const mkArm = (side: number) => {
      const g = new Group();
      g.position.set(0.46 * side, 1.45, 0);
      const armGeo = new CapsuleGeometry(0.08, 0.6, 6, 10);
      deformGeometry(armGeo, 0.02, 2, side * 17 + 3);
      const arm = new Mesh(armGeo, this.mat('#1a1e2e', '#252a45', 0.1));
      arm.position.y = -0.35;
      arm.castShadow = true;
      g.add(arm);
      // кисть — когтистая сфера
      const handGeo = new SphereGeometry(0.11, 8, 8);
      deformGeometry(handGeo, 0.03, 2, side * 19);
      const hand = new Mesh(handGeo, this.mat('#23273d'));
      hand.position.y = -0.78;
      hand.scale.set(1, 0.7, 1.2);
      g.add(hand);
      return g;
    };
    this.armL = mkArm(-1);
    this.armR = mkArm(1);
    this.body.add(this.armL, this.armR);

    // голова — вытянутая сфера без лица
    const headGeo = new SphereGeometry(0.21, 14, 12);
    deformGeometry(headGeo, 0.045, 1.8, rand(0, 100));
    const head = new Mesh(headGeo, this.mat('#1c2032', '#252a45', 0.18));
    head.position.y = 1.88;
    head.castShadow = true;
    this.head.add(head);

    // глаза — два эмиссивных шарика
    for (const s of [-1, 1]) {
      const eye = new Mesh(
        new SphereGeometry(0.032, 8, 8),
        new MeshStandardMaterial({ color: '#8fb8ff', emissive: '#6ea0ff', emissiveIntensity: 1.2 }),
      );
      eye.position.set(0.07 * s, 1.9, 0.17);
      this.head.add(eye);
      this.eyes.push(eye);
    }

    // обрывки плаща на спине
    const ragGeo = new PlaneGeometry(0.6, 0.9, 3, 4);
    deformGeometry(ragGeo, 0.08, 1.5, rand(0, 100));
    const rag = new Mesh(ragGeo, new MeshStandardMaterial({ color: '#1a1e2e', side: DoubleSide, roughness: 1, transparent: true, opacity: 0.7 }));
    rag.position.set(0, 1.1, -0.32);
    rag.rotation.x = 0.2;
    this.body.add(rag);
  }

  private buildKust() {
    // куст — тело из нескольких деформированных сфер-комков
    const bodyCols = ['#3d5a3a', '#4a6a44', '#355030'];
    const comps: [number, number, number, number][] = [
      [0, 0.55, 0, 0.42],
      [0.22, 0.45, 0.12, 0.28],
      [-0.2, 0.5, -0.1, 0.26],
      [0, 0.75, 0.08, 0.33],
      [0.12, 0.35, -0.18, 0.22],
    ];
    comps.forEach(([x, y, z, r], i) => {
      const m = new Mesh(crownGeo(r, 10), this.mat(bodyCols[i % 3]));
      m.position.set(x, y, z);
      m.castShadow = true;
      this.body.add(m);
    });

    // шипы — конусы торчащие
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + rand(-0.2, 0.2);
      const thornGeo = new ConeGeometry(0.045, 0.22, 5);
      deformGeometry(thornGeo, 0.01, 2, i * 13 + 7);
      const thorn = new Mesh(thornGeo, this.mat('#2b3b28'));
      thorn.position.set(Math.cos(a) * 0.42, 0.6 + rand(-0.1, 0.2), Math.sin(a) * 0.42);
      thorn.lookAt(thorn.position.clone().multiplyScalar(2));
      this.body.add(thorn);
    }

    // голова — меньший комок с глазами-листочками
    const head = new Mesh(crownGeo(0.2, 10), this.mat('#4d6c48'));
    head.position.set(0, 1.05, 0.12);
    head.castShadow = true;
    this.head.add(head);

    for (const s of [-1, 1]) {
      const eye = new Mesh(
        new SphereGeometry(0.035, 8, 8),
        new MeshStandardMaterial({ color: '#a8ff8a', emissive: '#7aff5a', emissiveIntensity: 0.9 }),
      );
      eye.position.set(0.08 * s, 1.08, 0.27);
      this.head.add(eye);
      this.eyes.push(eye);
    }

    // руки-ветки
    const mkBranch = (side: number) => {
      const g = new Group();
      g.position.set(0.32 * side, 0.65, 0);
      const bGeo = trunkGeo(0.05, 0.08, 0.55);
      const b = new Mesh(bGeo, this.mat('#5a4630'));
      b.position.y = -0.1;
      b.rotation.z = 0.6 * side;
      b.castShadow = true;
      g.add(b);
      return g;
    };
    this.armL = mkBranch(-1);
    this.armR = mkBranch(1);
    this.body.add(this.armL, this.armR);
  }

  takeDamage(amount: number, dir: Vector3) {
    if (this.state === 'dead') return false;
    this.hp -= amount;
    this.knock.copy(dir).setY(0).normalize().multiplyScalar(2.8);
    this.knock.y = 0.4;
    this.hurtT = 0.45;
    this.state = 'hurt';
    this.stateT = 0;
    this.healthBar.visible = true;
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'dead';
      this.stateT = 0;
      this.canDamagePlayer = false;
      return true;
    }
    return false;
  }

  isDead(): boolean { return this.state === 'dead' && this.deadT > 0.9; }
  isAlive(): boolean { return this.state !== 'dead'; }
  getPos(): Vector3 { return this.pos; }

  reset() {
    this.hp = this.maxHp;
    this.state = 'patrol';
    this.stateT = 0;
    this.hurtT = 0;
    this.deadT = 0;
    this.wait = rand(0, 2);
    this.pos.copy(this.home);
    this.target.copy(this.home);
    this.group.position.copy(this.pos);
    this.group.position.y = this.heightAt(this.pos.x, this.pos.z);
    this.group.visible = true;
    this.group.scale.setScalar(this.scaleBase);
    this.healthBar.visible = false;
    this.canDamagePlayer = false;
    this.knock.set(0, 0, 0);
  }

  update(dt: number, playerPos: Vector3, playerRolling: boolean, heightAt: (x: number, z: number) => number, t: number) {
    if (this.state === 'dead') {
      this.deadT += dt;
      this.group.position.y = heightAt(this.pos.x, this.pos.z) - this.deadT * 0.3;
      this.group.scale.setScalar(this.scaleBase * (1 - this.deadT * 0.6));
      this.group.rotation.z = this.deadT * 0.8;
      this.healthBar.visible = false;
      if (this.deadT > 1.0) this.group.visible = false;
      return 0;
    }

    // отталкивание при ударе
    if (this.knock.lengthSq() > 0.001) {
      this.pos.x += this.knock.x * dt * 5.2;
      this.pos.z += this.knock.z * dt * 5.2;
      this.knock.multiplyScalar(1 - dt * 7.5);
      if (this.knock.length() < 0.05) this.knock.set(0, 0, 0);
    }

    const distToPlayer = this.pos.distanceTo(playerPos);
    const canSee = distToPlayer < this.detectionR && distToPlayer > 0.5;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);

    if (this.state === 'hurt') {
      this.stateT += dt;
      if (this.stateT > 0.35) {
        this.state = canSee ? 'chase' : 'patrol';
        this.stateT = 0;
      }
    } else if (canSee && distToPlayer < this.attackR + 0.3 && this.attackCooldown <= 0 && this.state !== 'attack') {
      // начать атаку
      this.state = 'attack';
      this.stateT = 0;
      this.canDamagePlayer = false;
    } else if (this.state === 'attack') {
      this.stateT += dt;
      // активная фаза 0.22-0.48
      if (this.stateT > 0.22 && this.stateT < 0.5) {
        this.canDamagePlayer = !playerRolling && distToPlayer < this.attackR + 0.4;
      } else {
        this.canDamagePlayer = false;
      }
      if (this.stateT > 0.78) {
        this.state = canSee ? 'chase' : 'patrol';
        this.stateT = 0;
        this.attackCooldown = this.kind === 'ten' ? 1.4 : 0.9;
        this.canDamagePlayer = false;
      }
    } else if (canSee) {
      this.state = 'chase';
      _dir.set(playerPos.x - this.pos.x, 0, playerPos.z - this.pos.z).normalize();
      this.pos.x += _dir.x * this.speedChase * dt;
      this.pos.z += _dir.z * this.speedChase * dt;
      this.yaw = Math.atan2(_dir.x, _dir.z);
      this.walkT += dt * 10;
    } else {
      // патруль
      if (this.wait > 0) {
        this.wait -= dt;
        this.walkT = 0;
      } else {
        const d = Math.hypot(this.target.x - this.pos.x, this.target.z - this.pos.z);
        if (d < 0.5) {
          this.wait = rand(0.8, 3.5);
          const a = rand(0, TAU);
          const r = rand(0, this.radius);
          this.target.set(this.home.x + Math.cos(a) * r, 0, this.home.z + Math.sin(a) * r);
        } else {
          _dir.set(this.target.x - this.pos.x, 0, this.target.z - this.pos.z).normalize();
          this.pos.x += _dir.x * this.speedWalk * dt;
          this.pos.z += _dir.z * this.speedWalk * dt;
          this.yaw = Math.atan2(_dir.x, _dir.z);
          this.walkT += dt * 7;
        }
      }
      this.state = this.wait > 0 ? 'idle' : 'patrol';
    }

    this.pos.y = heightAt(this.pos.x, this.pos.z);
    this.group.position.copy(this.pos);

    // анимация тела
    const moving = this.state === 'patrol' || this.state === 'chase';
    const bob = moving ? Math.abs(Math.sin(this.walkT)) * 0.07 : Math.sin(t * 1.2) * 0.01;
    this.body.position.y = bob;
    this.body.rotation.y = this.yaw;
    const lean = this.state === 'chase' ? 0.18 : 0;
    this.body.rotation.x = lean + (this.state === 'attack' ? Math.sin(this.stateT * 12) * 0.18 : 0);

    // руки
    if (this.state === 'attack') {
      const s = Math.sin(this.stateT * 18);
      this.armL.rotation.x = -0.8 + s * 0.9;
      this.armR.rotation.x = -0.8 - s * 0.9;
    } else if (moving) {
      const sw = Math.sin(this.walkT * 2) * 0.5;
      this.armL.rotation.x = sw;
      this.armR.rotation.x = -sw;
    } else {
      this.armL.rotation.x *= 0.92;
      this.armR.rotation.x *= 0.92;
    }
    if (this.state === 'hurt') {
      this.body.rotation.z = Math.sin(this.stateT * 22) * 0.25;
      // вспышка глаз
      this.eyes.forEach((e) => {
        (e.material as MeshStandardMaterial).emissiveIntensity = 2.5;
      });
    } else {
      this.body.rotation.z *= 0.9;
      const ei = this.kind === 'ten' ? 1.2 : 0.9;
      this.eyes.forEach((e) => {
        (e.material as MeshStandardMaterial).emissiveIntensity = ei + Math.sin(t * 3 + e.position.x * 10) * 0.2;
      });
    }

    // healthbar billboard — без аллокаций
    if (this.healthBar.visible) {
      this.healthBar.getWorldPosition(_worldPos);
      this.healthBar.lookAt(playerPos.x, _worldPos.y + 2, playerPos.z);
      const pct = clamp(this.hp / this.maxHp, 0, 1);
      (this.healthFill.material as MeshBasicMaterial).color.set(pct > 0.5 ? '#f2c14e' : pct > 0.25 ? '#e88a4a' : '#e84a4a');
      this.healthFill.scale.x = pct;
      this.healthFill.position.x = -(1 - pct) * 0.43;
    }

    // возвращаем урон игрока, если враг в радиусе атаки
    if (this.canDamagePlayer) return this.kind === 'ten' ? 18 : 12;
    return 0;
  }
}
