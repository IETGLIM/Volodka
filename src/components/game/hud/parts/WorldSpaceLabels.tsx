'use client';

import React, { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, Hand, AlertCircle, Star } from 'lucide-react';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Category of world-space label.
 * Each type maps to specific visual styling:
 * - `npc`: Character entities (cyan theme)
 * - `item`: Collectible objects (amber/gold theme)
 * - `interaction`: Interactive elements (green theme)
 * - `custom`: User-defined with optional color override (purple default)
 */
export type WorldLabelType = 'npc' | 'item' | 'interaction' | 'custom';

/**
 * Represents a 3D position in world space coordinates.
 * Units depend on game engine scale (typically meters or unreal units).
 */
export interface WorldPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Complete data structure for a single world-space label instance.
 * Contains all information needed for rendering, positioning, and state tracking.
 */
export interface WorldLabelData {
  /** Unique identifier - used as React key and for animation phase offset */
  id: string;
  /** Display text rendered on the label */
  text: string;
  /** 3D world position where label anchor is placed */
  worldPosition: WorldPosition;
  /** Visual category determining default styling */
  type: WorldLabelType;
  /** Render priority - higher values render on top (default: 0) */
  priority?: number;
  /** Maximum visible distance before hiding (uses fadeDistance if unset) */
  maxDistance?: number;
  /** Vertical offset from projected point in pixels (default: 40) */
  verticalOffset?: number;
  /** Custom color override for 'custom' type labels */
  customColor?: string;
  /** Custom icon element override for 'custom' type labels */
  customIcon?: React.ReactNode;
  /** Manual visibility toggle (default: true) */
  isVisible?: boolean;
  /** Occlusion flag - true dims the label (default: false) */
  isOccluded?: boolean;
  /** Arbitrary context data for click handlers or external filtering */
  context?: Record<string, unknown>;
}

/** Viewport dimensions for projection calculations */
export interface ScreenSize {
  width: number;
  height: number;
}

/** Result of projecting a 3D world position into 2D screen space */
export interface ProjectedPoint {
  x: number;
  y: number;
  isOnScreen: boolean;
  depth: number;
}

/** Props for the WorldSpaceLabels container component */
export interface WorldSpaceLabelsProps {
  labels: WorldLabelData[];
  screenSize: ScreenSize;
  projectToWorld?: (pos: WorldPosition) => ProjectedPoint;
  maxVisibleLabels?: number;
  fadeDistance?: number;
  showConnectionLines?: boolean;
  enableBobbing?: boolean;
  enableClamping?: boolean;
  edgePadding?: number;
  visible?: boolean;
}

// ============================================================================
// Constants & Default Configuration
// ============================================================================

const DEFAULT_FADE_DISTANCE = 1000;
const DEFAULT_MAX_VISIBLE_LABELS = 20;
const DEFAULT_EDGE_PADDING = 20;
const BOBBING_AMPLITUDE = 4;
const BOBBING_FREQUENCY = 2;
const MIN_OPACITY_THRESHOLD = 0.01;
const OCCLUSION_DIM_FACTOR = 0.35;
const FADE_START_RATIO = 0.5;

// ============================================================================
// Type-Specific Styling Configuration (filmic noir — not candy neon chrome)
// ============================================================================

/**
 * Visual style presets for each label type.
 * Restrained filmic ink / stone; soft borders — no cyberpunk neon glow spam.
 */
const TYPE_STYLES: Record<WorldLabelType, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  npc: {
    color: 'rgba(214, 211, 209, 0.92)',
    bgColor: 'rgba(12, 10, 9, 0.55)',
    borderColor: 'rgba(168, 162, 158, 0.35)',
    icon: <User size={12} />,
  },
  item: {
    color: 'rgba(231, 229, 228, 0.94)',
    bgColor: 'rgba(12, 10, 9, 0.55)',
    borderColor: 'rgba(180, 150, 100, 0.4)',
    icon: <Package size={12} />,
  },
  interaction: {
    color: 'rgba(214, 211, 209, 0.95)',
    bgColor: 'rgba(12, 10, 9, 0.58)',
    borderColor: 'rgba(120, 160, 140, 0.38)',
    icon: <Hand size={12} />,
  },
  custom: {
    color: 'rgba(214, 211, 209, 0.9)',
    bgColor: 'rgba(12, 10, 9, 0.5)',
    borderColor: 'rgba(168, 162, 158, 0.32)',
    icon: <Star size={12} />,
  },
};

