/**
 * Volodka RPG – Asset Preloading Strategy
 * Intelligent preloading of 3D models, textures, and audio
 * 
 * STRATEGY:
 * 1. Critical assets: Load immediately (player model, current scene)
 * 2. High priority: Load after game starts (frequent NPCs, UI textures)
 * 3. Low priority: Load during idle time (rare scenes, bonus content)
 */

import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════
   Asset Priority Definitions
   ═══════════════════════════════════════════════════════════════ */

export const ASSET_PRIORITIES = {
  // Tier 1: Critical - loaded immediately
  CRITICAL: {
    models: [
      '/models-external/khronos_cc0_CesiumMan.glb', // Player model
    ],
    textures: [
      // Add critical textures here
    ],
  },

  // Tier 2: High - loaded after initial render
  HIGH: {
    models: [
      '/models-external/cc0_Soldier.glb',  // Albert, Dmitry
      '/models-external/cc0_Michelle.glb', // Zarema, Maria
    ],
    textures: [],
  },

  // Tier 3: Normal - loaded during idle
  NORMAL: {
    models: [
      '/models-external/cc0_Xbot.glb', // Alexander
      '/models-external/khronos_cc0_RiggedFigure.glb', // Colleague
      '/models-external/khronos_cc0_BrainStem.glb',
    ],
    textures: [],
  },

  // Tier 4: Low - loaded only when needed
  LOW: {
    models: [],
    textures: [],
  },
};

/* ═══════════════════════════════════════════════════════════════
   Preloader Class
   ═══════════════════════════════════════════════════════════════ */

class AssetPreloader {
  private loadedAssets = new Set<string>();
  private loadingAssets = new Set<string>();
  private loadingProgress = new Map<string, number>();
  private onLoadCallbacks = new Map<string, (() => void)[]>();
  private totalAssets = 0;
  private loadedCount = 0;

  /**
   * Preload a GLB model
   */
  async preloadModel(path: string, priority: 'critical' | 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
    if (this.loadedAssets.has(path) || this.loadingAssets.has(path)) {
      return;
    }

    this.loadingAssets.add(path);
    this.totalAssets++;

    try {
      // Use useGLTF.preload from drei
      useGLTF.preload(path);
      this.loadedAssets.add(path);
      this.loadedCount++;
      this.loadingProgress.set(path, 100);

      // Notify callbacks
      const callbacks = this.onLoadCallbacks.get(path);
      if (callbacks) {
        callbacks.forEach(cb => cb());
        this.onLoadCallbacks.delete(path);
      }
    } catch (error) {
      console.warn(`[AssetPreloader] Failed to load model: ${path}`, error);
    } finally {
      this.loadingAssets.delete(path);
    }
  }

  /**
   * Preload multiple assets by priority
   */
  async preloadPriority(priority: keyof typeof ASSET_PRIORITIES): Promise<void[]> {
    const assets = ASSET_PRIORITIES[priority];
    const promises: Promise<void>[] = [];
    const normalizedPriority = priority.toLowerCase() as 'critical' | 'high' | 'normal' | 'low';

    for (const model of assets.models) {
      promises.push(this.preloadModel(model, normalizedPriority));
    }

    return Promise.all(promises);
  }

  /**
   * Preload all critical assets immediately
   */
  async preloadCritical(): Promise<void[]> {
    return this.preloadPriority('CRITICAL');
  }

