'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneId } from '@/data/types';
import { getExplorationWeather } from '@/lib/explorationAtmosphere';

interface ExplorationParticlesProps {
  sceneId: SceneId;
  timeOfDay: number;
  visualLite: boolean;
}

const BOX = 14;

function initPositions(count: number, ySpread: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = (Math.random() - 0.5) * BOX * 2;
    arr[i * 3 + 1] = Math.random() * ySpread;
    arr[i * 3 + 2] = (Math.random() - 0.5) * BOX * 2;
  }
  return arr;
}

function fillUnitRandom01(arr: Float32Array) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = Math.random();
  }
}

function stepSnow(
  arr: Float32Array,
  dt: number,
  t: number,
  speed: number,
  fallJitter: Float32Array,
  driftPhase: Float32Array,
) {
  const n = arr.length / 3;
  for (let i = 0; i < n; i++) {
    arr[i * 3 + 1] -= speed * dt;
    arr[i * 3] += Math.sin(driftPhase[i] + (i + t * 0.6) * 0.7) * 0.15 * dt;
    if (arr[i * 3 + 1] < 0) {
      arr[i * 3 + 1] = BOX + fallJitter[i] * 2;
      arr[i * 3] = Math.sin(t * 1.4 + i * 7.13 + driftPhase[i]) * BOX;
      arr[i * 3 + 2] = Math.cos(t * 1.1 + i * 5.91 + driftPhase[i]) * BOX;
    }
  }
}

function stepRain(arr: Float32Array, dt: number, t: number, speed: number, respawnPhase: Float32Array) {
  const n = arr.length / 3;
  for (let i = 0; i < n; i++) {
    arr[i * 3 + 1] -= speed * dt;
    arr[i * 3] -= 0.35 * dt;
    if (arr[i * 3 + 1] < 0) {
      arr[i * 3 + 1] = BOX * 1.2;
      arr[i * 3] = Math.sin(t * 1.5 + i * 8.2 + respawnPhase[i]) * BOX;
      arr[i * 3 + 2] = Math.cos(t * 1.2 + i * 6.4 + respawnPhase[i]) * BOX;
    }
  }
}

function stepSpark(
  arr: Float32Array,
  dt: number,
  t: number,
  riseJitter: Float32Array,
  driftPhase: Float32Array,
  resetY: Float32Array,
) {
  const n = arr.length / 3;
  for (let i = 0; i < n; i++) {
    arr[i * 3 + 1] += (0.4 + riseJitter[i] * 0.2) * dt;
    arr[i * 3] += Math.sin(driftPhase[i] + t * 5) * 0.075 * dt;
    if (arr[i * 3 + 1] > 5) {
      arr[i * 3 + 1] = resetY[i] * 0.4;
      arr[i * 3] = Math.sin(t * 2.1 + i * 11.7 + driftPhase[i]) * 4;
      arr[i * 3 + 2] = Math.cos(t * 1.9 + i * 10.3 + driftPhase[i]) * 4;
    }
  }
}

export function ExplorationParticles({ sceneId, timeOfDay, visualLite }: ExplorationParticlesProps) {
  const weather = getExplorationWeather(sceneId, timeOfDay);
  const snowRef = useRef<THREE.Points>(null);
  const rainRef = useRef<THREE.Points>(null);
  const sparkRef = useRef<THREE.Points>(null);

  const nSnow = visualLite ? 280 : 720;
  const nRain = visualLite ? 600 : 1800;
  const nSpark = visualLite ? 40 : 96;

  const snow = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(initPositions(nSnow, BOX), 3));
    const mat = new THREE.PointsMaterial({
      color: 0xe8f4ff,
      size: 0.055,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const fallJitter = new Float32Array(nSnow);
    const driftPhase = new Float32Array(nSnow);
    fillUnitRandom01(fallJitter);
    fillUnitRandom01(driftPhase);
    for (let i = 0; i < nSnow; i++) {
      driftPhase[i] *= Math.PI * 2;
    }
    return { geom, mat, fallJitter, driftPhase };
  }, [nSnow]);

  const rain = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(initPositions(nRain, BOX * 1.2), 3));
    const mat = new THREE.PointsMaterial({
      color: 0x6ab0ff,
      size: 0.028,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const respawnPhase = new Float32Array(nRain);
    fillUnitRandom01(respawnPhase);
    for (let i = 0; i < nRain; i++) {
      respawnPhase[i] *= Math.PI * 2;
    }
    return { geom, mat, respawnPhase };
  }, [nRain]);

  const sparks = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const pos = initPositions(nSpark, 6);
    for (let i = 0; i < nSpark; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = Math.random() * 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffaa44,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const riseJitter = new Float32Array(nSpark);
    const driftPhase = new Float32Array(nSpark);
    const resetY = new Float32Array(nSpark);
    fillUnitRandom01(riseJitter);
    fillUnitRandom01(driftPhase);
    fillUnitRandom01(resetY);
    for (let i = 0; i < nSpark; i++) {
      driftPhase[i] *= Math.PI * 2;
    }
    return { geom, mat, riseJitter, driftPhase, resetY };
  }, [nSpark]);

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();

    if (snowRef.current && weather === 'snow') {
      const arr = snowRef.current.geometry.attributes.position.array as Float32Array;
      stepSnow(arr, dt, t, 1.1, snow.fallJitter, snow.driftPhase);
      snowRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (rainRef.current && (weather === 'rain' || weather === 'drizzle' || weather === 'fog')) {
      const arr = rainRef.current.geometry.attributes.position.array as Float32Array;
      stepRain(arr, dt, t, weather === 'drizzle' ? 7 : 11, rain.respawnPhase);
      rainRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (sparkRef.current && (sceneId === 'abandoned_factory' || sceneId === 'battle')) {
      const arr = sparkRef.current.geometry.attributes.position.array as Float32Array;
      stepSpark(arr, dt, t, sparks.riseJitter, sparks.driftPhase, sparks.resetY);
      sparkRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const showSnow = weather === 'snow';
  const showRain = weather === 'rain' || weather === 'drizzle' || weather === 'fog';
  const showSparks = sceneId === 'abandoned_factory' || sceneId === 'battle';

  return (
    <group>
      {showSnow && <points ref={snowRef} geometry={snow.geom} material={snow.mat} />}
      {showRain && <points ref={rainRef} geometry={rain.geom} material={rain.mat} />}
      {showSparks && <points ref={sparkRef} geometry={sparks.geom} material={sparks.mat} />}
    </group>
  );
}