// ============================================================================
// Projection Helper Functions
// ============================================================================

/**
 * Default fallback projection function for demo/development use.
 * Maps world coordinates to screen percentage via trigonometric functions.
 * Production requires integration with actual 3D engine camera matrices.
 */
function defaultProjectToWorld(pos: WorldPosition): ProjectedPoint {
  const normalizedX = (Math.sin(pos.x * 0.01) + 1) * 50;
  const normalizedY = (Math.cos(pos.z * 0.01) + 1) * 50;
  const depth = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  
  return {
    x: normalizedX,
    y: normalizedY,
    isOnScreen: true,
    depth: Number.isFinite(depth) ? depth : 0,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Clamps screen coordinates to remain within viewport boundaries with padding */
function clampToScreen(
  x: number, y: number,
  screenWidth: number, screenHeight: number,
  padding: number
): { x: number; y: number; clamped: boolean } {
  let clamped = false;
  let clampedX = x;
  let clampedY = y;

  if (clampedX < padding) { clampedX = padding; clamped = true; }
  else if (clampedX > screenWidth - padding) { clampedX = screenWidth - padding; clamped = true; }
  if (clampedY < padding) { clampedY = padding; clamped = true; }
  else if (clampedY > screenHeight - padding) { clampedY = screenHeight - padding; clamped = true; }

  return { x: clampedX, y: clampedY, clamped };
}

/**
 * Calculates composite opacity based on distance fading and occlusion dimming.
 * Returns value between 0.0 (fully transparent) and 1.0 (fully opaque).
 */
function calculateOpacity(
  depth: number,
  fadeDistance: number,
  isOccluded: boolean,
  isVisible: boolean
): number {
  if (!isVisible || !Number.isFinite(depth)) return 0;

  let opacity = 1;
  const fadeStart = fadeDistance * FADE_START_RATIO;
  
  // Linear fade based on distance from camera
  if (depth > fadeStart) {
    const fadeProgress = (depth - fadeStart) / (fadeDistance - fadeStart);
    opacity = Math.max(0, 1 - fadeProgress);
  }

  // Apply occlusion dimming when entity is behind geometry
  if (isOccluded) opacity *= OCCLUSION_DIM_FACTOR;

  return Math.round(opacity * 100) / 100;
}

/** Resolves visual style config for a label, handling custom color/icon overrides */
function getStyleForLabel(label: WorldLabelData): typeof TYPE_STYLES[WorldLabelType] {
  if (label.type === 'custom' && label.customColor) {
    return {
      color: label.customColor,
      bgColor: `${label.customColor}26`,
      borderColor: `${label.customColor}99`,
      icon: label.customIcon ?? <Star size={12} />,
    };
  }
  return TYPE_STYLES[label.type];
}

/** Validates that required label fields are present and correctly typed */
function isValidLabel(label: WorldLabelData): boolean {
  return (
    typeof label.id === 'string' && label.id.length > 0 &&
    typeof label.text === 'string' &&
    label.worldPosition !== undefined &&
    typeof label.worldPosition.x === 'number' &&
    typeof label.worldPosition.y === 'number' &&
    typeof label.worldPosition.z === 'number'
  );
}

/** Generates deterministic hash from string for stable animation phase offsets */
function simpleStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// ============================================================================
// Connection Line Sub-Component
// ============================================================================

interface ConnectionLineProps {
  startX: number; startY: number;
  endX: number; endY: number;
  color: string;
  opacity: number;
}

/**
 * Renders gradient line connecting label to anchor point.
 * Uses CSS transform rotation for efficient rendering at any angle.
 * Skips rendering for very short or invisible lines.
 */
const ConnectionLine = memo<ConnectionLineProps>(({ startX, startY, endX, endY, color, opacity }) => {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

  if (length < 5 || opacity <= 0) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: startX, top: startY, width: length, height: 1,
        transformOrigin: '0 50%',
        transform: `rotate(${angle}deg)`,
        opacity: Math.min(opacity * 0.4, 0.4),
      }}
    >
      <div
        className="w-full h-full"
        style={{
          background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)`,
          boxShadow: 'none',
        }}
      />
    </div>
  );
});
ConnectionLine.displayName = 'ConnectionLine';

// ============================================================================
// Single Label Sub-Component
// ============================================================================

interface SingleLabelProps {
  label: WorldLabelData;
  styleConfig: ReturnType<typeof getStyleForLabel>;
  opacity: number;
  clampedPosition: { x: number; y: number; clamped: boolean };
  showConnectionLine: boolean;
  enableBobbing: boolean;
  reducedMotion: boolean;
}

/**
 * Renders single floating label with full visual effects:
 * - Smooth framer-motion animations (respects reduced motion)
 * - Optional connection line to anchor point
 * - Cyberpunk-styled container with neon glow
 * - Occlusion indicator when entity hidden
 * - Edge-clamp pulse indicator when position adjusted
 * - Gentle bobbing animation with per-label phase offset (CSS — no rAF React commits)
 */
const SingleLabel = memo<SingleLabelProps>(({
  label, styleConfig, opacity, clampedPosition,
  showConnectionLine, enableBobbing, reducedMotion,
}) => {
  const phaseOffset = useMemo(
    () => (simpleStringHash(label.id) % 1000) / 1000,
    [label.id],
  );

  // Final screen position with offsets applied
  const verticalOffset = label.verticalOffset ?? 40;
  const finalY = clampedPosition.y - verticalOffset;
  const finalX = clampedPosition.x;

  // Early exit for effectively invisible labels
  if (opacity <= MIN_OPACITY_THRESHOLD) return null;

  // Z-index based on priority (higher renders above)
  const zIndexValue = Math.round((label.priority ?? 0) * 100 + 10);

  return (
    <motion.div
      className="absolute pointer-events-auto"
      initial={{ opacity: 0, scale: 0.8, y: finalY - 10 }}
      animate={{ opacity, scale: clampedPosition.clamped ? 0.9 : 1, x: finalX, y: finalY }}
      exit={{ opacity: 0, scale: 0.8, y: finalY - 10 }}
      transition={{ duration: reducedMotion ? 0.001 : 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{ transform: 'translate(-50%, -100%)', zIndex: zIndexValue }}
    >
      {/* Connection line to anchor point */}
      {showConnectionLine && (
        <ConnectionLine
          startX={0} startY={verticalOffset}
          endX={0} endY={verticalOffset}
          color={styleConfig.color} opacity={opacity}
        />
      )}

      {/* Main cyberpunk-styled container — CSS bob avoids per-frame React commits */}
      <div
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md backdrop-blur-sm border"
        style={{
          backgroundColor: styleConfig.bgColor,
          borderColor: styleConfig.borderColor,
          boxShadow: '0 1px 8px rgba(0,0,0,0.45)',
          ...(enableBobbing && !reducedMotion
            ? {
                ['--world-label-bob-amp' as string]: `${BOBBING_AMPLITUDE}px`,
                animation: `world-label-bob ${1 / BOBBING_FREQUENCY}s ease-in-out infinite`,
                animationDelay: `${-phaseOffset / BOBBING_FREQUENCY}s`,
              }
            : null),
        }}
      >
        {/* Type-specific icon */}
        <span className="flex-shrink-0" style={{ color: styleConfig.color }} aria-hidden="true">
          {label.customIcon ?? styleConfig.icon}
        </span>

        {/* Label text — filmic ink, no neon text-shadow */}
        <span
          className="text-xs font-medium whitespace-nowrap tracking-wide"
          style={{ color: styleConfig.color, textShadow: '0 1px 2px rgba(0,0,0,0.65)' }}
        >
          {label.text}
        </span>

        {/* Occlusion indicator */}
        {label.isOccluded && (
          <span className="ml-0.5 opacity-60" style={{ color: styleConfig.color }} title="Entity occluded">
            <AlertCircle size={10} />
          </span>
        )}

        {/* Edge clamp pulse indicator */}
        {clampedPosition.clamped && (
          <motion.div
            className="absolute -bottom-1 left-1/2 w-4 h-0.5 rounded-full"
            style={{ backgroundColor: styleConfig.color, transform: 'translateX(-50%)' }}
            animate={
              reducedMotion
                ? { scaleX: 1, opacity: 0.7 }
                : { scaleX: [0.5, 1, 0.5], opacity: [0.5, 1, 0.5] }
            }
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>
    </motion.div>
  );
});
SingleLabel.displayName = 'SingleLabel';

// ============================================================================
// Main WorldSpaceLabels Container Component
// ============================================================================

/**
 * WorldSpaceLabels - Floating 3D-space labels for game entities.
 *
 * Projects world positions to screen coordinates and renders styled
 * floating labels with cyberpunk aesthetic. Features include:
 *
 * **Rendering**: 3D→2D projection, type-specific styling (NPCs=cyan, items=amber, interactions=green)
 * **Visual Effects**: Distance-based fading, occlusion hints, neon glow borders
 * **Behavior**: Priority z-ordering, optional connection lines, gentle bobbing animation
 * **Performance**: Screen-edge clamping, max visible limit, memoized sub-components
 * **Accessibility**: Full reduced-motion support for all animations
 *
 * @example
 * ```tsx
 * <WorldSpaceLabels
 *   labels={[
 *     { id: 'npc-1', text: 'Guard', worldPosition: {x:100,y:0,z:50}, type: 'npc' },
 *     { id: 'item-1', text: 'Sword', worldPosition: {x:-50,y:0,z:30}, type: 'item', priority: 10 },
 *   ]}
 *   screenSize={{ width: 1920, height: 1080 }}
 *   projectToWorld={myEngineProjectionFunction}
 * />
 * ```
 */
function WorldSpaceLabelsComponent({
  labels,
  screenSize,
  projectToWorld: externalProjector,
  maxVisibleLabels = DEFAULT_MAX_VISIBLE_LABELS,
  fadeDistance = DEFAULT_FADE_DISTANCE,
  showConnectionLines = false,
  enableBobbing = true,
  enableClamping = true,
  edgePadding = DEFAULT_EDGE_PADDING,
  visible = true,
}: WorldSpaceLabelsProps) {
  // -----------------------------------------------------------------------
  // State & Hooks
  // -----------------------------------------------------------------------
  
  const reducedMotion = useEffectiveReducedMotion();

  // -----------------------------------------------------------------------
  // Derived Values
  // -----------------------------------------------------------------------
  
  /** Active projection function (external or demo fallback) */
  const projector = useMemo(
    () => externalProjector ?? defaultProjectToWorld,
    [externalProjector]
  );

  // -----------------------------------------------------------------------
  // Label Processing Pipeline
  // -----------------------------------------------------------------------
  
  /**
   * Processes labels through pipeline:
   * 1. Validate/filter invalid data
   * 2. Project world→screen coordinates
   * 3. Calculate depth-based opacity
   * 4. Clamp to viewport bounds
   * 5. Filter invisible labels
   * 6. Sort by priority (desc)
   * 7. Limit to maxVisibleLabels
   */
  const processedLabels = useMemo(() => {
    if (!visible || !screenSize.width || !screenSize.height) return [];

    return labels
      .filter(isValidLabel)
      .map((label) => {
        const projected = projector(label.worldPosition);
        const opacity = calculateOpacity(
          projected.depth, fadeDistance,
          label.isOccluded ?? false, label.isVisible !== false
        );
        const clamped = enableClamping
          ? clampToScreen(projected.x, projected.y, screenSize.width, screenSize.height, edgePadding)
          : { x: projected.x, y: projected.y, clamped: false };

        return { label, projected, opacity, clamped, styleConfig: getStyleForLabel(label) };
      })
      .filter((item) => item.opacity > MIN_OPACITY_THRESHOLD)
      .sort((a, b) => (b.label.priority ?? 0) - (a.label.priority ?? 0))
      .slice(0, maxVisibleLabels);
  }, [
    labels, visible, screenSize, projector, fadeDistance,
    enableClamping, edgePadding, maxVisibleLabels,
  ]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  
  if (!visible || processedLabels.length === 0) return null;

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: UI_LAYERS.WORLD_LABELS }}
      aria-label="World space entity labels"
      role="region"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {processedLabels.map(({ label, opacity, clamped, styleConfig }) => (
          <SingleLabel
            key={`world-label-${label.id}`}
            label={label}
            styleConfig={styleConfig}
            opacity={opacity}
            clampedPosition={clamped}
            showConnectionLine={showConnectionLines}
            enableBobbing={enableBobbing}
            reducedMotion={reducedMotion}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

/** Memoized export for optimal re-render performance */
export const WorldSpaceLabels = memo(WorldSpaceLabelsComponent);

/** Default export for convenient importing */
export default WorldSpaceLabels;
