/* ─── Volodka RPG – Scene POI Compass (proximity radar) ─── */

import { memo, useEffect, useRef } from 'react';
import { TRIGGER_ZONES, isTriggerZoneAvailable } from '@/data/triggerZones';
import type { TriggerZone } from '@/data/triggerZones';
import { useGameStore } from '@/store/gameStore';
import { usePanelStack } from '@/components/game/orchestrator/PanelStackContext';
import { EXPLORATION_HUD_LAYOUT, explorationWeatherTopPx } from '@/shared/constants/hudLayout';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGameplayPresentationProfile, isExplorationHudProfile } from '@/hooks/useGameplayPresentationProfile';

/* ── Constants ── */
const COMPASS_SIZE = 120;
const CENTER = COMPASS_SIZE / 2; // 60
const RADIUS = COMPASS_SIZE / 2 - 4; // 56 – inner padding
const MAX_DISTANCE = 8; // meters
const LABEL_RING_INNER = 0.6; // show label only in outer 40%
const MARKER_SIZE = 5;
const PLAYER_DOT_SIZE = 6;
const SCAN_PERIOD = 4; // seconds per full rotation

/* ── Color helpers ── */
function markerColor(zone: TriggerZone): string {
  if (zone.containerContents) return '#34d399'; // emerald-400 — containers/loot
  if (zone.interactionType === 'talk' || zone.linkedNpcId) return '#fbbf24'; // amber-400 — NPCs
  if (zone.autoTrigger) return '#f87171'; // red-400 — combat/danger
  // examine, read, take, hack, open, use, push, default
  return '#22d3ee'; // cyan-400 — interactable objects
}

function markerGlow(zone: TriggerZone): string {
  if (zone.containerContents) return 'rgba(52,211,153,0.5)';
  if (zone.interactionType === 'talk' || zone.linkedNpcId) return 'rgba(251,191,36,0.5)';
  if (zone.autoTrigger) return 'rgba(248,113,113,0.5)';
  return 'rgba(34,211,238,0.5)';
}

/** Short label for a zone — first 8 chars of interaction label, or truncated id */
function zoneLabel(zone: TriggerZone): string {
  if (zone.interactionLabel) {
    const t = zone.interactionLabel.length > 8 ? zone.interactionLabel.slice(0, 8) + '…' : zone.interactionLabel;
    return t;
  }
  const id = zone.id.replace(/_/g, ' ');
  return id.length > 8 ? id.slice(0, 8) + '…' : id;
}

/* ── Inline <style> for the radar sweep keyframe (avoid external CSS dep) ── */
function RadarSweepStyle() {
  return (
    <style>{`
@keyframes poi-compass-sweep {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.poi-compass-sweep {
  animation: poi-compass-sweep ${SCAN_PERIOD}s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .poi-compass-sweep {
    animation: none;
  }
}
    `}</style>
  );
}

/* ── Main component ── */
export const ScenePoiCompass = memo(function ScenePoiCompass() {
  const profile = useGameplayPresentationProfile();
  const reducedMotion = useEffectiveReducedMotion();
  const quietStyle = useHudQuietStyle();
  const { stack } = usePanelStack();

  /* Hide when not in exploration or any panel is open */
  const panelOpen = stack.length > 0;
  if (!isExplorationHudProfile(profile) || panelOpen) return null;

  return (
    <>
      <RadarSweepStyle />
      <RadarInner reducedMotion={reducedMotion} quietStyle={quietStyle} />
    </>
  );
});

