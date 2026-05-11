'use client';

/* ─── Volodka RPG – Visualization Layer System ─── */
/* Three.js layer separation for depth, parallax, and performance control */

import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Layer Definitions ───

export const LAYER = {
  DEFAULT: 0,
  BACKGROUND: 1,
  MIDGROUND: 2,
  FOREGROUND: 3,
  OVERLAY: 4,
} as const;

export type LayerName = keyof typeof LAYER;

const LAYER_NAMES: LayerName[] = ['DEFAULT', 'BACKGROUND', 'MIDGROUND', 'FOREGROUND', 'OVERLAY'];

/** Parallax factor per layer — background shifts opposite to player movement */
const LAYER_PARALLAX: Record<LayerName, number> = {
  DEFAULT: 0,
  BACKGROUND: 0.12,     // Moves opposite to player (distant)
  MIDGROUND: 0,
  FOREGROUND: -0.06,    // Moves WITH player direction (closer than player = passes by)
  OVERLAY: 0.03,
};

/** Depth-fog additional factor per layer (0 = no extra fog, 1 = fully fogged) */
const LAYER_FOG_FACTOR: Record<LayerName, number> = {
  DEFAULT: 0,
  BACKGROUND: 0.5,
  MIDGROUND: 0.15,
  FOREGROUND: 0,
  OVERLAY: 0.3,
};

// ─── Layer Registry Context ───

interface LayerRegistryEntry {
  ref: THREE.Object3D;
  layer: LayerName;
}

interface LayerContextValue {
  registerObject: (ref: THREE.Object3D, layer: LayerName) => void;
  unregisterObject: (ref: THREE.Object3D) => void;
  getLayerObjects: (layer: LayerName) => THREE.Object3D[];
  setLayerEnabled: (layer: LayerName, enabled: boolean) => void;
  isLayerEnabled: (layer: LayerName) => boolean;
}

const LayerContext = createContext<LayerContextValue | null>(null);

/** Hook to access the visualization layer system */
export function useVisualizationLayer(): LayerContextValue {
  const ctx = useContext(LayerContext);
  if (!ctx) {
    // Return a no-op fallback when used outside the provider
    return {
      registerObject: () => {},
      unregisterObject: () => {},
      getLayerObjects: () => [],
      setLayerEnabled: () => {},
      isLayerEnabled: () => true,
    };
  }
  return ctx;
}

// ─── SceneLayer Component ───

interface SceneLayerProps {
  layer: LayerName;
  children: React.ReactNode;
}

/** Wraps children in a specific render layer group with parallax and depth-fog support */
export const SceneLayer = memo(function SceneLayer({ layer, children }: SceneLayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { registerObject, unregisterObject, isLayerEnabled } = useVisualizationLayer();
  // Read enabled state reactively from context — no polling needed.
  // When enabledLayers changes in the provider, isLayerEnabled changes,
  // which updates the context value and triggers a re-render here.
  const enabled = isLayerEnabled(layer);

  // Register the group with the layer system
  useEffect(() => {
    if (!groupRef.current) return;
    registerObject(groupRef.current, layer);
    return () => {
      if (groupRef.current) {
        unregisterObject(groupRef.current);
      }
    };
  }, [layer, registerObject, unregisterObject]);

  // Set Three.js layers on all child objects via traverse
  useEffect(() => {
    if (!groupRef.current) return;
    const layerBit = LAYER[layer];
    groupRef.current.traverse((child) => {
      // Guard: not all traversed nodes have a standard THREE.Layers instance
      // (e.g. Skeleton, Bone internals may lack .layers.enable)
      if (child.layers && typeof child.layers.enable === 'function') {
        child.layers.enable(layerBit);
      }
    });
  }, [layer, enabled]);

  if (!enabled) return null;

  return (
    <group ref={groupRef} layers-enable={LAYER[layer]}>
      {children}
    </group>
  );
});

// ─── Background Parallax Component ───

interface BackgroundParallaxProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  children: React.ReactNode;
}

