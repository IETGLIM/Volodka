/* ─── Volodka RPG – Scene POI Compass (proximity radar) ─── */
/* eslint-disable react-refresh/only-export-components */

import { memo, useEffect, useRef } from 'react';
import { TRIGGER_ZONES, isTriggerZoneAvailable } from '@/data/triggerZones';
import type { TriggerZone } from '@/data/triggerZones';
import { useGameStore } from '@/store/gameStore';
import { getLiveCurrentSceneId, getLivePlayerPosition } from '@/store/stores/explorationStore';
import { usePanelStack } from '@/components/game/orchestrator/PanelStackContext';
import { EXPLORATION_HUD_LAYOUT, explorationWeatherTopPx } from '@/shared/constants/hudLayout';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGameplayPresentationProfile, isExplorationHudProfile } from '@/hooks/useGameplayPresentationProfile';
import { getQuestDefinitions } from '@/data/gameDataLoader';
import type { QuestDefinition } from '@/shared/types/definitions/quest';

/* ── Constants ── */
const COMPASS_SIZE = 120;
const CENTER = COMPASS_SIZE / 2; // 60
const RADIUS = COMPASS_SIZE / 2 - 4; // 56 – inner padding
const MAX_DISTANCE = 8; // meters
const LABEL_RING_INNER = 0.6; // show label only in outer 40%
const MARKER_SIZE = 5;
const PLAYER_DOT_SIZE = 6;
const SCAN_PERIOD = 4; // seconds per full rotation
const QUEST_MARKER_SIZE = 6;
const QUEST_COLOR = '#d946ef'; // fuchsia-500
const QUEST_GLOW = 'rgba(217, 70, 239, 0.6)';
const QUEST_LABEL_MAX = 20;

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

/** Short label for a zone — first 8 chars of interaction label, examine title, or truncated id */
function zoneLabel(zone: TriggerZone): string {
  const display = zone.interactionLabel ?? zone.examineData?.title;
  if (display) {
    const t = display.length > 8 ? display.slice(0, 8) + '…' : display;
    return t;
  }
  const id = zone.id.replace(/_/g, ' ');
  return id.length > 8 ? id.slice(0, 8) + '…' : id;
}

/* ── Quest helpers ── */

/** Compute a set of active quest IDs that have at least one uncompleted objective. */
function computeActiveQuestIds(
  quests: ReturnType<typeof useGameStore.getState>['quests'],
  defs: QuestDefinition[],
): Set<string> {
  const activeIds = new Set<string>();
  for (const q of quests) {
    if (q.status !== 'active') continue;
    const def = defs.find(d => d.id === q.questId);
    if (!def) continue;
    // Check if any objective is still uncompleted
    for (const obj of def.objectives) {
      if (!obj.completed && !q.objectives[obj.id]) {
        activeIds.add(q.questId);
        break;
      }
    }
  }
  return activeIds;
}

