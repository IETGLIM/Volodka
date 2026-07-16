
/* ─── Volodka RPG – Mini-map (AAA+ Overhaul) ───
   Cardinal directions (N, S, E, W), scene exit indicators,
   NPC colored dots, player direction triangle, pulsing glow,
   backdrop-blur transparent background.
*/

import { useRef, useEffect, useMemo } from 'react';
import { selectNpcRelations, useMiniMapState } from '@/store/selectors';
import { SCENE_CONFIG } from '@/config/scenes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { explorationMinimapTopPx, EXPLORATION_HUD_LAYOUT } from '@/shared/constants/hudLayout';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { useActiveQuests, getQuestMarker } from '@/store/questStore';
import { cyberCyan } from '@/shared/constants/cyberPalette';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';

const MAP_SIZE = 160;
const MAP_PADDING = 16; // Extra padding for cardinal labels
const INNER_PADDING = 4;

/* ── NPC color map (distinct per NPC) ── */
const NPC_DOT_COLORS: Record<string, string> = {
  albert: '#d4a030',         // gold
  zarema: '#e87a9f',         // pink
  cafe_barista: '#f0c040',   // yellow
  office_alexander: '#cc2020', // red
  office_colleague: '#a0a0c0', // silver-blue
  maria: '#40d0e0',          // cyan
  office_dmitry: '#6a8a30',  // green
};

