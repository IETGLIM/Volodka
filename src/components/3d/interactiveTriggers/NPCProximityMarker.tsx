/* ─── Volodka RPG – NPC proximity marker (enhanced) ───
 *  Visual marker for a single NPC proximity highlight.
 *  Shows: NPC name, relationship badge, current activity,
 *  "E — говорить" hint when in range, glowing ring at feet,
 *  and a god-ray column. All elements fade smoothly based on
 *  proximity factor.
 */

import { useEffect, useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useGameStore } from '@/store/gameStore';
import type { NpcProximityRuntime } from '@/engine/interaction/interactiveTriggerProximity';
import { findNpcById } from '@/data/allNpcDefinitions';
import { getRelationLevel, getRelationLevelColors } from '@/engine/npcRelationship/npcRelationshipPresentation';
import { RELATION_LEVEL_LABELS, type RelationLevel } from '@/engine/npcRelationship/npcRelationshipConstants';
import { formatNpcActivityHint } from '@/engine/npc/npcActivityPresentation';
import { ProximityGodRay } from '../ProximityGodRay';
import { NpcProximityRing } from './NpcProximityRing';

/** Resolve relationship color for proximity indicator: green (ally), amber (neutral), red (enemy) */
function resolveRelationColor(level: RelationLevel): string {
  const colors = getRelationLevelColors(level);
  switch (level) {
    case 'ally': return '#4ade80';
    case 'neutral': return '#facc15';
    case 'enemy': return '#f87171';
  }
}

/** Visual marker for a single NPC proximity highlight */
export function NPCProximityMarker({
  npcId,
  position,
  runtime,
  unregisterPrompt,
  activity,
}: {
  npcId: string;
  position: [number, number, number];
  runtime: NpcProximityRuntime;
  unregisterPrompt: (id: string) => void;
  /** Schedule-driven activity for the current time slot */
  activity?: string;
}) {
  const promptId = `npc_${npcId}`;
  const npcDef = findNpcById(npcId);
  const hasDialogue = Boolean(npcDef?.dialogueNodeId);
  const npcName = npcDef?.name ?? npcId;

  // Read NPC relation for color coding
  const npcRelations = useGameStore((s) => s.npcRelations);
  const relation = npcRelations.find((r) => r.npcId === npcId);
  const relationValue = relation?.value ?? 50;
  const relationLevel = getRelationLevel(relationValue);
  const relationColor = resolveRelationColor(relationLevel);
  const relationLabel = RELATION_LEVEL_LABELS[relationLevel];

  // Activity hint text from schedule system
  const activityHint = useMemo(
    () => formatNpcActivityHint(activity),
    [activity],
  );

  useEffect(() => {
    return () => {
      unregisterPrompt(promptId);
    };
  }, [promptId, unregisterPrompt]);

  return (
    <group position={position}>
      {/* Glowing ring at NPC feet — relationship color-coded */}
      <NpcProximityRing
        proximityRef={runtime.proximityRef}
        pulsePhaseRef={runtime.pulsePhaseRef}
        activeRef={runtime.showIndicatorRef}
        relationColor={relationColor}
      />

      <ProximityGodRay
        activeRef={runtime.showIndicatorRef}
        color={relationColor}
        beamHeight={2.6}
        baseY={0.2}
        proximityRef={runtime.proximityRef}
        pulsePhaseRef={runtime.pulsePhaseRef}
      />

      <Html
        position={[0, 2.8, 0]}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        zIndexRange={[0, 0]}
      >
        <div className="npc-proximity-indicator-wrapper">
          {/* Name with relation color accent */}
          <div className="npc-prox-name-row">
            <span
              className="npc-prox-name"
              style={{ borderColor: relationColor, color: relationColor }}
            >
              {npcName}
            </span>
            <span
              className="npc-prox-relation-dot"
              style={{
                backgroundColor: relationColor,
                boxShadow: `0 0 6px ${relationColor}`,
              }}
            />
          </div>

          {/* Status line: relationship level + current activity */}
          <div className="npc-prox-status-line">
            <span
              className="npc-prox-relation-label"
              style={{ color: relationColor }}
            >
              {relationLabel}
            </span>
            {activityHint && (
              <>
                <span className="npc-prox-status-sep">·</span>
                <span className="npc-prox-activity">{activityHint}</span>
              </>
            )}
          </div>

          {/* "E — говорить" hint when in interaction range */}
          {hasDialogue && (
            <div className="npc-prox-interact-hint">
              <span className="npc-prox-key-badge">E</span>
              <span className="npc-prox-hint-text">говорить</span>
            </div>
          )}

          {/* Dialogue "!" indicator (fallback for NPCs without dialogue) */}
          {!hasDialogue && (
            <div className="npc-dialogue-indicator npc-prox-dialogue-pulse">
              !
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}