/** Build a map: questId → first uncompleted objective description. */
function buildQuestObjectiveLabels(
  quests: ReturnType<typeof useGameStore.getState>['quests'],
  defs: QuestDefinition[],
): Map<string, string> {
  const labels = new Map<string, string>();
  for (const q of quests) {
    if (q.status !== 'active') continue;
    const def = defs.find(d => d.id === q.questId);
    if (!def) continue;
    for (const obj of def.objectives) {
      if (!obj.completed && !q.objectives[obj.id]) {
        const desc = obj.description.length > QUEST_LABEL_MAX
          ? obj.description.slice(0, QUEST_LABEL_MAX) + '…'
          : obj.description;
        labels.set(q.questId, desc);
        break; // only first uncompleted objective
      }
    }
  }
  return labels;
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
@keyframes poi-quest-pulse {
  0%, 100% { opacity: 1; transform: rotate(45deg) scale(1); }
  50% { opacity: 0.5; transform: rotate(45deg) scale(0.7); }
}
.poi-quest-marker {
  animation: poi-quest-pulse 1.5s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .poi-compass-sweep {
    animation: none;
  }
  .poi-quest-marker {
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
  const questMarkersRef = useRef<HTMLDivElement>(null);
  const rafId = useRef(0);
  // Store selector values that change infrequently — we snapshot these
  // on every animation frame from the store to avoid re-renders.
  const flagsRef = useRef(useGameStore.getState().playerState.flags);
  const actRef = useRef(useGameStore.getState().playerState.progression.currentAct ?? 1);
  const ttlFlagsRef = useRef(useGameStore.getState().activeTTLFlags);
  // Quest data: recomputed when quests slice changes
  const activeQuestIdsRef = useRef(new Set<string>());
  const questObjectiveLabelsRef = useRef(new Map<string, string>());

  // Subscribe to store changes (rare — flag/act change) to update refs.
  // Scene + player position are read live each frame (facade can lag one rAF).
  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      flagsRef.current = state.playerState.flags;
      actRef.current = state.playerState.progression.currentAct ?? 1;
      ttlFlagsRef.current = state.activeTTLFlags;
    });
    return () => unsub();
  }, []);

  // Subscribe to quest changes — recompute active quest IDs & labels.
  useEffect(() => {
    function refreshQuestData() {
      const quests = useGameStore.getState().quests;
      const defs = getQuestDefinitions();
      activeQuestIdsRef.current = computeActiveQuestIds(quests, defs);
      questObjectiveLabelsRef.current = buildQuestObjectiveLabels(quests, defs);
    }
    refreshQuestData();
    const unsub = useGameStore.subscribe(
      (s) => s.quests,
      (quests) => {
        const defs = getQuestDefinitions();
        activeQuestIdsRef.current = computeActiveQuestIds(quests, defs);
        questObjectiveLabelsRef.current = buildQuestObjectiveLabels(quests, defs);
      },
    );
    return () => unsub();
  }, []);

  // rAF loop — update marker DOM positions directly
  useEffect(() => {
    const mc: HTMLDivElement = markersRef.current!;
    const qmc: HTMLDivElement = questMarkersRef.current!;
    if (!mc || !qmc) return;

    function tick() {
      const sceneId = getLiveCurrentSceneId();
      const flags = flagsRef.current;
      const act = actRef.current;
      const ttlFlags = ttlFlagsRef.current;
      const playerPos = getLivePlayerPosition();

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
        el.title = zone.interactionLabel ?? zone.examineData?.title ?? zone.id;
      }

      // Remove extra DOM nodes
      while (mc.childElementCount > count) {
        mc.removeChild(mc.lastChild!);
      }

      // ── Quest objective markers ──
      const activeQuestIds = activeQuestIdsRef.current;
      const questLabels = questObjectiveLabelsRef.current;
      const questZones: TriggerZone[] = [];
      for (let i = 0; i < visibleZones.length; i++) {
        const z = visibleZones[i];
        if (z.linkedQuestId && activeQuestIds.has(z.linkedQuestId)) {
          questZones.push(z);
        }
      }

      // Render quest markers (imperative DOM, same pattern as POI markers)
      const qExisting = qmc.children;
      const qCount = questZones.length;

      for (let i = 0; i < qCount; i++) {
        const zone = questZones[i];
        const dx = zone.position[0] - px;
        const dz = zone.position[2] - pz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 0.1) continue; // skip zones on top of player

        const angle = Math.atan2(dx, -dz);
        const normDist = Math.min(dist / MAX_DISTANCE, 1);
        const r = normDist * RADIUS;

        const mx = CENTER + Math.sin(angle) * r - QUEST_MARKER_SIZE / 2;
        const my = CENTER - Math.cos(angle) * r - QUEST_MARKER_SIZE / 2;

        let el = qExisting[i] as HTMLElement | undefined;
        if (!el) {
          el = document.createElement('div');
          el.className = 'poi-quest-marker';
          qmc.appendChild(el);
        }

        el.style.left = `${mx}px`;
        el.style.top = `${my}px`;
        el.style.width = `${QUEST_MARKER_SIZE}px`;
        el.style.height = `${QUEST_MARKER_SIZE}px`;
        el.style.backgroundColor = QUEST_COLOR;
        el.style.boxShadow = `0 0 6px ${QUEST_GLOW}`;

        // Label — only in outer 40% ring, using quest objective description
        const qLabel = normDist >= LABEL_RING_INNER && zone.linkedQuestId
          ? (questLabels.get(zone.linkedQuestId) ?? '')
          : '';
        el.setAttribute('data-label', qLabel);
        el.title = zone.linkedQuestId
          ? (questLabels.get(zone.linkedQuestId) ?? zone.linkedQuestId)
          : '';
      }

      // Remove extra quest marker DOM nodes
      while (qmc.childElementCount > qCount) {
        qmc.removeChild(qmc.lastChild!);
      }

      rafId.current = requestAnimationFrame(tick);
    }

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  const _isMobile = false; // compass is desktop-only for now

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
        className="pointer-events-auto rounded-full hud-frame-corner"
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

        {/* Quest objective markers container (managed by rAF, above POI markers) */}
        <div
          ref={questMarkersRef}
          className="absolute inset-0"
          style={{ pointerEvents: 'none', zIndex: 3 }}
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
          .poi-quest-marker {
            position: absolute;
            border-radius: 1px;
            z-index: 3;
            pointer-events: none;
            transform: rotate(45deg);
          }
          .poi-quest-marker::after {
            content: attr(data-label);
            position: absolute;
            left: calc(100% + 5px);
            top: 50%;
            transform: rotate(-45deg) translateY(-50%);
            font-size: 7px;
            line-height: 1;
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            color: rgba(217, 70, 239, 0.85);
            white-space: nowrap;
            text-shadow: 0 1px 3px rgba(0,0,0,0.9);
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
        <span
          className="inline-block"
          style={{
            width: 5,
            height: 5,
            backgroundColor: QUEST_COLOR,
            transform: 'rotate(45deg)',
            borderRadius: 1,
          }}
        />
        <span className="text-[7px] font-mono text-fuchsia-400/50 tracking-wider">
          Задания
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