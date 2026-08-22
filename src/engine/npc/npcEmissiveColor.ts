/* ─── NPC emissive color caching ─── */

import { getGameSnapshot } from '@/engine/GameActionDispatcher';

/** Cached emissive color per NPC — reads store once per frame, not per-NPC */
const _emissiveCache = new Map<string, { color: string; frame: number }>();
let _emissiveFrame = 0;

/** Emissive tint based on NPC relation level — replaces per-NPC point lights */
export function getNpcEmissiveColor(npcId: string, glowColor: string): string {
  const cached = _emissiveCache.get(npcId);
  if (cached && cached.frame === _emissiveFrame) {
    return cached.color;
  }

  const npcRelations = getGameSnapshot().npcRelations;
  const relation = npcRelations.find((r) => r.npcId === npcId);
  const value = relation?.value ?? 50;

  let color: string;
  if (value >= 70) color = '#ffaa44';
  else if (value <= 30) color = '#ff4444';
  else color = glowColor;

  _emissiveCache.set(npcId, { color, frame: _emissiveFrame });
  return color;
}

/** Call once per frame to advance the emissive cache frame counter */
export function advanceEmissiveFrame(): void {
  _emissiveFrame++;
  if (_emissiveCache.size > 50) {
    _emissiveCache.clear();
  }
}
