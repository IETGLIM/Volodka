/**
 * Volodka RPG – Performance Optimizer
 * Centralized performance utilities for 3D engine optimization
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════
   LOD (Level of Detail) System for NPCs and Objects
   ═══════════════════════════════════════════════════════════════ */

export interface LODLevel {
  distance: number;
  updateFrequency: number; // ms between updates
  physicsEnabled: boolean;
  shadowsEnabled: boolean;
}

export const LOD_LEVELS: LODLevel[] = [
  { distance: 10, updateFrequency: 16, physicsEnabled: true, shadowsEnabled: true },   // Close: 60fps, full physics
  { distance: 25, updateFrequency: 33, physicsEnabled: true, shadowsEnabled: true },   // Medium: 30fps
  { distance: 50, updateFrequency: 66, physicsEnabled: false, shadowsEnabled: false }, // Far: 15fps, no physics
  { distance: 100, updateFrequency: 100, physicsEnabled: false, shadowsEnabled: false }, // Very far: 10fps
];

/**
 * Hook to determine LOD level based on distance from player
 */
export function useLOD(
  objectPosition: THREE.Vector3,
  playerPositionRef: React.MutableRefObject<THREE.Vector3>
): { level: number; shouldRender: boolean; updateInterval: number } {
  const lodRef = useRef({ level: 0, lastUpdate: 0 });

  useFrame(() => {
    const now = performance.now();
    const distance = objectPosition.distanceTo(playerPositionRef.current);

    // Find appropriate LOD level
    let newLevel = LOD_LEVELS.length - 1;
    for (let i = 0; i < LOD_LEVELS.length; i++) {
      if (distance < LOD_LEVELS[i].distance) {
        newLevel = i;
        break;
      }
    }

    lodRef.current.level = newLevel;
  });

  return {
    level: lodRef.current.level,
    shouldRender: lodRef.current.level < LOD_LEVELS.length,
    updateInterval: LOD_LEVELS[lodRef.current.level]?.updateFrequency ?? 100,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Consolidated Frame Loop System
   Replaces multiple useFrame hooks with a single prioritized loop
   ═══════════════════════════════════════════════════════════════ */

export type FrameCallback = (delta: number, state: THREE.Renderer) => void;
export type FramePriority = 'critical' | 'high' | 'normal' | 'low';

interface FrameJob {
  id: string;
  callback: FrameCallback;
  priority: FramePriority;
  enabled: boolean;
}

class FrameLoopManager {
  private jobs: Map<string, FrameJob> = new Map();
  private sortedJobs: FrameJob[] = [];

  register(id: string, callback: FrameCallback, priority: FramePriority = 'normal') {
    this.jobs.set(id, { id, callback, priority, enabled: true });
    this.resort();
  }

  unregister(id: string) {
    this.jobs.delete(id);
    this.resort();
  }

  setEnabled(id: string, enabled: boolean) {
    const job = this.jobs.get(id);
    if (job) {
      job.enabled = enabled;
    }
  }

  private resort() {
    const priorityOrder: Record<FramePriority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };
    this.sortedJobs = Array.from(this.jobs.values())
      .filter(j => j.enabled)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  execute(delta: number, state: THREE.Renderer) {
    for (const job of this.sortedJobs) {
      try {
        job.callback(delta, state);
      } catch (err) {
        console.warn(`[FrameLoop] Job ${job.id} error:`, err);
      }
    }
  }
}

export const frameLoopManager = new FrameLoopManager();

/**
 * Hook to register a callback in the consolidated frame loop
 */
export function useConsolidatedFrame(
  id: string,
  callback: FrameCallback,
  priority: FramePriority = 'normal',
  deps: React.DependencyList = []
) {
  useEffect(() => {
    frameLoopManager.register(id, callback, priority);
    return () => frameLoopManager.unregister(id);
  }, [id, ...deps]);
}

/* ═══════════════════════════════════════════════════════════════
   Object Pooling for frequently created/destroyed objects
   ═══════════════════════════════════════════════════════════════ */

export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 10) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    return this.pool.length > 0 ? this.pool.pop()! : this.factory();
  }

  release(obj: T) {
    this.reset(obj);
    this.pool.push(obj);
  }

  get size(): number {
    return this.pool.length;
  }
}

// Pre-created pools for common objects
export const vector3Pool = new ObjectPool<THREE.Vector3>(
  () => new THREE.Vector3(),
  (v) => v.set(0, 0, 0),
  50
);