export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const pulsePhaseRef = useRef(0);
  const isVisibleRef = useRef(true); // tracks visibility for rAF perf
  const animateFnRef = useRef<FrameRequestCallback>(() => {}); // stored for IntersectionObserver restart
  const quietStyle = useHudQuietStyle();

  const { currentSceneId, playerPos, playerRotation, npcStates } = useMiniMapState();

  const activeQuests = useActiveQuests();
  const sceneConfig = SCENE_CONFIG[currentSceneId];

  // Get NPCs in current scene
  const npcsInScene = useMemo(() => {
    const result: { id: string; name: string; position: [number, number, number]; relation: number }[] = [];
    const relations = selectNpcRelations();

    for (const npcDef of ALL_NPC_DEFINITIONS) {
      const state = npcStates[npcDef.id];
      if (state && state.sceneId === currentSceneId) {
        const rel = relations.find((r) => r.npcId === npcDef.id);
        result.push({
          id: npcDef.id,
          name: npcDef.name,
          position: state.position,
          relation: rel?.value ?? 50,
        });
      }
    }
    return result;
  }, [npcStates, currentSceneId]);

  // Quest markers
  const questMarkers = useMemo(() => {
    return activeQuests
      .map((q) => getQuestMarker(q.questId))
      .filter((m): m is NonNullable<typeof m> => m !== null && m.sceneId === currentSceneId);
  }, [activeQuests, currentSceneId]);

  // Get scene exits for direction indicators
  const sceneExits = useMemo(() => {
    if (!sceneConfig?.exits) return [];
    return sceneConfig.exits.map((exit) => ({
      targetScene: exit.targetScene,
      label: exit.label,
      position: exit.position,
      targetName: SCENE_CONFIG[exit.targetScene]?.name ?? exit.targetScene,
    }));
  }, [sceneConfig]);

  const playerPosRef = useRef(playerPos);
  const playerRotationRef = useRef(playerRotation);
  const npcsInSceneRef = useRef(npcsInScene);
  const questMarkersRef = useRef(questMarkers);
  const sceneExitsRef = useRef(sceneExits);
  playerPosRef.current = playerPos;
  playerRotationRef.current = playerRotation;
  npcsInSceneRef.current = npcsInScene;
  questMarkersRef.current = questMarkers;
  sceneExitsRef.current = sceneExits;

  // ── Breadcrumb trail: last N player positions ──
  const MAX_TRAIL = 40;
  const TRAIL_SAMPLE_INTERVAL = 8; // record every N frames
  const trailRef = useRef<Array<{ x: number; z: number }>>([]);
  const trailFrameCountRef = useRef(0);
  const prevSceneIdRef = useRef(currentSceneId);

  // Reset trail on scene change
  if (currentSceneId !== prevSceneIdRef.current) {
    trailRef.current = [];
    prevSceneIdRef.current = currentSceneId;
  }

  // Animation loop for pulsing glow
  useEffect(() => {
    if (!sceneConfig) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [sceneW, sceneD] = sceneConfig.size;
    const drawSize = MAP_SIZE - MAP_PADDING * 2 - INNER_PADDING * 2;
    const scaleX = drawSize / sceneW;
    const scaleZ = drawSize / sceneD;

    const toMapX = (worldX: number) => MAP_PADDING + INNER_PADDING + (worldX + sceneW / 2) * scaleX;
    const toMapY = (worldZ: number) => MAP_PADDING + INNER_PADDING + (worldZ + sceneD / 2) * scaleZ;

    const animate: FrameRequestCallback = () => {
      animateFnRef.current = animate;
      pulsePhaseRef.current += 0.03;
      const pulse = Math.sin(pulsePhaseRef.current) * 0.5 + 0.5; // 0..1

      // Clear
      ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE);

      // Background — semi-transparent dark panel
      ctx.fillStyle = 'rgba(8, 12, 28, 0.85)';
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

      // Inner map area background — slightly lighter for depth
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(
        MAP_PADDING + INNER_PADDING,
        MAP_PADDING + INNER_PADDING,
        drawSize,
        drawSize,
      );

      // Border — subtle cyberpunk cyan frame
      ctx.strokeStyle = cyberCyan(0.2);
      ctx.lineWidth = 1;
      ctx.strokeRect(
        MAP_PADDING + INNER_PADDING - 1,
        MAP_PADDING + INNER_PADDING - 1,
        drawSize + 2,
        drawSize + 2,
      );

      // Grid lines — subtle cyan reference grid
      ctx.strokeStyle = cyberCyan(0.04);
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 4; i++) {
        const gx = MAP_PADDING + INNER_PADDING + (drawSize * i) / 4;
        const gy = MAP_PADDING + INNER_PADDING + (drawSize * i) / 4;
        ctx.beginPath();
        ctx.moveTo(gx, MAP_PADDING + INNER_PADDING);
        ctx.lineTo(gx, MAP_PADDING + INNER_PADDING + drawSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(MAP_PADDING + INNER_PADDING, gy);
        ctx.lineTo(MAP_PADDING + INNER_PADDING + drawSize, gy);
        ctx.stroke();
      }

      // ── Scene exit indicators (arrows at map edges) ──
      for (const exit of sceneExitsRef.current) {
        const ex = toMapX(exit.position[0]);
        const ey = toMapY(exit.position[2]);

        // Clamp to inner map area
        const clampedX = Math.max(MAP_PADDING + INNER_PADDING + 4, Math.min(MAP_PADDING + INNER_PADDING + drawSize - 4, ex));
        const clampedY = Math.max(MAP_PADDING + INNER_PADDING + 4, Math.min(MAP_PADDING + INNER_PADDING + drawSize - 4, ey));

        // Draw small arrow pointing outward
        ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.beginPath();

        // Determine arrow direction based on position relative to center
        const cx = MAP_PADDING + INNER_PADDING + drawSize / 2;
        const cy = MAP_PADDING + INNER_PADDING + drawSize / 2;
        const dx = clampedX - cx;
        const dy = clampedY - cy;
        const angle = Math.atan2(dy, dx);

        // Arrow triangle
        const arrowSize = 4;
        ctx.save();
        ctx.translate(clampedX, clampedY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(arrowSize, 0);
        ctx.lineTo(-arrowSize * 0.6, -arrowSize * 0.5);
        ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // ── Quest markers (diamond shape with glow) ──
      for (const marker of questMarkersRef.current) {
        const mx = toMapX(marker.position[0]);
        const my = toMapY(marker.position[2]);
        const dSize = 4; // half-width of 8px diamond
        ctx.save();
        ctx.shadowColor = '#fbbf24'; // amber glow
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(mx, my - dSize);       // top vertex
        ctx.lineTo(mx + dSize, my);       // right vertex
        ctx.lineTo(mx, my + dSize);       // bottom vertex
        ctx.lineTo(mx - dSize, my);       // left vertex
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // ── NPC dots (colored per NPC) ──
      for (const npc of npcsInSceneRef.current) {
        const nx = toMapX(npc.position[0]);
        const ny = toMapY(npc.position[2]);
        const color = NPC_DOT_COLORS[npc.id] ?? 'rgba(148, 163, 184, 0.6)';

        // Outer ring
        ctx.fillStyle = `${color}40`; // 25% opacity
        ctx.beginPath();
        ctx.arc(nx, ny, 5, 0, Math.PI * 2);
        ctx.fill();

        // Inner dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Player breadcrumb trail (fading dots) ──
      trailFrameCountRef.current++;
      if (trailFrameCountRef.current % TRAIL_SAMPLE_INTERVAL === 0) {
        trailRef.current.push({ x: playerPosRef.current[0], z: playerPosRef.current[2] });
        if (trailRef.current.length > MAX_TRAIL) {
          trailRef.current.shift();
        }
      }
      const trail = trailRef.current;
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        const tx = toMapX(t.x);
        const ty = toMapY(t.z);
        const alpha = ((i + 1) / trail.length) * 0.35;
        const radius = 0.8 + (i / trail.length) * 1.2;
        ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`;
        ctx.beginPath();
        ctx.arc(tx, ty, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Player dot with direction indicator and pulsing glow ──
      const px = toMapX(playerPosRef.current[0]);
      const py = toMapY(playerPosRef.current[2]);

      // Pulsing outer glow
      const glowSize = 5 + pulse * 3;
      const glowAlpha = 0.15 + pulse * 0.1;
      ctx.fillStyle = cyberCyan(glowAlpha);
      ctx.beginPath();
      ctx.arc(px, py, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Secondary glow ring
      ctx.strokeStyle = cyberCyan(0.2 + pulse * 0.15);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(px, py, 6 + pulse * 2, 0, Math.PI * 2);
      ctx.stroke();

      // Direction triangle (small triangle pointing in player facing direction)
      const dirAngle = playerRotationRef.current; // Y-axis rotation
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-dirAngle + Math.PI / 2); // Adjust for coordinate system
      ctx.fillStyle = cyberCyan(0.9);
      ctx.beginPath();
      ctx.moveTo(0, -6);     // tip (forward)
      ctx.lineTo(-3, 2);     // back-left
      ctx.lineTo(3, 2);      // back-right
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // ── Radar sweep effect on minimap ──
      const sweepAngle = (pulsePhaseRef.current * 0.4) % (Math.PI * 2);
      const sweepCx = px;
      const sweepCy = py;
      const sweepRadius = 30;
      ctx.save();
      ctx.globalAlpha = 0.08 + pulse * 0.04;
      ctx.beginPath();
      ctx.moveTo(sweepCx, sweepCy);
      ctx.arc(sweepCx, sweepCy, sweepRadius, sweepAngle, sweepAngle + 0.8);
      ctx.closePath();
      const sweepFill = ctx.createRadialGradient(sweepCx, sweepCy, 0, sweepCx, sweepCy, sweepRadius);
      sweepFill.addColorStop(0, 'rgba(34, 211, 238, 0.3)');
      sweepFill.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = sweepFill;
      ctx.fill();
      ctx.restore();

      // ── Cardinal direction labels ──
      const centerX = MAP_PADDING + INNER_PADDING + drawSize / 2;
      const centerY = MAP_PADDING + INNER_PADDING + drawSize / 2;
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // С (North)
      ctx.fillStyle = cyberCyan(0.5);
      ctx.fillText('С', centerX, MAP_PADDING - 2);
      // Ю (South)
      ctx.fillStyle = cyberCyan(0.3);
      ctx.fillText('Ю', centerX, MAP_SIZE - MAP_PADDING + 4);
      // З (West)
      ctx.fillStyle = cyberCyan(0.3);
      ctx.fillText('З', MAP_PADDING - 4, centerY);
      // В (East)
      ctx.fillStyle = cyberCyan(0.3);
      ctx.fillText('В', MAP_SIZE - MAP_PADDING + 4, centerY);

      // Small tick marks for cardinal directions
      ctx.strokeStyle = cyberCyan(0.2);
      ctx.lineWidth = 1;
      // N tick
      ctx.beginPath();
      ctx.moveTo(centerX, MAP_PADDING + INNER_PADDING - 2);
      ctx.lineTo(centerX, MAP_PADDING + INNER_PADDING + 3);
      ctx.stroke();
      // S tick
      ctx.beginPath();
      ctx.moveTo(centerX, MAP_PADDING + INNER_PADDING + drawSize - 3);
      ctx.lineTo(centerX, MAP_PADDING + INNER_PADDING + drawSize + 2);
      ctx.stroke();
      // W tick
      ctx.beginPath();
      ctx.moveTo(MAP_PADDING + INNER_PADDING - 2, centerY);
      ctx.lineTo(MAP_PADDING + INNER_PADDING + 3, centerY);
      ctx.stroke();
      // E tick
      ctx.beginPath();
      ctx.moveTo(MAP_PADDING + INNER_PADDING + drawSize - 3, centerY);
      ctx.lineTo(MAP_PADDING + INNER_PADDING + drawSize + 2, centerY);
      ctx.stroke();

      // Only continue rAF loop when minimap is visible
      if (isVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [sceneConfig]);

  // IntersectionObserver: skip rAF when minimap is off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisibleRef.current;
        isVisibleRef.current = entry.isIntersecting;
        // Resume animation loop when becoming visible again
        if (!wasVisible && entry.isIntersecting && sceneConfig) {
          animFrameRef.current = requestAnimationFrame(animateFnRef.current);
        }
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sceneConfig]);

  if (!sceneConfig) return null;

  return (
    <div
      ref={containerRef}
      className="fixed pointer-events-none hidden lg:block relative minimap-ambient-pulse minimap-scanline-overlay"
      data-exploration-ui
      style={{
        top: explorationMinimapTopPx(),
        right: EXPLORATION_HUD_LAYOUT.RIGHT_INSET,
        zIndex: UI_LAYERS.HUD,
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        boxShadow: '0 0 20px rgba(0,0,0,0.4), inset 0 0 0 1px rgb(var(--cyber-cyan-rgb) / 0.1)',
        ...quietStyle,
      }}
    >
      <canvas
        ref={canvasRef}
        width={MAP_SIZE}
        height={MAP_SIZE}
        className="rounded-md"
        style={{
          width: MAP_SIZE,
          height: MAP_SIZE,
          imageRendering: 'auto',
        }}
      />
      {/* Scanline sweep overlay */}
      <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none">
        <div className="minimap-scanline-sweep absolute inset-0" />
      </div>
      {/* Fast Travel hint */}
      <div
        className="flex items-center justify-center gap-1 mt-1 py-0.5 px-2 rounded"
        style={{
          // CSS vars: --cyber-cyan-rgb for hint bar tint
          background: 'rgb(var(--cyber-cyan-rgb) / 0.06)',
          border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.12)',
        }}
      >
        <span className="text-[8px] text-cyan-400/50 font-mono">🧭</span>
        <kbd className="text-[8px] text-cyan-400/50 font-mono px-1 py-0.5 rounded border border-cyan-500/15 bg-cyan-950/30">F</kbd>
        <span className="text-[8px] text-slate-500/50 font-mono">Быстрый переход</span>
      </div>
    </div>
  );
}
