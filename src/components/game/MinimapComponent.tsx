/* ─────────────────────────────────────────────────────────────────────────────
   Volodka RPG – Circular Minimap Component

   A player-centric rotating circular minimap rendered to a <canvas>.
   The map rotates so the player's facing direction always points "up".
   Shows nearby NPCs colored by disposition, quest markers, scene exits,
   a breadcrumb trail, and an optional radar sweep effect.

   Features:
   - Circular player-centric rendering (player always at center, north rotates)
   - NPC dots colored by disposition: green (friendly), red (hostile), yellow (neutral)
   - Quest objective markers via getQuestMarker() — the same live API the compass
     (CompassPOIMarkers) and the world map use; yellow diamond = active objective,
     green = ready to turn in
   - Edge-clamping: off-radius quest targets snap to the rim with a direction
     arrow (Cyberpunk/GTA style); targets in another scene point at the scene
     exit that leads toward them
   - Scene exit dots
   - Breadcrumb trail (recent player movement)
   - Radar sweep animation
   - Glass-morphism frame with corner brackets
   - Toggleable via M key / tap: expanded map ↔ compact 44px pill
     (north arrow + quest target with distance), smooth transition
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
  getQuestMarker,
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
  MINIMAP_ZOOM_LEVELS,
  MINIMAP_ZOOM_DEFAULT_INDEX,
  MINIMAP_VIEW_RADIUS_MIN,
  clampMinimapZoomIndex,
  readMinimapZoomIndex,
  writeMinimapZoomIndex,
  getMinimapZoomRadiusMultiplier,
} from '@/engine/minimapZoomSetting';
import { hapticLight } from '@/shared/utils/hapticFeedback';
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
/** Максимум квест-маркеров на миникарте одновременно (как в компасе) */
const MAX_QUEST_MARKERS = 4;
/** Цвет маркера активной цели квеста (жёлтый) */
const QUEST_ACTIVE_COLOR = '#fbbf24';
/** Цвет маркера квеста, готового к сдаче (зелёный) */
const QUEST_READY_COLOR = '#00ff66';
/** Размер свёрнутой «таблетки» — тапабельная зона (px) */
const PILL_SIZE = 44;
/** Частота обновления свёрнутой «таблетки» (мс) — дешевле rAF-цикла */
const PILL_UPDATE_INTERVAL_MS = 200;

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
  questId: string;
  /** Позиция в ТЕКУЩЕЙ сцене: сама цель либо ведущий к ней выход */
  worldX: number;
  worldZ: number;
  /** Истинная цель в другой сцене — маркер ведёт к выходу */
  offScene: boolean;
  /** Название сцены цели (подпись в свёрнутой «таблетке») */
  targetSceneName: string;
  /** Все цели квеста выполнены — готов к сдаче */
  ready: boolean;
}