export const colorPool = new ObjectPool<THREE.Color>(
  () => new THREE.Color(),
  (c) => c.setRGB(0, 0, 0),
  20
);

/* ═══════════════════════════════════════════════════════════════
   GPU Memory Management
   ═══════════════════════════════════════════════════════════════ */

export function useGPUMemoryMonitor() {
  const gl = useThree((state) => state.gl);
  const memoryRef = useRef({ geometries: 0, textures: 0 });

  useFrame(() => {
    if (gl.info) {
      memoryRef.current = {
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
      };
    }
  }, 1); // Low priority

  return memoryRef.current;
}

/* ═══════════════════════════════════════════════════════════════
   Adaptive Quality System
   Automatically adjusts quality based on FPS
   ═══════════════════════════════════════════════════════════════ */

export interface QualitySettings {
  shadowMapSize: number;
  particleCount: number;
  postProcessingEnabled: boolean;
  antialiasing: boolean;
  npcUpdateFrequency: number;
}

export const QUALITY_PRESETS: Record<string, QualitySettings> = {
  low: {
    shadowMapSize: 512,
    particleCount: 50,
    postProcessingEnabled: false,
    antialiasing: false,
    npcUpdateFrequency: 100,
  },
  medium: {
    shadowMapSize: 1024,
    particleCount: 200,
    postProcessingEnabled: true,
    antialiasing: false,
    npcUpdateFrequency: 50,
  },
  high: {
    shadowMapSize: 2048,
    particleCount: 500,
    postProcessingEnabled: true,
    antialiasing: true,
    npcUpdateFrequency: 33,
  },
  ultra: {
    shadowMapSize: 4096,
    particleCount: 1000,
    postProcessingEnabled: true,
    antialiasing: true,
    npcUpdateFrequency: 16,
  },
};

export function useAdaptiveQuality(
  targetFPS: number = 55,
  minFPS: number = 25
): { quality: QualitySettings; fps: number; qualityLevel: string } {
  const [qualityLevel, setQualityLevel] = useState<string>('high');
  const fpsHistory = useRef<number[]>([]);
  const lastTime = useRef(performance.now());
  const frameCount = useRef(0);

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    const delta = now - lastTime.current;

    if (delta >= 1000) {
      const fps = (frameCount.current / delta) * 1000;
      fpsHistory.current.push(fps);
      if (fpsHistory.current.length > 10) {
        fpsHistory.current.shift();
      }

      const avgFps = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length;

      // Adjust quality based on FPS
      if (avgFps < minFPS && qualityLevel !== 'low') {
        const levels = ['ultra', 'high', 'medium', 'low'];
        const currentIndex = levels.indexOf(qualityLevel);
        if (currentIndex < levels.length - 1) {
          setQualityLevel(levels[currentIndex + 1]);
        }
      } else if (avgFps > targetFPS && qualityLevel !== 'ultra') {
        const levels = ['low', 'medium', 'high', 'ultra'];
        const currentIndex = levels.indexOf(qualityLevel);
        if (currentIndex < levels.length - 1) {
          setQualityLevel(levels[currentIndex + 1]);
        }
      }

      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  const avgFps = fpsHistory.current.length > 0
    ? fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
    : 60;

  return {
    quality: QUALITY_PRESETS[qualityLevel],
    fps: Math.round(avgFps),
    qualityLevel,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Spatial Partitioning for efficient proximity queries
   ═══════════════════════════════════════════════════════════════ */

export class SpatialGrid<T> {
  private cellSize: number;
  private cells: Map<string, T[]> = new Map();

  constructor(cellSize: number = 10) {
    this.cellSize = cellSize;
  }

  private getCellKey(x: number, z: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cz}`;
  }

  insert(item: T, position: THREE.Vector3) {
    const key = this.getCellKey(position.x, position.z);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key)!.push(item);
  }

  remove(item: T, position: THREE.Vector3) {
    const key = this.getCellKey(position.x, position.z);
    const cell = this.cells.get(key);
    if (cell) {
      const index = cell.indexOf(item);
      if (index >= 0) {
        cell.splice(index, 1);
      }
    }
  }

  query(position: THREE.Vector3, radius: number): T[] {
    const results: T[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(position.x / this.cellSize);
    const cz = Math.floor(position.z / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const key = `${cx + dx},${cz + dz}`;
        const cell = this.cells.get(key);
        if (cell) {
          results.push(...cell);
        }
      }
    }

    return results;
  }

  clear() {
    this.cells.clear();
  }
}

// Import useState for useAdaptiveQuality
import { useState } from 'react';