/** Applies parallax offset to background objects based on player position */
function BackgroundParallax({ livePlayerPositionRef, children }: BackgroundParallaxProps) {
  const groupRef = useRef<THREE.Group>(null);
  const offsetRef = useRef(new THREE.Vector3(0, 0, 0));
  const targetOffsetRef = useRef(new THREE.Vector3(0, 0, 0));
  const prevPlayerPos = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    if (!groupRef.current) return;

    const playerPos = livePlayerPositionRef.current;
    const parallaxFactor = LAYER_PARALLAX.BACKGROUND; // 0.12

    // Compute target offset opposite to player movement
    targetOffsetRef.current.set(
      -playerPos.x * parallaxFactor,
      0, // Don't parallax vertically
      -playerPos.z * parallaxFactor
    );

    // Smooth interpolation toward target
    offsetRef.current.lerp(targetOffsetRef.current, 0.05);

    // Apply offset
    groupRef.current.position.copy(offsetRef.current);
  });

  return <group ref={groupRef}>{children}</group>;
}

// ─── Foreground Parallax Component ───

interface ForegroundParallaxProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  children: React.ReactNode;
}

/** Applies parallax offset to foreground objects based on player position.
 *  Negative factor means foreground objects shift in the SAME direction as the player,
 *  creating the illusion they are closer than the player. */
function ForegroundParallax({ livePlayerPositionRef, children }: ForegroundParallaxProps) {
  const groupRef = useRef<THREE.Group>(null);
  const offsetRef = useRef(new THREE.Vector3(0, 0, 0));
  const targetOffsetRef = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    if (!groupRef.current) return;

    const playerPos = livePlayerPositionRef.current;
    const parallaxFactor = LAYER_PARALLAX.FOREGROUND; // -0.06

    // Compute target offset — negative factor means same direction as player
    targetOffsetRef.current.set(
      -playerPos.x * parallaxFactor,
      0, // Don't parallax vertically
      -playerPos.z * parallaxFactor
    );

    // Smooth interpolation toward target
    offsetRef.current.lerp(targetOffsetRef.current, 0.05);

    // Apply offset
    groupRef.current.position.copy(offsetRef.current);
  });

  return <group ref={groupRef}>{children}</group>;
}

// ─── Depth Fog Component ───

interface DepthFogProps {
  layer: LayerName;
  children: React.ReactNode;
}

/** Applies additional fog opacity to a layer group based on depth factor */
function DepthFogLayer({ layer, children }: DepthFogProps) {
  const groupRef = useRef<THREE.Group>(null);
  const fogFactor = LAYER_FOG_FACTOR[layer];
  const lastFogFactorRef = useRef(0);

  // For background/overlay layers, apply a slight opacity reduction via material override
  // This is a visual hint — actual fog is handled by SceneEnvironment, but we can
  // tint the material slightly toward the fog color for depth perception.
  //
  // IMPORTANT: We clone materials before mutating them so that shared material instances
  // used by other meshes are NOT affected. On cleanup, original materials are restored
  // and clones are disposed.
  //
  // Optimization: since fogFactor comes from a static constant (LAYER_FOG_FACTOR),
  // it rarely changes. Skip re-cloning if the factor hasn't changed.
  useEffect(() => {
    if (!groupRef.current || fogFactor <= 0) return;

    // Skip re-cloning if fogFactor hasn't changed since last application
    if (fogFactor === lastFogFactorRef.current) return;

    const fogColor = new THREE.Color('#1a1a2e'); // default fog color
    const clonedMaterials = new Map<THREE.Material, THREE.Material>();

    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && mat.color) {
          // Clone material to avoid affecting shared instances
          const cloned = mat.clone();
          cloned.color.lerp(fogColor, fogFactor * 0.3);
          cloned.userData._originalMaterial = mat;
          mesh.material = cloned;
          clonedMaterials.set(cloned, mat);
        }
      }
    });

    lastFogFactorRef.current = fogFactor;

    return () => {
      // Restore original materials
      clonedMaterials.forEach((original, cloned) => {
        // Find meshes using the cloned material and restore original
        groupRef.current?.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material === cloned) {
            (child as THREE.Mesh).material = original;
          }
        });
        cloned.dispose();
      });
      clonedMaterials.clear();
      lastFogFactorRef.current = 0;
    };
  }, [fogFactor, layer]);

  return <group ref={groupRef}>{children}</group>;
}