/** Ближайший к точке выход сцены — направление «в другую локацию» */
function findNearestExit(
  exits: ReadonlyArray<{ position: [number, number, number] }>,
  x: number,
  z: number,
): { position: [number, number, number] } | null {
  let best: { position: [number, number, number] } | null = null;
  let bestDist = Infinity;
  for (const exit of exits) {
    const dx = exit.position[0] - x;
    const dz = exit.position[2] - z;
    const d = dx * dx + dz * dz;
    if (d < bestDist) {
      bestDist = d;
      best = exit;
    }
  }
  return best;
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

  /* ── Zoom (масштаб обзора) — persisted, контекстные кнопки на рамке ── */
  const [zoomIndex, setZoomIndex] = useState(() => readMinimapZoomIndex());
  useEffect(() => {
    writeMinimapZoomIndex(zoomIndex);
  }, [zoomIndex]);
  /** delta: +1 — приблизить («крупный»), −1 — отдалить («обзор»). */
  const changeZoom = useCallback((delta: number) => {
    hapticLight();
    setZoomIndex((prev) => clampMinimapZoomIndex(prev + delta));
  }, []);
  const handleZoomIn = useCallback(() => changeZoom(+1), [changeZoom]);
  const handleZoomOut = useCallback(() => changeZoom(-1), [changeZoom]);
  const zoomLabel = MINIMAP_ZOOM_LEVELS[zoomIndex]?.labelRu ?? MINIMAP_ZOOM_LEVELS[MINIMAP_ZOOM_DEFAULT_INDEX].labelRu;

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

  /* ── Compute view radius from scene dimensions × zoom level ── */
  const viewRadius = useMemo(() => {
    const base = (() => {
      if (!sceneConfig) return BASE_VIEW_RADIUS;
      const [sceneW, sceneD] = sceneConfig.size;
      const halfDiag = Math.sqrt(sceneW * sceneW + sceneD * sceneD) / 2;
      // Show at least half the scene diagonal or the base radius
      return Math.max(BASE_VIEW_RADIUS, halfDiag);
    })();
    // Приближение/отдаление: множитель уровня × базовый радиус сцены
    return Math.max(MINIMAP_VIEW_RADIUS_MIN, base * getMinimapZoomRadiusMultiplier(zoomIndex));
  }, [sceneConfig, zoomIndex]);

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

  /* ── Quest markers ──
     Живой источник — getQuestMarker() из questSelectors: ровно тот же API,
     которым пользуются компас (CompassPOIMarkers) и карта мира. Раньше здесь
     читалось несуществующее поле q.markerWorldPos, из-за чего маркеры
     никогда не рисовались.

     Цель может находиться в другой сцене. Простое надёжное решение:
     маркер ставится на выход текущей сцены, который ведёт прямо в сцену цели
     (exit.targetScene === marker.sceneId); если прямого выхода нет — на
     ближайший к игроку выход: любой путь в другую локацию начинается
     с выхода из текущей. Такие маркеры рисуются полупрозрачными —
     «цель не здесь, идите к выходу». */
  const questMarkers = useMemo<MinimapQuestMarker[]>(() => {
    const markers: MinimapQuestMarker[] = [];

    for (const quest of activeQuests) {
      const marker = getQuestMarker(quest.questId);
      if (!marker) continue;

      // «Готов к сдаче» — все записанные цели квеста выполнены
      const objectiveValues = Object.values(quest.objectives);
      const ready = objectiveValues.length > 0 && objectiveValues.every(Boolean);
      const targetSceneName = SCENE_CONFIG[marker.sceneId]?.name ?? marker.sceneId;

      if (marker.sceneId === currentSceneId) {
        markers.push({
          questId: quest.questId,
          worldX: marker.position[0],
          worldZ: marker.position[2],
          offScene: false,
          targetSceneName,
          ready,
        });
        continue;
      }

      // Цель в другой сцене — ведём к выходу
      const exits = sceneConfig?.exits ?? [];
      const directExit = exits.find((exit) => exit.targetScene === marker.sceneId);
      const exit = directExit ?? findNearestExit(exits, playerPos[0], playerPos[2]);
      if (!exit) continue; // выходов нет — направление не определить

      markers.push({
        questId: quest.questId,
        worldX: exit.position[0],
        worldZ: exit.position[2],
        offScene: true,
        targetSceneName,
        ready,
      });
    }

    // Приоритет: готовые к сдаче → цели в этой сцене → цели в другой локации
    markers.sort((a, b) => {
      if (a.ready !== b.ready) return a.ready ? -1 : 1;
      if (a.offScene !== b.offScene) return a.offScene ? 1 : -1;
      return 0;
    });
    return markers.slice(0, MAX_QUEST_MARKERS);
  }, [activeQuests, currentSceneId, sceneConfig, playerPos]);

  /* ── Mirror latest data into refs for the rAF loop ── */
  const npcsInSceneRef = useRef(npcsInScene);
  const sceneExitsRef = useRef(sceneExits);
  const questMarkersRef = useRef(questMarkers);
  npcsInSceneRef.current = npcsInScene;
  sceneExitsRef.current = sceneExits;
  questMarkersRef.current = questMarkers;

  /* ── Свёрнутая «таблетка»: живые север и квест-цель без rAF-цикла ── */
  const [pillState, setPillState] = useState<{
    northDeg: number;
    questLabel: string | null;
    questReady: boolean;
  }>({ northDeg: 0, questLabel: null, questReady: false });

  useEffect(() => {
    if (expanded || mode !== 'exploration') return;

    const update = () => {
      // Север относительно взгляда игрока: карта вращается, «С» уходит по кругу.
      // Стрелка «↑» повёрнутая на -yaw указывает на север (см. метку «С» на карте).
      const yaw = sharedPlayerRotationRef.current;
      const northDeg = Math.round((((-yaw * 180) / Math.PI) % 360 + 360) % 360) % 360;

      const primary = questMarkersRef.current[0];
      let questLabel: string | null = null;
      let questReady = false;
      if (primary) {
        questReady = primary.ready;
        if (primary.offScene) {
          // Цель в другой локации — показываем её название
          questLabel = primary.targetSceneName;
        } else {
          const livePos = sharedPlayerPositionRef.current;
          const px = Number.isFinite(livePos.x) ? livePos.x : playerPos[0];
          const pz = Number.isFinite(livePos.z) ? livePos.z : playerPos[2];
          const dist = Math.hypot(primary.worldX - px, primary.worldZ - pz);
          questLabel = `${Math.round(dist)} м`;
        }
      }

      setPillState((prev) =>
        prev.northDeg === northDeg
          && prev.questLabel === questLabel
          && prev.questReady === questReady
          ? prev
          : { northDeg, questLabel, questReady },
      );
    };

    update();
    const id = window.setInterval(update, PILL_UPDATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [expanded, mode, playerPos]);

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

      // ── Quest markers — ПОВЕРХ виньетки, чтобы не гаснуть у края ──
      // Жёлтый ромб — активная цель, зелёный — квест готов к сдаче.
      // Цель за пределами радиуса прижимается к ободу (edge-clamping)
      // и получает стрелку направления — как в Cyberpunk/GTA. Маркеры целей
      // в другой сцене ведут к выходу и рисуются полупрозрачными.
      for (const marker of questMarkersRef.current) {
        const [mx, my] = worldToMap(marker.worldX, marker.worldZ, playerX, playerZ, yaw);
        const ddx = mx - cx;
        const ddy = my - cy;
        const distFromCenter = Math.sqrt(ddx * ddx + ddy * ddy);
        const clampR = innerR - 9;
        const onEdge = distFromCenter > clampR;
        const k = onEdge && distFromCenter > 0 ? clampR / distFromCenter : 1;
        const clx = cx + ddx * k;
        const cly = cy + ddy * k;

        const markerColor = marker.ready ? QUEST_READY_COLOR : QUEST_ACTIVE_COLOR;
        const markerAlpha = marker.offScene ? 0.75 : 1;
        const dSize = visualLite ? 3 : 4;

        ctx.save();
        ctx.globalAlpha = markerAlpha;
        ctx.translate(clx, cly);
        // Вращение ромба — только на реальной позиции (у края важнее читаемость)
        if (!onEdge && !visualLite && !reducedMotion) {
          ctx.rotate((pulsePhaseRef.current * 1.2) % (Math.PI * 2));
        }
        // Пульсирующие кольца свечения
        if (!visualLite) {
          const questPulse = Math.sin(pulsePhaseRef.current * 2.5) * 0.5 + 0.5;
          const rgb = marker.ready ? '0, 255, 102' : '251, 191, 36';
          ctx.strokeStyle = `rgba(${rgb}, ${0.3 + questPulse * 0.4})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, dSize + 2 + questPulse * 2, 0, Math.PI * 2);
          ctx.stroke();
          // Внешнее пульсирующее кольцо
          ctx.strokeStyle = `rgba(${rgb}, ${0.15 + questPulse * 0.15})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, dSize + 5 + questPulse * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Ромб (цель квеста)
        ctx.fillStyle = markerColor;
        ctx.beginPath();
        ctx.moveTo(0, -dSize);
        ctx.lineTo(dSize, 0);
        ctx.lineTo(0, dSize);
        ctx.lineTo(-dSize, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Стрелка на ободе — направление на цель за пределами миникарты
        if (onEdge) {
          const angle = Math.atan2(ddy, ddx);
          ctx.save();
          ctx.globalAlpha = markerAlpha;
          ctx.translate(cx + Math.cos(angle) * (innerR - 1.5), cy + Math.sin(angle) * (innerR - 1.5));
          ctx.rotate(angle);
          ctx.fillStyle = markerColor;
          ctx.beginPath();
          ctx.moveTo(3.5, 0);
          ctx.lineTo(-2.5, -3);
          ctx.lineTo(-2.5, 3);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
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
          <AnimatePresence mode="wait" initial={false}>
            {expanded ? (
              /* ── Развёрнутая круглая миникарта ── */
              <motion.div
                key="minimap-expanded"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? undefined : { opacity: 0, scale: 0.85 }}
                transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
                className="relative flex items-center justify-center"
                role="img"
                aria-label="Миникарта"
                title="Свернуть миникарту"
                style={{
                  width: mapSize + 4,
                  height: mapSize + 4,
                  borderRadius: '50%',
                  background: 'rgba(6, 10, 22, 0.75)',
                  backdropFilter: `blur(${visualLite ? 4 : 10}px)`,
                  WebkitBackdropFilter: `blur(${visualLite ? 4 : 10}px)`,
                  border: '1.5px solid rgb(var(--cyber-cyan-rgb) / 0.2)',
                  boxShadow: `0 0 16px rgba(${CYBER_CYAN_RGB}, 0.08), inset 0 0 16px rgba(0, 0, 0, 0.3)`,
                  cursor: 'pointer',
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
              </motion.div>
            ) : (
              /* ── Свёрнутая «таблетка»: север + квест-цель с дистанцией ──
                 Раньше сворачивание лишь останавливало rAF и оставляло
                 застывший кадр; теперь canvas размонтируется, а вместо него
                 живёт лёгкая 44px «таблетка» (обновление раз в 200 мс). */
              <motion.div
                key="minimap-collapsed"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? undefined : { opacity: 0, scale: 0.7 }}
                transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
              >
                <button
                  type="button"
                  aria-label="Развернуть миникарту"
                  title="Развернуть миникарту"
                  onClick={handleToggle}
                  className="flex flex-col items-center justify-center gap-0.5 select-none"
                  style={{
                    width: PILL_SIZE,
                    height: PILL_SIZE,
                    borderRadius: '50%',
                    background: 'rgba(6, 10, 22, 0.75)',
                    backdropFilter: `blur(${visualLite ? 4 : 10}px)`,
                    WebkitBackdropFilter: `blur(${visualLite ? 4 : 10}px)`,
                    border: '1.5px solid rgb(var(--cyber-cyan-rgb) / 0.2)',
                    boxShadow: `0 0 16px rgba(${CYBER_CYAN_RGB}, 0.08), inset 0 0 16px rgba(0, 0, 0, 0.3)`,
                    cursor: 'pointer',
                  }}
                >
                  {/* Север — стрелка вращается вместе с игроком */}
                  <span
                    aria-hidden="true"
                    className="font-mono leading-none"
                    style={{
                      display: 'inline-block',
                      fontSize: 11,
                      color: cyberCyan(0.75),
                      transform: `rotate(${pillState.northDeg}deg)`,
                      transition: 'transform 0.2s linear',
                    }}
                  >
                    ↑
                  </span>

                  {/* Квест-цель: ромб + дистанция или название локации */}
                  {pillState.questLabel ? (
                    <span
                      aria-hidden="true"
                      className="flex items-center gap-1 leading-none"
                    >
                      <span
                        style={{
                          fontSize: 9,
                          color: pillState.questReady ? QUEST_READY_COLOR : QUEST_ACTIVE_COLOR,
                          textShadow: `0 0 4px ${
                            pillState.questReady ? QUEST_READY_COLOR : QUEST_ACTIVE_COLOR
                          }`,
                        }}
                      >
                        ◆
                      </span>
                      <span
                        className="font-mono"
                        style={{ fontSize: 8, color: 'rgba(226, 232, 240, 0.85)' }}
                      >
                        {pillState.questLabel.length > 10
                          ? `${pillState.questLabel.slice(0, 9)}…`
                          : pillState.questLabel}
                      </span>
                    </span>
                  ) : null}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Масштаб обзора (только в развёрнутом виде) ──
              Строчка живёт ПОД кругом, внутри зарезервированного слота
              MINIMAP_HEIGHT (196px): круг 164px + строчка 18px — правая
              колонка HUD не наезжает на квест-карту. */}
          {expanded && (
            <div
              className="flex items-center gap-1 select-none"
              style={{ marginTop: 2, height: 18 }}
              role="group"
              aria-label="Масштаб миникарты"
            >
              <button
                type="button"
                aria-label="Отдалить миникарту"
                title="Отдалить обзор"
                disabled={zoomIndex === 0}
                onClick={handleZoomOut}
                className="flex items-center justify-center transition-opacity disabled:opacity-25 disabled:cursor-default"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  fontSize: 12,
                  lineHeight: 1,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: cyberCyan(0.8),
                  border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
                  background: 'rgba(2, 6, 16, 0.72)',
                  boxShadow: `0 0 8px rgba(${CYBER_CYAN_RGB}, 0.06)`,
                  cursor: 'pointer',
                }}
              >
                −
              </button>
              <span
                className="font-mono whitespace-nowrap text-center"
                style={{ fontSize: 8, color: cyberCyan(0.55), minWidth: 40 }}
                aria-hidden="true"
              >
                {zoomLabel}
              </span>
              <button
                type="button"
                aria-label="Приблизить миникарту"
                title="Приблизить обзор"
                disabled={zoomIndex === MINIMAP_ZOOM_LEVELS.length - 1}
                onClick={handleZoomIn}
                className="flex items-center justify-center transition-opacity disabled:opacity-25 disabled:cursor-default"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  fontSize: 12,
                  lineHeight: 1,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: cyberCyan(0.8),
                  border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
                  background: 'rgba(2, 6, 16, 0.72)',
                  boxShadow: `0 0 8px rgba(${CYBER_CYAN_RGB}, 0.06)`,
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
