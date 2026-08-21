/* ─────────────────────────────────────────────────────────────────────────────
   Volodka RPG – Circular Minimap Component

   A player-centric rotating circular minimap rendered to a <canvas>.
   The map rotates so the player's facing direction always points "up".
   Shows nearby NPCs colored by disposition, quest markers, scene exits,
   a breadcrumb trail, and an optional radar sweep effect.

   Features:
   - Circular player-centric rendering (player always at center, north rotates)
   - NPC dots colored by disposition: green (friendly), red (hostile), yellow (neutral)
   - Quest objective markers (amber diamond)
   - Scene exit arrows
   - Breadcrumb trail (recent player movement)
   - Radar sweep animation
   - Glass-morphism frame with corner brackets
   - Toggleable via M key / tap to collapse → expand
   - Exploration-mode-only visibility
   - Quality-gated: simpler rendering on low/visualLite presets
   - Mobile-responsive: smaller size, repositioned to top-right
   - IntersectionObserver pauses rAF when off-screen
   - ARIA labels for accessibility

   @component MinimapComponent
   @requires framer-motion – for enter/exit transitions
────────────────────────────────────────────────────────────────────────────── */

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useMiniMapState,
  useNpcRelations,
  useGamePhase,
  useActiveQuests,
} from '@/store/selectors';
import { SCENE_CONFIG } from '@/config/scenes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  explorationMinimapTopPx,
  EXPLORATION_HUD_LAYOUT,
} from '@/shared/constants/hudLayout';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { cyberCyan, CYBER_CYAN_RGB } from '@/shared/constants/cyberPalette';
import {
  sharedPlayerPositionRef,
  sharedPlayerRotationRef,
} from '@/engine/PlayerRotationState';

/* ─── Constants ─── */

/** Minimap canvas diameter in pixels (desktop) */
const MAP_DESKTOP = 160;
/** Minimap canvas diameter in pixels (mobile) */
const MAP_MOBILE = 120;
/** Radius used for rendering calculations */
const MAP_RADIUS_DESKTOP = MAP_DESKTOP / 2;
const MAP_RADIUS_MOBILE = MAP_MOBILE / 2;
/** How many world-units the minimap shows in radius (scales with scene size) */
const BASE_VIEW_RADIUS = 12;
/** Max number of breadcrumb trail dots */
const MAX_TRAIL = 32;
/** Record a trail position every N frames */
const TRAIL_SAMPLE_INTERVAL = 6;
/** Relation value threshold for hostile NPCs */
const RELATION_HOSTILE = 25;
/** Relation value threshold for friendly NPCs */
const RELATION_FRIENDLY = 60;
/** M key code */
const TOGGLE_KEY = 'KeyM';

/* ─── Disposition coloring ─── */

type NPCDisposition = 'friendly' | 'hostile' | 'neutral';

/** Returns a fill color string based on NPC relation value */
function getDispositionColor(relation: number): { fill: string; glow: string } {
  if (relation < RELATION_HOSTILE) {
    return { fill: '#ff3355', glow: 'rgba(255, 51, 85, 0.6)' };
  }
  if (relation > RELATION_FRIENDLY) {
    return { fill: '#39ff14', glow: 'rgba(57, 255, 20, 0.6)' };
  }
  return { fill: '#ffcc00', glow: 'rgba(255, 204, 0, 0.6)' };
}

/* ─── NPC data for the minimap ─── */

interface MinimapNPC {
  id: string;
  name: string;
  worldX: number;
  worldZ: number;
  disposition: NPCDisposition;
  color: { fill: string; glow: string };
}

/* ─── Quest marker data ─── */

interface MinimapQuestMarker {
  worldX: number;
  worldZ: number;
}

/* ─── Scene exit data ─── */

interface MinimapExit {
  worldX: number;
  worldZ: number;
  label: string;
}

/* ─── Main Component ─── */

