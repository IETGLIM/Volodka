/**
 * Physical mob loot: drop arc, bounce, idle bob, magnetic pickup.
 * Resources remain lightweight procedural meshes with no external assets.
 */
import * as THREE from 'three';
import { rand, TAU } from './utils';
import { crownGeo, deformGeometry } from './organic';
import type { EnemyKind } from './combat';

export type LootKind = 'essence' | 'berry' | 'shard' | 'bark';

export interface LootPickup {
  kind: LootKind;
  amount: number;
  label: string;
  icon: string;
  rare: boolean;
  position: THREE.Vector3;
}

interface LootItem {
  id: number;
  kind: LootKind;
  amount: number;
  group: THREE.Group;
  velocity: THREE.Vector3;
  age: number;
  settled: boolean;
  baseY: number;
  phase: number;
}

const META: Record<LootKind, { label: string; icon: string; color: number; rare: boolean }> = {
  essence: { label: 'Эхо строки', icon: '✦', color: 0x8fd8ff, rare: false },
  berry: { label: 'Рябиновая ягода', icon: '●', color: 0xd94a45, rare: false },
  shard: { label: 'Лунный осколок', icon: '◆', color: 0xb7a8ff, rare: true },
  bark: { label: 'Живая кора', icon: '❧', color: 0x85b86a, rare: false },
};

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,.92)');
  g.addColorStop(0.3, 'rgba(255,255,255,.3)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export class LootSystem {
  private scene: THREE.Scene;
  private heightAt: (x: number, z: number) => number;
  private items: LootItem[] = [];
  private nextId = 1;
  private glowTexture = makeGlowTexture();

  constructor(scene: THREE.Scene, heightAt: (x: number, z: number) => number) {
    this.scene = scene;
    this.heightAt = heightAt;
  }

  private createVisual(kind: LootKind): THREE.Group {
    const meta = META[kind];
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color: meta.color,
      emissive: meta.color,
      emissiveIntensity: meta.rare ? 1.8 : 0.9,
      roughness: kind === 'bark' ? 0.9 : 0.35,
      metalness: kind === 'shard' ? 0.25 : 0,
    });

    if (kind === 'essence') {
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 1), material);
      mesh.scale.set(0.75, 1.35, 0.75);
      group.add(mesh);
    } else if (kind === 'berry') {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU;
        const berry = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), material);
        berry.position.set(Math.cos(a) * 0.1, Math.sin(i * 1.8) * 0.04, Math.sin(a) * 0.1);
        group.add(berry);
      }
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 6),
        new THREE.MeshStandardMaterial({ color: '#567548', roughness: 1 }),
      );
      leaf.scale.set(1.4, 0.25, 0.8);
      leaf.position.y = 0.14;
      group.add(leaf);
    } else if (kind === 'shard') {
      const geo = new THREE.ConeGeometry(0.15, 0.5, 5);
      deformGeometry(geo, 0.025, 2, rand(0, 100));
      const shard = new THREE.Mesh(geo, material);
      shard.rotation.z = 0.35;
      group.add(shard);
    } else {
      const bark = new THREE.Mesh(crownGeo(0.2, 9), material);
      bark.scale.set(0.55, 1.3, 0.35);
      bark.rotation.z = 0.45;
      group.add(bark);
    }

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.glowTexture,
      color: meta.color,
      transparent: true,
      opacity: meta.rare ? 0.8 : 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    glow.scale.setScalar(meta.rare ? 1.35 : 0.85);
    group.add(glow);
    group.traverse((o) => { if (o instanceof THREE.Mesh) o.castShadow = true; });
    return group;
  }

  drop(kind: LootKind, position: THREE.Vector3, amount = 1) {
    const group = this.createVisual(kind);
    group.position.copy(position).add(new THREE.Vector3(rand(-0.25, 0.25), 0.75, rand(-0.25, 0.25)));
    const item: LootItem = {
      id: this.nextId++,
      kind,
      amount,
      group,
      velocity: new THREE.Vector3(rand(-1.5, 1.5), rand(3.6, 5.2), rand(-1.5, 1.5)),
      age: 0,
      settled: false,
      baseY: this.heightAt(group.position.x, group.position.z) + 0.28,
      phase: rand(0, TAU),
    };
    this.items.push(item);
    this.scene.add(group);
  }

  dropEnemy(kind: EnemyKind, position: THREE.Vector3) {
    // A readable, generous table: every kill gives progression material.
    this.drop('essence', position, kind === 'ten' && Math.random() < 0.35 ? 2 : 1);
    if (kind === 'ten') {
      if (Math.random() < 0.24) this.drop('shard', position, 1);
      if (Math.random() < 0.18) this.drop('berry', position, 1);
    } else {
      if (Math.random() < 0.48) this.drop('berry', position, 1);
      if (Math.random() < 0.38) this.drop('bark', position, 1);
    }
  }

  update(dt: number, t: number, playerPos: THREE.Vector3): LootPickup[] {
    const picked: LootPickup[] = [];
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.age += dt;
      const p = item.group.position;

      if (!item.settled) {
        item.velocity.y -= 12 * dt;
        p.addScaledVector(item.velocity, dt);
        item.baseY = this.heightAt(p.x, p.z) + 0.28;
        if (p.y <= item.baseY) {
          p.y = item.baseY;
          if (Math.abs(item.velocity.y) > 1.2) {
            item.velocity.y = Math.abs(item.velocity.y) * 0.3;
            item.velocity.x *= 0.55;
            item.velocity.z *= 0.55;
          } else {
            item.settled = true;
            item.velocity.set(0, 0, 0);
          }
        }
      } else {
        p.y = item.baseY + Math.sin(t * 2.5 + item.phase) * 0.09;
      }

      item.group.rotation.y += dt * (META[item.kind].rare ? 2.8 : 1.5);
      item.group.rotation.x = Math.sin(t * 1.7 + item.phase) * 0.14;

      const distance = p.distanceTo(playerPos);
      if (item.age > 0.32 && distance < 4.5) {
        const strength = 5 + (4.5 - distance) * 2.2;
        const target = playerPos.clone().add(new THREE.Vector3(0, 1, 0));
        p.lerp(target, Math.min(1, dt * strength));
      }

      if (item.age > 0.32 && p.distanceTo(playerPos.clone().add(new THREE.Vector3(0, 0.8, 0))) < 0.78) {
        const meta = META[item.kind];
        picked.push({
          kind: item.kind,
          amount: item.amount,
          label: meta.label,
          icon: meta.icon,
          rare: meta.rare,
          position: p.clone(),
        });
        this.scene.remove(item.group);
        this.items.splice(i, 1);
      }
    }
    return picked;
  }

  clear() {
    for (const item of this.items) this.scene.remove(item.group);
    this.items = [];
  }
}