  /**
   * Preload high priority assets after initial render
   */
  preloadHighPriority(): void {
    // Use requestIdleCallback for non-critical loading
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.preloadPriority('HIGH');
      });
    } else {
      // Fallback: load after a short delay
      setTimeout(() => this.preloadPriority('HIGH'), 1000);
    }
  }

  /**
   * Preload normal priority assets during idle time
   */
  preloadNormalPriority(): void {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          this.preloadPriority('NORMAL');
        },
        { timeout: 5000 }
      );
    } else {
      setTimeout(() => this.preloadPriority('NORMAL'), 3000);
    }
  }

  /**
   * Preload assets for a specific scene
   */
  async preloadScene(sceneId: string): Promise<void> {
    const sceneModels = SCENE_ASSET_MAP[sceneId];
    if (!sceneModels) return;

    for (const model of sceneModels.models) {
      await this.preloadModel(model, 'normal');
    }
  }

  /**
   * Get loading progress (0-100)
   */
  getProgress(): number {
    if (this.totalAssets === 0) return 100;
    return Math.round((this.loadedCount / this.totalAssets) * 100);
  }

  /**
   * Check if an asset is loaded
   */
  isLoaded(path: string): boolean {
    return this.loadedAssets.has(path);
  }

  /**
   * Register callback for when an asset loads
   */
  onLoad(path: string, callback: () => void): void {
    if (this.loadedAssets.has(path)) {
      callback();
      return;
    }

    const callbacks = this.onLoadCallbacks.get(path) || [];
    callbacks.push(callback);
    this.onLoadCallbacks.set(path, callbacks);
  }

  /**
   * Clear all cached assets (useful for memory management)
   */
  clearCache(): void {
    useGLTF.clear();
    this.loadedAssets.clear();
    this.loadingAssets.clear();
    this.loadingProgress.clear();
    this.loadedCount = 0;
    this.totalAssets = 0;
  }
}

/* ═══════════════════════════════════════════════════════════════
   Scene-to-Asset Mapping
   ═══════════════════════════════════════════════════════════════ */

const SCENE_ASSET_MAP: Record<string, { models: string[] }> = {
  volodka_room: {
    models: ['/models-external/khronos_cc0_CesiumMan.glb'],
  },
  volodka_corridor: {
    models: ['/models-external/cc0_Michelle.glb'], // Zarema
  },
  home_evening: {
    models: ['/models-external/cc0_Michelle.glb'],
  },
  cafe_evening: {
    models: ['/models-external/cc0_Soldier.glb', '/models-external/khronos_cc0_CesiumMan.glb'], // Albert, Barista
  },
  office_day: {
    models: ['/models-external/cc0_Xbot.glb', '/models-external/khronos_cc0_RiggedFigure.glb', '/models-external/cc0_Soldier.glb'], // Alexander, Colleague, Dmitry
  },
  street_night: {
    models: ['/models-external/cc0_Michelle.glb'], // Maria
  },
};

/* ═══════════════════════════════════════════════════════════════
   Singleton Instance
   ═══════════════════════════════════════════════════════════════ */

export const assetPreloader = new AssetPreloader();

/* ═══════════════════════════════════════════════════════════════
   React Hook for Asset Preloading
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react';

export function useAssetPreloader() {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkProgress = () => {
      const currentProgress = assetPreloader.getProgress();
      setProgress(currentProgress);
      setIsLoaded(currentProgress >= 100);
    };

    // Check progress periodically
    const interval = setInterval(checkProgress, 100);

    return () => clearInterval(interval);
  }, []);

  return {
    progress,
    isLoaded,
    preloadCritical: () => assetPreloader.preloadCritical(),
    preloadHighPriority: () => assetPreloader.preloadHighPriority(),
    preloadScene: (sceneId: string) => assetPreloader.preloadScene(sceneId),
  };
}

/* ═══════════════════════════════════════════════════════════════
   Texture Preloading Utilities
   ═══════════════════════════════════════════════════════════════ */

const textureLoader = new THREE.TextureLoader();

export function preloadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      (texture) => {
        resolve(texture);
      },
      undefined,
      (error) => {
        reject(error);
      }
    );
  });
}

/* ═══════════════════════════════════════════════════════════════
   Audio Preloading Utilities
   ═══════════════════════════════════════════════════════════════ */

export function preloadAudio(urls: string[]): Promise<HTMLAudioElement[]> {
  const promises = urls.map(
    (url) =>
      new Promise<HTMLAudioElement>((resolve, reject) => {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = url;
        audio.oncanplaythrough = () => resolve(audio);
        audio.onerror = reject;
      })
  );
  return Promise.all(promises);
}