export function MinimapComponent() {
  /* ── Refs ── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const pulsePhaseRef = useRef(0);
  const isVisibleRef = useRef(true);
  const animateFnRef = useRef<FrameRequestCallback>(() => {});

  /* ── Trail state ── */
  const trailRef = useRef<Array<{ x: number; z: number }>>([]);
  const trailFrameCountRef = useRef(0);
  const prevSceneIdRef = useRef<string>('');

  /* ── Store selectors ── */
  const mode = useGamePhase();
  const { currentSceneId, playerPos, npcStates } = useMiniMapState();
  const npcRelations = useNpcRelations();
  const activeQuests = useActiveQuests();
  const quietStyle = useHudQuietStyle();
  const reducedMotion = useEffectiveReducedMotion();

  /* ── Responsive / quality hooks ── */
  const isMobile = useIsMobile();
  const { visualLite } = useGraphicsQuality();

  /* ── Toggle state ── */
  const [expanded, setExpanded] = useState(true);
  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  /* ── M-key toggle ── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === TOGGLE_KEY && mode === 'exploration') {
        e.preventDefault();
        handleToggle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, handleToggle]);

  /* ── Derived values ── */
  const sceneConfig = SCENE_CONFIG[currentSceneId];
  const mapSize = isMobile ? MAP_MOBILE : MAP_DESKTOP;
  const mapRadius = isMobile ? MAP_RADIUS_MOBILE : MAP_RADIUS_DESKTOP;

  /* Reset trail on scene change */
  if (currentSceneId !== prevSceneIdRef.current) {
    trailRef.current = [];
    prevSceneIdRef.current = currentSceneId;
  }

  /* ── Compute view radius from scene dimensions ── */
  const viewRadius = useMemo(() => {
    if (!sceneConfig) return BASE_VIEW_RADIUS;
    const [sceneW, sceneD] = sceneConfig.size;
    const halfDiag = Math.sqrt(sceneW * sceneW + sceneD * sceneD) / 2;
    // Show at least half the scene diagonal or the base radius
    return Math.max(BASE_VIEW_RADIUS, halfDiag);
  }, [sceneConfig]);

  /* ── Compute NPCs in scene ── */
  const npcsInScene = useMemo<MinimapNPC[]>(() => {
    const result: MinimapNPC[] = [];
    for (const npcDef of ALL_NPC_DEFINITIONS) {
      const state = npcStates[npcDef.id];
      if (state && state.sceneId === currentSceneId) {
        const rel = npcRelations.find((r) => r.npcId === npcDef.id);
        const value = rel?.value ?? 50;
        const disposition: NPCDisposition =
          value < RELATION_HOSTILE
            ? 'hostile'
            : value > RELATION_FRIENDLY
              ? 'friendly'
              : 'neutral';
        result.push({
          id: npcDef.id,
          name: npcDef.name,
          worldX: state.position[0],
          worldZ: state.position[2],
          disposition,
          color: getDispositionColor(value),
        });
      }
    }
    return result;
  }, [npcStates, currentSceneId, npcRelations]);

  /* ── Compute scene exits ── */
  const sceneExits = useMemo<MinimapExit[]>(() => {
    if (!sceneConfig?.exits) return [];
    return sceneConfig.exits.map((exit) => ({
      worldX: exit.position[0],
      worldZ: exit.position[2],
      label: exit.label,
    }));
  }, [sceneConfig]);

  /* ── Quest markers (active quests with position in current scene) ── */
  const questMarkers = useMemo<MinimapQuestMarker[]>(() => {
    return activeQuests
      .map((q) => {
        // Quest state may carry a marker position; guard for now
        const marker = (q as unknown as { markerWorldPos?: [number, number] })
          .markerWorldPos;
        if (!marker) return null;
        return { worldX: marker[0], worldZ: marker[1] };
      })
      .filter((m): m is MinimapQuestMarker => m !== null);
  }, [activeQuests]);

  /* ── Mirror latest data into refs for the rAF loop ── */
  const npcsInSceneRef = useRef(npcsInScene);
  const sceneExitsRef = useRef(sceneExits);
  const questMarkersRef = useRef(questMarkers);
  npcsInSceneRef.current = npcsInScene;
  sceneExitsRef.current = sceneExits;
  questMarkersRef.current = questMarkers;

  /* ── Visibility gate ── */
  const isVisible = mode === 'exploration' && !!sceneConfig && expanded;

  /* ── Canvas animation loop ── */
  useEffect(() => {
    if (!sceneConfig || !isVisible) {
      cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    const cssSize = mapSize;
    canvas.width = cssSize * dpr;
    canvas.height = cssSize * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = cssSize / 2;
    const cy = cssSize / 2;
    const r = mapRadius - 2;
    const innerR = r - 2;

    /** Convert world coordinates to minimap pixel coordinates (player-centric) */
    const worldToMap = (worldX: number, worldZ: number, playerX: number, playerZ: number, yaw: number): [number, number] => {
      // Delta from player
      const dx = worldX - playerX;
      const dz = worldZ - playerZ;
      // Rotate so player's facing direction points up (-yaw to rotate world)
      const cosY = Math.cos(-yaw);
      const sinY = Math.sin(-yaw);
      const rotX = dx * cosY - dz * sinY;
      const rotZ = dx * sinY + dz * cosY;
      // Scale: world units → pixels
      const scale = innerR / viewRadius;
      const px = cx + rotX * scale;
      const py = cy - rotZ * scale; // -Z is "up" in Three.js → up on screen
      return [px, py];
    };

    /** Clamp a point to within the circular map radius */
    const clampToCircle = (px: number, py: number): [number, number] => {
      const ddx = px - cx;
      const ddy = py - cy;
      const dist = Math.sqrt(ddx * ddx + ddy * ddy);
      if (dist <= innerR - 4) return [px, py];
      const clampR = innerR - 4;
      return [cx + (ddx / dist) * clampR, cy + (ddy / dist) * clampR];
    };

    const animate: FrameRequestCallback = () => {
      animateFnRef.current = animate;
      pulsePhaseRef.current += reducedMotion ? 0.01 : 0.03;
      const pulse = Math.sin(pulsePhaseRef.current) * 0.5 + 0.5;

      // Live player pose
      const livePos = sharedPlayerPositionRef.current;
      const playerX = Number.isFinite(livePos.x) ? livePos.x : playerPos[0];
      const playerZ = Number.isFinite(livePos.z) ? livePos.z : playerPos[2];
      const yaw = sharedPlayerRotationRef.current;

      // Clear
      ctx.clearRect(0, 0, cssSize, cssSize);

      // ── Circular clip ──
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // ── Background ──
      ctx.fillStyle = 'rgba(6, 10, 22, 0.9)';
      ctx.fillRect(0, 0, cssSize, cssSize);

      // ── Grid lines (rotated with player) ──
      if (!visualLite) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-yaw);
        const scale = innerR / viewRadius;
        const gridSpacing = 4; // world units
        ctx.strokeStyle = cyberCyan(0.04);
        ctx.lineWidth = 0.5;
        const gridRange = Math.ceil(viewRadius / gridSpacing) * gridSpacing;
        for (let g = -gridRange; g <= gridRange; g += gridSpacing) {
          const gx = g * scale;
          ctx.beginPath();
          ctx.moveTo(gx, -innerR);
          ctx.lineTo(gx, innerR);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-innerR, gx);
          ctx.lineTo(innerR, gx);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ── Scene boundary rectangle (rotated with player) ──
      if (sceneConfig) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-yaw);
        const scale = innerR / viewRadius;
        const [sceneW, sceneD] = sceneConfig.size;
        const bx = (-sceneW / 2) * scale;
        const bz = (-sceneD / 2) * scale;
        const bw = sceneW * scale;
        const bd = sceneD * scale;
        ctx.strokeStyle = cyberCyan(0.15);
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(bx, bz, bw, bd);
        ctx.setLineDash([]);
        ctx.restore();
      }

      // ── Radar sweep (quality gate) ──
      if (!visualLite && !reducedMotion) {
        const sweepAngle = (pulsePhaseRef.current * 0.5) % (Math.PI * 2);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, innerR, sweepAngle - Math.PI / 2, sweepAngle - Math.PI / 2 + 0.7);
        ctx.closePath();
        const sweepGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR);
        sweepGrad.addColorStop(0, `rgba(${CYBER_CYAN_RGB}, 0.12)`);
        sweepGrad.addColorStop(1, `rgba(${CYBER_CYAN_RGB}, 0)`);
        ctx.fillStyle = sweepGrad;
        ctx.fill();
        ctx.restore();
      }

      // ── Scene exits ──
      for (const exit of sceneExitsRef.current) {
        const [ex, ey] = worldToMap(exit.worldX, exit.worldZ, playerX, playerZ, yaw);
        const [clx, cly] = clampToCircle(ex, ey);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.beginPath();
        ctx.arc(clx, cly, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Quest markers (pulsing yellow dot for current objective) ──
      for (const marker of questMarkersRef.current) {
        const [mx, my] = worldToMap(marker.worldX, marker.worldZ, playerX, playerZ, yaw);
        const [clx, cly] = clampToCircle(mx, my);
        const dSize = visualLite ? 3 : 4;
        ctx.save();
        ctx.translate(clx, cly);
        if (!visualLite && !reducedMotion) {
          ctx.rotate((pulsePhaseRef.current * 1.2) % (Math.PI * 2));
        }
        // Glow ring — pulsing yellow
        if (!visualLite) {
          const questPulse = Math.sin(pulsePhaseRef.current * 2.5) * 0.5 + 0.5;
          ctx.strokeStyle = `rgba(251, 191, 36, ${0.3 + questPulse * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, dSize + 2 + questPulse * 2, 0, Math.PI * 2);
          ctx.stroke();
          // Outer pulse ring
          ctx.strokeStyle = `rgba(251, 191, 36, ${0.15 + questPulse * 0.15})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, dSize + 5 + questPulse * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Diamond (solid yellow)
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(0, -dSize);
        ctx.lineTo(dSize, 0);
        ctx.lineTo(0, dSize);
        ctx.lineTo(-dSize, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // ── NPC dots ──
      for (const npc of npcsInSceneRef.current) {
        const [nx, ny] = worldToMap(npc.worldX, npc.worldZ, playerX, playerZ, yaw);
        const [clx, cly] = clampToCircle(nx, ny);
        const dotSize = visualLite ? 2.5 : 3;

        // Outer ring
        if (!visualLite) {
          ctx.fillStyle = npc.color.glow;
          ctx.beginPath();
          ctx.arc(clx, cly, dotSize + 2, 0, Math.PI * 2);
          ctx.fill();
        }
        // Inner dot
        ctx.fillStyle = npc.color.fill;
        ctx.beginPath();
        ctx.arc(clx, cly, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Breadcrumb trail ──
      trailFrameCountRef.current++;
      if (trailFrameCountRef.current % TRAIL_SAMPLE_INTERVAL === 0) {
        trailRef.current.push({ x: playerX, z: playerZ });
        if (trailRef.current.length > MAX_TRAIL) {
          trailRef.current.shift();
        }
      }
      const trail = trailRef.current;
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        const [tx, ty] = worldToMap(t.x, t.z, playerX, playerZ, yaw);
        const alpha = ((i + 1) / trail.length) * (visualLite ? 0.2 : 0.35);
        const tr = visualLite ? 0.8 : 0.8 + (i / trail.length) * 1.2;
        ctx.fillStyle = `rgba(${CYBER_CYAN_RGB}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(tx, ty, tr, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Player direction triangle ──
      const triSize = isMobile ? 5 : 6;
      ctx.save();
      ctx.translate(cx, cy);
      // Triangle always points up on the minimap (since we rotate the world)
      ctx.fillStyle = cyberCyan(0.95);
      if (!visualLite) {
        ctx.shadowColor = `rgba(${CYBER_CYAN_RGB}, 0.8)`;
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.moveTo(0, -triSize);       // tip (forward)
      ctx.lineTo(-triSize * 0.55, triSize * 0.4);  // back-left
      ctx.lineTo(triSize * 0.55, triSize * 0.4);   // back-right
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      // ── Player center pulse glow ──
      if (!visualLite) {
        const glowR = 4 + pulse * 2;
        ctx.fillStyle = cyberCyan(0.1 + pulse * 0.08);
        ctx.beginPath();
        ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── North indicator (rotates with player) ──
      if (!visualLite) {
        ctx.save();
        ctx.font = `${isMobile ? 8 : 9}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // North (С) label — positioned at the edge of the circle based on world north
        const northAngle = Math.PI / 2 + yaw; // north is -Z in Three.js
        const labelR = r - (isMobile ? 10 : 14);
        const nLabelX = cx + Math.cos(northAngle) * labelR;
        const nLabelY = cy - Math.sin(northAngle) * labelR;
        ctx.fillStyle = cyberCyan(0.45);
        ctx.fillText('С', nLabelX, nLabelY);
        ctx.restore();
      }

      ctx.restore(); // undo circular clip

      // ── Radial gradient fade-out edge mask ──
      if (!visualLite) {
        const fadeGrad = ctx.createRadialGradient(cx, cy, r * 0.65, cx, cy, r);
        fadeGrad.addColorStop(0, 'rgba(0,0,0,0)');
        fadeGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
        fadeGrad.addColorStop(1, 'rgba(4,8,18,0.92)');
        ctx.fillStyle = fadeGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Outer ring border ──
      ctx.strokeStyle = cyberCyan(0.25);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Subtle outer glow ring
      if (!visualLite) {
        ctx.strokeStyle = cyberCyan(0.08 + pulse * 0.05);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Continue rAF loop when visible
      if (isVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [sceneConfig, isVisible, mapSize, mapRadius, viewRadius, playerPos, visualLite, reducedMotion, isMobile]);

  /* ── IntersectionObserver: pause rAF when off-screen ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisibleRef.current;
        isVisibleRef.current = entry.isIntersecting;
        if (!wasVisible && entry.isIntersecting && sceneConfig && isVisible) {
          animFrameRef.current = requestAnimationFrame(animateFnRef.current);
        }
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sceneConfig, isVisible]);

  if (!sceneConfig) return null;

  /* ── Positioning: desktop = top-right (via HUD layout slot), mobile = top-right ── */
  const containerStyle: React.CSSProperties = isMobile
    ? {
        top: 56, // below mobile top bar
        right: 8,
        zIndex: UI_LAYERS.HUD,
        ...quietStyle,
      }
    : {
        top: explorationMinimapTopPx(),
        right: EXPLORATION_HUD_LAYOUT.RIGHT_INSET,
        zIndex: UI_LAYERS.HUD,
        ...quietStyle,
      };

  return (
    <AnimatePresence>
      {mode === 'exploration' && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
          transition={{ duration: reducedMotion ? 0 : 0.25, ease: 'easeOut' }}
          ref={containerRef}
          data-exploration-ui
          data-testid="minimap-component"
          className="fixed flex flex-col items-center"
          style={containerStyle}
        >
          {/* Glass-morphism circular container */}
          <div
            className="relative flex items-center justify-center"
            role="img"
            aria-label={`Миникарта: ${currentSceneId}. Показывает позицию игрока, NPC и точки интереса.`}
            aria-live="polite"
            style={{
              width: mapSize + 4,
              height: mapSize + 4,
              borderRadius: '50%',
              background: 'rgba(6, 10, 22, 0.75)',
              backdropFilter: `blur(${visualLite ? 4 : 10}px)`,
              WebkitBackdropFilter: `blur(${visualLite ? 4 : 10}px)`,
              border: '1.5px solid rgb(var(--cyber-cyan-rgb) / 0.2)',
              boxShadow: `0 0 16px rgba(${CYBER_CYAN_RGB}, 0.08), inset 0 0 16px rgba(0, 0, 0, 0.3)`,
              cursor: expanded ? 'pointer' : undefined,
              overflow: 'hidden',
            }}
            onClick={handleToggle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle();
              }
            }}
            tabIndex={0}
            aria-roledescription="minimap toggle"
          >
            {/* Canvas */}
            <canvas
              ref={canvasRef}
              className="rounded-full"
              style={{
                width: mapSize,
                height: mapSize,
                imageRendering: 'auto',
              }}
            />

            {/* Scanline overlay (quality gate) */}
            {!visualLite && (
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
                }}
              />
            )}

            {/* Corner brackets — decorative cyberpunk accents */}
            <span
              className="absolute pointer-events-none"
              style={{
                top: 2,
                left: 2,
                width: 10,
                height: 10,
                borderTop: '1px solid rgb(var(--cyber-cyan-rgb) / 0.25)',
                borderLeft: '1px solid rgb(var(--cyber-cyan-rgb) / 0.25)',
              }}
            />
            <span
              className="absolute pointer-events-none"
              style={{
                top: 2,
                right: 2,
                width: 10,
                height: 10,
                borderTop: '1px solid rgb(var(--cyber-cyan-rgb) / 0.25)',
                borderRight: '1px solid rgb(var(--cyber-cyan-rgb) / 0.25)',
              }}
            />
            <span
              className="absolute pointer-events-none"
              style={{
                bottom: 2,
                left: 2,
                width: 10,
                height: 10,
                borderBottom: '1px solid rgb(var(--cyber-cyan-rgb) / 0.25)',
                borderLeft: '1px solid rgb(var(--cyber-cyan-rgb) / 0.25)',
              }}
            />
            <span
              className="absolute pointer-events-none"
              style={{
                bottom: 2,
                right: 2,
                width: 10,
                height: 10,
                borderBottom: '1px solid rgb(var(--cyber-cyan-rgb) / 0.25)',
                borderRight: '1px solid rgb(var(--cyber-cyan-rgb) / 0.25)',
              }}
            />

            {/* M key hint — hidden on touch devices */}
            {!isMobile && (
              <div
                className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-none opacity-50"
                aria-hidden="true"
              >
                <kbd
                  className="text-[7px] font-mono px-1 py-0.5 rounded"
                  style={{
                    color: cyberCyan(0.6),
                    border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.15)',
                    background: 'rgba(0, 0, 0, 0.4)',
                  }}
                >
                  M
                </kbd>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