// ─── Main VisualizationLayers Component ───

interface VisualizationLayersProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  children: React.ReactNode;
}

/**
 * Main visualization layer wrapper.
 * Provides the LayerContext and renders children with proper layer separation.
 * Add parallax for background and depth-fog for distant layers.
 */
export function VisualizationLayers({ livePlayerPositionRef, children }: VisualizationLayersProps) {
  // Layer registry
  const registryRef = useRef<Map<string, LayerRegistryEntry>>(new Map());
  const [enabledLayers, setEnabledLayers] = useState<Record<LayerName, boolean>>({
    DEFAULT: true,
    BACKGROUND: true,
    MIDGROUND: true,
    FOREGROUND: true,
    OVERLAY: true,
  });

  const registerObject = useCallback((ref: THREE.Object3D, layer: LayerName) => {
    const key = ref.uuid;
    registryRef.current.set(key, { ref, layer });
  }, []);

  const unregisterObject = useCallback((ref: THREE.Object3D) => {
    registryRef.current.delete(ref.uuid);
  }, []);

  const getLayerObjects = useCallback((layer: LayerName): THREE.Object3D[] => {
    const objects: THREE.Object3D[] = [];
    registryRef.current.forEach((entry) => {
      if (entry.layer === layer) {
        objects.push(entry.ref);
      }
    });
    return objects;
  }, []);

  const setLayerEnabled = useCallback((layer: LayerName, enabled: boolean) => {
    setEnabledLayers((prev) => ({ ...prev, [layer]: enabled }));
  }, []);

  const isLayerEnabled = useCallback((layer: LayerName): boolean => {
    return enabledLayers[layer];
  }, [enabledLayers]);

  const contextValue = useMemo<LayerContextValue>(() => ({
    registerObject,
    unregisterObject,
    getLayerObjects,
    setLayerEnabled,
    isLayerEnabled,
  }), [registerObject, unregisterObject, getLayerObjects, setLayerEnabled, isLayerEnabled]);

  return (
    <LayerContext.Provider value={contextValue}>
      <group>
        {children}
      </group>
    </LayerContext.Provider>
  );
}

// ─── Convenience Layer Wrappers ───

interface LayeredBackgroundProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  children: React.ReactNode;
}

/** Background layer with parallax and depth fog */
export function LayeredBackground({ livePlayerPositionRef, children }: LayeredBackgroundProps) {
  return (
    <SceneLayer layer="BACKGROUND">
      <BackgroundParallax livePlayerPositionRef={livePlayerPositionRef}>
        <DepthFogLayer layer="BACKGROUND">
          {children}
        </DepthFogLayer>
      </BackgroundParallax>
    </SceneLayer>
  );
}

/** Midground layer with slight depth fog */
export function LayeredMidground({ children }: { children: React.ReactNode }) {
  return (
    <SceneLayer layer="MIDGROUND">
      <DepthFogLayer layer="MIDGROUND">
        {children}
      </DepthFogLayer>
    </SceneLayer>
  );
}

interface LayeredForegroundProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  children: React.ReactNode;
}

/** Foreground layer with parallax — clear, no extra fog */
export function LayeredForeground({ livePlayerPositionRef, children }: LayeredForegroundProps) {
  return (
    <SceneLayer layer="FOREGROUND">
      <ForegroundParallax livePlayerPositionRef={livePlayerPositionRef}>
        {children}
      </ForegroundParallax>
    </SceneLayer>
  );
}

/** Overlay layer — particles, volumetric, weather */
export function LayeredOverlay({ children }: { children: React.ReactNode }) {
  return (
    <SceneLayer layer="OVERLAY">
      <DepthFogLayer layer="OVERLAY">
        {children}
      </DepthFogLayer>
    </SceneLayer>
  );
}
