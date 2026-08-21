/* ─── Volodka RPG – WoW-style NPC Interaction Indicator ─── */
/* Floating ! / ? indicators above NPC heads with sine-wave bobbing.
 *  - Yellow !  → Quest available (NPC has a quest to give)
 *  - Grey ?    → Active quest involving this NPC (in progress, not complete)
 *  - Yellow ?  → Quest ready to turn in (all objectives done)
 *
 * Uses the existing quest selector infrastructure but renders with
 * WoW-style colors and a gentle bobbing animation via useRegisterNpcFrame.
 */

'use client';

import { useRef, useMemo, useLayoutEffect, useId } from 'react';
import { Sprite, SpriteMaterial } from 'three';
import { useRegisterNpcFrame } from '@/engine/npc/npcFrameBatch';
import {
  acquireNpcQuestMarkerTexture,
  releaseNpcQuestMarkerTexture,
  createNpcSpriteMaterial,
} from '@/engine/npc/npcSpritePool';
import { getNpcQuestMarkerDisplay, type NpcQuestMarkerType } from '@/store/questStore';
import { useQuests } from '@/store/selectors';

/* ─── WoW-style color mapping ─── */
const WOW_COLORS: Record<NpcQuestMarkerType, { icon: string; color: string }> = {
  available: { icon: '!', color: '#ffdd00' },  // Yellow exclamation
  active:    { icon: '?', color: '#aaaaaa' },   // Grey question mark
  complete:  { icon: '?', color: '#ffdd00' },   // Yellow question mark (turn-in)
};

/* ─── Bobbing constants ─── */
const BOB_AMPLITUDE = 0.08;     // units of vertical travel
const BOB_FREQUENCY = 2.5;      // cycles per second
const BASE_HEIGHT = 2.05;       // meters above NPC origin
const BASE_SCALE = 0.32;

type IndicatorProps = {
  npcId: string;
};

/** WoW-style floating indicator that bobs above an NPC's head */
export function NpcInteractionIndicator({ npcId }: IndicatorProps) {
  const quests = useQuests();

  // Derive WoW-style display from quest store
  const display = useMemo(() => {
    const info = getNpcQuestMarkerDisplay(npcId);
    if (!info) return null;
    const wow = WOW_COLORS[info.type];
    return { icon: wow.icon, color: wow.color, questName: info.questName };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quests, npcId]);

  if (!display) return null;

  return (
    <BobbingQuestSprite
      icon={display.icon}
      color={display.color}
      questName={display.questName}
    />
  );
}

/* ─── Internal bobbing sprite ─── */

function BobbingQuestSprite({
  icon,
  color,
  questName,
}: {
  icon: string;
  color: string;
  questName: string;
}) {
  const tickOwner = useId();
  const spriteRef = useRef<Sprite>(null);
  const materialRef = useRef<SpriteMaterial | null>(null);
  const timeRef = useRef(0);

  const material = useMemo(() => {
    const texture = acquireNpcQuestMarkerTexture(icon, color, questName);
    const mat = createNpcSpriteMaterial(texture);
    materialRef.current = mat;
    return mat;
  }, [icon, color, questName]);

  // Bobbing + gentle pulse animation
  useRegisterNpcFrame(tickOwner, 'sprite', ({ delta }) => {
    timeRef.current += delta;
    const t = timeRef.current;

    // Sine-wave vertical bob
    if (spriteRef.current) {
      spriteRef.current.position.y = BASE_HEIGHT + Math.sin(t * BOB_FREQUENCY) * BOB_AMPLITUDE;
      // Subtle scale pulse
      const pulse = 1.0 + Math.sin(t * 3.0) * 0.06;
      spriteRef.current.scale.set(
        BASE_SCALE * pulse,
        BASE_SCALE * pulse,
        1,
      );
    }

    // Subtle opacity pulse
    const mat = materialRef.current;
    if (mat) {
      mat.opacity = 0.8 + Math.sin(t * 2.0) * 0.2;
    }
  });

  useLayoutEffect(
    () => () => {
      materialRef.current?.dispose();
      materialRef.current = null;
      releaseNpcQuestMarkerTexture(icon, color, questName);
    },
    [icon, color, questName],
  );

  return (
    <sprite
      ref={spriteRef}
      position={[0, BASE_HEIGHT, 0]}
      material={material}
      scale={[BASE_SCALE, BASE_SCALE, 1]}
    />
  );
}