/* ── Inner component — reads store once, uses rAF for DOM updates ── */
const RadarInner = memo(function RadarInner({
  reducedMotion,
  quietStyle,
}: {
  reducedMotion: boolean;
  quietStyle: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<HTMLDivElement>(null);
  const rafId = useRef(0);
  // Store selector values that change infrequently — we snapshot these
  // on every animation frame from the store to avoid re-renders.
  const currentSceneIdRef = useRef(useGameStore.getState().exploration.currentSceneId);
  const flagsRef = useRef(useGameStore.getState().playerState.flags);
  const actRef = useRef(useGameStore.getState().playerState.progression.currentAct ?? 1);
  const ttlFlagsRef = useRef(useGameStore.getState().activeTTLFlags);
  const playerPosRef = useRef<[number, number, number]>(useGameStore.getState().exploration.playerPosition as [number, number, number]);

  // Subscribe to store changes (rare — scene change, flag change) to update refs
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      currentSceneIdRef.current = state.exploration.currentSceneId;
      flagsRef.current = state.playerState.flags;
      actRef.current = state.playerState.progression.currentAct ?? 1;
      ttlFlagsRef.current = state.activeTTLFlags;
      playerPosRef.current = state.exploration.playerPosition as [number, number, number];
    });
    unsubscribeRef.current = unsub;
    return () => unsub();
  }, []);

  // rAF loop — update marker DOM positions directly
  useEffect(() => {
    const mc: HTMLDivElement = markersRef.current!;
    if (!mc) return;

    function tick() {
      const sceneId = currentSceneIdRef.current;
      const flags = flagsRef.current;
      const act = actRef.current;
      const ttlFlags = ttlFlagsRef.current;
      const playerPos = playerPosRef.current;

      // Filter zones for current scene
      const visibleZones: TriggerZone[] = [];
      for (let i = 0; i < TRIGGER_ZONES.length; i++) {
        const z = TRIGGER_ZONES[i];
        if (z.sceneId !== sceneId) continue;
        if (!isTriggerZoneAvailable(z, flags, act, ttlFlags)) continue;
        visibleZones.push(z);
      }

      // Compute marker positions (XZ plane only)
      const px = playerPos[0];
      const pz = playerPos[2];

      // Reuse or create marker elements
      const existing = mc.children;
      const count = visibleZones.length;

      for (let i = 0; i < count; i++) {
        const zone = visibleZones[i];
        const dx = zone.position[0] - px;
        const dz = zone.position[2] - pz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.1) continue; // skip zones on top of player

        const angle = Math.atan2(dx, -dz); // 0 = forward (-Z), clockwise
        const normDist = Math.min(dist / MAX_DISTANCE, 1);
        const r = normDist * RADIUS;

        const mx = CENTER + Math.sin(angle) * r - MARKER_SIZE / 2;
        const my = CENTER - Math.cos(angle) * r - MARKER_SIZE / 2;

        let el = existing[i] as HTMLElement | undefined;
        if (!el) {
          el = document.createElement('div');
          el.className = 'poi-compass-marker';
          mc.appendChild(el);
        }

        el.style.left = `${mx}px`;
        el.style.top = `${my}px`;
        el.style.width = `${MARKER_SIZE}px`;
        el.style.height = `${MARKER_SIZE}px`;
        el.style.backgroundColor = markerColor(zone);
        el.style.boxShadow = `0 0 4px ${markerGlow(zone)}`;

        // Label — only in outer 40% ring
        const label = normDist >= LABEL_RING_INNER ? zoneLabel(zone) : '';
        el.setAttribute('data-label', label);
        el.title = zone.interactionLabel ?? zone.id;
      }

      // Remove extra DOM nodes
      while (mc.childElementCount > count) {
        mc.removeChild(mc.lastChild!);
      }

      rafId.current = requestAnimationFrame(tick);
    }

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  const isMobile = false; // compass is desktop-only for now

  return (
    <div
      ref={containerRef}
      className="fixed pointer-events-none hidden lg:block"
      data-testid="scene-poi-compass"
      style={{
        top: explorationPoiCompassTopPx(),
        right: EXPLORATION_HUD_LAYOUT.RIGHT_INSET,
        zIndex: UI_LAYERS.HUD + 1,
        ...quietStyle,
      }}
    >
      <div
        className="pointer-events-auto rounded-full"
        style={{
          width: COMPASS_SIZE,
          height: COMPASS_SIZE,
          position: 'relative',
          background: 'radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.75) 100%)',
          border: '1px solid rgba(34,211,238,0.2)',
          boxShadow: '0 0 12px rgba(34,211,238,0.08), inset 0 0 8px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          overflow: 'hidden',
        }}
      >
        {/* Range rings */}
        <div
          className="absolute rounded-full"
          style={{
            width: RADIUS * 2 * 0.5,
            height: RADIUS * 2 * 0.5,
            top: CENTER - RADIUS * 0.5,
            left: CENTER - RADIUS * 0.5,
            border: '1px solid rgba(34,211,238,0.07)',
            pointerEvents: 'none',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: RADIUS * 2 * 0.8,
            height: RADIUS * 2 * 0.8,
            top: CENTER - RADIUS * 0.8,
            left: CENTER - RADIUS * 0.8,
            border: '1px solid rgba(34,211,238,0.07)',
            pointerEvents: 'none',
          }}
        />

        {/* Outer 40% ring highlight (label zone) */}
        <div
          className="absolute rounded-full"
          style={{
            width: RADIUS * 2,
            height: RADIUS * 2,
            top: CENTER - RADIUS,
            left: CENTER - RADIUS,
            border: '1px dashed rgba(34,211,238,0.06)',
            pointerEvents: 'none',
          }}
        />

        {/* Cross hairs */}
        <div
          className="absolute"
          style={{
            width: 1,
            height: COMPASS_SIZE,
            left: CENTER - 0.5,
            top: 0,
            background: 'linear-gradient(to bottom, transparent 10%, rgba(34,211,238,0.06) 50%, transparent 90%)',
            pointerEvents: 'none',
          }}
        />
        <div
          className="absolute"
          style={{
            width: COMPASS_SIZE,
            height: 1,
            top: CENTER - 0.5,
            left: 0,
            background: 'linear-gradient(to right, transparent 10%, rgba(34,211,238,0.06) 50%, transparent 90%)',
            pointerEvents: 'none',
          }}
        />

        {/* Scan line */}
        {!reducedMotion && (
          <div
            className="poi-compass-sweep absolute"
            style={{
              width: RADIUS,
              height: 2,
              top: CENTER - 1,
              left: CENTER,
              transformOrigin: '0 1px',
              background: 'linear-gradient(90deg, rgba(34,211,238,0.35), transparent)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Player dot — center */}
        <div
          className="absolute rounded-full"
          style={{
            width: PLAYER_DOT_SIZE,
            height: PLAYER_DOT_SIZE,
            top: CENTER - PLAYER_DOT_SIZE / 2,
            left: CENTER - PLAYER_DOT_SIZE / 2,
            backgroundColor: '#22d3ee',
            boxShadow: '0 0 6px rgba(34,211,238,0.7)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* POI markers container (managed by rAF) */}
        <div
          ref={markersRef}
          className="absolute inset-0"
          style={{ pointerEvents: 'none' }}
        />

        {/* Marker label renderer — CSS-only ::after using data-label attr */}
        <style>{`
          .poi-compass-marker {
            position: absolute;
            border-radius: 50%;
            z-index: 1;
            pointer-events: none;
          }
          .poi-compass-marker::after {
            content: attr(data-label);
            position: absolute;
            left: calc(100% + 3px);
            top: -1px;
            font-size: 8px;
            line-height: 1;
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            color: rgba(255,255,255,0.65);
            white-space: nowrap;
            text-shadow: 0 1px 3px rgba(0,0,0,0.8);
            pointer-events: none;
          }
        `}</style>
      </div>

      {/* Legend */}
      <div
        className="hud-minimap-legend flex items-center justify-center gap-2 mt-1"
        style={{ pointerEvents: 'none' }}
      >
        <span className="legend-dot" style={{ backgroundColor: '#22d3ee' }} />
        <span className="text-[7px] font-mono text-cyan-400/50 tracking-wider">
          Объекты
        </span>
        <span className="legend-dot" style={{ backgroundColor: '#fbbf24' }} />
        <span className="text-[7px] font-mono text-amber-400/50 tracking-wider">
          NPC
        </span>
        <span className="legend-dot" style={{ backgroundColor: '#34d399' }} />
        <span className="text-[7px] font-mono text-emerald-400/50 tracking-wider">
          Лут
        </span>
      </div>
    </div>
  );
});

/* ── Position: below the weather indicator on the right column ── */
export function explorationPoiCompassTopPx(): number {
  return (
    explorationWeatherTopPx()
    + 145 /* approximate WeatherIndicator height */
    + EXPLORATION_HUD_LAYOUT.SLOT_GAP
  );
}